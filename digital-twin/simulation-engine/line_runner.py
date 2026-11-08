
"""Kinematic production runner for one AutoPack CoppeliaSim line.

Uses direct ZeroMQ control while the CoppeliaSim simulation is stopped.
Compatible with all four scenes when their object aliases and geometry match.
"""

from __future__ import annotations

import math
import time
from dataclasses import asdict, dataclass
from typing import Any, Mapping, Sequence


# Internal animation update interval and roller geometry.
# These are implementation/geometry constants, not operating inputs.
STEP = 0.04
ROLLER_RADIUS = 0.005

PRODUCT_X = (-0.060, -0.020, 0.020, 0.060)
PRODUCT_Y = -0.010
CHUTE_EXIT_Z = 0.0075
BELT_SURFACE_BALL_Z = 0.0015
BOX_BALL_Z = -0.0305

BOX_X_OFFSETS = (-0.0045, -0.0015, 0.0015, 0.0045)
BOX_Y_OFFSETS = (-0.006, -0.003, 0.000, 0.003, 0.006)

UPPER_ROLLERS = (
    "UpperRollerJoint19",
    "UpperRollerJoint20",
)

LOWER_ROLLERS = (
    "LowerRollerJoint21",
    "LowerRollerJoint22",
)

WHEEL_JOINTS = {
    product: f"WheelJoint{product}"
    for product in range(1, 5)
}


@dataclass(frozen=True)
class LineParameters:
    """Operating parameters supplied by the Digital Twin for each run."""

    upper_belt_speed: float
    box_speed: float
    dispenser_rpm: float
    settle_time: float

    def validate(self) -> None:
        """Validate using the tested HTML controller's input limits."""

        values = {
            "upper_belt_speed": (self.upper_belt_speed, 0.01, 0.15),
            "box_speed": (self.box_speed, 0.01, 0.15),
            "dispenser_rpm": (self.dispenser_rpm, 20.0, 200.0),
            "settle_time": (self.settle_time, 0.0, 5.0),
        }

        for name, (value, low, high) in values.items():
            if isinstance(value, bool):
                raise ValueError(f"{name} must be numeric.")

            try:
                number = float(value)
            except (TypeError, ValueError):
                raise ValueError(f"{name} must be numeric.") from None

            if not math.isfinite(number) or not low <= number <= high:
                raise ValueError(
                    f"{name} must be between {low} and {high}."
                )


