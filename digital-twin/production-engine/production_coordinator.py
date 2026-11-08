
"""Production execution coordinator for two AutoPack packaging lines.

- Executes only Main-Agent-selected plans.
- Executes Line A and Line B concurrently.
- Applies deterministic production variations.
- Preserves inventory between production runs.
- Records requested and effective operating parameters.
- Blocks a line after execution failure.
- Prevents overlapping production-plan executions.

Does not select proposals, calculate machine health, or connect to Firebase.
"""

from __future__ import annotations

import sys
import threading
import time
from collections.abc import Mapping, Sequence
from concurrent.futures import ThreadPoolExecutor
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any


# Resolve the existing T1 simulation and production modules.
BASE_DIR = Path(__file__).resolve().parents[1]
SIMULATION_ENGINE_DIR = BASE_DIR / "simulation-engine"
PRODUCTION_ENGINE_DIR = BASE_DIR / "production-engine"

for directory in (SIMULATION_ENGINE_DIR, PRODUCTION_ENGINE_DIR):
    directory_path = str(directory)
    if directory_path not in sys.path:
        sys.path.insert(0, directory_path)

from line_runner import LineParameters, LineRunner  # type: ignore[reportMissingImports]
from production_variation import ProductionVariationPolicy  # type: ignore[reportMissingImports]


@dataclass(frozen=True)
class SelectedProductionPlan:
    """A selected plan with independent schedules for both lines."""

    plan_id: str
    schedule_id: str

    line_a_orders: Sequence[Mapping[str, Any]]
    line_a_parameters: LineParameters | None

    line_b_orders: Sequence[Mapping[str, Any]]
    line_b_parameters: LineParameters | None


