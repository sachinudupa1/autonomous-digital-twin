from copy import deepcopy
from dataclasses import asdict
from pathlib import Path
import sys

import pytest


ROOT = Path(__file__).resolve().parents[2]
SIMULATION_ENGINE_DIR = ROOT / "digital-twin" / "simulation-engine"

if str(SIMULATION_ENGINE_DIR) not in sys.path:
    sys.path.insert(0, str(SIMULATION_ENGINE_DIR))

from line_runner import LineParameters
from schedule_evaluator import EvaluationCandidate, ScheduleEvaluator
from state_manager import DigitalTwinStateManager


SCENE_ID = "digital_twin_line_a"

PARAMETERS = LineParameters(
    upper_belt_speed=0.025,
    box_speed=0.025,
    dispenser_rpm=30.0,
    settle_time=1.5,
)


def make_order(order_id="ORDER_001"):
    return {
        "order_id": order_id,
        "quantities": {
            "P1": 1,
            "P2": 0,
            "P3": 0,
            "P4": 0,
        },
    }


def make_candidate(
    candidate_id="candidate_001",
    schedule_id="schedule_001",
    orders=None,
    parameters=PARAMETERS,
):
    if orders is None:
        orders = [make_order()]

    return EvaluationCandidate(
        candidate_id=candidate_id,
        schedule_id=schedule_id,
        orders=orders,
        parameters=parameters,
    )


class FakeSimulation:
    def __init__(self, state=0):
        self.state = state

    def getSimulationState(self):
        return self.state


class FakeLineController:
    def __init__(self, scene_id):
        self.connection = type("Connection", (), {})()
        self.connection.scene_name = scene_id

        self.initial_stock = {
            f"P{i}": 294 for i in range(1, 5)
        }


class FakeLineRunner:
    """Mock the hardware-facing runner while retaining its real interface."""

    def __init__(
        self,
        line_controller,
        *,
        run_error=None,
        reset_fail_on=None,
        simulation_state=0,
    ):
        self.line = line_controller
        self.sim = FakeSimulation(simulation_state)

        self.initial_stock = deepcopy(
            line_controller.initial_stock
        )
        self.remaining_stock = deepcopy(self.initial_stock)

        self.box_positions = [
            [0.0, 0.0, 0.0],
            [0.0, 0.1, 0.0],
        ]
        self.active_box = "Box 1"

        self.reset_calls = 0
        self.run_calls = []
        self.returned_results = []

        self.run_error = run_error
        self.reset_fail_on = set(reset_fail_on or [])

    def reset(self):
        self.reset_calls += 1

        if self.reset_calls in self.reset_fail_on:
            raise RuntimeError(
                f"Mock reset failure on call {self.reset_calls}."
            )

        self.remaining_stock = deepcopy(self.initial_stock)
        self.box_positions = [
            [0.0, 0.0, 0.0],
            [0.0, 0.1, 0.0],
        ]
        self.active_box = "Box 1"

    def get_status(self):
        return {
            "scene": self.line.connection.scene_name,
            "simulation_state": self.sim.getSimulationState(),
            "remaining_stock": deepcopy(self.remaining_stock),
            "box_positions": deepcopy(self.box_positions),
            "active_box": self.active_box,
        }

    def run_schedule(self, orders, parameters, schedule_id):
        self.run_calls.append({
            "orders": deepcopy(list(orders)),
            "parameters": asdict(parameters),
            "schedule_id": schedule_id,
        })

        if self.run_error is not None:
            raise RuntimeError(self.run_error)

        total_balls = sum(
            sum(order["quantities"].values())
            for order in orders
        )

        self.remaining_stock["P1"] -= total_balls

        result = {
            "schedule_id": schedule_id,
            "scene": self.line.connection.scene_name,
            "parameters": asdict(parameters),
            "total_orders": len(orders),
            "total_balls": total_balls,
            "total_completion_time_seconds": 10.0,
            "average_order_completion_seconds": (
                10.0 / len(orders)
            ),
            "orders_per_minute": len(orders) * 6.0,
            "balls_per_minute": total_balls * 6.0,
            "remaining_stock": deepcopy(self.remaining_stock),
            "order_results": [
                {
                    "order_id": order["order_id"],
                    "quantities": deepcopy(order["quantities"]),
                    "completion_time_seconds": 10.0 / len(orders),
                }
                for order in orders
            ],
            "simulation_state": self.sim.getSimulationState(),
        }

        self.returned_results.append(result)

        return result


