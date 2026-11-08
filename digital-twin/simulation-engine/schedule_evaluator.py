
"""Candidate schedule evaluation using the Digital Twin CoppeliaSim lines."""

from __future__ import annotations

from copy import deepcopy
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from typing import Any, Mapping, Sequence

from line_runner import LineRunner, LineParameters
from state_manager import DigitalTwinStateManager


@dataclass(frozen=True)
class EvaluationCandidate:
    """One candidate schedule and its generated operating parameters."""

    candidate_id: str
    schedule_id: str
    orders: Sequence[Mapping[str, Any]]
    parameters: LineParameters

    @classmethod
    def from_parameter_candidate(
        cls,
        generated_candidate: Any,
        orders: Sequence[Mapping[str, Any]],
    ) -> "EvaluationCandidate":
        """Combine generated parameters with a proposed order sequence."""

        values = generated_candidate.parameters

        parameters = LineParameters(
            upper_belt_speed=values["upper_belt_speed"],
            box_speed=values["box_speed"],
            dispenser_rpm=values["dispenser_rpm"],
            settle_time=values["settle_time"],
        )

        return cls(
            candidate_id=generated_candidate.candidate_id,
            schedule_id=generated_candidate.schedule_id,
            orders=deepcopy(list(orders)),
            parameters=parameters,
        )

    def validate(self) -> None:
        if not self.candidate_id.strip():
            raise ValueError("candidate_id cannot be empty.")

        if not self.schedule_id.strip():
            raise ValueError("schedule_id cannot be empty.")

        if not self.orders:
            raise ValueError(
                f"{self.candidate_id}: at least one order is required."
            )

        self.parameters.validate()


class ScheduleEvaluator:
    """Evaluates candidate schedules on one connected Digital Twin line.

    Candidates are executed sequentially. Each candidate starts from
    the same initial inventory and box positions.

    Results are returned to the caller. Final schedule selection
    remains the responsibility of the Main Agent.
    """

    def __init__(
        self,
        *,
        scene_id: str,
        line_runner: LineRunner,
        state_manager: DigitalTwinStateManager,
    ):
        if scene_id not in state_manager.get_digital_twin_scenes():
            raise ValueError(
                "Schedule evaluation is allowed only on Digital Twin scenes."
            )

        if line_runner.line.connection.scene_name != scene_id:
            raise ValueError(
                "LineRunner is connected to a different scene."
            )

        if scene_id not in state_manager.get_connected_scenes():
            raise RuntimeError(
                "Attach this line to the State Manager before evaluation."
            )

        self.scene_id = scene_id
        self.runner = line_runner
        self.state_manager = state_manager

    def _prepare_candidate(self) -> None:
        """Restore a common initial state before candidate evaluation."""

        self.runner.reset()
        self.state_manager.refresh(self.scene_id)

    def _evaluate_one(
        self,
        candidate: EvaluationCandidate,
    ) -> dict[str, Any]:
        """Evaluate one candidate and restore the scene afterwards."""

        entry = {
            "candidate_id": candidate.candidate_id,
            "schedule_id": candidate.schedule_id,
            "parameters": asdict(candidate.parameters),
            "status": "pending",
            "metrics": None,
            "result": None,
            "error": None,
        }

        run_registered = False

        try:
            candidate.validate()

            self._prepare_candidate()

            if self.runner.sim.getSimulationState() != 0:
                raise RuntimeError(
                    "Digital Twin CoppeliaSim scene must be stopped."
                )

            # Register this evaluation with the central State Manager.
            self.state_manager.begin_run(
                self.scene_id,
                candidate.candidate_id,
                "candidate",
            )

            run_registered = True

            # Execute the actual schedule using the generated parameters.
            result = self.runner.run_schedule(
                orders=candidate.orders,
                parameters=candidate.parameters,
                schedule_id=candidate.candidate_id,
            )

            # Record successful evaluation.
            self.state_manager.complete_run(
                self.scene_id,
                result,
            )

            run_registered = False

            entry["status"] = "completed"
            entry["result"] = deepcopy(result)

            entry["metrics"] = {
                "total_orders": result["total_orders"],
                "total_balls": result["total_balls"],
                "total_completion_time_seconds": (
                    result["total_completion_time_seconds"]
                ),
                "average_order_completion_seconds": (
                    result["average_order_completion_seconds"]
                ),
                "orders_per_minute": result["orders_per_minute"],
                "balls_per_minute": result["balls_per_minute"],
            }

        except Exception as exc:
            entry["status"] = "failed"
            entry["error"] = str(exc)

            if run_registered:
                try:
                    self.state_manager.fail_run(
                        self.scene_id,
                        exc,
                    )
                    run_registered = False
                except Exception as state_error:
                    entry["state_manager_error"] = str(state_error)

        finally:
            # Every candidate must leave the scene in its initial state.
            try:
                self._prepare_candidate()
            except Exception as cleanup_error:
                entry["cleanup_error"] = str(cleanup_error)

                raise RuntimeError(
                    f"Could not restore {self.scene_id} after "
                    f"candidate {candidate.candidate_id}: "
                    f"{cleanup_error}"
                ) from cleanup_error

        entry["completed_at"] = datetime.now(
            timezone.utc
        ).isoformat(timespec="seconds")

        return entry

    def evaluate_candidates(
        self,
        candidates: Sequence[EvaluationCandidate],
    ) -> dict[str, Any]:
        """Evaluate multiple schedules and return their measured results."""

        if not candidates:
            raise ValueError("At least one candidate is required.")

        candidate_ids = [
            candidate.candidate_id for candidate in candidates
        ]

        if len(candidate_ids) != len(set(candidate_ids)):
            raise ValueError(
                "Candidate IDs must be unique within an evaluation."
            )

        if self.runner.sim.getSimulationState() != 0:
            raise RuntimeError(
                "Stop the Digital Twin scene before evaluation."
            )

        results = []

        for candidate in candidates:
            results.append(
                self._evaluate_one(candidate)
            )

        successful = [
            result for result in results
            if result["status"] == "completed"
        ]

        failed = [
            result for result in results
            if result["status"] == "failed"
        ]

        return {
            "scene_id": self.scene_id,
            "evaluation_timestamp": datetime.now(
                timezone.utc
            ).isoformat(timespec="seconds"),
            "candidate_count": len(candidates),
            "successful_count": len(successful),
            "failed_count": len(failed),
            "results": results,
            "selection_authority": "main_agent",
        }

    def evaluate_generated_parameters(
        self,
        *,
        orders: Sequence[Mapping[str, Any]],
        parameter_candidates: Sequence[Any],
    ) -> dict[str, Any]:
        """Evaluate generated parameter configurations for an order schedule."""

        candidates = [
            EvaluationCandidate.from_parameter_candidate(
                generated_candidate,
                orders,
            )
            for generated_candidate in parameter_candidates
        ]

        return self.evaluate_candidates(candidates)
