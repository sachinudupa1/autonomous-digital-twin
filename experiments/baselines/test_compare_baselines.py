
import pytest

from compare_baselines import evaluate_schedule


@pytest.fixture
def sample_orders():
    return [
        {
            "order_id": "A",
            "status": "queued",
            "arrival_timestamp_utc": "2026-11-07T09:00:00Z",
            "requested_deadline_utc": "2026-11-07T10:15:00Z",
            "estimated_processing_minutes": 30,
        },
        {
            "order_id": "B",
            "status": "queued",
            "arrival_timestamp_utc": "2026-11-07T09:30:00Z",
            "requested_deadline_utc": "2026-11-07T11:00:00Z",
            "estimated_processing_minutes": 30,
        },
    ]


def test_waiting_time_calculation(sample_orders):
    metrics = evaluate_schedule(
        sample_orders,
        ["A", "B"],
        "2026-11-07T10:00:00Z",
    )

    assert metrics["average_waiting_time"] == pytest.approx(60.0)


def test_tardiness_calculation(sample_orders):
    metrics = evaluate_schedule(
        sample_orders,
        ["A", "B"],
        "2026-11-07T10:00:00Z",
    )

    assert metrics["average_tardiness"] == pytest.approx(7.5)


def test_late_order_count(sample_orders):
    metrics = evaluate_schedule(
        sample_orders,
        ["A", "B"],
        "2026-11-07T10:00:00Z",
    )

    assert metrics["late_orders"] == 1


def test_makespan_calculation(sample_orders):
    metrics = evaluate_schedule(
        sample_orders,
        ["A", "B"],
        "2026-11-07T10:00:00Z",
    )

    assert metrics["makespan"] == pytest.approx(60.0)


def test_all_orders_completed_in_sequence(sample_orders):
    metrics = evaluate_schedule(
        sample_orders,
        ["A", "B"],
        "2026-11-07T10:00:00Z",
    )

    assert metrics["makespan"] == 60.0
    assert metrics["late_orders"] == 1