def make_schedule_evaluator(
    *,
    scene_id=SCENE_ID,
    run_error=None,
    reset_fail_on=None,
    simulation_state=0,
):
    state_manager = DigitalTwinStateManager()

    controller = FakeLineController(scene_id)

    runner = FakeLineRunner(
        controller,
        run_error=run_error,
        reset_fail_on=reset_fail_on,
        simulation_state=simulation_state,
    )

    state_manager.attach(
        scene_id,
        controller,
        runner,
    )

    evaluator = ScheduleEvaluator(
        scene_id=scene_id,
        line_runner=runner,
        state_manager=state_manager,
    )

    return evaluator, state_manager, runner


def test_successful_candidate_lifecycle_records_result_and_cleans_up():
    evaluator, manager, runner = make_schedule_evaluator()

    candidate = make_candidate()

    report = evaluator.evaluate_candidates([candidate])

    assert report["scene_id"] == SCENE_ID
    assert report["candidate_count"] == 1
    assert report["successful_count"] == 1
    assert report["failed_count"] == 0
    assert report["selection_authority"] == "main_agent"

    entry = report["results"][0]

    assert entry["status"] == "completed"
    assert entry["candidate_id"] == "candidate_001"
    assert entry["schedule_id"] == "schedule_001"

    assert entry["metrics"]["total_orders"] == 1
    assert entry["metrics"]["total_balls"] == 1

    # One reset before execution and one after execution.
    assert runner.reset_calls == 2
    assert len(runner.run_calls) == 1

    # The runner receives the candidate ID as its execution schedule ID.
    assert runner.run_calls[0]["schedule_id"] == "candidate_001"

    state = manager.get_scene_state(SCENE_ID)

    assert state["connection_status"] == "connected"
    assert state["run_status"] == "completed"
    assert state["completed_runs"] == 1
    assert state["last_schedule_id"] == "candidate_001"
    assert state["last_run_purpose"] == "candidate"

    assert state["active_schedule_id"] is None
    assert state["active_run_purpose"] is None

    # Cleanup restores the initial inventory.
    assert state["remaining_stock"] == runner.initial_stock


def test_multiple_candidates_are_evaluated_sequentially():
    evaluator, manager, runner = make_schedule_evaluator()

    candidates = [
        make_candidate("candidate_001", "schedule_001"),
        make_candidate("candidate_002", "schedule_002"),
        make_candidate("candidate_003", "schedule_003"),
    ]

    report = evaluator.evaluate_candidates(candidates)

    assert report["candidate_count"] == 3
    assert report["successful_count"] == 3
    assert report["failed_count"] == 0

    assert runner.reset_calls == 6
    assert len(runner.run_calls) == 3

    assert [
        call["schedule_id"] for call in runner.run_calls
    ] == [
        "candidate_001",
        "candidate_002",
        "candidate_003",
    ]

    state = manager.get_scene_state(SCENE_ID)

    assert state["completed_runs"] == 3
    assert state["run_status"] == "completed"
    assert state["remaining_stock"] == runner.initial_stock


def test_runner_failure_is_recorded_and_scene_cleanup_still_runs():
    evaluator, manager, runner = make_schedule_evaluator(
        run_error="Mock execution failure."
    )

    report = evaluator.evaluate_candidates([
        make_candidate()
    ])

    assert report["successful_count"] == 0
    assert report["failed_count"] == 1

    entry = report["results"][0]

    assert entry["status"] == "failed"
    assert entry["error"] == "Mock execution failure."

    assert runner.reset_calls == 2
    assert len(runner.run_calls) == 1

    state = manager.get_scene_state(SCENE_ID)

    assert state["run_status"] == "failed"
    assert state["last_error"] == "Mock execution failure."
    assert state["completed_runs"] == 0
    assert state["active_schedule_id"] is None
    assert state["active_run_purpose"] is None


def test_invalid_candidate_is_reported_as_failed():
    evaluator, manager, runner = make_schedule_evaluator()

    candidate = make_candidate(orders=[])

    report = evaluator.evaluate_candidates([candidate])

    assert report["successful_count"] == 0
    assert report["failed_count"] == 1

    entry = report["results"][0]

    assert entry["status"] == "failed"
    assert "at least one order" in entry["error"]

    # Validation fails before execution, but final cleanup still runs.
    assert runner.reset_calls == 1
    assert runner.run_calls == []

    state = manager.get_scene_state(SCENE_ID)
    assert state["run_status"] == "idle"
    assert state["completed_runs"] == 0


def test_invalid_parameters_are_reported_as_candidate_failure():
    evaluator, manager, runner = make_schedule_evaluator()

    invalid_parameters = LineParameters(
        upper_belt_speed=0.001,
        box_speed=0.025,
        dispenser_rpm=30.0,
        settle_time=1.5,
    )

    report = evaluator.evaluate_candidates([
        make_candidate(parameters=invalid_parameters)
    ])

    assert report["failed_count"] == 1
    assert report["results"][0]["status"] == "failed"
    assert "upper_belt_speed" in report["results"][0]["error"]

    assert runner.run_calls == []
    assert runner.reset_calls == 1

    assert manager.get_scene_state(SCENE_ID)["completed_runs"] == 0


