"""System-state input schema (illustrative; final fields need Teammate 1's approval).

Timestamps must be timezone-aware and are treated as UTC. Orders are kept as raw
dicts at state level and validated one by one, so ONE bad order is reported as an
exclusion rather than silently dropped or crashing the whole proposal.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

MAX_PER_BALL = 5
MAX_TOTAL = 20


class StateValidationError(ValueError):
    def __init__(self, message: str, errors: list[str] | None = None):
        super().__init__(message)
        self.errors = errors or [message]


def _aware_datetime(v: Any) -> Any:
    if isinstance(v, datetime):
        return v
    if isinstance(v, str):
        return v
    raise ValueError("timestamp must be an ISO-8601 string")


def _require_tz(v: datetime | None) -> datetime | None:
    if v is not None and (v.tzinfo is None or v.tzinfo.utcoffset(v) is None):
        raise ValueError("timestamp must be timezone-aware (UTC); naive timestamps are rejected")
    return v


class Items(BaseModel):
    model_config = ConfigDict(extra="forbid")
    ball_1: int = Field(ge=0, le=MAX_PER_BALL)
    ball_2: int = Field(ge=0, le=MAX_PER_BALL)
    ball_3: int = Field(ge=0, le=MAX_PER_BALL)
    ball_4: int = Field(ge=0, le=MAX_PER_BALL)


class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    order_id: str
    order_type: Literal["normal", "rush"]
    items: Items
    total_quantity: int
    created_at_utc: datetime
    requested_deadline_utc: datetime | None = None
    status: str
    estimated_processing_seconds: float | None = Field(default=None, ge=0)
    waiting_seconds: float | None = Field(default=None, ge=0)

    @field_validator("created_at_utc", "requested_deadline_utc", mode="before")
    @classmethod
    def _before(cls, v):
        return v if v is None else _aware_datetime(v)

    @field_validator("created_at_utc", "requested_deadline_utc")
    @classmethod
    def _tz(cls, v):
        return _require_tz(v)

    @field_validator("order_id")
    @classmethod
    def _id(cls, v):
        if not v.strip():
            raise ValueError("order_id must not be blank")
        return v

    @field_validator("status")
    @classmethod
    def _status(cls, v):
        return v.strip().lower()

    @model_validator(mode="after")
    def _consistency(self) -> "Order":
        total = self.items.ball_1 + self.items.ball_2 + self.items.ball_3 + self.items.ball_4
        if total != self.total_quantity:
            raise ValueError(f"total_quantity {self.total_quantity} != sum of items {total}")
        if not 1 <= total <= MAX_TOTAL:
            raise ValueError(f"total quantity must be between 1 and {MAX_TOTAL}")
        if self.requested_deadline_utc is not None and self.requested_deadline_utc < self.created_at_utc:
            raise ValueError("requested_deadline_utc is before created_at_utc")
        return self


class SystemState(BaseModel):
    model_config = ConfigDict(extra="ignore")
    schema_version: str = "1.0"
    state_id: str
    state_version: int = Field(ge=0)
    timestamp_utc: datetime
    orders: list[Any]
    machine_health_summary: dict[str, Any] | None = None
    resource_state: dict[str, Any] = {}
    constraints: dict[str, Any] = {}

    @field_validator("timestamp_utc", mode="before")
    @classmethod
    def _before(cls, v):
        return _aware_datetime(v)

    @field_validator("timestamp_utc")
    @classmethod
    def _tz(cls, v):
        return _require_tz(v)

    @field_validator("state_id")
    @classmethod
    def _sid(cls, v):
        if not v.strip():
            raise ValueError("state_id must not be blank")
        return v


def validate_state(system_state: Any) -> SystemState:
    """Return a SystemState or raise StateValidationError with readable errors."""
    from pydantic import ValidationError

    if isinstance(system_state, SystemState):
        return system_state
    if not isinstance(system_state, dict):
        raise StateValidationError("system_state must be a JSON object")
    try:
        return SystemState(**system_state)
    except ValidationError as exc:
        errors = [f"{'.'.join(str(p) for p in e['loc']) or 'state'}: {e['msg']}" for e in exc.errors()]
        raise StateValidationError("Invalid system state: " + "; ".join(errors), errors) from exc