class LineRunner:
    """Executes an ordered list of packaging orders on one scene."""

    def __init__(self, line_controller: Any):
        self.line = line_controller
        self.sim = line_controller.sim

        self._require_stopped()

        self.active_box_index = 0
        self.elapsed = 0.0
        self.upper_angle = 0.0
        self.lower_angle = 0.0

        self.active_flights: list[dict[str, Any]] = []
        self.delivered = {f"P{i}": 0 for i in range(1, 5)}
        self.total_balls = 0

    def _require_stopped(self) -> None:
        if self.sim.getSimulationState() != 0:
            raise RuntimeError(
                "CoppeliaSim must remain stopped during Python "
                "kinematic control."
            )

    def _object(self, alias: str) -> int:
        return self.line.handles[alias]

    def _set_world_position(
        self,
        handle: int,
        position: Sequence[float],
    ) -> None:
        self.sim.setObjectPosition(
            handle,
            list(position),
            self.sim.handle_world,
        )

    @staticmethod
    def _validate_quantities(
        quantities: Mapping[str, Any],
    ) -> dict[str, int]:
        """Validate an order: 0–5 of each product, 1–20 total."""

        if not isinstance(quantities, Mapping):
            raise ValueError("quantities must be a mapping.")

        clean: dict[str, int] = {}

        for product in range(1, 5):
            key = f"P{product}"

            if key not in quantities:
                raise ValueError(f"Missing quantity for {key}.")

            raw = quantities[key]

            if isinstance(raw, bool):
                raise ValueError(f"{key} must be a whole number.")

            try:
                number = float(raw)
            except (TypeError, ValueError):
                raise ValueError(f"{key} must be numeric.") from None

            if (
                not math.isfinite(number)
                or not number.is_integer()
                or not 0 <= number <= 5
            ):
                raise ValueError(
                    f"{key} must be a whole number from 0 to 5."
                )

            clean[key] = int(number)

        total = sum(clean.values())

        if not 1 <= total <= 20:
            raise ValueError(
                "An order must contain between 1 and 20 balls."
            )

        return clean

    def reset(self) -> None:
        """Restore both boxes, all balls and all joints to initial state.

        Call before each candidate schedule evaluation to ensure
        comparable initial conditions.
        """

        self._require_stopped()

        self.line.reset_initial_state()

        self.active_box_index = 0
        self.elapsed = 0.0
        self.upper_angle = 0.0
        self.lower_angle = 0.0

        self.active_flights.clear()
        self.delivered = {f"P{i}": 0 for i in range(1, 5)}
        self.total_balls = 0

    def get_status(self) -> dict[str, Any]:
        """Return the current production state."""

        return {
            "scene": self.line.connection.endpoint.name,
            "elapsed_seconds": round(self.elapsed, 3),
            "delivered": self.delivered.copy(),
            "remaining_stock": self.line.remaining_stock.copy(),
            "active_flights": len(self.active_flights),
            "active_box": f"Box {self.active_box_index + 1}",
            "box_positions": [
                self.sim.getObjectPosition(
                    box, self.sim.handle_world
                )
                for box in self.line.boxes
            ],
            "simulation_state": self.sim.getSimulationState(),
        }

    def _tick(self, parameters: LineParameters) -> None:
        """Advance one kinematic update without starting CoppeliaSim."""

        self.upper_angle = (
            self.upper_angle
            + parameters.upper_belt_speed * STEP / ROLLER_RADIUS
        ) % (2.0 * math.pi)

        self.lower_angle = (
            self.lower_angle
            - parameters.box_speed * STEP / ROLLER_RADIUS
        ) % (2.0 * math.pi)

        for name in UPPER_ROLLERS:
            self.sim.setJointPosition(
                self._object(name), self.upper_angle
            )

        for name in LOWER_ROLLERS:
            self.sim.setJointPosition(
                self._object(name), self.lower_angle
            )

        self._advance_flights()

        time.sleep(STEP)
        self.elapsed += STEP

    def _wait(
        self,
        seconds: float,
        parameters: LineParameters,
    ) -> None:
        steps = max(0, math.ceil(seconds / STEP))

        for _ in range(steps):
            self._tick(parameters)

    def _move_box(
        self,
        box: int,
        target: Sequence[float],
        speed: float,
        parameters: LineParameters,
    ) -> None:
        start = list(
            self.sim.getObjectPosition(box, self.sim.handle_world)
        )

        distance = math.sqrt(
            sum((target[i] - start[i]) ** 2 for i in range(3))
        )

        if distance <= 1e-9:
            self._set_world_position(box, target)
            return

        duration = distance / speed
        steps = max(1, math.ceil(duration / STEP))

        for step in range(1, steps + 1):
            fraction = step / steps

            position = [
                start[i] + (target[i] - start[i]) * fraction
                for i in range(3)
            ]

            self._set_world_position(box, position)
            self._tick(parameters)

    def _clear_box(self, box: int) -> None:
        """Hide delivered balls before reusing their box."""

        contents = self.line.box_contents.get(box, [])

        for record in contents:
            self.sim.setObjectParent(
                record.handle,
                self.sim.handle_world,
                True,
            )

            self.sim.setObjectInt32Param(
                record.handle,
                self.sim.objintparam_visibility_layer,
                0,
            )

        self.line.box_contents[box] = []

    def _move_boxes_for_handoff(
        self,
        outgoing: int,
        incoming: int,
        parameters: LineParameters,
    ) -> None:
        """Move outgoing box to exit while incoming box reaches filling."""

        outgoing_start = list(
            self.sim.getObjectPosition(
                outgoing, self.sim.handle_world
            )
        )

        incoming_start = list(
            self.sim.getObjectPosition(
                incoming, self.sim.handle_world
            )
        )

        outgoing_distance = math.dist(
            outgoing_start, self.line.exit_position
        )

        incoming_distance = math.dist(
            incoming_start, self.line.fill_position
        )

        speed = parameters.box_speed

        duration = max(
            outgoing_distance / speed,
            incoming_distance / speed,
        )

        steps = max(1, math.ceil(duration / STEP))

        for step in range(1, steps + 1):
            fraction = step / steps
            elapsed_fraction = fraction * duration

            out_fraction = min(
                1.0,
                elapsed_fraction / max(
                    outgoing_distance / speed, 1e-12
                ),
            )

            in_fraction = min(
                1.0,
                elapsed_fraction / max(
                    incoming_distance / speed, 1e-12
                ),
            )

            out_position = [
                outgoing_start[i]
                + (
                    self.line.exit_position[i]
                    - outgoing_start[i]
                ) * out_fraction
                for i in range(3)
            ]

            in_position = [
                incoming_start[i]
                + (
                    self.line.fill_position[i]
                    - incoming_start[i]
                ) * in_fraction
                for i in range(3)
            ]

            self._set_world_position(outgoing, out_position)
            self._set_world_position(incoming, in_position)

            self._tick(parameters)

        # Preserve the tested reusable-box handoff behaviour.
        self._clear_box(outgoing)

        self._set_world_position(
            outgoing,
            self.line.home_position,
        )

    def _rotate_active_dispensers(
        self,
        products: Sequence[int],
        parameters: LineParameters,
    ) -> None:
        """Rotate active dispensers together by one full revolution."""

        if not products:
            return

        duration = 60.0 / parameters.dispenser_rpm
        steps = max(2, math.ceil(duration / STEP))

        joints = [
            self._object(WHEEL_JOINTS[product])
            for product in products
        ]

        for step in range(1, steps + 1):
            angle = 2.0 * math.pi * step / steps

            for joint in joints:
                self.sim.setJointPosition(joint, angle)

            self._tick(parameters)

        for joint in joints:
            self.sim.setJointPosition(joint, 0.0)

    def _launch_ball(
        self,
        product: int,
        slot: int,
        active_box: int,
        parameters: LineParameters,
    ) -> None:
        """Detach one available ball and animate it into the active box."""

        key = f"P{product}"

        used = (
            self.line.initial_stock[key]
            - self.line.remaining_stock[key]
        )

        records = self.line.balls[product]

        if used >= len(records):
            raise RuntimeError(
                f"No remaining balls in Product {product}."
            )

        record = records[used]
        ball = record.handle

        # Detach the ball from its hopper while preserving its identity.
        self.sim.setObjectParent(
            ball,
            self.sim.handle_world,
            True,
        )

        start = [
            PRODUCT_X[product - 1],
            PRODUCT_Y,
            CHUTE_EXIT_Z,
        ]

        self._set_world_position(ball, start)

        column = slot % 4
        row = slot // 4

        if row >= len(BOX_Y_OFFSETS):
            raise ValueError("Box capacity exceeded.")

        target_x = (
            self.line.home_position[0]
            + BOX_X_OFFSETS[column]
        )

        target_y = (
            self.line.fill_position[1]
            + BOX_Y_OFFSETS[row]
        )

        belt_target = [
            target_x, target_y, BELT_SURFACE_BALL_Z
        ]

        box_target = [
            target_x, target_y, BOX_BALL_Z
        ]

        horizontal_distance = math.hypot(
            target_x - start[0],
            target_y - start[1],
        )

        self.active_flights.append({
            "record": record,
            "handle": ball,
            "product": product,
            "box": active_box,
            "stage": 0,
            "stage_start": self.elapsed,
            "start": start,
            "waypoints": [
                (
                    [start[0], start[1], BELT_SURFACE_BALL_Z],
                    0.20,
                ),
                (
                    belt_target,
                    max(
                        STEP,
                        horizontal_distance
                        / parameters.upper_belt_speed,
                    ),
                ),
                (
                    box_target,
                    0.45,
                ),
            ],
        })

        self.line.remaining_stock[key] -= 1

    def _advance_flights(self) -> None:
        """Advance all airborne/transported balls."""

        completed: set[int] = set()

        for flight in self.active_flights:
            while flight["stage"] < len(flight["waypoints"]):

                stage = flight["stage"]
                target, duration = flight["waypoints"][stage]

                fraction = (
                    (self.elapsed - flight["stage_start"]) / duration
                    if duration > 0 else 1.0
                )

                if fraction >= 1.0:
                    self._set_world_position(
                        flight["handle"], target
                    )

                    flight["stage_start"] += duration
                    flight["stage"] += 1

                    if flight["stage"] >= len(flight["waypoints"]):
                        box = flight["box"]
                        record = flight["record"]

                        self.sim.setObjectParent(
                            flight["handle"], box, True
                        )

                        self.line.box_contents.setdefault(
                            box, []
                        ).append(record)

                        key = f"P{flight['product']}"
                        self.delivered[key] += 1

                        completed.add(flight["handle"])
                        break

                    continue

                previous = (
                    flight["start"]
                    if stage == 0
                    else flight["waypoints"][stage - 1][0]
                )

                t = max(0.0, min(1.0, fraction))

                position = [
                    previous[i] + (target[i] - previous[i]) * t
                    for i in range(3)
                ]

                self._set_world_position(
                    flight["handle"], position
                )
                break

        if completed:
            self.active_flights = [
                flight
                for flight in self.active_flights
                if flight["handle"] not in completed
            ]

    def _run_order(
        self,
        order: Mapping[str, Any],
        parameters: LineParameters,
        has_next_order: bool,
    ) -> dict[str, Any]:
        """Execute one order."""

        quantities = self._validate_quantities(
            order["quantities"]
        )

        order_id = str(order["order_id"]).strip()

        if not order_id:
            raise ValueError("order_id cannot be empty.")

        for key, quantity in quantities.items():
            if quantity > self.line.remaining_stock[key]:
                raise ValueError(
                    f"{key}: requested {quantity}, "
                    f"only {self.line.remaining_stock[key]} remain."
                )

        start_time = self.elapsed
        total_quantity = sum(quantities.values())

        self.delivered = {f"P{i}": 0 for i in range(1, 5)}
        active_box = self.line.boxes[self.active_box_index]
        waiting_box = self.line.boxes[1 - self.active_box_index]

        # Move the first/next available box to the filling station.
        current_position = self.sim.getObjectPosition(
            active_box, self.sim.handle_world
        )

        if (
            abs(current_position[1] - self.line.fill_position[1])
            > 0.00001
        ):
            self._move_box(
                active_box,
                self.line.fill_position,
                parameters.box_speed,
                parameters,
            )

        # Dispensing cycles: each active dispenser releases one ball.
        maximum_cycles = max(quantities.values())
        next_slot = 0

        for cycle in range(maximum_cycles):
            active_products = [
                product
                for product in range(1, 5)
                if quantities[f"P{product}"] > cycle
            ]

            self._rotate_active_dispensers(
                active_products, parameters
            )

            for product in active_products:
                self._launch_ball(
                    product,
                    next_slot,
                    active_box,
                    parameters,
                )
                next_slot += 1

        # Wait until every ball reaches its box.
        while self.active_flights:
            self._tick(parameters)

        # Explicit settling time supplied by the Digital Twin.
        self._wait(parameters.settle_time, parameters)

        order_duration = self.elapsed - start_time

        result = {
            "order_id": order_id,
            "quantities": quantities,
            "delivered": self.delivered.copy(),
            "completion_time_seconds": round(order_duration, 3),
        }

        # If another order is queued, hand off to the waiting box.
        if has_next_order:
            self._move_boxes_for_handoff(
                active_box,
                waiting_box,
                parameters,
            )

            self.active_box_index = 1 - self.active_box_index

        else:
            # Final box exits; both boxes return to their initial positions.
            self._move_box(
                active_box,
                self.line.exit_position,
                parameters.box_speed,
                parameters,
            )

            self._clear_box(active_box)

            self._set_world_position(
                active_box,
                self.line.home_position,
            )

            self.active_box_index = 1 - self.active_box_index

        result["schedule_elapsed_seconds"] = round(
            self.elapsed, 3
        )

        return result

    def run_schedule(
        self,
        orders: Sequence[Mapping[str, Any]],
        parameters: LineParameters,
        schedule_id: str,
    ) -> dict[str, Any]:
        """Run a complete ordered schedule on this packaging line.

        Expected order format:
        {
            "order_id": "ORD-001",
            "quantities": {"P1": 2, "P2": 1, "P3": 0, "P4": 3}
        }

        The caller must reset the line before every independent
        candidate evaluation.
        """

        self._require_stopped()
        parameters.validate()

        if not isinstance(schedule_id, str) or not schedule_id.strip():
            raise ValueError("schedule_id must be supplied.")

        if not orders:
            raise ValueError("A schedule must contain at least one order.")

        # Validate the complete schedule before moving anything.
        normalized_orders = []
        required_stock = {f"P{i}": 0 for i in range(1, 5)}

        for order in orders:
            if not isinstance(order, Mapping):
                raise ValueError("Every order must be a mapping.")

            if "order_id" not in order or "quantities" not in order:
                raise ValueError(
                    "Every order requires order_id and quantities."
                )

            quantities = self._validate_quantities(
                order["quantities"]
            )

            order_id = str(order["order_id"]).strip()

            if not order_id:
                raise ValueError("order_id cannot be empty.")

            for key, quantity in quantities.items():
                required_stock[key] += quantity

            normalized_orders.append({
                "order_id": order_id,
                "quantities": quantities,
            })

        for key, amount in required_stock.items():
            if amount > self.line.remaining_stock[key]:
                raise ValueError(
                    f"Schedule requires {amount} {key} balls, "
                    f"but only {self.line.remaining_stock[key]} remain."
                )

        self.elapsed = 0.0
        self.total_balls = sum(required_stock.values())

        order_results = []

        for index, order in enumerate(normalized_orders):
            has_next = index < len(normalized_orders) - 1

            result = self._run_order(
                order,
                parameters,
                has_next,
            )

            order_results.append(result)

        total_time = self.elapsed
        total_orders = len(order_results)

        average_order_time = (
            sum(
                item["completion_time_seconds"]
                for item in order_results
            ) / total_orders
        )

        orders_per_minute = (
            total_orders * 60.0 / total_time
            if total_time > 0 else 0.0
        )

        balls_per_minute = (
            self.total_balls * 60.0 / total_time
            if total_time > 0 else 0.0
        )

        return {
            "schedule_id": schedule_id,
            "scene": self.line.connection.endpoint.name,
            "parameters": asdict(parameters),
            "total_orders": total_orders,
            "total_balls": self.total_balls,
            "total_completion_time_seconds": round(total_time, 3),
            "average_order_completion_seconds": round(
                average_order_time, 3
            ),
            "orders_per_minute": round(orders_per_minute, 3),
            "balls_per_minute": round(balls_per_minute, 3),
            "remaining_stock": self.line.remaining_stock.copy(),
            "order_results": order_results,
            "simulation_state": self.sim.getSimulationState(),
        }
