import csv
from datetime import datetime, timezone

from scheduling_baselines import SchedulingBaselines


def parse_time(value):
    """Convert an ISO timestamp into a timezone-aware datetime."""
    if isinstance(value, str):
        value = datetime.fromisoformat(
            value.replace("Z", "+00:00")
        )

    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)

    return value.astimezone(timezone.utc)


def estimate_processing_time(order):
    """Demonstration-only processing-time estimator in minutes."""
    return float(order["estimated_processing_minutes"])


def evaluate_schedule(orders, sequence, current_time):
    """Calculate simplified single-resource scheduling metrics."""

    order_lookup = {
        order["order_id"]: order
        for order in orders
    }

    clock = parse_time(current_time)
    start_time = clock

    waiting_times = []
    tardiness_values = []
    late_orders = 0

    for order_id in sequence:
        order = order_lookup[order_id]

        arrival = parse_time(order["arrival_timestamp_utc"])
        deadline_value = order.get("requested_deadline_utc")

        # The resource cannot process an order before it arrives.
        start = max(clock, arrival)

        waiting_minutes = max(
            0.0, (start - arrival).total_seconds() / 60
        )

        duration = estimate_processing_time(order)
        finish = start.timestamp() + duration * 60
        finish_time = datetime.fromtimestamp(
            finish, tz=timezone.utc
        )

        if deadline_value is None:
            tardiness = 0.0
        else:
            deadline = parse_time(deadline_value)
            tardiness = max(
                0.0,
                (finish_time - deadline).total_seconds() / 60,
            )

        waiting_times.append(waiting_minutes)
        tardiness_values.append(tardiness)

        if tardiness > 0:
            late_orders += 1

        clock = finish_time

    if sequence:
        makespan = max(
            0.0, (clock - start_time).total_seconds() / 60
        )
    else:
        makespan = 0.0

    count = len(sequence)

    return {
        "average_waiting_time": (
            sum(waiting_times) / count if count else 0.0
        ),
        "average_tardiness": (
            sum(tardiness_values) / count if count else 0.0
        ),
        "makespan": makespan,
        "late_orders": late_orders,
    }


def main():
    baselines = SchedulingBaselines()

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

    algorithms = {
        "FIFO": lambda: baselines.fifo(orders),
        "EDD": lambda: baselines.edd(orders),
        "SJF": lambda: baselines.sjf(
            orders, estimate_processing_time
        ),
        "Priority Orders First": lambda: (
            baselines.priority_orders_first(orders)
        ),
        "Least Slack Time First": lambda: (
            baselines.least_slack_time_first(
                orders,
                estimate_processing_time,
                current_time,
            )
        ),
    }

    print("\n========== BASELINE EVALUATION ==========\n")

    for name, get_sequence in algorithms.items():
        sequence = get_sequence()

        metrics = evaluate_schedule(
            orders, sequence, current_time
        )

        print(name)
        print("Sequence:", " -> ".join(sequence))
        print(
            f"Average waiting time: "
            f"{metrics['average_waiting_time']:.2f} minutes"
        )
        print(
            f"Average tardiness: "
            f"{metrics['average_tardiness']:.2f} minutes"
        )
        print(
            f"Makespan: {metrics['makespan']:.2f} minutes"
        )
        print(f"Late orders: {metrics['late_orders']}")
        print("-" * 45)



