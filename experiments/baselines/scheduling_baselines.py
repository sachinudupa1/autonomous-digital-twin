
from datetime import datetime, timezone
from math import isfinite
from typing import Callable, Mapping, Sequence, Any


class SchedulingBaselines:
    """
    Conventional scheduling baselines.

    Each method returns an ordered list of order IDs.
    No machine or packaging-line assignments are made.
    """

    def __init__(
        self,
        order_id_field="order_id",
        status_field="status",
        eligible_statuses=("queued",),
        arrival_field="arrival_timestamp_utc",
        deadline_field="requested_deadline_utc",
        order_type_field="order_type",
        priority_order=("rush", "normal"),
    ):
        self.order_id_field = order_id_field
        self.status_field = status_field
        self.eligible_statuses = set(eligible_statuses)
        self.arrival_field = arrival_field
        self.deadline_field = deadline_field
        self.order_type_field = order_type_field
        self.priority_order = {
            name: index for index, name in enumerate(priority_order)
        }

    def _eligible(self, orders):
        return [
            (index, order)
            for index, order in enumerate(orders)
            if order.get(self.status_field) in self.eligible_statuses
        ]

    def _order_id(self, order):
        if self.order_id_field not in order:
            raise ValueError(
                f"Missing order ID field: {self.order_id_field}"
            )
        return str(order[self.order_id_field])

    @staticmethod
    def _parse_time(value):
        if value is None:
            return None

        if isinstance(value, str):
            value = datetime.fromisoformat(
                value.replace("Z", "+00:00")
            )

        if not isinstance(value, datetime):
            raise ValueError("Timestamp must be an ISO string or datetime")

        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)

        return value.astimezone(timezone.utc)

    @staticmethod
    def _processing_time(order, estimator):
        if estimator is None:
            raise ValueError(
                "Provide a processing_time_estimator for this baseline"
            )

        duration = float(estimator(order))

        if not isfinite(duration) or duration < 0:
            raise ValueError(
                "Estimated processing time must be finite and non-negative"
            )

        return duration

    def fifo(self, orders):
        """First In, First Out."""
        eligible = self._eligible(orders)

        eligible.sort(
            key=lambda item: (
                self._parse_time(
                    item[1].get(self.arrival_field)
                ) is None,
                self._parse_time(
                    item[1].get(self.arrival_field)
                ) or datetime.max.replace(tzinfo=timezone.utc),
                item[0],
            )
        )

        return [self._order_id(order) for _, order in eligible]

    def edd(self, orders):
        """Earliest Due Date; orders without deadlines go last."""
        eligible = self._eligible(orders)

        eligible.sort(
            key=lambda item: (
                self._parse_time(
                    item[1].get(self.deadline_field)
                ) is None,
                self._parse_time(
                    item[1].get(self.deadline_field)
                ) or datetime.max.replace(tzinfo=timezone.utc),
                item[0],
            )
        )

        return [self._order_id(order) for _, order in eligible]

    def sjf(self, orders, processing_time_estimator):
        """Shortest Job First."""
        eligible = self._eligible(orders)

        eligible.sort(
            key=lambda item: (
                self._processing_time(
                    item[1], processing_time_estimator
                ),
                item[0],
            )
        )

        return [self._order_id(order) for _, order in eligible]

    def priority_orders_first(self, orders):
        """
        Categorical priority baseline.

        Default: rush before normal.
        This is a configurable heuristic, not an approved
        production priority-weight system.
        """
        eligible = self._eligible(orders)

        eligible.sort(
            key=lambda item: (
                self.priority_order.get(
                    item[1].get(self.order_type_field),
                    len(self.priority_order),
                ),
                item[0],
            )
        )

        return [self._order_id(order) for _, order in eligible]

    def least_slack_time_first(
        self,
        orders,
        processing_time_estimator,
        now,
    ):
        """
        Least Slack Time First.

        Slack = deadline - current time - estimated processing time.
        Orders without deadlines go last.
        """
        current_time = self._parse_time(now)

        if current_time is None:
            raise ValueError("A valid current time is required")

        eligible = self._eligible(orders)
        scored = []

        for index, order in eligible:
            deadline = self._parse_time(
                order.get(self.deadline_field)
            )

            if deadline is None:
                slack = float("inf")
            else:
                duration = self._processing_time(
                    order, processing_time_estimator
                )
                remaining_seconds = (
                    deadline - current_time
                ).total_seconds()

                slack = remaining_seconds - duration

            scored.append((slack, index, order))

        scored.sort(key=lambda item: (item[0], item[1]))

        return [
            self._order_id(order)
            for _, _, order in scored
        ]
