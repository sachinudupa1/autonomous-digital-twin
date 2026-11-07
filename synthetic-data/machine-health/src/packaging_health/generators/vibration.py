from __future__ import annotations

from ..utils import ramp_value, uniform_value


def generate_vibration_reading(rng, low: float, high: float, unit: str = "configured_unit") -> dict:
    """Uniform vibration within [low, high]. Unit is NOT assumed (awaiting approval)."""
    return {"value": round(uniform_value(low, high, rng), 3), "unit": unit}


def generate_vibration_ramp(rng, start: float, end: float, progress: float, noise: float = 0.0, unit: str = "configured_unit") -> dict:
    return {"value": round(ramp_value(start, end, progress, rng, noise), 3), "unit": unit}
