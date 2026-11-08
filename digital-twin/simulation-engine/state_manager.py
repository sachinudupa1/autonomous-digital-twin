
"""Central runtime state manager for the four AutoPack CoppeliaSim scenes."""

from __future__ import annotations

from copy import deepcopy
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from time import monotonic
from typing import Any


SCENES = {
    "digital_twin_line_a": {
        "model": "digital_twin",
        "line": "A",
    },
    "digital_twin_line_b": {
        "model": "digital_twin",
        "line": "B",
    },
    "production_line_a": {
        "model": "production",
        "line": "A",
    },
    "production_line_b": {
        "model": "production",
        "line": "B",
    },
}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


@dataclass
class SceneState:
    """Current tracked state of one individual CoppeliaSim scene."""

    scene_id: str
    model: str
    line: str

    connection_status: str = "disconnected"
    simulation_state: str = "unknown"

    initial_stock: dict[str, int] = field(default_factory=dict)
    remaining_stock: dict[str, int] = field(default_factory=dict)

    box_positions: list[list[float]] = field(default_factory=list)

    active_box: str | None = None
    active_schedule_id: str | None = None
    active_run_purpose: str | None = None

    last_schedule_id: str | None = None
    last_run_purpose: str | None = None
    last_result: dict[str, Any] | None = None

    run_status: str = "idle"
    completed_runs: int = 0

    last_error: str | None = None
    last_updated: str = field(default_factory=utc_now)


