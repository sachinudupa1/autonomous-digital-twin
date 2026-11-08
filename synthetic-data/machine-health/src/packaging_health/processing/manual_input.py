"""Process operator-entered (manual) health inputs.

Accepted payload shapes (final shape to be fixed with Teammate 1):
  * flat:   {"source":"manual","mode":"sensor_input","temperature":{...},"vibration":{...},"operating_duration":{...}}
  * nested: {"source":"manual","mode":"sensor_input","readings":{"temperature":{...},"vibration":{...}},"operating_duration":{...}}
  * override: {"source":"manual","mode":"health_override","health_override":45}
Manual values are never replaced by random values and stay labelled "manual".
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from pydantic import ValidationError

from ..config import MEASUREMENTS, resolve_config
from ..schemas.readings import HealthInput
from ..utils import HealthValidationError
from .reading_processor import build_health_record


def _flatten(payload: dict) -> dict:
    data = dict(payload)
    nested = data.pop("readings", None)
    if nested is not None:
        if not isinstance(nested, dict):
            raise HealthValidationError("'readings' must be an object")
        unknown = set(nested) - set(MEASUREMENTS)
        if unknown:
            raise HealthValidationError(f"Unknown reading(s) in 'readings': {sorted(unknown)}")
        clash = set(nested) & set(data)
        if clash:
            raise HealthValidationError(f"Reading(s) given twice (flat and nested): {sorted(clash)}")
        data.update(nested)
    return data


def process_manual_health_input(
    payload: Any,
    config: dict | None = None,
    *,
    now: datetime | None = None,
    record_id: str | None = None,
) -> dict:
    """Validate a manual payload and return a structured health record dict.

    Raises HealthValidationError (with `.errors`) for invalid input.
    """
    if not isinstance(payload, dict):
        raise HealthValidationError("Payload must be a JSON object")
    cfg = resolve_config(config)
    data = _flatten(payload)
    data.setdefault("source", "manual")
    if data["source"] != "manual":
        raise HealthValidationError("process_manual_health_input only accepts source='manual'")
    data.setdefault("availability", cfg["availability"]["default"])
    try:
        health_input = HealthInput(**data)
    except ValidationError as exc:
        errors = [f"{'.'.join(str(p) for p in e['loc']) or 'payload'}: {e['msg']}" for e in exc.errors()]
        raise HealthValidationError("Invalid health input: " + "; ".join(errors), errors) from exc
    except TypeError as exc:
        raise HealthValidationError(f"Invalid health input: {exc}") from exc
    return build_health_record(
        health_input,
        cfg,
        scenario_id=record_id or f"MANUAL-{uuid.uuid4().hex[:8].upper()}",
        scenario_type="manual",
        now=now,
    )
