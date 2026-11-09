
from typing import Any, Mapping, Sequence

import gymnasium as gym
import numpy as np
from gymnasium import spaces

from src.env.processing_time import ProcessingTimeEstimator
from src.env.reward import SchedulingReward
from src.env.state_encoder import StateEncoder


class PackagingEnv(gym.Env):
    """
    Provisional Gymnasium environment for order sequencing.

    The action selects an eligible order slot.
    It does not assign orders to packaging lines.

    Processing duration is optional and supplied through an
    externally configured ProcessingTimeEstimator.
    """

    metadata = {"render_modes": []}

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
        id_field: str = "order_id",
        status_field: str = "status",
        items_field: str = "items",
        order_type_field: str = "order_type",
        deadline_field: str = "requested_deadline_utc",
        overflow_policy: str = "error",
        reward_calculator: SchedulingReward | None = None,
        processing_time_estimator: ProcessingTimeEstimator | None = None,
    ):
        super().__init__()

        if max_orders < 1:
            raise ValueError("max_orders must be at least 1")

        if overflow_policy != "error":
            raise ValueError(
                "Only the explicit 'error' overflow policy "
                "is supported."
            )

        self.max_orders = max_orders
        self.product_fields = tuple(product_fields)
        self.eligible_statuses = set(eligible_statuses)

        self.id_field = id_field
        self.status_field = status_field
        self.items_field = items_field
        self.order_type_field = order_type_field
        self.deadline_field = deadline_field

        self.state_encoder = StateEncoder(
            max_orders=max_orders,
            product_fields=self.product_fields,
            eligible_statuses=eligible_statuses,
            status_field=status_field,
            items_field=items_field,
            order_type_field=order_type_field,
            deadline_field=deadline_field,
        )

        self.reward_calculator = (
            reward_calculator
            if reward_calculator is not None
            else SchedulingReward()
        )

        self.processing_time_estimator = processing_time_estimator

        self.features_per_order = self.state_encoder.features_per_order

        self.observation_space = spaces.Box(
            low=0.0,
            high=np.inf,
            shape=(
                self.max_orders * self.features_per_order,
            ),
            dtype=np.float32,
        )

        self.action_space = spaces.Discrete(self.max_orders)

        self.orders: list[dict[str, Any]] = []
        self.slot_order_ids: list[str | None] = [
            None
        ] * self.max_orders
        self.selected_order_ids: list[str] = []

    def _is_eligible(self, order: Mapping[str, Any]) -> bool:
        return order.get(self.status_field) in self.eligible_statuses

    def _encode_observation(self) -> np.ndarray:
        observation = self.state_encoder.encode(self.orders)

        self.slot_order_ids = [None] * self.max_orders

        for slot, order in enumerate(self.orders):
            order_id = order.get(self.id_field)

            if order_id is None:
                raise ValueError(
                    f"Order in slot {slot} has no '{self.id_field}'"
                )

            self.slot_order_ids[slot] = str(order_id)

        return observation

    def reset(self, seed=None, options=None):
        super().reset(seed=seed)

        options = options or {}
        supplied_orders = options.get("orders", [])

        if not isinstance(supplied_orders, list):
            raise TypeError("'orders' must be a list")

        if len(supplied_orders) > self.max_orders:
            raise ValueError(
                f"Queue overflow: received {len(supplied_orders)} "
                f"orders; capacity is {self.max_orders}"
            )

        self.orders = [dict(order) for order in supplied_orders]
        self.selected_order_ids = []

        observation = self._encode_observation()

        info = {
            "slot_order_ids": self.slot_order_ids.copy(),
            "eligible_order_ids": [
                order_id
                for order_id, order in zip(
                    self.slot_order_ids, self.orders
                )
                if self._is_eligible(order)
            ],
        }

        return observation, info

    def step(self, action):
        if not self.orders:
            observation = self._encode_observation()

            return observation, 0.0, True, False, {
                "reason": "empty_queue"
            }

        if (
            not isinstance(action, (int, np.integer))
            or isinstance(action, (bool, np.bool_))
            or not self.action_space.contains(action)
        ):
            reward = self.reward_calculator.calculate(
                selected_order=None,
                valid_action=False,
            )

            return self._encode_observation(), reward, False, False, {
                "invalid_action": True,
                "reason": "action_out_of_range",
            }

        action = int(action)

        if action >= len(self.orders):
            reward = self.reward_calculator.calculate(
                selected_order=None,
                valid_action=False,
            )

            return self._encode_observation(), reward, False, False, {
                "invalid_action": True,
                "reason": "padded_slot",
            }

        selected_order = self.orders[action]

        if not self._is_eligible(selected_order):
            reward = self.reward_calculator.calculate(
                selected_order=None,
                valid_action=False,
            )

            return self._encode_observation(), reward, False, False, {
                "invalid_action": True,
                "reason": "ineligible_order",
                "order_id": selected_order.get(self.id_field),
            }

        selected_id = str(selected_order[self.id_field])

        # Estimate duration only when an estimator is supplied.
        # No processing-time formula is assumed by this environment.
        processing_time_seconds = None

        if self.processing_time_estimator is not None:
            processing_time_seconds = (
                self.processing_time_estimator.estimate(selected_order)
            )

        reward = self.reward_calculator.calculate(
            selected_order=selected_order,
            valid_action=True,
        )

        self.selected_order_ids.append(selected_id)
        self.orders.pop(action)

        observation = self._encode_observation()

        has_eligible_orders = any(
            self._is_eligible(order) for order in self.orders
        )

        terminated = not has_eligible_orders

        info = {
            "selected_order_id": selected_id,
            "selected_order_ids": self.selected_order_ids.copy(),
            "remaining_order_ids": [
                order.get(self.id_field) for order in self.orders
            ],
        }

        if processing_time_seconds is not None:
            info["processing_time_seconds"] = processing_time_seconds

        return observation, reward, terminated, False, info
