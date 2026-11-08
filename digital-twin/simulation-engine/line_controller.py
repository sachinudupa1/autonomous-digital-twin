
"""Scene-specific object management for one AutoPack packaging line.

The same controller supports all four CoppeliaSim scenes.
CoppeliaSim simulation remains stopped during direct Python control.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any


BALL_PATTERN = re.compile(r"^Product([1-4])_(\d+)$")

REQUIRED_OBJECTS = [
    "Hopper1", "Hopper2", "Hopper3", "Hopper4",
    "BoxRoot", "BoxRoot2",
    "BoxHome", "BoxStop", "BoxEnd",
    "UpperBeltFrame", "LowerBeltFrame",
    "WheelJoint1", "WheelJoint2",
    "WheelJoint3", "WheelJoint4",
    "UpperRollerJoint19", "UpperRollerJoint20",
    "LowerRollerJoint21", "LowerRollerJoint22",
]


@dataclass
class BallRecord:
    product: int
    item: int
    handle: int
    alias: str
    original_parent: int
    original_position: list[float]
    original_visibility_layer: int


class LineController:
    """Manages the objects and inventory of one CoppeliaSim line."""

    def __init__(self, connection: Any):
        self.connection = connection
        self.sim = connection.connect()

        self.handles: dict[str, int] = {}
        self.balls: dict[int, list[BallRecord]] = {
            i: [] for i in range(1, 5)
        }

        self.boxes: list[int] = []
        self.box_contents: dict[int, list[BallRecord]] = {}

        self.initial_stock = {f"P{i}": 0 for i in range(1, 5)}
        self.remaining_stock = self.initial_stock.copy()

        self._cache_objects()
        self._validate_scene()
        self._cache_route()
        self._cache_balls()
        self._prepare_joints()

        self.reset_initial_state()

    def _cache_objects(self) -> None:
        """Discover objects by their aliases."""

        self.connection.refresh_objects()
        self.handles = dict(self.connection.objects)

    def _validate_scene(self) -> None:
        """Check that the scene contains all required objects."""

        missing = [
            name for name in REQUIRED_OBJECTS
            if name not in self.handles
        ]

        if missing:
            raise RuntimeError(
                f"{self.connection.endpoint.name}: "
                f"missing scene objects: {', '.join(missing)}"
            )

        for box_name in ("BoxRoot", "BoxRoot2"):
            root = self.handles[box_name]
            parts = self.sim.getObjectsInTree(
                root, self.sim.handle_all, 0
            )

            if len(parts) < 6:
                raise RuntimeError(
                    f"{box_name} is incomplete. "
                    f"Expected at least 6 objects; found {len(parts)}."
                )

        self.boxes = [
            self.handles["BoxRoot"],
            self.handles["BoxRoot2"],
        ]

        self.box_contents = {
            box: [] for box in self.boxes
        }

    def _cache_route(self) -> None:
        """Read route marker positions from this scene."""

        world = self.sim.handle_world

        self.home_position = list(
            self.sim.getObjectPosition(
                self.handles["BoxHome"], world
            )
        )

        self.fill_position = list(
            self.sim.getObjectPosition(
                self.handles["BoxStop"], world
            )
        )

        self.exit_position = list(
            self.sim.getObjectPosition(
                self.handles["BoxEnd"], world
            )
        )

        if (
            self.home_position[1] == self.fill_position[1]
            or self.fill_position[1] == self.exit_position[1]
        ):
            raise RuntimeError("Invalid or overlapping box route markers.")

    def _cache_balls(self) -> None:
        """Discover and record every product ball."""

        for alias, handle in self.handles.items():
            match = BALL_PATTERN.fullmatch(alias)

            if not match:
                continue

            product = int(match.group(1))
            item = int(match.group(2))

            parent = self.sim.getObjectParent(handle)

            position = list(
                self.sim.getObjectPosition(
                    handle, self.sim.handle_world
                )
            )

            try:
                layer = self.sim.getObjectInt32Param(
                    handle,
                    self.sim.objintparam_visibility_layer,
                )
                if layer == 0:
                    layer = 1
            except Exception:
                layer = 1

            self.balls[product].append(
                BallRecord(
                    product=product,
                    item=item,
                    handle=handle,
                    alias=alias,
                    original_parent=parent,
                    original_position=position,
                    original_visibility_layer=layer,
                )
            )

        for product in range(1, 5):
            self.balls[product].sort(
                key=lambda record: record.item
            )

            count = len(self.balls[product])

            if count != 294:
                raise RuntimeError(
                    f"Product {product}: expected 294 balls, "
                    f"but discovered {count}."
                )

            self.initial_stock[f"P{product}"] = count

        self.remaining_stock = self.initial_stock.copy()

    def _prepare_joints(self) -> None:
        """Prepare conveyor and dispenser joints for direct control."""

        joint_names = [
            "WheelJoint1", "WheelJoint2",
            "WheelJoint3", "WheelJoint4",
            "UpperRollerJoint19", "UpperRollerJoint20",
            "LowerRollerJoint21", "LowerRollerJoint22",
        ]

        for name in joint_names:
            handle = self.handles[name]

            try:
                self.sim.setJointInterval(
                    handle, True, [0.0, 2.0 * 3.141592653589793]
                )
            except Exception:
                pass

            self.sim.setJointMode(
                handle, self.sim.jointmode_kinematic, 0
            )

    def _restore_ball(self, record: BallRecord) -> None:
        """Return a ball to its original hopper and position."""

        self.sim.setObjectParent(
            record.handle,
            record.original_parent,
            True,
        )

        self.sim.setObjectPosition(
            record.handle,
            record.original_position,
            self.sim.handle_world,
        )

        self.sim.setObjectInt32Param(
            record.handle,
            self.sim.objintparam_visibility_layer,
            record.original_visibility_layer,
        )

    def reset_initial_state(self) -> None:
        """Restore inventory, both boxes and all conveyor joints."""

        if self.sim.getSimulationState() != 0:
            raise RuntimeError(
                "Stop the CoppeliaSim simulation before resetting the line."
            )

        # Both boxes must initially be at BoxHome.
        for box in self.boxes:
            self.sim.setObjectPosition(
                box,
                self.home_position,
                self.sim.handle_world,
            )

        # Restore all balls to their original hopper positions.
        for product in range(1, 5):
            for record in self.balls[product]:
                self._restore_ball(record)

        self.remaining_stock = self.initial_stock.copy()

        for box in self.boxes:
            self.box_contents[box] = []

        for name in [
            "WheelJoint1", "WheelJoint2",
            "WheelJoint3", "WheelJoint4",
            "UpperRollerJoint19", "UpperRollerJoint20",
            "LowerRollerJoint21", "LowerRollerJoint22",
        ]:
            self.sim.setJointPosition(self.handles[name], 0.0)

    def get_status(self) -> dict:
        """Return a snapshot of this line's current state."""

        return {
            "scene": self.connection.endpoint.name,
            "stock": self.remaining_stock.copy(),
            "initial_stock": self.initial_stock.copy(),
            "box_positions": [
                self.sim.getObjectPosition(
                    box, self.sim.handle_world
                )
                for box in self.boxes
            ],
            "route": {
                "home": self.home_position.copy(),
                "fill": self.fill_position.copy(),
                "exit": self.exit_position.copy(),
            },
            "simulation_state": self.sim.getSimulationState(),
        }
