
"""Compare Digital Twin predictions with Production Model results.

This module belongs to Teammate 1.

It does not:
- Score or rank agent proposals.
- Select a winning proposal.
- Calculate machine health.
- Define acceptable deviation thresholds.

It compares the predicted and actual execution of the same schedule.
"""

from __future__ import annotations

import math
from collections.abc import Mapping, Sequence
from typing import Any


LINE_IDS = ("line_a", "line_b")

NUMERIC_METRICS = (
    "total_orders",
    "total_balls",
    "total_completion_time_seconds",
    "average_order_completion_seconds",
    "orders_per_minute",
    "balls_per_minute",
)

COUNT_METRICS = ("total_orders", "total_balls")


def _require_mapping(value: Any, name: str) -> Mapping[str, Any]:
    if not isinstance(value, Mapping):
        raise ValueError(f"{name} must be a mapping.")
    return value


def _validate_schedule_ids(
    predicted: Mapping[str, Any],
    actual: Mapping[str, Any],
) -> str:
    predicted_id = predicted.get("schedule_id")
    actual_id = actual.get("schedule_id")

    if not isinstance(predicted_id, str) or not predicted_id.strip():
        raise ValueError("Digital Twin report has no valid schedule_id.")

    if not isinstance(actual_id, str) or not actual_id.strip():
        raise ValueError("Production report has no valid schedule_id.")

    if predicted_id != actual_id:
        raise ValueError(
            "Cannot compare different schedules: "
            f"Digital Twin={predicted_id!r}, Production={actual_id!r}."
        )

    return predicted_id


def _extract_predicted_result(
    line_report: Mapping[str, Any],
) -> Mapping[str, Any] | None:
    """Extract the individual candidate result from ScheduleEvaluator."""

    evaluation = line_report.get("evaluation")

    if not isinstance(evaluation, Mapping):
        return None

    results = evaluation.get("results")

    if (
        not isinstance(results, Sequence)
        or isinstance(results, (str, bytes))
        or len(results) != 1
    ):
        return None

    candidate_result = results[0]

    if not isinstance(candidate_result, Mapping):
        return None

    result = candidate_result.get("result")

    if isinstance(result, Mapping):
        return result

    return None


def _normalize_order_sequence(
    result: Mapping[str, Any],
) -> tuple[tuple[str, tuple[tuple[str, Any], ...]], ...] | None:
    """Create a comparable representation of executed order assignments."""

    orders = result.get("order_results")

    if (
        not isinstance(orders, Sequence)
        or isinstance(orders, (str, bytes))
    ):
        return None

    normalized = []

    for order in orders:
        if not isinstance(order, Mapping):
            return None

        order_id = order.get("order_id")
        quantities = order.get("quantities")

        if not isinstance(order_id, str) or not order_id.strip():
            return None

        if not isinstance(quantities, Mapping):
            return None

        normalized_quantities = tuple(
            sorted(quantities.items())
        )

        normalized.append(
            (order_id, normalized_quantities)
        )

    return tuple(normalized)


def _compare_numeric_metrics(
    predicted: Mapping[str, Any],
    actual: Mapping[str, Any],
    metric_names: Sequence[str] = NUMERIC_METRICS,
) -> dict[str, Any]:
    """Report actual-minus-predicted deviations without judging them."""

    comparisons = {}
    missing = []

    for name in metric_names:
        predicted_value = predicted.get(name)
        actual_value = actual.get(name)

        valid_predicted = (
            isinstance(predicted_value, (int, float))
            and not isinstance(predicted_value, bool)
            and math.isfinite(predicted_value)
        )

        valid_actual = (
            isinstance(actual_value, (int, float))
            and not isinstance(actual_value, bool)
            and math.isfinite(actual_value)
        )

        if not valid_predicted or not valid_actual:
            missing.append(name)
            continue

        delta = actual_value - predicted_value

        percentage_delta = (
            (delta / predicted_value) * 100.0
            if predicted_value != 0
            else None
        )

        comparisons[name] = {
            "predicted": predicted_value,
            "actual": actual_value,
            "delta_actual_minus_predicted": round(delta, 6),
            "absolute_delta": round(abs(delta), 6),
            "percentage_delta": (
                round(percentage_delta, 3)
                if percentage_delta is not None
                else None
            ),
            "exact_match": (
                predicted_value == actual_value
                if name in COUNT_METRICS
                else None
            ),
        }

    return {
        "metrics": comparisons,
        "missing_metrics": missing,
    }


