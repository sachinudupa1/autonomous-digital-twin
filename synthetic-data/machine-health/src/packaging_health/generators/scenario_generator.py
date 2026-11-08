"""Controlled, reproducible synthetic scenarios.

Same scenario_type + seed + config (+ step/total_steps) -> identical readings.
`created_at_utc` is the wall-clock time unless `now` is passed.
All output is labelled source="synthetic" (except operator-supplied custom readings,
which are labelled "manual").
"""
from __future__ import annotations

import secrets
from datetime import datetime

import numpy as np

from ..config import MEASUREMENTS, resolve_config
from ..processing.manual_input import process_manual_health_input
from ..processing.reading_processor import build_health_record
from ..schemas.readings import HealthInput
from ..schemas.scenarios import SCENARIO_TYPES
from ..utils import HealthValidationError, uniform_value
from .operating_duration import generate_operating_duration, generate_operating_duration_ramp
from .temperature import generate_temperature_ramp, generate_temperature_reading
from .vibration import generate_vibration_ramp, generate_vibration_reading

_GEN_UNIFORM = {
    "temperature": generate_temperature_reading,
    "vibration": generate_vibration_reading,
    "operating_duration": generate_operating_duration,
}
_GEN_RAMP = {
    "temperature": generate_temperature_ramp,
    "vibration": generate_vibration_ramp,
    "operating_duration": generate_operating_duration_ramp,
}


def _normal(m, rng, cfg):
    r = cfg["generation"]["normal_ranges"][m]
    return _GEN_UNIFORM[m](rng, r["min"], r["max"], cfg["units"][m])


def _ramp(m, rng, cfg, spec, progress):
    return _GEN_RAMP[m](rng, spec["start"], spec["end"], progress, cfg["generation"]["noise"][m], cfg["units"][m])


def _scenario_readings(scenario_type, rng, cfg, progress):
    sc = cfg["scenarios"][scenario_type]
    readings = {m: _normal(m, rng, cfg) for m in MEASUREMENTS}
    availability = cfg["availability"]["default"]
    if scenario_type == "increasing_temperature":
        readings["temperature"] = _ramp("temperature", rng, cfg, sc["temperature"], progress)
    elif scenario_type == "high_vibration":
        readings["vibration"] = _ramp("vibration", rng, cfg, sc["vibration"], progress)
    elif scenario_type == "prolonged_operation":
        readings["operating_duration"] = _ramp("operating_duration", rng, cfg, sc["operating_duration"], progress)
    elif scenario_type in ("degraded", "breakdown"):
        for m in MEASUREMENTS:
            readings[m] = _GEN_UNIFORM[m](rng, sc[m]["min"], sc[m]["max"], cfg["units"][m])
        availability = sc["availability"]
    elif scenario_type == "recovery":
        for m in MEASUREMENTS:
            spec = {"start": sc["start"][m], "end": sc["end"][m]}
            readings[m] = _ramp(m, rng, cfg, spec, progress)
        if progress < sc["availability_recovered_at"]:
            availability = "degraded"
    # "normal": all-normal readings, default availability
    return readings, availability


def _clip(readings: dict, cfg: dict) -> dict:
    out = {}
    for m, meas in readings.items():
        r = cfg["valid_ranges"][m]
        out[m] = {**meas, "value": min(max(meas["value"], r["min"]), r["max"])}
    return out


