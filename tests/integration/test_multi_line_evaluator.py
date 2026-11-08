from pathlib import Path
import sys
import threading

import pytest


ROOT = Path(__file__).resolve().parents[2]
SIMULATION_ENGINE_DIR = ROOT / "digital-twin" / "simulation-engine"

if str(SIMULATION_ENGINE_DIR) not in sys.path:
    sys.path.insert(0, str(SIMULATION_ENGINE_DIR))

from line_runner import LineParameters
from multi_line_evaluator import (
    MultiLineEvaluationCandidate,
    MultiLineEvaluator,
)


PARAMETERS = LineParameters(
    upper_belt_speed=0.025,
    box_speed=0.025,
    dispenser_rpm=30.0,
    settle_time=1.5,
)


def make_order(order_id, product="P1", quantity=1):
    quantities = {
        "P1": 0,
        "P2": 0,
        "P3": 0,
        "P4": 0,
    }
    quantities[product] = quantity

    return {
        "order_id": order_id,
        "quantities": quantities,
    }


def make_candidate(
    candidate_id="candidate_001",
    schedule_id="schedule_001",
    line_a_orders=None,
    line_b_orders=None,
    line_a_parameters=PARAMETERS,
    line_b_parameters=PARAMETERS,
):
    if line_a_orders is None:
        line_a_orders = [make_order("ORDER_A1", "P1")]

    if line_b_orders is None:
        line_b_orders = [make_order("ORDER_B1", "P2")]

    return MultiLineEvaluationCandidate(
        candidate_id=candidate_id,
        schedule_id=schedule_id,
        line_a_orders=line_a_orders,
        line_a_parameters=line_a_parameters,
        line_b_orders=line_b_orders,
        line_b_parameters=line_b_parameters,
    )


class FakeRunner:
    def __init__(self, reset_error=None):
        self.reset_calls = 0
        self.reset_error = reset_error

    def reset(self):
        self.reset_calls += 1

        if self.reset_error is not None:
            raise RuntimeError(self.reset_error)


class FakeStateManager:
    def __init__(self, refresh_error=None):
        self.refresh_calls = []
        self.refresh_error = refresh_error

    def refresh(self, scene_id):
        self.refresh_calls.append(scene_id)

        if self.refresh_error is not None:
            raise RuntimeError(self.refresh_error)


class ConcurrencyTracker:
    def __init__(self):
        self.lock = threading.Lock()
        self.active = 0
        self.maximum_active = 0
        self.thread_ids = set()

    def enter(self):
        with self.lock:
            self.active += 1
            self.maximum_active = max(
                self.maximum_active,
                self.active,
            )
            self.thread_ids.add(threading.get_ident())

    def leave(self):
        with self.lock:
            self.active -= 1


class FakeScheduleEvaluator:
    """Test double implementing the ScheduleEvaluator interface."""

    def __init__(
        self,
        scene_id,
        *,
        behavior="completed",
        barrier=None,
        tracker=None,
        runner=None,
        state_manager=None,
    ):
        self.scene_id = scene_id
        self.runner = runner or FakeRunner()
        self.state_manager = state_manager or FakeStateManager()

        self.behavior = behavior
        self.barrier = barrier
        self.tracker = tracker
        self.calls = []

    def evaluate_candidates(self, candidates):
        assert len(candidates) == 1

        candidate = candidates[0]
        self.calls.append(candidate)

        if self.tracker is not None:
            self.tracker.enter()

        try:
            if self.barrier is not None:
                self.barrier.wait(timeout=5)

            if self.behavior == "raise":
                raise RuntimeError("Mock evaluator exception.")

            metrics = {
                "total_orders": len(candidate.orders),
                "total_balls": sum(
                    sum(order["quantities"].values())
                    for order in candidate.orders
                ),
                "total_completion_time_seconds": 10.0,
            }

            if self.behavior == "failed":
                result = {
                    "candidate_id": candidate.candidate_id,
                    "status": "failed",
                    "metrics": None,
                    "error": "Mock candidate evaluation failed.",
                    "cleanup_error": None,
                }

                return {
                    "candidate_count": 1,
                    "successful_count": 0,
                    "failed_count": 1,
                    "results": [result],
                }

            result = {
                "candidate_id": candidate.candidate_id,
                "status": "completed",
                "metrics": metrics,
                "error": None,
                "cleanup_error": None,
            }

            return {
                "candidate_count": 1,
                "successful_count": 1,
                "failed_count": 0,
                "results": [result],
            }

        finally:
            if self.tracker is not None:
                self.tracker.leave()


