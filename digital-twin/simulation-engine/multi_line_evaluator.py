
"""Concurrent Digital Twin evaluation across two independent lines.

For each candidate:
- Line A and Line B are evaluated concurrently.
- Each line uses its own ScheduleEvaluator and CoppeliaSim scene.
- Each scene is restored to its initial state after evaluation.

Different candidate plans are evaluated sequentially.

This module reports results only. It never selects or combines proposals.
Main Agent remains the selection authority.
"""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from concurrent.futures import ThreadPoolExecutor
from dataclasses import asdict, dataclass
from typing import Any

try:
    from line_runner import LineParameters
    from schedule_evaluator import (
        EvaluationCandidate,
        ScheduleEvaluator,
    )
except ImportError:
    from .line_runner import LineParameters
    from .schedule_evaluator import (
        EvaluationCandidate,
        ScheduleEvaluator,
    )


PARAMETER_FIELDS = (
    "upper_belt_speed",
    "box_speed",
    "dispenser_rpm",
    "settle_time",
)


@dataclass(frozen=True)
class MultiLineEvaluationCandidate:
    """One complete proposal containing schedules for both lines.

    An empty schedule means that the corresponding line is idle.
    At least one line must receive orders.
    """

    candidate_id: str
    schedule_id: str

    line_a_orders: Sequence[Mapping[str, Any]]
    line_a_parameters: LineParameters | Mapping[str, Any] | None

    line_b_orders: Sequence[Mapping[str, Any]]
    line_b_parameters: LineParameters | Mapping[str, Any] | None