def _compare_line(
    line_id: str,
    predicted_line: Mapping[str, Any],
    actual_line: Mapping[str, Any],
) -> dict[str, Any]:
    """Compare one line's predicted and actual execution."""

    predicted_status = predicted_line.get("status")
    actual_status = actual_line.get("status")

    common = {
        "line_id": line_id,
        "predicted_status": predicted_status,
        "actual_status": actual_status,
    }

    if predicted_status == "idle" and actual_status == "idle":
        return {
            **common,
            "status": "idle",
            "order_sequence_match": True,
            "metric_comparison": None,
        }

    if (
        predicted_status == "idle"
        or actual_status == "idle"
    ):
        return {
            **common,
            "status": "assignment_mismatch",
            "order_sequence_match": False,
            "metric_comparison": None,
        }

    if (
        predicted_status != "completed"
        or actual_status != "completed"
    ):
        return {
            **common,
            "status": "not_comparable",
            "order_sequence_match": None,
            "metric_comparison": None,
            "reason": "Both executions must complete for comparison.",
        }

    predicted_result = _extract_predicted_result(predicted_line)
    actual_result = actual_line.get("result")

    if predicted_result is None or not isinstance(
        actual_result, Mapping
    ):
        return {
            **common,
            "status": "not_comparable",
            "order_sequence_match": None,
            "metric_comparison": None,
            "reason": "Execution metrics or order results are missing.",
        }

    predicted_orders = _normalize_order_sequence(predicted_result)
    actual_orders = _normalize_order_sequence(actual_result)

    sequence_match = (
        predicted_orders == actual_orders
        if predicted_orders is not None and actual_orders is not None
        else None
    )

    predicted_metrics = predicted_line.get("metrics")

    if not isinstance(predicted_metrics, Mapping):
        predicted_metrics = predicted_result

    metric_comparison = _compare_numeric_metrics(
        predicted_metrics,
        actual_result,
    )

    line_status = (
        "schedule_mismatch"
        if sequence_match is False
        else "compared"
    )

    return {
        **common,
        "status": line_status,
        "order_sequence_match": sequence_match,
        "predicted_order_count": predicted_result.get("total_orders"),
        "actual_order_count": actual_result.get("total_orders"),
        "metric_comparison": metric_comparison,
    }


def _combined_metrics(
    line_reports: Mapping[str, Mapping[str, Any]],
    predicted: bool,
) -> dict[str, Any] | None:
    """Derive comparable combined metrics across completed lines."""

    results = []

    for line_id in LINE_IDS:
        report = line_reports.get(line_id)

        if not isinstance(report, Mapping):
            continue

        if report.get("status") != "completed":
            continue

        if predicted:
            result = _extract_predicted_result(report)
        else:
            result = report.get("result")

        if isinstance(result, Mapping):
            results.append(result)

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


def compare_prediction_with_actual(
    predicted_report: Mapping[str, Any],
    actual_report: Mapping[str, Any],
) -> dict[str, Any]:
    """Compare one Digital Twin report with its Production execution.

    Both reports must refer to the same schedule_id.

    The returned deviations are descriptive. No tolerance, score,
    winner or acceptance decision is invented here.
    """

    predicted = _require_mapping(
        predicted_report, "predicted_report"
    )

    actual = _require_mapping(
        actual_report, "actual_report"
    )

    schedule_id = _validate_schedule_ids(predicted, actual)

    predicted_lines = _require_mapping(
        predicted.get("lines"), "predicted_report.lines"
    )

    actual_lines = _require_mapping(
        actual.get("lines"), "actual_report.lines"
    )

    line_comparisons = {}

    for line_id in LINE_IDS:
        predicted_line = _require_mapping(
            predicted_lines.get(line_id),
            f"predicted_report.lines.{line_id}",
        )

        actual_line = _require_mapping(
            actual_lines.get(line_id),
            f"actual_report.lines.{line_id}",
        )

        line_comparisons[line_id] = _compare_line(
            line_id,
            predicted_line,
            actual_line,
        )

    statuses = [
        result["status"]
        for result in line_comparisons.values()
    ]

    if any(
        status in ("assignment_mismatch", "schedule_mismatch")
        for status in statuses
    ):
        overall_status = "mismatch"
    elif any(status == "not_comparable" for status in statuses):
        overall_status = "partial"
    else:
        overall_status = "compared"

    predicted_combined = _combined_metrics(
        predicted_lines, predicted=True
    )

    actual_combined = _combined_metrics(
        actual_lines, predicted=False
    )

    combined_comparison = None

    if (
        predicted_combined is not None
        and actual_combined is not None
    ):
        combined_comparison = _compare_numeric_metrics(
            predicted_combined,
            actual_combined,
            metric_names=(
                "total_orders",
                "total_balls",
                "parallel_completion_time_seconds",
                "orders_per_minute",
                "balls_per_minute",
            ),
        )

    return {
        "schema_version": "1.0",
        "schedule_id": schedule_id,
        "predicted_candidate_id": predicted.get("candidate_id"),
        "actual_plan_id": actual.get("plan_id"),
        "status": overall_status,
        "lines": line_comparisons,
        "predicted_combined_metrics": predicted_combined,
        "actual_combined_metrics": actual_combined,
        "combined_comparison": combined_comparison,
        "comparison_scope": [
            "order assignments",
            "product quantities",
            "completion times",
            "throughput",
        ],
        "limitations": [
            "No acceptable-deviation thresholds have been configured.",
            "Machine-health and wear comparisons are not included yet.",
            "This component does not score proposals or select a plan.",
        ],
        "selection_authority": "main_agent",
    }