def make_evaluator(
    *,
    line_a_behavior="completed",
    line_b_behavior="completed",
    barrier=None,
    tracker=None,
    line_a_runner=None,
    line_b_runner=None,
    line_a_manager=None,
    line_b_manager=None,
):
    evaluator_a = FakeScheduleEvaluator(
        "digital_twin_line_a",
        behavior=line_a_behavior,
        barrier=barrier,
        tracker=tracker,
        runner=line_a_runner,
        state_manager=line_a_manager,
    )

    evaluator_b = FakeScheduleEvaluator(
        "digital_twin_line_b",
        behavior=line_b_behavior,
        barrier=barrier,
        tracker=tracker,
        runner=line_b_runner,
        state_manager=line_b_manager,
    )

    multi = MultiLineEvaluator(evaluator_a, evaluator_b)

    return multi, evaluator_a, evaluator_b


def test_both_lines_are_evaluated_concurrently():
    barrier = threading.Barrier(2)
    tracker = ConcurrencyTracker()

    multi, evaluator_a, evaluator_b = make_evaluator(
        barrier=barrier,
        tracker=tracker,
    )

    report = multi.evaluate_candidate(make_candidate())

    assert report["status"] == "completed"
    assert report["lines"]["line_a"]["status"] == "completed"
    assert report["lines"]["line_b"]["status"] == "completed"

    assert len(evaluator_a.calls) == 1
    assert len(evaluator_b.calls) == 1

    assert tracker.maximum_active == 2
    assert len(tracker.thread_ids) == 2


def test_line_specific_candidate_identifiers_are_generated():
    multi, evaluator_a, evaluator_b = make_evaluator()

    multi.evaluate_candidate(make_candidate())

    candidate_a = evaluator_a.calls[0]
    candidate_b = evaluator_b.calls[0]

    assert candidate_a.candidate_id == "candidate_001::line_a"
    assert candidate_b.candidate_id == "candidate_001::line_b"

    assert candidate_a.schedule_id == "schedule_001"
    assert candidate_b.schedule_id == "schedule_001"


def test_line_orders_and_parameters_are_preserved():
    multi, evaluator_a, evaluator_b = make_evaluator()

    orders_a = [
        make_order("A1", "P1", 2),
        make_order("A2", "P3", 1),
    ]

    orders_b = [
        make_order("B1", "P2", 3),
    ]

    candidate = make_candidate(
        line_a_orders=orders_a,
        line_b_orders=orders_b,
    )

    multi.evaluate_candidate(candidate)

    assert evaluator_a.calls[0].orders == orders_a
    assert evaluator_b.calls[0].orders == orders_b

    assert evaluator_a.calls[0].parameters == PARAMETERS
    assert evaluator_b.calls[0].parameters == PARAMETERS


def test_candidate_results_retain_main_agent_selection_authority():
    multi, _, _ = make_evaluator()

    report = multi.evaluate_candidate(make_candidate())

    assert report["selection_authority"] == "main_agent"
    assert "winner" not in report
    assert "selected_proposal" not in report


def test_multiple_candidates_are_evaluated_sequentially():
    barrier = threading.Barrier(2)
    tracker = ConcurrencyTracker()

    multi, evaluator_a, evaluator_b = make_evaluator(
        barrier=barrier,
        tracker=tracker,
    )

    candidates = [
        make_candidate(
            candidate_id="candidate_001",
            schedule_id="schedule_001",
        ),
        make_candidate(
            candidate_id="candidate_002",
            schedule_id="schedule_002",
        ),
        make_candidate(
            candidate_id="candidate_003",
            schedule_id="schedule_003",
        ),
    ]

    report = multi.evaluate_candidates(candidates)

    assert report["evaluated_candidate_count"] == 3
    assert report["successful_count"] == 3
    assert report["failed_count"] == 0
    assert report["partial_failure_count"] == 0

    assert [
        call.candidate_id for call in evaluator_a.calls
    ] == [
        "candidate_001::line_a",
        "candidate_002::line_a",
        "candidate_003::line_a",
    ]

    assert [
        call.candidate_id for call in evaluator_b.calls
    ] == [
        "candidate_001::line_b",
        "candidate_002::line_b",
        "candidate_003::line_b",
    ]

    # At most two simultaneous evaluations: one per line.
    assert tracker.maximum_active == 2


