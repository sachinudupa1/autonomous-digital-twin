from concurrent.futures import ThreadPoolExecutor
from dataclasses import asdict
from pathlib import Path
import sys
import threading

import pytest


ROOT = Path(__file__).resolve().parents[2]

SIMULATION_ENGINE_DIR = ROOT / "digital-twin" / "simulation-engine"
PRODUCTION_ENGINE_DIR = ROOT / "digital-twin" / "production-engine"

for directory in (SIMULATION_ENGINE_DIR, PRODUCTION_ENGINE_DIR):
    path = str(directory)
    if path not in sys.path:
        sys.path.insert(0, path)

from line_runner import LineParameters, LineRunner
from production_coordinator import (
    ProductionCoordinator,
    SelectedProductionPlan,
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


def make_plan(
    plan_id="plan_001",
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

    return SelectedProductionPlan(
        plan_id=plan_id,
        schedule_id=schedule_id,
        line_a_orders=line_a_orders,
        line_a_parameters=line_a_parameters,
        line_b_orders=line_b_orders,
        line_b_parameters=line_b_parameters,
    )


class FakeSimulation:
    def getSimulationState(self):
        return 0


class FakeRunner:
    """Mock runner implementing the interface used by ProductionCoordinator."""

    _validate_quantities = staticmethod(LineRunner._validate_quantities)

    def __init__(
        self,
        scene_name,
        *,
        barrier=None,
        entered_event=None,
        release_event=None,
        failure_message=None,
        completion_time=10.0,
        initial_stock=294,
    ):
        self.line = type("FakeLine", (), {})()
        self.line.connection = type("FakeConnection", (), {})()
        self.line.connection.scene_name = scene_name

        self.line.remaining_stock = {
            f"P{i}": initial_stock for i in range(1, 5)
        }

        self.sim = FakeSimulation()
        self.barrier = barrier
        self.entered_event = entered_event
        self.release_event = release_event
        self.failure_message = failure_message
        self.completion_time = completion_time

        self.calls = []
        self.execution_thread_ids = []

    def get_status(self):
        return {
            "scene": self.line.connection.scene_name,
            "remaining_stock": self.line.remaining_stock.copy(),
            "simulation_state": self.sim.getSimulationState(),
        }

    def run_schedule(self, orders, parameters, schedule_id):
        self.execution_thread_ids.append(threading.get_ident())

        call = {
            "orders": [dict(order) for order in orders],
            "parameters": asdict(parameters),
            "schedule_id": schedule_id,
        }
        self.calls.append(call)

        if self.entered_event is not None:
            self.entered_event.set()

        if self.barrier is not None:
            self.barrier.wait(timeout=5)

        if self.release_event is not None:
            if not self.release_event.wait(timeout=5):
                raise RuntimeError("Mock runner timed out waiting for release.")

        if self.failure_message is not None:
            raise RuntimeError(self.failure_message)

        normalized_orders = []
        total_balls = 0

        for order in orders:
            quantities = self._validate_quantities(order["quantities"])

            for product, quantity in quantities.items():
                if quantity > self.line.remaining_stock[product]:
                    raise RuntimeError(
                        f"Mock inventory exhausted for {product}."
                    )

                self.line.remaining_stock[product] -= quantity
                total_balls += quantity

            normalized_orders.append({
                "order_id": str(order["order_id"]),
                "quantities": quantities,
                "completion_time_seconds": self.completion_time
                / len(orders),
            })

        total_orders = len(normalized_orders)
        elapsed = self.completion_time

        return {
            "schedule_id": schedule_id,
            "scene": self.line.connection.scene_name,
            "parameters": asdict(parameters),
            "total_orders": total_orders,
            "total_balls": total_balls,
            "total_completion_time_seconds": elapsed,
            "average_order_completion_seconds": elapsed / total_orders,
            "orders_per_minute": total_orders * 60.0 / elapsed,
            "balls_per_minute": total_balls * 60.0 / elapsed,
            "remaining_stock": self.line.remaining_stock.copy(),
            "order_results": normalized_orders,
            "simulation_state": 0,
        }


def make_coordinator(
    line_a=None,
    line_b=None,
):
    if line_a is None:
        line_a = FakeRunner("production_line_a")

    if line_b is None:
        line_b = FakeRunner("production_line_b")

    return ProductionCoordinator(line_a, line_b), line_a, line_b


def test_both_lines_execute_concurrently():
    barrier = threading.Barrier(2)

    runner_a = FakeRunner(
        "production_line_a",
        barrier=barrier,
        completion_time=10.0,
    )
    runner_b = FakeRunner(
        "production_line_b",
        barrier=barrier,
        completion_time=8.0,
    )

    coordinator, _, _ = make_coordinator(runner_a, runner_b)

    report = coordinator.execute_selected_plan(make_plan())

    assert report["status"] == "completed"
    assert len(runner_a.calls) == 1
    assert len(runner_b.calls) == 1

    assert barrier.broken is False
    assert runner_a.execution_thread_ids[0] != (
        runner_b.execution_thread_ids[0]
    )

    combined = report["combined_metrics"]

    assert combined["total_orders"] == 2
    assert combined["total_balls"] == 2
    assert combined["parallel_completion_time_seconds"] == 10.0
    assert combined["scope"] == "successfully_completed_lines_only"


def test_inventory_persists_between_production_plans():
    coordinator, runner_a, runner_b = make_coordinator()

    first_report = coordinator.execute_selected_plan(
        make_plan(
            plan_id="plan_001",
            schedule_id="schedule_001",
            line_a_orders=[make_order("A1", "P1", 2)],
            line_b_orders=[make_order("B1", "P2", 1)],
        )
    )

    second_report = coordinator.execute_selected_plan(
        make_plan(
            plan_id="plan_002",
            schedule_id="schedule_002",
            line_a_orders=[make_order("A2", "P3", 3)],
            line_b_orders=[make_order("B2", "P4", 2)],
        )
    )

    assert first_report["status"] == "completed"
    assert second_report["status"] == "completed"

    assert runner_a.line.remaining_stock == {
        "P1": 292,
        "P2": 294,
        "P3": 291,
        "P4": 294,
    }

    assert runner_b.line.remaining_stock == {
        "P1": 294,
        "P2": 293,
        "P3": 294,
        "P4": 292,
    }

    assert len(runner_a.calls) == 2
    assert len(runner_b.calls) == 2


def test_requested_and_effective_parameters_are_recorded():
    coordinator, _, _ = make_coordinator()

    report = coordinator.execute_selected_plan(make_plan())

    line_report = report["lines"]["line_a"]

    assert line_report["requested_parameters"] == asdict(PARAMETERS)
    assert line_report["effective_parameters"] is not None
    assert line_report["variation_report"]["deterministic"] is True

    assert line_report["result"]["parameters"] == (
        line_report["effective_parameters"]
    )

    assert report["variation_policy"]["seed"] == 2026


def test_idle_line_does_not_require_operating_parameters():
    coordinator, runner_a, runner_b = make_coordinator()

    plan = make_plan(
        line_a_orders=[make_order("A1", "P1")],
        line_b_orders=[],
        line_b_parameters=None,
    )

    report = coordinator.execute_selected_plan(plan)

    assert report["status"] == "completed"
    assert report["lines"]["line_a"]["status"] == "completed"
    assert report["lines"]["line_b"]["status"] == "idle"

    assert len(runner_a.calls) == 1
    assert len(runner_b.calls) == 0

    assert report["combined_metrics"]["total_orders"] == 1
    assert report["combined_metrics"]["total_balls"] == 1


def test_both_lines_are_validated_before_either_starts():
    coordinator, runner_a, runner_b = make_coordinator()

    runner_b.line.remaining_stock["P2"] = 0

    plan = make_plan(
        line_a_orders=[make_order("A1", "P1")],
        line_b_orders=[make_order("B1", "P2")],
    )

    with pytest.raises(ValueError, match="line_b"):
        coordinator.execute_selected_plan(plan)

    assert runner_a.calls == []
    assert runner_b.calls == []


def test_failed_line_is_blocked_and_other_line_can_complete():
    runner_a = FakeRunner(
        "production_line_a",
        failure_message="Mock production failure.",
    )
    runner_b = FakeRunner("production_line_b")

    coordinator, _, _ = make_coordinator(runner_a, runner_b)

    report = coordinator.execute_selected_plan(make_plan())

    assert report["status"] == "partial_failure"
    assert report["lines"]["line_a"]["status"] == "failed"
    assert report["lines"]["line_b"]["status"] == "completed"

    status = coordinator.get_status()

    assert status["lines"]["line_a"]["blocked"] is True
    assert status["lines"]["line_a"]["block_reason"] == (
        "Mock production failure."
    )
    assert status["lines"]["line_b"]["blocked"] is False


def test_blocked_line_cannot_execute_without_manual_recovery():
    runner_a = FakeRunner(
        "production_line_a",
        failure_message="Mock production failure.",
    )
    runner_b = FakeRunner("production_line_b")

    coordinator, _, _ = make_coordinator(runner_a, runner_b)

    coordinator.execute_selected_plan(make_plan())

    retry_plan = make_plan(
        plan_id="plan_002",
        schedule_id="schedule_002",
        line_a_orders=[make_order("A2", "P1")],
        line_b_orders=[],
        line_b_parameters=None,
    )

    with pytest.raises(RuntimeError, match="manual recovery"):
        coordinator.execute_selected_plan(retry_plan)

    assert len(runner_a.calls) == 1


def test_healthy_line_can_continue_while_other_line_is_blocked():
    runner_a = FakeRunner(
        "production_line_a",
        failure_message="Mock production failure.",
    )
    runner_b = FakeRunner("production_line_b")

    coordinator, _, _ = make_coordinator(runner_a, runner_b)

    coordinator.execute_selected_plan(make_plan())

    line_b_only_plan = make_plan(
        plan_id="plan_002",
        schedule_id="schedule_002",
        line_a_orders=[],
        line_a_parameters=None,
        line_b_orders=[make_order("B2", "P3")],
    )

    report = coordinator.execute_selected_plan(line_b_only_plan)

    assert report["status"] == "completed"
    assert report["lines"]["line_a"]["status"] == "idle"
    assert report["lines"]["line_b"]["status"] == "completed"

    assert len(runner_a.calls) == 1
    assert len(runner_b.calls) == 2


def test_overlapping_plan_execution_is_rejected():
    entered_a = threading.Event()
    entered_b = threading.Event()
    release = threading.Event()

    runner_a = FakeRunner(
        "production_line_a",
        entered_event=entered_a,
        release_event=release,
    )
    runner_b = FakeRunner(
        "production_line_b",
        entered_event=entered_b,
        release_event=release,
    )

    coordinator, _, _ = make_coordinator(runner_a, runner_b)

    try:
        with ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(
                coordinator.execute_selected_plan,
                make_plan(),
            )

            assert entered_a.wait(timeout=3)
            assert entered_b.wait(timeout=3)

            with pytest.raises(RuntimeError, match="already executing"):
                coordinator.execute_selected_plan(
                    make_plan(
                        plan_id="overlapping_plan",
                        schedule_id="overlapping_schedule",
                    )
                )

            release.set()

            report = future.result(timeout=5)

        assert report["status"] == "completed"
        assert len(runner_a.calls) == 1
        assert len(runner_b.calls) == 1

    finally:
        release.set()


def test_plan_cannot_be_empty_on_both_lines():
    coordinator, runner_a, runner_b = make_coordinator()

    plan = make_plan(
        line_a_orders=[],
        line_a_parameters=None,
        line_b_orders=[],
        line_b_parameters=None,
    )

    with pytest.raises(ValueError, match="at least one line"):
        coordinator.execute_selected_plan(plan)

    assert runner_a.calls == []
    assert runner_b.calls == []


def test_coordinator_rejects_the_same_runner_for_both_lines():
    runner = FakeRunner("production_line_a")

    with pytest.raises(ValueError, match="independent runners"):
        ProductionCoordinator(runner, runner)


def test_coordinator_rejects_incorrect_scene_assignments():
    runner_a = FakeRunner("production_line_b")
    runner_b = FakeRunner("production_line_b")

    with pytest.raises(ValueError, match="production_line_a"):
        ProductionCoordinator(runner_a, runner_b)


def test_coordinator_rejects_wrong_plan_type():
    coordinator, _, _ = make_coordinator()

    with pytest.raises(TypeError, match="SelectedProductionPlan"):
        coordinator.execute_selected_plan({"plan_id": "invalid"})
