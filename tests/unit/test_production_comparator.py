from copy import deepcopy
from pathlib import Path
import sys

import pytest


ROOT = Path(__file__).resolve().parents[2]

EVALUATION_DIR = ROOT / "digital-twin" / "evaluation"
SIMULATION_ENGINE_DIR = ROOT / "digital-twin" / "simulation-engine"
COMMUNICATION_DIR = ROOT / "digital-twin" / "communication"

for directory in (
    EVALUATION_DIR,
    SIMULATION_ENGINE_DIR,
    COMMUNICATION_DIR,
):
    path = str(directory)
    if path not in sys.path:
        sys.path.insert(0, path)

from production_comparator import compare_prediction_with_actual


def make_result(orders, elapsed):
    total_orders = len(orders)
    total_balls = sum(
        sum(order["quantities"].values())
        for order in orders
    )

    return {
        "total_orders": total_orders,
        "total_balls": total_balls,
        "total_completion_time_seconds": elapsed,
        "average_order_completion_seconds": elapsed / total_orders,
        "orders_per_minute": total_orders * 60 / elapsed,
        "balls_per_minute": total_balls * 60 / elapsed,
        "order_results": orders,
    }


def make_predicted_line(result):
    return {
        "status": "completed",
        "metrics": dict(result),
        "evaluation": {
            "results": [
                {
                    "status": "completed",
                    "result": result,
                }
            ]
        },
    }


def make_actual_line(result):
    return {
        "status": "completed",
        "result": result,
    }


def make_reports():
    line_a_orders = [
        {
            "order_id": "ORDER_001",
            "quantities": {"P1": 1},
        },
        {
            "order_id": "ORDER_002",
            "quantities": {"P2": 1},
        },
    ]

    line_b_orders = [
        {
            "order_id": "ORDER_003",
            "quantities": {"P3": 2},
        },
    ]

    predicted_a = make_result(line_a_orders, 10.0)
    predicted_b = make_result(line_b_orders, 8.0)

    actual_a = make_result(deepcopy(line_a_orders), 10.5)
    actual_b = make_result(deepcopy(line_b_orders), 8.2)

    predicted = {
        "schedule_id": "schedule_001",
        "candidate_id": "candidate_001",
        "lines": {
            "line_a": make_predicted_line(predicted_a),
            "line_b": make_predicted_line(predicted_b),
        },
    }

    actual = {
        "schedule_id": "schedule_001",
        "plan_id": "plan_001",
        "lines": {
            "line_a": make_actual_line(actual_a),
            "line_b": make_actual_line(actual_b),
        },
    }

    return predicted, actual


def test_successful_comparison():
    predicted, actual = make_reports()

    report = compare_prediction_with_actual(predicted, actual)

    assert report["status"] == "compared"
    assert report["schedule_id"] == "schedule_001"
    assert report["predicted_candidate_id"] == "candidate_001"
    assert report["actual_plan_id"] == "plan_001"
    assert report["selection_authority"] == "main_agent"

    assert report["lines"]["line_a"]["status"] == "compared"
    assert report["lines"]["line_b"]["status"] == "compared"


def test_matching_order_assignments_are_detected():
    predicted, actual = make_reports()

    report = compare_prediction_with_actual(predicted, actual)

    assert report["lines"]["line_a"]["order_sequence_match"] is True
    assert report["lines"]["line_b"]["order_sequence_match"] is True


def test_quantity_dictionary_order_does_not_create_false_mismatch():
    predicted, actual = make_reports()

    predicted_orders = (
        predicted["lines"]["line_a"]["evaluation"]["results"][0]
        ["result"]["order_results"]
    )

    actual_orders = actual["lines"]["line_a"]["result"]["order_results"]

    predicted_orders[0]["quantities"] = {"P1": 1, "P2": 2}
    actual_orders[0]["quantities"] = {"P2": 2, "P1": 1}

    report = compare_prediction_with_actual(predicted, actual)

    assert report["lines"]["line_a"]["order_sequence_match"] is True


def test_metric_deviations_are_actual_minus_predicted():
    predicted, actual = make_reports()

    report = compare_prediction_with_actual(predicted, actual)

    metrics = report["lines"]["line_a"]["metric_comparison"]["metrics"]

    elapsed = metrics["total_completion_time_seconds"]

    assert elapsed["predicted"] == 10.0
    assert elapsed["actual"] == 10.5
    assert elapsed["delta_actual_minus_predicted"] == 0.5
    assert elapsed["percentage_delta"] == 5.0


