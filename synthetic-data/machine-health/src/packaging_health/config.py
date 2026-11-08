"""Load and validate health_config.yaml.

All thresholds/weights come from configuration. The shipped YAML contains
clearly labelled DEVELOPMENT DEFAULTS that Teammate 1 must approve.
"""
from __future__ import annotations

import copy
import math
from pathlib import Path
from typing import Any

import yaml

from .utils import ConfigError

DEFAULT_CONFIG_PATH = Path(__file__).resolve().parents[2] / "configs" / "health_config.yaml"
MEASUREMENTS = ("temperature", "vibration", "operating_duration")
CATEGORY_ORDER = ("normal", "warning", "abnormal", "critical")


def _need(cfg: dict, *path: str) -> Any:
    cur: Any = cfg
    for key in path:
        if not isinstance(cur, dict) or key not in cur or cur[key] is None:
            raise ConfigError(f"Config value '{'.'.join(path)}' is missing or null; it must be set/approved.")
        cur = cur[key]
    return cur


def _num(cfg: dict, *path: str) -> float:
    v = _need(cfg, *path)
    if isinstance(v, bool) or not isinstance(v, (int, float)) or not math.isfinite(v):
        raise ConfigError(f"Config value '{'.'.join(path)}' must be a finite number, got {v!r}.")
    return float(v)


def validate_config(cfg: dict) -> dict:
    """Validate a config dict. Returns it unchanged or raises ConfigError."""
    if not isinstance(cfg, dict):
        raise ConfigError("Config must be a mapping.")
    _need(cfg, "config_version")
    for m in MEASUREMENTS:
        _need(cfg, "units", m)
        if _num(cfg, "valid_ranges", m, "min") >= _num(cfg, "valid_ranges", m, "max"):
            raise ConfigError(f"valid_ranges.{m}: min must be < max.")
        if _num(cfg, "health_calculation", "risk_ranges", m, "low") >= _num(
            cfg, "health_calculation", "risk_ranges", m, "high"
        ):
            raise ConfigError(f"risk_ranges.{m}: low must be < high.")
        _num(cfg, "health_calculation", "weights", m)
        lo, hi = _num(cfg, "generation", "normal_ranges", m, "min"), _num(cfg, "generation", "normal_ranges", m, "max")
        if lo > hi:
            raise ConfigError(f"generation.normal_ranges.{m}: min must be <= max.")
        _num(cfg, "generation", "noise", m)
    weights = [cfg["health_calculation"]["weights"][m] for m in MEASUREMENTS]
    if any(w < 0 for w in weights) or not math.isclose(sum(weights), 1.0, abs_tol=1e-9):
        raise ConfigError(f"Weights must be non-negative and sum to 1 (got {sum(weights)}).")
    smin, smax = _num(cfg, "health_calculation", "score_range", "minimum"), _num(
        cfg, "health_calculation", "score_range", "maximum"
    )
    if smin >= smax:
        raise ConfigError("score_range.minimum must be < maximum.")
    mins = [_num(cfg, "health_calculation", "categories", c, "minimum") for c in CATEGORY_ORDER]
    if any(a <= b for a, b in zip(mins, mins[1:])):
        raise ConfigError("Category minimums must strictly decrease: normal > warning > abnormal > critical.")
    if mins[-1] > smin:
        raise ConfigError("The lowest category minimum must cover the bottom of the score range.")
    required = _need(cfg, "health_calculation", "required_readings")
    if not isinstance(required, list) or not set(required) <= set(MEASUREMENTS):
        raise ConfigError("required_readings must be a list drawn from the known measurements.")
    allowed = _need(cfg, "availability", "allowed")
    if _need(cfg, "availability", "default") not in allowed:
        raise ConfigError("availability.default must be one of availability.allowed.")
    _need(cfg, "scenarios")
    return cfg


def load_config(path: str | Path | None = None, overrides: dict | None = None) -> dict:
    """Load the YAML config (default: configs/health_config.yaml) and validate it."""
    p = Path(path) if path else DEFAULT_CONFIG_PATH
    if not p.exists():
        raise ConfigError(f"Config file not found: {p}")
    with p.open("r", encoding="utf-8") as fh:
        cfg = yaml.safe_load(fh)
    if overrides:
        cfg = _deep_merge(cfg, overrides)
    return validate_config(cfg)


def resolve_config(config: dict | str | Path | None) -> dict:
    """Accept None (default file), a path, or an already-loaded dict."""
    if config is None or isinstance(config, (str, Path)):
        return load_config(config)
    return validate_config(copy.deepcopy(config))


def _deep_merge(base: dict, extra: dict) -> dict:
    out = copy.deepcopy(base)
    for k, v in extra.items():
        if isinstance(v, dict) and isinstance(out.get(k), dict):
            out[k] = _deep_merge(out[k], v)
        else:
            out[k] = v
    return out
