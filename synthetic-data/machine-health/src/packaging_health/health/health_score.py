"""Health score = 100 x (1 - combined risk), weights from config.

Illustrative demonstration formula, NOT a validated condition-monitoring model.
"""
from __future__ import annotations

from typing import Any

from ..config import MEASUREMENTS, resolve_config
from ..utils import HealthValidationError
from .classification import classify_health
from .normalization import normalize_risk


def _value(reading: Any) -> float:
    if reading is None:
        raise KeyError
    return float(reading["value"] if isinstance(reading, dict) else reading.value)


def calculate_health(readings: dict, config: dict | None = None) -> dict:
    """Return {health_score, health_category, calculation{...}} for sensor readings.

    `readings` maps measurement name -> {"value", "unit"} (or Measurement).
    Raises HealthValidationError for missing/invalid readings.
    """
    cfg = resolve_config(config)
    calc_cfg = cfg["health_calculation"]
    problems: list[str] = []
    risks: dict[str, float] = {}
    for m in calc_cfg["required_readings"]:
        try:
            raw = _value(readings.get(m))
        except (KeyError, TypeError, ValueError):
            problems.append(f"missing or invalid reading: {m}")
            continue
        rr = calc_cfg["risk_ranges"][m]
        try:
            risks[m] = normalize_risk(raw, rr["low"], rr["high"])
        except ValueError as exc:
            problems.append(f"{m}: {exc}")
    if problems:
        raise HealthValidationError("Cannot calculate health: " + "; ".join(problems), problems)

    weights = calc_cfg["weights"]
    # Weights of measurements that are not required are ignored and the rest renormalised.
    used = [m for m in MEASUREMENTS if m in risks]
    total_w = sum(weights[m] for m in used)
    combined = sum(weights[m] * risks[m] for m in used) / total_w if total_w else 0.0
    smin, smax = calc_cfg["score_range"]["minimum"], calc_cfg["score_range"]["maximum"]
    score = round(max(smin, min(smax, smax * (1 - combined))), 2)

    return {
        "health_score": score,
        "health_category": classify_health(score, cfg),
        "calculation": {
            **{f"{m}_risk": round(risks[m], 4) for m in used},
            "combined_risk": round(combined, 4),
            "weights": {m: weights[m] for m in used},
            "formula": "health_score = score_max * (1 - sum(weight_i * risk_i))",
        },
    }
