
"""Reusable ZeroMQ communication layer for all four CoppeliaSim scenes."""

from dataclasses import dataclass
from typing import Any
import re

from coppeliasim_zmqremoteapi_client import RemoteAPIClient


@dataclass(frozen=True)
class SceneEndpoint:
    name: str
    host: str
    port: int


# Each scene has an independent connection.
SCENE_ENDPOINTS = {
    "digital_twin_line_a": SceneEndpoint(
        "Digital Twin - Line A", "127.0.0.1", 23000
    ),
    "digital_twin_line_b": SceneEndpoint(
        "Digital Twin - Line B", "127.0.0.1", 23002
    ),
    "production_line_a": SceneEndpoint(
        "Production - Line A", "127.0.0.1", 23004
    ),
    "production_line_b": SceneEndpoint(
        "Production - Line B", "127.0.0.1", 23006
    ),
}

PRODUCT_PATTERN = re.compile(r"^Product([1-4])_(\d+)$")

WHEEL_JOINTS = [
    "WheelJoint1",
    "WheelJoint2",
    "WheelJoint3",
    "WheelJoint4",
]

ROLLER_JOINTS = [
    "UpperRollerJoint19",
    "UpperRollerJoint20",
    "LowerRollerJoint21",
    "LowerRollerJoint22",
]

REQUIRED_OBJECTS = [
    "Hopper1", "Hopper2", "Hopper3", "Hopper4",
    "BoxRoot", "BoxRoot2",
    "BoxHome", "BoxStop", "BoxEnd",
    "UpperBeltFrame", "LowerBeltFrame",
    *WHEEL_JOINTS,
    *ROLLER_JOINTS,
]


class CoppeliaConnection:
    """Connection and scene-access interface for one CoppeliaSim instance."""

    def __init__(self, scene_name: str):
        if scene_name not in SCENE_ENDPOINTS:
            raise ValueError(
                f"Unknown scene '{scene_name}'. "
                f"Available: {list(SCENE_ENDPOINTS)}"
            )

        self.scene_name = scene_name
        self.endpoint = SCENE_ENDPOINTS[scene_name]
        self.client = None
        self.sim: Any = None
        self.objects: dict[str, int] = {}

    def connect(self):
        """Connect to the selected CoppeliaSim instance."""

        if self.sim is not None:
            return self.sim

        try:
            self.client = RemoteAPIClient(
                host=self.endpoint.host,
                port=self.endpoint.port,
            )
            self.sim = self.client.require("sim")
            self.sim.getSimulationState()
            self.refresh_objects()

            return self.sim

        except Exception as exc:
            self.client = None
            self.sim = None
            raise ConnectionError(
                f"Could not connect to {self.endpoint.name} "
                f"at {self.endpoint.host}:{self.endpoint.port}"
            ) from exc

    def refresh_objects(self) -> None:
        """Discover objects using their aliases in the selected scene."""

        if self.sim is None:
            raise RuntimeError("Connect first.")

        handles = self.sim.getObjectsInTree(
            self.sim.handle_scene,
            self.sim.handle_all,
            0,
        )

        self.objects.clear()

        for handle in handles:
            try:
                alias = self.sim.getObjectAlias(handle)
                self.objects[alias] = handle
            except Exception:
                continue

    def get_handle(self, alias: str) -> int:
        """Get an object handle by alias."""

        if alias not in self.objects:
            self.refresh_objects()

        if alias not in self.objects:
            raise KeyError(
                f"Object '{alias}' not found in {self.endpoint.name}."
            )

        return self.objects[alias]

    def require_simulation_stopped(self) -> None:
        """Prevent direct kinematic control while simulation is running."""

        if self.sim is None:
            raise RuntimeError("Not connected.")

        state = self.sim.getSimulationState()

        if state != 0:
            raise RuntimeError(
                "Stop the CoppeliaSim simulation before using "
                "the Python kinematic controller."
            )

    def inspect_scene(self) -> dict:
        """Check scene objects and count available product balls."""

        if self.sim is None:
            raise RuntimeError("Connect first.")

        self.refresh_objects()

        missing = [
            name for name in REQUIRED_OBJECTS
            if name not in self.objects
        ]

        ball_counts = {f"P{i}": 0 for i in range(1, 5)}

        for alias in self.objects:
            match = PRODUCT_PATTERN.match(alias)

            if match:
                product = int(match.group(1))
                ball_counts[f"P{product}"] += 1

        return {
            "scene": self.endpoint.name,
            "address": f"{self.endpoint.host}:{self.endpoint.port}",
            "simulation_state": self.sim.getSimulationState(),
            "required_objects_found": len(REQUIRED_OBJECTS) - len(missing),
            "required_objects_total": len(REQUIRED_OBJECTS),
            "missing_objects": missing,
            "ball_counts": ball_counts,
        }

    def get_position(self, alias: str) -> list[float]:
        handle = self.get_handle(alias)

        return self.sim.getObjectPosition(
            handle,
            self.sim.handle_world,
        )

    def set_position(self, alias: str, position: list[float]) -> None:
        self.require_simulation_stopped()

        if len(position) != 3:
            raise ValueError("Position must contain exactly three coordinates.")

        self.sim.setObjectPosition(
            self.get_handle(alias),
            position,
            self.sim.handle_world,
        )

    def set_joint_position(self, alias: str, angle: float) -> None:
        self.require_simulation_stopped()

        self.sim.setJointPosition(
            self.get_handle(alias),
            angle,
        )

    def set_parent(
        self,
        child_alias: str,
        parent_alias: str | None,
        preserve_world_position: bool = True,
    ) -> None:
        self.require_simulation_stopped()

        child = self.get_handle(child_alias)

        parent = (
            self.sim.handle_world
            if parent_alias is None
            else self.get_handle(parent_alias)
        )

        self.sim.setObjectParent(
            child,
            parent,
            preserve_world_position,
        )


def main():
    import argparse

    parser = argparse.ArgumentParser(
        description="Inspect a CoppeliaSim scene connection."
    )

    parser.add_argument(
        "--scene",
        required=True,
        choices=list(SCENE_ENDPOINTS),
    )

    args = parser.parse_args()

    connection = CoppeliaConnection(args.scene)
    connection.connect()

    report = connection.inspect_scene()

    print("\n========== SCENE CONNECTION ==========")
    print("Scene:", report["scene"])
    print("Address:", report["address"])
    print("Simulation state:", report["simulation_state"])

    print(
        "Required objects:",
        f'{report["required_objects_found"]}/'
        f'{report["required_objects_total"]}'
    )

    if report["missing_objects"]:
        print("Missing objects:", report["missing_objects"])
    else:
        print("All required objects found.")

    print("\nBall inventory:")

    for product, count in report["ball_counts"].items():
        print(f"{product}: {count}")

    print("======================================\n")


if __name__ == "__main__":
    main()
