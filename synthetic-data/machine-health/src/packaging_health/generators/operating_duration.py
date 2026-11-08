from __future__ import annotations

from ..utils import ramp_value, uniform_value


def generate_operating_duration(rng, low: float, high: float, unit: str = "minutes") -> dict:
    """Uniform operating duration within [low, high] in the configured unit."""
    return {"value": round(uniform_value(low, high, rng), 1), "unit": unit}


def generate_operating_duration_ramp(rng, start: float, end: float, progress: float, noise: float = 0.0, unit: str = "minutes") -> dict:
    return {"value": round(ramp_value(start, end, progress, rng, noise), 1), "unit": unit}