class ProductionCoordinator:
    """Coordinates simulated production on two independent scenes."""

    EXPECTED_SCENES = {
        "line_a": "production_line_a",
        "line_b": "production_line_b",
    }

    def __init__(
        self,
        line_a_runner: LineRunner,
        line_b_runner: LineRunner,
        variation_policy: ProductionVariationPolicy | None = None,
    ) -> None:
        if line_a_runner is line_b_runner:
            raise ValueError(
                "Production Line A and Line B need independent runners."
            )

        self.runners = {
            "line_a": line_a_runner,
            "line_b": line_b_runner,
        }

        for line_id, runner in self.runners.items():
            actual_scene = runner.line.connection.scene_name
            expected_scene = self.EXPECTED_SCENES[line_id]

            if actual_scene != expected_scene:
                raise ValueError(
                    f"{line_id} must use scene {expected_scene}; "
                    f"received {actual_scene}."
                )

        self.variation_policy = (
            variation_policy
            if variation_policy is not None
            else ProductionVariationPolicy(
                max_relative_variation=0.02,
                seed=2026,
            )
        )

        self._state_lock = threading.Lock()
        self._execution_lock = threading.Lock()
        self._blocked_lines: dict[str, str] = {}

    @staticmethod
    def _validate_plan_identity(
        plan: SelectedProductionPlan,
    ) -> None:
        if not isinstance(plan.plan_id, str) or not plan.plan_id.strip():
            raise ValueError("plan_id must be supplied.")

        if (
            not isinstance(plan.schedule_id, str)
            or not plan.schedule_id.strip()
        ):
            raise ValueError("schedule_id must be supplied.")

    @staticmethod
    def _validate_line_schedule(
        line_id: str,
        runner: LineRunner,
        orders: Sequence[Mapping[str, Any]],
        parameters: LineParameters | None,
    ) -> list[Mapping[str, Any]]:
        """Preflight orders and stock without moving objects."""

        if (
            not isinstance(orders, Sequence)
            or isinstance(orders, (str, bytes))
        ):
            raise ValueError(
                f"{line_id} orders must be a sequence."
            )

        normalized_orders = list(orders)

        if not normalized_orders:
            if parameters is not None:
                if not isinstance(parameters, LineParameters):
                    raise ValueError(
                        f"{line_id} parameters must be LineParameters."
                    )
                parameters.validate()

            return []

        if parameters is None:
            raise ValueError(
                f"{line_id} requires operating parameters."
            )

        if not isinstance(parameters, LineParameters):
            raise ValueError(
                f"{line_id} parameters must be LineParameters."
            )

        parameters.validate()

        if runner.sim.getSimulationState() != 0:
            raise RuntimeError(
                f"{line_id} CoppeliaSim simulation must remain stopped."
            )

        required_stock = {
            f"P{i}": 0 for i in range(1, 5)
        }

        for index, order in enumerate(normalized_orders):
            if not isinstance(order, Mapping):
                raise ValueError(
                    f"{line_id} order {index} must be a mapping."
                )

            if "order_id" not in order or "quantities" not in order:
                raise ValueError(
                    f"{line_id} order {index} requires "
                    "order_id and quantities."
                )

            order_id = str(order["order_id"]).strip()

            if not order_id:
                raise ValueError(
                    f"{line_id} order {index} has an empty order_id."
                )

            quantities = runner._validate_quantities(
                order["quantities"]
            )

            for product, quantity in quantities.items():
                required_stock[product] += quantity

        for product, required in required_stock.items():
            available = runner.line.remaining_stock[product]

            if required > available:
                raise ValueError(
                    f"{line_id}: schedule requires {required} "
                    f"{product} balls, but only {available} remain."
                )

        return normalized_orders

    def _prepare_line(
        self,
        line_id: str,
        orders: Sequence[Mapping[str, Any]],
        requested_parameters: LineParameters | None,
        plan: SelectedProductionPlan,
    ) -> dict[str, Any]:
        """Validate a line and prepare its effective production inputs."""

        runner = self.runners[line_id]

        normalized_orders = self._validate_line_schedule(
            line_id,
            runner,
            orders,
            requested_parameters,
        )

        if not normalized_orders:
            return {
                "orders": [],
                "requested_parameters": None,
                "effective_parameters": None,
                "variation_report": None,
            }

        effective_parameters, variation_report = (
            self.variation_policy.apply(
                requested_parameters,
                plan_id=plan.plan_id,
                schedule_id=plan.schedule_id,
                line_id=line_id,
            )
        )

        effective_parameters.validate()

        return {
            "orders": normalized_orders,
            "requested_parameters": requested_parameters,
            "effective_parameters": effective_parameters,
            "variation_report": variation_report,
        }

    @staticmethod
    def _get_safe_status(
        runner: LineRunner,
    ) -> dict[str, Any] | None:
        try:
            return runner.get_status()
        except Exception:
            return None

    def _execute_line(
        self,
        line_id: str,
        prepared: Mapping[str, Any],
        schedule_id: str,
    ) -> dict[str, Any]:
        """Execute one line without resetting its inventory."""

        runner = self.runners[line_id]

        requested_parameters = prepared["requested_parameters"]
        effective_parameters = prepared["effective_parameters"]
        variation_report = prepared["variation_report"]
        orders = prepared["orders"]

        try:
            result = runner.run_schedule(
                orders=orders,
                parameters=effective_parameters,
                schedule_id=f"{schedule_id}:{line_id}",
            )

            # Keep requested and effective inputs in the report.
            # The runner's own parameters field contains effective values.
            return {
                "line_id": line_id,
                "scene_id": self.EXPECTED_SCENES[line_id],
                "status": "completed",
                "assigned_orders": len(orders),
                "requested_parameters": asdict(requested_parameters),
                "effective_parameters": asdict(effective_parameters),
                "variation_report": variation_report,
                "result": result,
                "final_state": self._get_safe_status(runner),
                "error": None,
            }

        except Exception as exc:
            # Never automatically reset a potentially partially completed run.
            with self._state_lock:
                self._blocked_lines[line_id] = str(exc)

            return {
                "line_id": line_id,
                "scene_id": self.EXPECTED_SCENES[line_id],
                "status": "failed",
                "assigned_orders": len(orders),
                "requested_parameters": asdict(requested_parameters),
                "effective_parameters": asdict(effective_parameters),
                "variation_report": variation_report,
                "result": None,
                "final_state": self._get_safe_status(runner),
                "error": str(exc),
            }

    def _idle_line_report(
        self,
        line_id: str,
    ) -> dict[str, Any]:
        """Report a line without assigned orders."""

        runner = self.runners[line_id]

        return {
            "line_id": line_id,
            "scene_id": self.EXPECTED_SCENES[line_id],
            "status": "idle",
            "assigned_orders": 0,
            "requested_parameters": None,
            "effective_parameters": None,
            "variation_report": None,
            "result": None,
            "final_state": self._get_safe_status(runner),
            "error": None,
        }

    @staticmethod
    def _calculate_combined_metrics(
        line_reports: Mapping[str, Mapping[str, Any]],
    ) -> dict[str, Any] | None:
        """Calculate throughput using parallel execution time."""

        results = [
            report["result"]
            for report in line_reports.values()
            if report["status"] == "completed"
            and report["result"] is not None
        ]

        if not results:
            return None

        total_orders = sum(
            result["total_orders"] for result in results
        )

        total_balls = sum(
            result["total_balls"] for result in results
        )

        makespan = max(
            result["total_completion_time_seconds"]
            for result in results
        )

        return {
            "total_orders": total_orders,
            "total_balls": total_balls,
            "parallel_completion_time_seconds": round(makespan, 3),
            "orders_per_minute": round(
                total_orders * 60.0 / makespan, 3
            ) if makespan > 0 else 0.0,
            "balls_per_minute": round(
                total_balls * 60.0 / makespan, 3
            ) if makespan > 0 else 0.0,
            "scope": "successfully_completed_lines_only",
        }

    @staticmethod
    def _overall_status(
        line_reports: Mapping[str, Mapping[str, Any]],
    ) -> str:
        active = [
            report["status"]
            for report in line_reports.values()
            if report["status"] != "idle"
        ]

        if active and all(
            status == "completed" for status in active
        ):
            return "completed"

        if "completed" in active:
            return "partial_failure"

        return "failed"

    def execute_selected_plan(
        self,
        plan: SelectedProductionPlan,
    ) -> dict[str, Any]:
        """Execute one Main-Agent-selected plan."""

        if not isinstance(plan, SelectedProductionPlan):
            raise TypeError(
                "plan must be a SelectedProductionPlan."
            )

        if not self._execution_lock.acquire(blocking=False):
            raise RuntimeError(
                "Another production plan is already executing."
            )

        try:
            return self._execute_plan_locked(plan)
        finally:
            self._execution_lock.release()

    def _execute_plan_locked(
        self,
        plan: SelectedProductionPlan,
    ) -> dict[str, Any]:
        self._validate_plan_identity(plan)

        # Prepare and validate BOTH lines before starting either one.
        prepared = {
            "line_a": self._prepare_line(
                "line_a",
                plan.line_a_orders,
                plan.line_a_parameters,
                plan,
            ),
            "line_b": self._prepare_line(
                "line_b",
                plan.line_b_orders,
                plan.line_b_parameters,
                plan,
            ),
        }

        if not prepared["line_a"]["orders"] and not prepared["line_b"]["orders"]:
            raise ValueError(
                "The selected plan must assign orders to at least one line."
            )

        with self._state_lock:
            blocked = {
                line_id: self._blocked_lines[line_id]
                for line_id, data in prepared.items()
                if data["orders"] and line_id in self._blocked_lines
            }

        if blocked:
            raise RuntimeError(
                "Production cannot start because a line requires "
                f"manual recovery: {blocked}"
            )

        line_reports: dict[str, dict[str, Any]] = {}
        start = time.perf_counter()

        # Each line runs concurrently; candidate evaluation is not involved.
        with ThreadPoolExecutor(
            max_workers=2,
            thread_name_prefix="production-line",
        ) as executor:

            futures = {}

            for line_id in ("line_a", "line_b"):
                if not prepared[line_id]["orders"]:
                    line_reports[line_id] = self._idle_line_report(line_id)
                    continue

                futures[line_id] = executor.submit(
                    self._execute_line,
                    line_id,
                    prepared[line_id],
                    plan.schedule_id,
                )

            for line_id, future in futures.items():
                line_reports[line_id] = future.result()

        wall_clock = time.perf_counter() - start

        return {
            "plan_id": plan.plan_id,
            "schedule_id": plan.schedule_id,
            "status": self._overall_status(line_reports),
            "lines": line_reports,
            "combined_metrics": self._calculate_combined_metrics(
                line_reports
            ),
            "wall_clock_duration_seconds": round(wall_clock, 3),
            "execution_authority": "main_agent_selected_plan",
            "inventory_policy": "persistent_across_production_runs",
            "variation_policy": {
                "profile": self.variation_policy.PROFILE_ID,
                "seed": self.variation_policy.seed,
                "max_relative_variation": (
                    self.variation_policy.max_relative_variation
                ),
            },
        }

    def get_status(self) -> dict[str, Any]:
        """Return the current independent states of both production lines."""

        with self._state_lock:
            blocked_lines = self._blocked_lines.copy()

        lines = {}

        for line_id, runner in self.runners.items():
            lines[line_id] = {
                "scene_id": self.EXPECTED_SCENES[line_id],
                "blocked": line_id in blocked_lines,
                "block_reason": blocked_lines.get(line_id),
                "state": self._get_safe_status(runner),
            }

        return {
            "execution_in_progress": self._execution_lock.locked(),
            "lines": lines,
        }
