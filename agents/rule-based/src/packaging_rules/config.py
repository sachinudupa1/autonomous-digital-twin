"""Rule configuration (validated with Pydantic)."""
from __future__ import annotations

from pathlib import Path

import yaml
from pydantic import BaseModel, ConfigDict, field_validator

DEFAULT_CONFIG_PATH = Path(__file__).resolve().parents[2] / "configs" / "rule_config.yaml"


class RuleConfigError(ValueError):
    pass


class RuleToggles(BaseModel):
    model_config = ConfigDict(extra="forbid")
    rush_priority_enabled: bool
    deadline_urgency_enabled: bool
    slack_time_enabled: bool
    waiting_time_enabled: bool
    health_awareness_enabled: bool


class TieBreaking(BaseModel):
    model_config = ConfigDict(extra="forbid")
    earlier_deadline: bool
    longer_waiting_time: bool
    earlier_arrival: bool
    order_id: bool


class Eligibility(BaseModel):
    model_config = ConfigDict(extra="forbid")
    eligible_statuses: list[str]


class WaitingTime(BaseModel):
    model_config = ConfigDict(extra="forbid")
    starvation_promotion_seconds: float | None = None

    @field_validator("starvation_promotion_seconds")
    @classmethod
    def _positive(cls, v):
        if v is not None and v <= 0:
            raise ValueError("starvation_promotion_seconds must be > 0 or null")
        return v


class HealthAwareness(BaseModel):
    model_config = ConfigDict(extra="forbid")
    on_missing_health: str
    allowed_availability: list[str]
    allowed_categories: list[str]
    slowdown_factor_by_category: dict[str, float | None]

    @field_validator("on_missing_health")
    @classmethod
    def _policy(cls, v):
        if v != "mark_uncertain":
            raise ValueError("only 'mark_uncertain' is implemented for on_missing_health")
        return v

    @field_validator("slowdown_factor_by_category")
    @classmethod
    def _factors(cls, v):
        for k, f in v.items():
            if f is not None and (isinstance(f, bool) or f < 1):
                raise ValueError(f"slowdown factor for '{k}' must be >= 1 or null")
        return v


class RuleConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")
    rule_config_version: str
    approval_status: str = "unknown"
    rules: RuleToggles
    tie_breaking: TieBreaking
    eligibility: Eligibility
    waiting_time: WaitingTime
    health_awareness: HealthAwareness


def load_rule_config(path: str | Path | None = None) -> RuleConfig:
    p = Path(path) if path else DEFAULT_CONFIG_PATH
    if not p.exists():
        raise RuleConfigError(f"Rule config not found: {p}")
    with p.open("r", encoding="utf-8") as fh:
        raw = yaml.safe_load(fh)
    return parse_rule_config(raw)


def parse_rule_config(raw: dict) -> RuleConfig:
    from pydantic import ValidationError

    try:
        return RuleConfig(**raw)
    except (ValidationError, TypeError) as exc:
        detail = exc.errors() if isinstance(exc, ValidationError) else str(exc)
        raise RuleConfigError(f"Invalid rule configuration: {detail}") from exc


def resolve_rule_config(config) -> RuleConfig:
    """None -> default file; path -> that file; dict -> parsed; RuleConfig -> as is."""
    if isinstance(config, RuleConfig):
        return config
    if config is None or isinstance(config, (str, Path)):
        return load_rule_config(config)
    if isinstance(config, dict):
        return parse_rule_config(config)
    raise RuleConfigError("Unsupported config type")