def generate_health_scenario(
    scenario_type: str,
    seed: int | None = None,
    config: dict | None = None,
    *,
    step: int = 0,
    total_steps: int | None = None,
    custom: dict | None = None,
    now: datetime | None = None,
) -> dict:
    """Generate ONE health record for a scenario at `step` of `total_steps`.

    seed=None picks a random seed and records it in the output, so the run can be repeated.
    custom (scenario_type="custom"): {"readings": {...}, "availability": ..., "health_override": ...}
        -> operator-supplied values, processed as manual input; or
        {"ranges": {"temperature": {"min":..,"max":..}, ...}, "availability": ...}
        -> synthetic readings drawn from the given ranges.
    """
    cfg = resolve_config(config)
    if scenario_type not in SCENARIO_TYPES:
        raise HealthValidationError(f"Unknown scenario_type '{scenario_type}'. Allowed: {list(SCENARIO_TYPES)}")
    if not cfg["scenarios"].get(scenario_type, {}).get("enabled", False):
        raise HealthValidationError(f"Scenario '{scenario_type}' is disabled in the configuration")
    if isinstance(step, bool) or not isinstance(step, int) or step < 0:
        raise HealthValidationError("step must be a non-negative integer")
    total = total_steps or cfg["generation"]["default_steps"]
    if total < 1:
        raise HealthValidationError("total_steps must be >= 1")
    if seed is None:
        seed = secrets.randbelow(2**32)
    if isinstance(seed, bool) or not isinstance(seed, int) or seed < 0:
        raise HealthValidationError("seed must be a non-negative integer")

    scenario_id = f"SCEN-{scenario_type.upper()}-{seed}-S{step:03d}"
    rng = np.random.default_rng([seed, step])
    progress = 0.0 if total == 1 else min(step / (total - 1), 1.0)

    if scenario_type == "custom":
        return _custom(custom, rng, cfg, scenario_id, seed, step, now)

    readings, availability = _scenario_readings(scenario_type, rng, cfg, progress)
    health_input = HealthInput(
        source="synthetic", mode="sensor_input", availability=availability, **_clip(readings, cfg)
    )
    return build_health_record(
        health_input, cfg, scenario_id=scenario_id, scenario_type=scenario_type, random_seed=seed, step=step, now=now
    )


def _custom(custom, rng, cfg, scenario_id, seed, step, now):
    if not isinstance(custom, dict) or not (("readings" in custom) or ("ranges" in custom) or ("health_override" in custom)):
        raise HealthValidationError("custom scenario needs 'readings', 'ranges' or 'health_override'")
    availability = custom.get("availability", cfg["availability"]["default"])
    if "readings" in custom or "health_override" in custom:
        payload = {"source": "manual", "availability": availability}
        if "health_override" in custom:
            payload.update(mode="health_override", health_override=custom["health_override"])
        else:
            payload.update(mode="sensor_input", readings=custom["readings"])
        rec = process_manual_health_input(payload, cfg, now=now, record_id=scenario_id)
        rec.update(scenario_type="custom", random_seed=seed, step=step)
        return rec
    ranges = custom["ranges"]
    readings = {}
    for m in MEASUREMENTS:
        r = ranges.get(m) or cfg["generation"]["normal_ranges"][m]
        try:
            readings[m] = _GEN_UNIFORM[m](rng, r["min"], r["max"], cfg["units"][m])
        except (KeyError, TypeError, ValueError) as exc:
            raise HealthValidationError(f"Invalid custom range for {m}: {exc}") from exc
    health_input = HealthInput(source="synthetic", mode="sensor_input", availability=availability, **_clip(readings, cfg))
    return build_health_record(
        health_input, cfg, scenario_id=scenario_id, scenario_type="custom", random_seed=seed, step=step, now=now
    )


def generate_health_sequence(
    scenario_type: str,
    seed: int | None = None,
    config: dict | None = None,
    *,
    steps: int | None = None,
    custom: dict | None = None,
    now: datetime | None = None,
) -> list[dict]:
    """Time series: one record per step (e.g. Time 0 normal ... recovery)."""
    cfg = resolve_config(config)
    n = steps or cfg["generation"]["default_steps"]
    if seed is None:
        seed = secrets.randbelow(2**32)
    return [
        generate_health_scenario(scenario_type, seed, cfg, step=i, total_steps=n, custom=custom, now=now)
        for i in range(n)
    ]
