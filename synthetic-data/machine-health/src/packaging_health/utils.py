"""Shared helpers and constants for packaging_health."""
from __future__ import annotations

from datetime import datetime, timezone

GENERATOR_VERSION = "health-generator-v1"
SCHEMA_VERSION = "1.0"


class HealthValidationError(ValueError):
    """Raised for invalid health input. `errors` holds readable messages."""

    def __init__(self, message: str, errors: list[str] | None = None):
        super().__init__(message)
        self.errors = errors or [message]


class ConfigError(ValueError):
    """Raised when health_config.yaml is missing values or inconsistent."""


def utc_now_iso(now: datetime | None = None) -> str:
    """UTC timestamp as ISO-8601 with trailing Z (second precision)."""
    dt = now or datetime.now(timezone.utc)
    if dt.tzinfo is None:
        raise ValueError("Timestamps must be timezone-aware (UTC).")
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def ramp_value(start: float, end: float, progress: float, rng, noise: float = 0.0) -> float:
    """Linear ramp start->end at `progress` (0..1) with +/- uniform noise."""
    if not 0.0 <= progress <= 1.0:
        raise ValueError("progress must be between 0 and 1")
    if noise < 0:
        raise ValueError("noise must be >= 0")
    value = start + (end - start) * progress
    if noise:
        value += float(rng.uniform(-noise, noise))
    return value


def uniform_value(low: float, high: float, rng) -> float:
    if high < low:
        raise ValueError(f"Invalid generation range: min {low} > max {high}")
    return float(rng.uniform(low, high))