def main(results_rows = []):
    baselines = SchedulingBaselines()

    scenarios = {
        "Scenario 1 - Tight Deadlines": [
            {
                "order_id": "A",
                "status": "queued",
                "order_type": "normal",
                "arrival_timestamp_utc": "2026-11-07T10:00:00Z",
                "requested_deadline_utc": "2026-11-07T11:00:00Z",
                "estimated_processing_minutes": 60,
            },
            {
                "order_id": "B",
                "status": "queued",
                "order_type": "rush",
                "arrival_timestamp_utc": "2026-11-07T10:00:00Z",
                "requested_deadline_utc": "2026-11-07T10:45:00Z",
                "estimated_processing_minutes": 30,
            },
            {
                "order_id": "C",
                "status": "queued",
                "order_type": "normal",
                "arrival_timestamp_utc": "2026-11-07T10:00:00Z",
                "requested_deadline_utc": "2026-11-07T12:00:00Z",
                "estimated_processing_minutes": 20,
            },
        ],

        "Scenario 2 - Different Arrival Times": [
            {
                "order_id": "D",
                "status": "queued",
                "order_type": "normal",
                "arrival_timestamp_utc": "2026-11-07T09:00:00Z",
                "requested_deadline_utc": "2026-11-07T12:00:00Z",
                "estimated_processing_minutes": 40,
            },
            {
                "order_id": "E",
                "status": "queued",
                "order_type": "rush",
                "arrival_timestamp_utc": "2026-11-07T10:15:00Z",
                "requested_deadline_utc": "2026-11-07T11:30:00Z",
                "estimated_processing_minutes": 20,
            },
            {
                "order_id": "F",
                "status": "queued",
                "order_type": "normal",
                "arrival_timestamp_utc": "2026-11-07T09:30:00Z",
                "requested_deadline_utc": "2026-11-07T13:00:00Z",
                "estimated_processing_minutes": 15,
            },
        ],

        "Scenario 3 - Mixed Priorities": [
            {
                "order_id": "G",
                "status": "queued",
                "order_type": "normal",
                "arrival_timestamp_utc": "2026-11-07T10:00:00Z",
                "requested_deadline_utc": "2026-11-07T12:00:00Z",
                "estimated_processing_minutes": 50,
            },
            {
                "order_id": "H",
                "status": "queued",
                "order_type": "rush",
                "arrival_timestamp_utc": "2026-11-07T10:00:00Z",
                "requested_deadline_utc": "2026-11-07T10:50:00Z",
                "estimated_processing_minutes": 25,
            },
            {
                "order_id": "I",
                "status": "queued",
                "order_type": "normal",
                "arrival_timestamp_utc": "2026-11-07T10:00:00Z",
                "requested_deadline_utc": "2026-11-07T14:00:00Z",
                "estimated_processing_minutes": 10,
            },
        ],
    }

    current_time = "2026-11-07T10:00:00Z"

    for scenario_name, orders in scenarios.items():

        algorithms = {
            "FIFO": lambda: baselines.fifo(orders),
            "EDD": lambda: baselines.edd(orders),
            "SJF": lambda: baselines.sjf(
                orders, estimate_processing_time
            ),
            "Priority Orders First": lambda: (
                baselines.priority_orders_first(orders)
            ),
            "Least Slack Time First": lambda: (
                baselines.least_slack_time_first(
                    orders,
                    estimate_processing_time,
                    current_time,
                )
            ),
        }

        print("\n" + "=" * 65)
        print(scenario_name)
        print("=" * 65)

        for name, get_sequence in algorithms.items():
            sequence = get_sequence()

            metrics = evaluate_schedule(
                orders, sequence, current_time
            )
            results_rows.append({
    "Scenario": scenario_name,
    "Algorithm": name,
    "Order Sequence": " -> ".join(sequence),
    "Average Waiting Time": metrics["average_waiting_time"],
    "Average Tardiness": metrics["average_tardiness"],
    "Makespan": metrics["makespan"],
    "Late Orders": metrics["late_orders"],
})
            print(f"\n{name}")
            print("Sequence:", " -> ".join(sequence))
            print(
                f"Average waiting time: "
                f"{metrics['average_waiting_time']:.2f} minutes"
            )
            print(
                f"Average tardiness: "
                f"{metrics['average_tardiness']:.2f} minutes"
            )
            print(
                f"Makespan: {metrics['makespan']:.2f} minutes"
            )
            print(f"Late orders: {metrics['late_orders']}")


    csv_filename = "baseline_results.csv"

    fieldnames = [
        "Scenario",
        "Algorithm",
        "Order Sequence",
        "Average Waiting Time",
        "Average Tardiness",
        "Makespan",
        "Late Orders",
    ]

    with open(
        csv_filename,
        "w",
        newline="",
        encoding="utf-8"
    ) as csvfile:

        writer = csv.DictWriter(
            csvfile,
            fieldnames=fieldnames
        )

        writer.writeheader()
        writer.writerows(results_rows)

    print(f"\nCSV results saved successfully: {csv_filename}")
if __name__ == "__main__":
    main()
