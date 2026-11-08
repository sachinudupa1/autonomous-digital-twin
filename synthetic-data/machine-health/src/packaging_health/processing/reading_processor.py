"""Turn a validated HealthInput into a full, schema-checked health record."""
from __future__ import annotations

from datetime import datetime

from ..config import MEASUREMENTS, resolve_config
from ..health.classification import classify_health
from ..health.health_score import calculate_health
from ..schemas.readings import HealthInput, HealthRecord
from ..utils import GENERATOR_VERSION, SCHEMA_VERSION, HealthValidationError, utc_now_iso


def validate_measurements(health_input: HealthInput, config: dict) -> None:
    """Check units, configured ranges and (for sensor mode) required readings."""
    errors: list[str] = []
    for m in MEASUREMENTS:
        meas = getattr(health_input, m)
        if meas is None:
            continue
        expected = config["units"][m]
        if meas.unit != expected:
            errors.append(f"{m}: unit '{meas.unit}' does not match configured unit '{expected}'")
        r = config["valid_ranges"][m]
        if not r["min"] <= meas.value <= r["max"]:
            errors.append(f"{m}: value {meas.value} outside configured range {r['min']}-{r['max']}")
    if health_input.mode == "sensor_input":
        for m in config["health_calculation"]["required_readings"]:
            if getattr(health_input, m) is None:
                errors.append(f"{m}: required reading is missing")
    else:
        rng = config["health_calculation"]["score_range"]
        if not rng["minimum"] <= health_input.health_override <= rng["maximum"]:
            errors.append(f"health_override outside configured range {rng['minimum']}-{rng['maximum']}")
    if health_input.availability not in config["availability"]["allowed"]:
        errors.append(f"availability '{health_input.availability}' is not allowed")
    if errors:
        raise HealthValidationError("Invalid health input: " + "; ".join(errors), errors)


def build_health_record(
    health_input: HealthInput,
    config: dict | None = None,
    *,
    scenario_id: str,
    scenario_type: str | None = None,
    random_seed: int | None = None,
    step: int | None = None,
    now: datetime | None = None,
) -> dict:
    """Validate, calculate (or keep the manual override) and return a record dict.

    Raw readings are never overwritten by the calculated score, and `source`
    is never changed.
    """
    cfg = resolve_config(config)
    validate_measurements(health_input, cfg)

    readings = {m: getattr(health_input, m) for m in MEASUREMENTS}
    if health_input.mode == "sensor_input":
        res = calculate_health({k: v for k, v in readings.items() if v is not None}, cfg)
        health_source = "calculated"
    else:
        score = float(health_input.health_override)
        res = {"health_score": score, "health_category": classify_health(score, cfg), "calculation": None}
        health_source = "manual"

    record = HealthRecord(
        schema_version=SCHEMA_VERSION,
        scenario_id=scenario_id,
        source=health_input.source,
        health_source=health_source,
        mode=health_input.mode,
        readings={k: (v.model_dump() if v is not None else None) for k, v in readings.items()},
        health_result=res,
        availability=health_input.availability,
        scenario_type=scenario_type,
        random_seed=random_seed,
        step=step,
        generator_version=GENERATOR_VERSION,
        config_version=cfg["config_version"],
        thresholds_status=cfg.get("approval_status", "unknown"),
        created_at_utc=utc_now_iso(now),
    )
    return record.model_dump(mode="json")