def test_combined_metrics_use_parallel_makespan():
    predicted, actual = make_reports()

    report = compare_prediction_with_actual(predicted, actual)

    assert (
        report["predicted_combined_metrics"]
        ["parallel_completion_time_seconds"] == 10.0
    )

    assert (
        report["actual_combined_metrics"]
        ["parallel_completion_time_seconds"] == 10.5
    )

    comparison = report["combined_comparison"]["metrics"]

    assert comparison["parallel_completion_time_seconds"][
        "delta_actual_minus_predicted"
    ] == 0.5


def test_different_schedule_ids_are_rejected():
    predicted, actual = make_reports()
    actual["schedule_id"] = "another_schedule"

    with pytest.raises(ValueError, match="different schedules"):
        compare_prediction_with_actual(predicted, actual)


def test_missing_schedule_id_is_rejected():
    predicted, actual = make_reports()
    del predicted["schedule_id"]

    with pytest.raises(ValueError, match="schedule_id"):
        compare_prediction_with_actual(predicted, actual)


def test_idle_lines_are_compared_without_metrics():
    predicted = {
        "schedule_id": "schedule_idle",
        "lines": {
            "line_a": {"status": "idle"},
            "line_b": {"status": "idle"},
        },
    }

    actual = {
        "schedule_id": "schedule_idle",
        "lines": {
            "line_a": {"status": "idle"},
            "line_b": {"status": "idle"},
        },
    }

    report = compare_prediction_with_actual(predicted, actual)

    assert report["status"] == "compared"
    assert report["lines"]["line_a"]["status"] == "idle"
    assert report["lines"]["line_b"]["status"] == "idle"
    assert report["predicted_combined_metrics"] is None
    assert report["actual_combined_metrics"] is None


def test_idle_vs_completed_line_is_an_assignment_mismatch():
    predicted, actual = make_reports()

    predicted["lines"]["line_a"] = {"status": "idle"}

    report = compare_prediction_with_actual(predicted, actual)

    assert report["status"] == "mismatch"
    assert report["lines"]["line_a"]["status"] == "assignment_mismatch"


def test_different_order_assignments_are_reported():
    predicted, actual = make_reports()

    actual["lines"]["line_a"]["result"]["order_results"][0][
        "quantities"
    ]["P1"] = 3

    report = compare_prediction_with_actual(predicted, actual)

    assert report["status"] == "mismatch"
    assert report["lines"]["line_a"]["status"] == "schedule_mismatch"
    assert report["lines"]["line_a"]["order_sequence_match"] is False


def test_failed_line_is_not_comparable():
    predicted, actual = make_reports()

    predicted["lines"]["line_a"] = {"status": "failed"}
    actual["lines"]["line_a"] = {"status": "failed"}

    report = compare_prediction_with_actual(predicted, actual)

    assert report["status"] == "partial"
    assert report["lines"]["line_a"]["status"] == "not_comparable"
    assert report["lines"]["line_b"]["status"] == "compared"


def test_missing_metric_is_reported_without_crashing():
    predicted, actual = make_reports()

    predicted["lines"]["line_a"]["metrics"][
        "average_order_completion_seconds"
    ] = "not available"

    report = compare_prediction_with_actual(predicted, actual)

    missing = report["lines"]["line_a"]["metric_comparison"][
        "missing_metrics"
    ]

    assert "average_order_completion_seconds" in missing


def test_zero_predicted_metric_has_no_percentage_delta():
    predicted, actual = make_reports()

    predicted["lines"]["line_a"]["metrics"][
        "average_order_completion_seconds"
    ] = 0.0

    report = compare_prediction_with_actual(predicted, actual)

    metric = report["lines"]["line_a"]["metric_comparison"]["metrics"][
        "average_order_completion_seconds"
    ]

    assert metric["percentage_delta"] is None


def test_invalid_top_level_report_is_rejected():
    with pytest.raises(ValueError, match="must be a mapping"):
        compare_prediction_with_actual([], {})


def test_missing_line_report_is_rejected():
    predicted, actual = make_reports()
    del actual["lines"]["line_b"]

    with pytest.raises(ValueError, match="line_b"):
        compare_prediction_with_actual(predicted, actual)


def test_comparator_does_not_select_a_winning_plan():
    predicted, actual = make_reports()

    report = compare_prediction_with_actual(predicted, actual)

    assert report["selection_authority"] == "main_agent"
    assert "winner" not in report
    assert "selected_proposal" not in report