def test_idle_line_is_reset_and_refreshed():
    runner_a = FakeRunner()
    manager_a = FakeStateManager()

    multi, evaluator_a, evaluator_b = make_evaluator(
        line_a_runner=runner_a,
        line_a_manager=manager_a,
    )

    candidate = make_candidate(
        line_a_orders=[],
        line_a_parameters=None,
        line_b_orders=[make_order("B1", "P2")],
    )

    report = multi.evaluate_candidate(candidate)

    assert report["status"] == "completed"
    assert report["lines"]["line_a"]["status"] == "idle"
    assert report["lines"]["line_b"]["status"] == "completed"

    assert runner_a.reset_calls == 1
    assert manager_a.refresh_calls == ["digital_twin_line_a"]

    assert evaluator_a.calls == []
    assert len(evaluator_b.calls) == 1


def test_idle_line_reset_failure_is_reported():
    runner_a = FakeRunner(reset_error="Mock reset failure.")

    multi, _, _ = make_evaluator(
        line_a_runner=runner_a,
    )

    candidate = make_candidate(
        line_a_orders=[],
        line_a_parameters=None,
    )

    report = multi.evaluate_candidate(candidate)

    assert report["status"] == "partial_failure"
    assert report["lines"]["line_a"]["status"] == "failed"
    assert "Mock reset failure" in report["lines"]["line_a"]["error"]
    assert report["lines"]["line_b"]["status"] == "completed"


def test_both_idle_lines_are_rejected():
    multi, evaluator_a, evaluator_b = make_evaluator()

    candidate = make_candidate(
        line_a_orders=[],
        line_a_parameters=None,
        line_b_orders=[],
        line_b_parameters=None,
    )

    with pytest.raises(ValueError, match="at least one order"):
        multi.evaluate_candidate(candidate)

    assert evaluator_a.calls == []
    assert evaluator_b.calls == []


def test_active_line_requires_operating_parameters():
    multi, evaluator_a, evaluator_b = make_evaluator()

    candidate = make_candidate(
        line_a_orders=[make_order("A1")],
        line_a_parameters=None,
    )

    with pytest.raises(ValueError, match="requires operating parameters"):
        multi.evaluate_candidate(candidate)

    assert evaluator_a.calls == []
    assert evaluator_b.calls == []


def test_parameter_mapping_is_normalized():
    multi, evaluator_a, evaluator_b = make_evaluator()

    parameter_mapping = {
        "upper_belt_speed": 0.025,
        "box_speed": 0.025,
        "dispenser_rpm": 30,
        "settle_time": 1.5,
    }

    candidate = make_candidate(
        line_a_parameters=parameter_mapping,
    )

    report = multi.evaluate_candidate(candidate)

    assert report["status"] == "completed"
    assert evaluator_a.calls[0].parameters == PARAMETERS
    assert isinstance(
        evaluator_a.calls[0].parameters,
        LineParameters,
    )


@pytest.mark.parametrize(
    "parameters",
    [
        {
            "upper_belt_speed": 0.025,
            "box_speed": 0.025,
            "dispenser_rpm": 30,
        },
        {
            "upper_belt_speed": 0.025,
            "box_speed": 0.025,
            "dispenser_rpm": 30,
            "settle_time": 1.5,
            "unexpected": 1,
        },
        {
            "upper_belt_speed": True,
            "box_speed": 0.025,
            "dispenser_rpm": 30,
            "settle_time": 1.5,
        },
        {
            "upper_belt_speed": 0.025,
            "box_speed": 0.025,
            "dispenser_rpm": 30,
            "settle_time": 10,
        },
    ],
)
def test_invalid_parameter_mappings_are_rejected(parameters):
    multi, evaluator_a, evaluator_b = make_evaluator()

    candidate = make_candidate(
        line_a_parameters=parameters,
    )

    with pytest.raises(ValueError):
        multi.evaluate_candidate(candidate)

    assert evaluator_a.calls == []
    assert evaluator_b.calls == []


def test_invalid_order_sequence_is_rejected():
    multi, evaluator_a, evaluator_b = make_evaluator()

    candidate = make_candidate(line_a_orders="not-an-order-list")

    with pytest.raises(ValueError, match="orders must be a sequence"):
        multi.evaluate_candidate(candidate)

    assert evaluator_a.calls == []
    assert evaluator_b.calls == []


def test_non_mapping_order_is_rejected():
    multi, evaluator_a, evaluator_b = make_evaluator()

    candidate = make_candidate(
        line_a_orders=["not-a-mapping"],
    )

    with pytest.raises(ValueError, match="must be a mapping"):
        multi.evaluate_candidate(candidate)

    assert evaluator_a.calls == []
    assert evaluator_b.calls == []


