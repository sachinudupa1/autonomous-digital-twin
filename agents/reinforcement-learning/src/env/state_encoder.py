
from typing import Any, Mapping, Sequence

import numpy as np


class StateEncoder:
    """Converts order dictionaries into fixed-size observations."""

    def __init__(
        self,
        max_orders: int = 32,
        product_fields: Sequence[str] = (
            "P1",
            "P2",
            "P3",
            "P4",
        ),
        eligible_statuses: Sequence[str] = ("queued",),
        status_field: str = "status",
        items_field: str = "items",
        order_type_field: str = "order_type",
        deadline_field: str = "requested_deadline_utc",
    ):
        if max_orders < 1:
            raise ValueError("max_orders must be at least 1")

        self.max_orders = max_orders
        self.product_fields = tuple(product_fields)
        self.eligible_statuses = set(eligible_statuses)

        self.status_field = status_field
        self.items_field = items_field
        self.order_type_field = order_type_field
        self.deadline_field = deadline_field

        self.features_per_order = len(self.product_fields) + 4

    def encode(
        self,
        orders: Sequence[Mapping[str, Any]],
    ) -> np.ndarray:
        if len(orders) > self.max_orders:
            raise ValueError("Order queue exceeds configured capacity")

        observation = np.zeros(
            self.max_orders * self.features_per_order,
            dtype=np.float32,
        )

        for slot, order in enumerate(orders):
            if not isinstance(order, Mapping):
                raise TypeError("Every order must be a dictionary")

            offset = slot * self.features_per_order

            observation[offset] = 1.0
            observation[offset + 1] = float(
                order.get(self.status_field) in self.eligible_statuses
            )

            items = order.get(self.items_field, {})

            if not isinstance(items, Mapping):
                raise ValueError(
                    f"'{self.items_field}' must be a dictionary"
                )

            for index, product in enumerate(self.product_fields):
                quantity = items.get(product, 0)

                if (
                    isinstance(quantity, bool)
                    or not isinstance(quantity, (int, float))
                    or not np.isfinite(quantity)
                    or quantity < 0
                ):
                    raise ValueError(
                        f"Invalid quantity for {product}: {quantity}"
                    )

                observation[offset + 2 + index] = float(quantity)

            rush_index = offset + 2 + len(self.product_fields)
            deadline_index = rush_index + 1

            observation[rush_index] = float(
                order.get(self.order_type_field) == "rush"
            )

            observation[deadline_index] = float(
                order.get(self.deadline_field) is not None
            )

        return observation
