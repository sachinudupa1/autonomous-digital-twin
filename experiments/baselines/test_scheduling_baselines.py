import pytest

from scheduling_baselines import SchedulingBaselines


@pytest.fixture
def baselines():
    return SchedulingBaselines()


def make_order(
    order_id,
    arrival="2026-11-07T09:00:00Z",
    deadline="2026-11-07T12:00:00Z",
    order_type="normal",
    status="queued",
    processing_time=10,
):
    return {
        "order_id": order_id,
        "arrival_timestamp_utc": arrival,
        "requested_deadline_utc": deadline,
        "order_type": order_type,
        "status": status,
        "processing_time": processing_time,
    }


def estimate_processing_time(order):
    return order["processing_time"]


def test_fifo(baselines):
    orders = [
        make_order("B", arrival="2026-11-07T10:00:00Z"),
        make_order("A", arrival="2026-11-07T08:00:00Z"),
    ]

    assert baselines.fifo(orders) == ["A", "B"]


def test_edd(baselines):
    orders = [
        make_order("B", deadline="2026-11-07T15:00:00Z"),
        make_order("A", deadline="2026-11-07T11:00:00Z"),
    ]

    assert baselines.edd(orders) == ["A", "B"]


def test_sjf(baselines):
    orders = [
        make_order("A", processing_time=20),
        make_order("B", processing_time=5),
        make_order("C", processing_time=10),
    ]

    assert baselines.sjf(orders, estimate_processing_time) == [
        "B", "C", "A"
    ]


def test_priority_orders_first(baselines):
    orders = [
        make_order("A", order_type="normal"),
        make_order("B", order_type="rush"),
        make_order("C", order_type="normal"),
    ]

    assert baselines.priority_orders_first(orders) == [
        "B", "A", "C"
    ]


def test_least_slack_time_first(baselines):
    orders = [
        make_order(
            "A",
            deadline="2026-11-07T12:00:00Z",
            processing_time=10,
        ),
        make_order(
            "B",
            deadline="2026-11-07T11:00:00Z",
            processing_time=20,
        ),
    ]

    result = baselines.least_slack_time_first(
        orders,
        estimate_processing_time,
        now="2026-11-07T10:00:00Z",
    )

    assert result == ["B", "A"]


def test_ineligible_orders_are_excluded(baselines):
    orders = [
        make_order("A"),
        make_order("B", status="completed"),
        make_order("C"),
    ]

    assert baselines.fifo(orders) == ["A", "C"]


def test_missing_deadlines_go_last(baselines):
    orders = [
        make_order("A", deadline=None),
        make_order("B", deadline="2026-11-07T11:00:00Z"),
    ]

    assert baselines.edd(orders) == ["B", "A"]


def test_equal_priority_keeps_original_order(baselines):
    orders = [
        make_order("A", processing_time=10),
        make_order("B", processing_time=10),
    ]

    assert baselines.sjf(orders, estimate_processing_time) == [
        "A", "B"
    ]


def test_sjf_requires_processing_time_estimator(baselines):
    with pytest.raises(ValueError):
        baselines.sjf([make_order("A")], None)


def test_least_slack_requires_valid_time(baselines):
    with pytest.raises(ValueError):
        baselines.least_slack_time_first(
            [make_order("A")],
            estimate_processing_time,
            now=None,
        )