@pytest.mark.parametrize(
    "field,value",
    [
        ("candidate_id", ""),
        ("candidate_id", "   "),
        ("schedule_id", ""),
        ("schedule_id", "   "),
    ],
)
def test_empty_candidate_or_schedule_identity_is_rejected(field, value):
    multi, evaluator_a, evaluator_b = make_evaluator()

    values = {
        "candidate_id": "candidate_001",
        "schedule_id": "schedule_001",
    }
    values[field] = value

    candidate = make_candidate(**values)

    with pytest.raises(ValueError):
        multi.evaluate_candidate(candidate)

    assert evaluator_a.calls == []
    assert evaluator_b.calls == []


def test_one_line_failure_produces_partial_failure():
    multi, _, _ = make_evaluator(
        line_a_behavior="failed",
        line_b_behavior="completed",
    )

    report = multi.evaluate_candidate(make_candidate())

    assert report["status"] == "partial_failure"
    assert report["lines"]["line_a"]["status"] == "failed"
    assert report["lines"]["line_b"]["status"] == "completed"


def test_both_line_failures_produce_failed_status():
    multi, _, _ = make_evaluator(
        line_a_behavior="failed",
        line_b_behavior="failed",
    )

    report = multi.evaluate_candidate(make_candidate())

    assert report["status"] == "failed"


def test_evaluator_exception_triggers_line_reset_and_refresh():
    runner_a = FakeRunner()
    manager_a = FakeStateManager()

    multi, _, _ = make_evaluator(
        line_a_behavior="raise",
        line_a_runner=runner_a,
        line_a_manager=manager_a,
    )

    report = multi.evaluate_candidate(make_candidate())

    assert report["status"] == "partial_failure"
    assert report["lines"]["line_a"]["status"] == "failed"

    assert report["lines"]["line_a"]["error"] == (
        "Mock evaluator exception."
    )

    assert runner_a.reset_calls == 1
    assert manager_a.refresh_calls == ["digital_twin_line_a"]


def test_evaluator_exception_also_reports_reset_failure():
    runner_a = FakeRunner(reset_error="Mock cleanup reset failure.")

    multi, _, _ = make_evaluator(
        line_a_behavior="raise",
        line_a_runner=runner_a,
    )

    report = multi.evaluate_candidate(make_candidate())

    assert report["lines"]["line_a"]["status"] == "failed"
    assert report["lines"]["line_a"]["reset_error"] == (
        "Mock cleanup reset failure."
    )


def test_duplicate_scene_evaluators_are_rejected():
    evaluator_a = FakeScheduleEvaluator("digital_twin_line_a")
    evaluator_b = FakeScheduleEvaluator("digital_twin_line_a")

    with pytest.raises(ValueError, match="different Digital Twin scenes"):
        MultiLineEvaluator(evaluator_a, evaluator_b)


def test_wrong_candidate_type_is_rejected():
    multi, _, _ = make_evaluator()

    with pytest.raises(TypeError, match="MultiLineEvaluationCandidate"):
        multi.evaluate_candidate({"candidate_id": "invalid"})


def test_empty_candidate_batch_is_rejected():
    multi, evaluator_a, evaluator_b = make_evaluator()

    with pytest.raises(ValueError, match="At least one candidate"):
        multi.evaluate_candidates([])

    assert evaluator_a.calls == []
    assert evaluator_b.calls == []


def test_duplicate_candidate_ids_in_batch_are_rejected():
    multi, evaluator_a, evaluator_b = make_evaluator()

    candidates = [
        make_candidate(candidate_id="duplicate"),
        make_candidate(
            candidate_id="duplicate",
            schedule_id="schedule_002",
        ),
    ]

    with pytest.raises(ValueError, match="Candidate IDs must be unique"):
        multi.evaluate_candidates(candidates)

    assert evaluator_a.calls == []
    assert evaluator_b.calls == []


def test_non_candidate_batch_item_is_rejected():
    multi, evaluator_a, evaluator_b = make_evaluator()

    with pytest.raises(TypeError, match="Every item"):
        multi.evaluate_candidates([{"candidate_id": "invalid"}])

    assert evaluator_a.calls == []
    assert evaluator_b.calls == []


def test_non_sequence_candidate_batch_is_rejected():
    multi, evaluator_a, evaluator_b = make_evaluator()

    with pytest.raises(ValueError, match="candidates must be a sequence"):
        multi.evaluate_candidates("not-a-candidate-list")

    assert evaluator_a.calls == []
    assert evaluator_b.calls == []