def test_active_coppeliasim_scene_is_rejected_before_evaluation():
    evaluator, _, runner = make_schedule_evaluator(
        simulation_state=1
    )

    with pytest.raises(RuntimeError, match="Stop the Digital Twin scene before evaluation"):
        evaluator.evaluate_candidates([make_candidate()])

    assert runner.reset_calls == 0
    assert runner.run_calls == []


def test_duplicate_candidate_ids_are_rejected_before_execution():
    evaluator, _, runner = make_schedule_evaluator()

    candidates = [
        make_candidate("duplicate", "schedule_001"),
        make_candidate("duplicate", "schedule_002"),
    ]

    with pytest.raises(ValueError, match="Candidate IDs must be unique"):
        evaluator.evaluate_candidates(candidates)

    assert runner.reset_calls == 0
    assert runner.run_calls == []


def test_empty_candidate_batch_is_rejected():
    evaluator, _, runner = make_schedule_evaluator()

    with pytest.raises(ValueError, match="At least one candidate"):
        evaluator.evaluate_candidates([])

    assert runner.reset_calls == 0
    assert runner.run_calls == []


def test_scene_must_be_attached_to_state_manager():
    manager = DigitalTwinStateManager()
    controller = FakeLineController(SCENE_ID)
    runner = FakeLineRunner(controller)

    with pytest.raises(RuntimeError, match="Attach this line"):
        ScheduleEvaluator(
            scene_id=SCENE_ID,
            line_runner=runner,
            state_manager=manager,
        )


def test_production_scene_cannot_be_used_for_candidate_evaluation():
    scene_id = "production_line_a"

    manager = DigitalTwinStateManager()
    controller = FakeLineController(scene_id)
    runner = FakeLineRunner(controller)

    manager.attach(scene_id, controller, runner)

    with pytest.raises(ValueError, match="Digital Twin scenes"):
        ScheduleEvaluator(
            scene_id=scene_id,
            line_runner=runner,
            state_manager=manager,
        )


def test_runner_must_belong_to_the_requested_scene():
    manager, controller, runner_a = (
        lambda: None, None, None
    )

    state_manager = DigitalTwinStateManager()

    controller_a = FakeLineController("digital_twin_line_a")
    runner_a = FakeLineRunner(controller_a)

    state_manager.attach(
        "digital_twin_line_a",
        controller_a,
        runner_a,
    )

    controller_b = FakeLineController("digital_twin_line_b")
    runner_b = FakeLineRunner(controller_b)

    with pytest.raises(ValueError, match="different scene"):
        ScheduleEvaluator(
            scene_id="digital_twin_line_a",
            line_runner=runner_b,
            state_manager=state_manager,
        )


def test_result_is_copied_before_being_returned():
    evaluator, manager, runner = make_schedule_evaluator()

    report = evaluator.evaluate_candidates([
        make_candidate()
    ])

    runner.returned_results[0]["total_balls"] = 999

    assert report["results"][0]["result"]["total_balls"] == 1

    state = manager.get_scene_state(SCENE_ID)

    assert state["last_result"]["total_balls"] == 1


def test_cleanup_failure_is_reported_to_caller():
    evaluator, _, runner = make_schedule_evaluator(
        reset_fail_on={2}
    )

    with pytest.raises(
        RuntimeError,
        match="Could not restore",
    ):
        evaluator.evaluate_candidates([
            make_candidate()
        ])

    assert runner.reset_calls == 2
    assert len(runner.run_calls) == 1


def test_successful_evaluation_keeps_main_agent_as_selection_authority():
    evaluator, _, _ = make_schedule_evaluator()

    report = evaluator.evaluate_candidates([
        make_candidate()
    ])

    assert report["selection_authority"] == "main_agent"
    assert "winner" not in report
    assert "selected_proposal" not in report


def test_new_run_clears_previous_error():
    evaluator, manager, runner = make_schedule_evaluator(
        run_error="Previous execution failure."
    )

    evaluator.evaluate_candidates([
        make_candidate()
    ])

    failed_state = manager.get_scene_state(SCENE_ID)
    assert failed_state["last_error"] == "Previous execution failure."

    manager.begin_run(
        SCENE_ID,
        "candidate_002",
        "candidate",
    )

    active_state = manager.get_scene_state(SCENE_ID)

    assert active_state["last_error"] is None
    assert active_state["active_schedule_id"] == "candidate_002"
    assert active_state["run_status"] == "evaluating"

    manager.fail_run(SCENE_ID, "Test cleanup.")
