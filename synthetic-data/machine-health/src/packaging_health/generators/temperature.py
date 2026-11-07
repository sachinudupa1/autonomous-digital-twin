from __future__ import annotations

from ..utils import ramp_value, uniform_value


def generate_temperature_reading(rng, low: float, high: float, unit: str = "C") -> dict:
    """Uniform temperature within [low, high] (configured range)."""
    return {"value": round(uniform_value(low, high, rng), 2), "unit": unit}


def generate_temperature_ramp(rng, start: float, end: float, progress: float, noise: float = 0.0, unit: str = "C") -> dict:
    return {"value": round(ramp_value(start, end, progress, rng, noise), 2), "unit": unit}
