
from scheduling_baselines import SchedulingBaselines


def estimate_processing_time(order):
    """
    Demonstration-only estimator.
    Uses sample processing times stored in each order.
    Replace with the agreed processing-time model later.
    """
    return order["estimated_processing_minutes"]


def main():
    baselines = SchedulingBaselines()

    # Sample orders for demonstration.
    orders = [
        {
            "order_id": "ORDER-001",
            "status": "queued",
            "order_type": "normal",
            "arrival_timestamp_utc": "2026-11-07T09:00:00Z",
            "requested_deadline_utc": "2026-11-07T15:00:00Z",
            "estimated_processing_minutes": 30,
        },
        {
            "order_id": "ORDER-002",
            "status": "queued",
            "order_type": "rush",
            "arrival_timestamp_utc": "2026-11-07T10:00:00Z",
            "requested_deadline_utc": "2026-11-07T12:00:00Z",
            "estimated_processing_minutes": 60,
        },
        {
            "order_id": "ORDER-003",
            "status": "queued",
            "order_type": "normal",
            "arrival_timestamp_utc": "2026-11-07T08:00:00Z",
            "requested_deadline_utc": "2026-11-07T14:00:00Z",
            "estimated_processing_minutes": 15,
        },
        {
            "order_id": "ORDER-004",
            "status": "completed",
            "order_type": "normal",
            "arrival_timestamp_utc": "2026-11-07T07:00:00Z",
            "requested_deadline_utc": "2026-11-07T11:00:00Z",
            "estimated_processing_minutes": 10,
        },
    ]

    current_time = "2026-11-07T10:00:00Z"

    results = {
        "FIFO": baselines.fifo(orders),
        "EDD": baselines.edd(orders),
        "SJF": baselines.sjf(
            orders, estimate_processing_time
        ),
        "Priority Orders First": baselines.priority_orders_first(
            orders
        ),
        "Least Slack Time First": baselines.least_slack_time_first(
            orders,
            estimate_processing_time,
            current_time,
        ),
    }

    print("\n========== SCHEDULING BASELINE COMPARISON ==========\n")

    for algorithm, sequence in results.items():
        print(f"{algorithm}:")
        print(" -> ".join(sequence))
        print()


if __name__ == "__main__":
    main()