class DigitalTwinStateManager:
    """Maintains independent state for all four CoppeliaSim scenes.

    Digital Twin scenes are reserved for candidate schedule evaluation.
    Production scenes are reserved for approved schedule execution.
    """

    def __init__(self):
        self._states: dict[str, SceneState] = {}

        # Live Python objects are held separately from serializable state.
        self._bindings: dict[str, tuple[Any, Any]] = {}

        self._run_started: dict[str, float] = {}

        for scene_id, details in SCENES.items():
            self._states[scene_id] = SceneState(
                scene_id=scene_id,
                model=details["model"],
                line=details["line"],
            )

    def _validate_scene_id(self, scene_id: str) -> None:
        if scene_id not in self._states:
            raise ValueError(
                f"Unknown scene '{scene_id}'. "
                f"Available scenes: {list(self._states)}"
            )

    @staticmethod
    def _simulation_label(raw_state: int) -> str:
        if raw_state == 0:
            return "stopped"
        return "active"

    def attach(
        self,
        scene_id: str,
        line_controller: Any,
        line_runner: Any,
    ) -> dict[str, Any]:
        """Register an initialized connection and its controllers."""

        self._validate_scene_id(scene_id)

        if line_controller.connection.scene_name != scene_id:
            raise ValueError(
                "The supplied LineController belongs to a different scene."
            )

        if line_runner.line is not line_controller:
            raise ValueError(
                "LineRunner and LineController must belong to the same line."
            )

        if scene_id in self._run_started:
            raise RuntimeError(
                "Cannot replace a scene binding while a run is active."
            )

        self._bindings[scene_id] = (
            line_controller,
            line_runner,
        )

        self.refresh(scene_id)

        return self.get_scene_state(scene_id)

    def detach(self, scene_id: str) -> None:
        """Mark a scene disconnected without deleting its last snapshot."""

        self._validate_scene_id(scene_id)

        if scene_id in self._run_started:
            raise RuntimeError(
                "Cannot detach a scene while a run is active."
            )

        self._bindings.pop(scene_id, None)

        state = self._states[scene_id]
        state.connection_status = "disconnected"
        state.simulation_state = "unknown"
        state.run_status = "idle"
        state.last_updated = utc_now()

    def refresh(self, scene_id: str) -> dict[str, Any]:
        """Read the latest state from one connected scene."""

        self._validate_scene_id(scene_id)

        if scene_id not in self._bindings:
            raise RuntimeError(
                f"{scene_id} is not currently connected."
            )

        line_controller, line_runner = self._bindings[scene_id]

        snapshot = line_runner.get_status()
        state = self._states[scene_id]

        state.connection_status = "connected"
        state.simulation_state = self._simulation_label(
            snapshot["simulation_state"]
        )

        state.initial_stock = deepcopy(
            line_controller.initial_stock
        )

        state.remaining_stock = deepcopy(
            snapshot["remaining_stock"]
        )

        state.box_positions = deepcopy(
            snapshot["box_positions"]
        )

        state.active_box = snapshot["active_box"]
        state.last_error = None
        state.last_updated = utc_now()

        return self.get_scene_state(scene_id)

    def refresh_all(self) -> dict[str, dict[str, Any]]:
        """Refresh every currently connected scene."""

        result = {}

        for scene_id in self._states:
            if scene_id in self._bindings:
                result[scene_id] = self.refresh(scene_id)

        return result

    def begin_run(
        self,
        scene_id: str,
        schedule_id: str,
        purpose: str,
    ) -> dict[str, Any]:
        """Register a candidate evaluation or production execution."""

        self._validate_scene_id(scene_id)

        if scene_id not in self._bindings:
            raise RuntimeError(
                f"{scene_id} is not currently connected."
            )

        if purpose not in ("candidate", "production"):
            raise ValueError(
                "purpose must be 'candidate' or 'production'."
            )

        state = self._states[scene_id]

        if purpose == "candidate" and state.model != "digital_twin":
            raise ValueError(
                "Candidate evaluation must use a Digital Twin scene."
            )

        if purpose == "production" and state.model != "production":
            raise ValueError(
                "Production execution must use a Production Model scene."
            )

        if scene_id in self._run_started:
            raise RuntimeError(
                f"{scene_id} already has an active run."
            )

        if not isinstance(schedule_id, str) or not schedule_id.strip():
            raise ValueError("A valid schedule_id is required.")

        self.refresh(scene_id)

        if state.simulation_state != "stopped":
            raise RuntimeError(
                "CoppeliaSim must be stopped before a new run."
            )

        self._run_started[scene_id] = monotonic()

        state.active_schedule_id = schedule_id
        state.active_run_purpose = purpose
        state.run_status = (
            "evaluating" if purpose == "candidate" else "executing"
        )
        state.last_error = None
        state.last_updated = utc_now()

        return self.get_scene_state(scene_id)

    def complete_run(
        self,
        scene_id: str,
        result: dict[str, Any],
    ) -> dict[str, Any]:
        """Record the results of a successfully completed run."""

        self._validate_scene_id(scene_id)

        if scene_id not in self._run_started:
            raise RuntimeError("No active run exists for this scene.")

        if not isinstance(result, dict):
            raise ValueError("Run result must be a dictionary.")

        state = self._states[scene_id]

        expected_schedule = state.active_schedule_id
        returned_schedule = result.get("schedule_id")

        if returned_schedule != expected_schedule:
            raise ValueError(
                f"Schedule mismatch: expected {expected_schedule}, "
                f"received {returned_schedule}."
            )

        self._run_started.pop(scene_id)

        state.last_schedule_id = expected_schedule
        state.last_run_purpose = state.active_run_purpose
        state.last_result = deepcopy(result)

        state.active_schedule_id = None
        state.active_run_purpose = None

        state.run_status = "completed"
        state.completed_runs += 1
        state.last_error = None

        self.refresh(scene_id)

        return self.get_scene_state(scene_id)

    def fail_run(
        self,
        scene_id: str,
        error: Exception | str,
    ) -> dict[str, Any]:
        """Record a failed run without hiding its error."""

        self._validate_scene_id(scene_id)

        if scene_id not in self._run_started:
            raise RuntimeError("No active run exists for this scene.")

        self._run_started.pop(scene_id)

        state = self._states[scene_id]

        state.run_status = "failed"
        state.last_error = str(error)

        state.active_schedule_id = None
        state.active_run_purpose = None
        state.last_updated = utc_now()

        return self.get_scene_state(scene_id)

    def get_scene_state(self, scene_id: str) -> dict[str, Any]:
        """Return a safe copy of one scene's state."""

        self._validate_scene_id(scene_id)

        return asdict(deepcopy(self._states[scene_id]))

    def get_all_states(self) -> dict[str, dict[str, Any]]:
        """Return the states of all four scenes."""

        return {
            scene_id: self.get_scene_state(scene_id)
            for scene_id in self._states
        }

    def get_connected_scenes(self) -> list[str]:
        """List scenes currently connected to Python."""

        return list(self._bindings.keys())

    def get_digital_twin_scenes(self) -> list[str]:
        return [
            scene_id
            for scene_id, state in self._states.items()
            if state.model == "digital_twin"
        ]

    def get_production_scenes(self) -> list[str]:
        return [
            scene_id
            for scene_id, state in self._states.items()
            if state.model == "production"
        ]
