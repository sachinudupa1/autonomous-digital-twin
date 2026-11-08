
"""Deterministic operating variations for the Production Model.

These variations represent controlled demonstration differences between
the idealized Digital Twin and Production Model.

They are configurable assumptions, not validated industrial measurements.
The same inputs, identifiers and seed always produce the same parameters.
"""

from __future__ import annotations

import hashlib
from dataclasses import asdict
from pathlib import Path
import sys
from typing import Any


SIMULATION_ENGINE_DIR = (
    Path(__file__).resolve().parents[1] / "simulation-engine"
)

simulation_engine_path = str(SIMULATION_ENGINE_DIR)

if simulation_engine_path not in sys.path:
    sys.path.insert(0, simulation_engine_path)

from line_runner import LineParameters  # type: ignore[reportMissingImports]


PARAMETER_BOUNDS = {
    "upper_belt_speed": (0.01, 0.15),
    "box_speed": (0.01, 0.15),
    "dispenser_rpm": (20.0, 200.0),
    "settle_time": (0.0, 5.0),
}


class ProductionVariationPolicy:
    """Apply small, deterministic variations to production parameters."""

    PROFILE_ID = "production-variation-v1"

    def __init__(
        self,
        max_relative_variation: float = 0.02,
        seed: int = 2026,
    ) -> None:
        if isinstance(max_relative_variation, bool):
            raise ValueError("Variation must be numeric.")

        if not isinstance(max_relative_variation, (int, float)):
            raise ValueError("Variation must be numeric.")

        if not 0.0 <= max_relative_variation <= 0.10:
            raise ValueError(
                "Maximum relative variation must be between 0 and 0.10."
            )

        if isinstance(seed, bool) or not isinstance(seed, int):
            raise ValueError("Variation seed must be an integer.")

        self.max_relative_variation = float(max_relative_variation)
        self.seed = seed

    def _deterministic_change(
        self,
        plan_id: str,
        schedule_id: str,
        line_id: str,
        parameter_name: str,
    ) -> float:
        """Return a reproducible relative change in the configured range."""

        key = (
            f"{self.PROFILE_ID}|{self.seed}|{plan_id}|"
            f"{schedule_id}|{line_id}|{parameter_name}"
        )

        digest = hashlib.sha256(key.encode("utf-8")).digest()

        number = int.from_bytes(digest[:8], byteorder="big")

        fraction = number / ((2**64) - 1)

        # Convert [0, 1] into [-max_variation, +max_variation].
        return (
            (2.0 * fraction - 1.0)
            * self.max_relative_variation
        )

    def apply(
        self,
        parameters: LineParameters,
        *,
        plan_id: str,
        schedule_id: str,
        line_id: str,
    ) -> tuple[LineParameters, dict[str, Any]]:
        """Generate effective production parameters and an audit report."""

        if not isinstance(parameters, LineParameters):
            raise TypeError("parameters must be LineParameters.")

        parameters.validate()

        for name, value in (
            ("plan_id", plan_id),
            ("schedule_id", schedule_id),
        ):
            if not isinstance(value, str) or not value.strip():
                raise ValueError(f"{name} must be supplied.")

        if line_id not in ("line_a", "line_b"):
            raise ValueError("line_id must be line_a or line_b.")

        requested = asdict(parameters)
        effective: dict[str, float] = {}
        adjustments: dict[str, dict[str, Any]] = {}

        for name, requested_value in requested.items():
            low, high = PARAMETER_BOUNDS[name]

            relative_change = self._deterministic_change(
                plan_id,
                schedule_id,
                line_id,
                name,
            )

            raw_value = requested_value * (1.0 + relative_change)

            effective_value = round(
                min(high, max(low, raw_value)),
                10,
            )

            effective[name] = effective_value

            actual_percentage = (
                (effective_value - requested_value)
                / requested_value * 100.0
                if requested_value != 0
                else 0.0
            )

            adjustments[name] = {
                "requested": requested_value,
                "effective": effective_value,
                "actual_change_percent": round(
                    actual_percentage, 6
                ),
                "clamped_to_operating_bounds": (
                    effective_value != round(raw_value, 10)
                ),
            }

        effective_parameters = LineParameters(**effective)
        effective_parameters.validate()

        report = {
            "variation_profile": self.PROFILE_ID,
            "variation_seed": self.seed,
            "configured_max_variation_percent": (
                self.max_relative_variation * 100.0
            ),
            "plan_id": plan_id,
            "schedule_id": schedule_id,
            "line_id": line_id,
            "requested_parameters": requested,
            "effective_parameters": asdict(effective_parameters),
            "parameter_adjustments": adjustments,
            "deterministic": True,
        }

        return effective_parameters, report