class MultiLineEvaluator:
    """Coordinates evaluation across two independent Digital Twin scenes."""

    def __init__(
        self,
        line_a_evaluator: ScheduleEvaluator,
        line_b_evaluator: ScheduleEvaluator,
    ) -> None:
        self.evaluators = {
            "line_a": line_a_evaluator,
            "line_b": line_b_evaluator,
        }

        if line_a_evaluator.scene_id == line_b_evaluator.scene_id:
            raise ValueError(
                "Line A and Line B must use different Digital Twin scenes."
            )

    @staticmethod
    def _normalize_parameters(
        parameters: LineParameters | Mapping[str, Any] | None,
        line_id: str,
        has_orders: bool,
    ) -> LineParameters | None:
        """Convert parameter input into validated operating values."""

        if parameters is None:
            if has_orders:
                raise ValueError(
                    f"{line_id} requires operating parameters "
                    "because it has assigned orders."
                )
            return None

        if isinstance(parameters, LineParameters):
            raw = asdict(parameters)
        elif isinstance(parameters, Mapping):
            raw = dict(parameters)
        else:
            raise ValueError(
                f"{line_id} parameters must be LineParameters or a mapping."
            )

        missing = set(PARAMETER_FIELDS) - set(raw)
        extra = set(raw) - set(PARAMETER_FIELDS)

        if missing:
            raise ValueError(
                f"{line_id} is missing parameters: {sorted(missing)}"
            )

        if extra:
            raise ValueError(
                f"{line_id} has unexpected parameters: {sorted(extra)}"
            )

        clean: dict[str, float] = {}

        for name in PARAMETER_FIELDS:
            value = raw[name]

            if isinstance(value, bool):
                raise ValueError(
                    f"{line_id}: {name} must be numeric."
                )

            try:
                clean[name] = float(value)
            except (TypeError, ValueError):
                raise ValueError(
                    f"{line_id}: {name} must be numeric."
                ) from None

        result = LineParameters(**clean)
        result.validate()

        return result

    @staticmethod
    def _normalize_orders(
        orders: Sequence[Mapping[str, Any]],
        line_id: str,
    ) -> list[Mapping[str, Any]]:
        """Validate the basic structure of one line's assigned orders."""

        if (
            not isinstance(orders, Sequence)
            or isinstance(orders, (str, bytes))
        ):
            raise ValueError(
                f"{line_id} orders must be a sequence."
            )

        normalized = list(orders)

        for index, order in enumerate(normalized):
            if not isinstance(order, Mapping):
                raise ValueError(
                    f"{line_id} order at index {index} must be a mapping."
                )

        return normalized

    def _reset_idle_line(
        self,
        line_id: str,
    ) -> dict[str, Any]:
        """Restore a line that has no assigned orders."""

        evaluator = self.evaluators[line_id]

        try:
            evaluator.runner.reset()
            evaluator.state_manager.refresh(evaluator.scene_id)

            return {
                "line_id": line_id,
                "scene_id": evaluator.scene_id,
                "status": "idle",
                "assigned_orders": 0,
                "evaluation": None,
                "metrics": None,
                "error": None,
            }

        except Exception as exc:
            return {
                "line_id": line_id,
                "scene_id": evaluator.scene_id,
                "status": "failed",
                "assigned_orders": 0,
                "evaluation": None,
                "metrics": None,
                "error": str(exc),
            }

    @staticmethod
    def _get_line_status(
        evaluation: Mapping[str, Any],
    ) -> str:
        """Interpret the existing ScheduleEvaluator summary."""

        successful = evaluation.get("successful_count", 0)
        failed = evaluation.get("failed_count", 0)

        if successful == 1 and failed == 0:
            return "completed"

        if failed > 0:
            return "failed"

        return "unknown"

    def _evaluate_line(
        self,
        line_id: str,
        candidate: MultiLineEvaluationCandidate,
        orders: list[Mapping[str, Any]],
        parameters: LineParameters | None,
    ) -> dict[str, Any]:
        """Evaluate one line using its existing ScheduleEvaluator."""

        evaluator = self.evaluators[line_id]

        if not orders:
            return self._reset_idle_line(line_id)

        if parameters is None:
            return {
                "line_id": line_id,
                "scene_id": evaluator.scene_id,
                "status": "failed",
                "assigned_orders": 0,
                "evaluation": None,
                "metrics": None,
                "error": "Operating parameters were not supplied.",
            }

        line_candidate = EvaluationCandidate(
            candidate_id=f"{candidate.candidate_id}::{line_id}",
            schedule_id=candidate.schedule_id,
            orders=orders,
            parameters=parameters,
        )

        try:
            evaluation = evaluator.evaluate_candidates(
                [line_candidate]
            )

            status = self._get_line_status(evaluation)

            candidate_results = evaluation.get("results", [])
            candidate_result = (
                candidate_results[0]
                if candidate_results
                else {}
            )

            return {
                "line_id": line_id,
                "scene_id": evaluator.scene_id,
                "status": status,
                "assigned_orders": len(orders),
                "evaluation": evaluation,
                "metrics": candidate_result.get("metrics"),
                "error": candidate_result.get("error"),
                "cleanup_error": candidate_result.get("cleanup_error"),
            }

        except Exception as exc:
            reset_error = None

            try:
                evaluator.runner.reset()
                evaluator.state_manager.refresh(evaluator.scene_id)
            except Exception as reset_exc:
                reset_error = str(reset_exc)

            return {
                "line_id": line_id,
                "scene_id": evaluator.scene_id,
                "status": "failed",
                "assigned_orders": len(orders),
                "evaluation": None,
                "metrics": None,
                "error": str(exc),
                "reset_error": reset_error,
            }

    @staticmethod
    def _overall_status(
        line_reports: Mapping[str, Mapping[str, Any]],
    ) -> str:
        """Calculate combined execution status without selecting a plan."""

        active_statuses = [
            report["status"]
            for report in line_reports.values()
            if report["status"] != "idle"
        ]

        if active_statuses and all(
            status == "completed" for status in active_statuses
        ):
            return "completed"

        if "completed" in active_statuses:
            return "partial_failure"

        if active_statuses and all(
            status == "failed" for status in active_statuses
        ):
            return "failed"

        return "unknown"

    def evaluate_candidate(
        self,
        candidate: MultiLineEvaluationCandidate,
    ) -> dict[str, Any]:
        """Evaluate both line schedules concurrently for one candidate."""

        if not isinstance(candidate, MultiLineEvaluationCandidate):
            raise TypeError(
                "candidate must be MultiLineEvaluationCandidate."
            )

        if (
            not isinstance(candidate.candidate_id, str)
            or not candidate.candidate_id.strip()
        ):
            raise ValueError("candidate_id must be supplied.")

        if (
            not isinstance(candidate.schedule_id, str)
            or not candidate.schedule_id.strip()
        ):
            raise ValueError("schedule_id must be supplied.")

        line_a_orders = self._normalize_orders(
            candidate.line_a_orders, "line_a"
        )

        line_b_orders = self._normalize_orders(
            candidate.line_b_orders, "line_b"
        )

        if not line_a_orders and not line_b_orders:
            raise ValueError(
                "A candidate must assign at least one order "
                "across the two lines."
            )

        line_a_parameters = self._normalize_parameters(
            candidate.line_a_parameters,
            "line_a",
            bool(line_a_orders),
        )

        line_b_parameters = self._normalize_parameters(
            candidate.line_b_parameters,
            "line_b",
            bool(line_b_orders),
        )

        # The two independent scenes execute concurrently.
        # Different candidate proposals are never run concurrently.
        with ThreadPoolExecutor(
            max_workers=2,
            thread_name_prefix="digital-twin-line",
        ) as executor:

            future_a = executor.submit(
                self._evaluate_line,
                "line_a",
                candidate,
                line_a_orders,
                line_a_parameters,
            )

            future_b = executor.submit(
                self._evaluate_line,
                "line_b",
                candidate,
                line_b_orders,
                line_b_parameters,
            )

            line_a_report = future_a.result()
            line_b_report = future_b.result()

        line_reports = {
            "line_a": line_a_report,
            "line_b": line_b_report,
        }

        return {
            "candidate_id": candidate.candidate_id,
            "schedule_id": candidate.schedule_id,
            "status": self._overall_status(line_reports),
            "lines": line_reports,
            "selection_authority": "main_agent",
        }

    def evaluate_candidates(
        self,
        candidates: Sequence[MultiLineEvaluationCandidate],
    ) -> dict[str, Any]:
        """Evaluate candidates sequentially, with concurrent line execution."""

        if (
            not isinstance(candidates, Sequence)
            or isinstance(candidates, (str, bytes))
        ):
            raise ValueError("candidates must be a sequence.")

        candidates = list(candidates)

        if not candidates:
            raise ValueError(
                "At least one candidate plan is required."
            )

        for candidate in candidates:
            if not isinstance(
                candidate, MultiLineEvaluationCandidate
            ):
                raise TypeError(
                    "Every item must be a MultiLineEvaluationCandidate."
                )

        candidate_ids = [
            candidate.candidate_id
            for candidate in candidates
        ]

        if len(candidate_ids) != len(set(candidate_ids)):
            raise ValueError(
                "Candidate IDs must be unique within one evaluation batch."
            )

        # Sequential candidate evaluation ensures that two different
        # proposals never compete for the same Digital Twin scenes.
        results = [
            self.evaluate_candidate(candidate)
            for candidate in candidates
        ]

        successful = sum(
            result["status"] == "completed"
            for result in results
        )

        failed = sum(
            result["status"] == "failed"
            for result in results
        )

        partial = sum(
            result["status"] == "partial_failure"
            for result in results
        )

        return {
            "evaluated_candidate_count": len(results),
            "successful_count": successful,
            "failed_count": failed,
            "partial_failure_count": partial,
            "candidate_results": results,
            "selection_authority": "main_agent",
        }
