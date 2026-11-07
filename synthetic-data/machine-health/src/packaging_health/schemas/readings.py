"""Pydantic schemas for health inputs and health records.

source        : where the raw readings/override came from ("manual" | "synthetic")
health_source : how the health value was produced ("calculated" | "manual")
These are deliberately separate so calculated scores are never confused with
raw readings or operator overrides.
"""
from __future__ import annotations

import math
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

Availability = Literal["available", "degraded", "unavailable"]
Category = Literal["normal", "warning", "abnormal", "critical"]


class Measurement(BaseModel):
    model_config = ConfigDict(extra="forbid")
    value: float
    unit: str

    @field_validator("value", mode="before")
    @classmethod
    def _numeric_only(cls, v: Any) -> Any:
        if isinstance(v, bool) or not isinstance(v, (int, float)):
            raise ValueError("value must be a number (not a string or boolean)")
        if not math.isfinite(v):
            raise ValueError("value must be finite")
        return v

    @field_validator("unit")
    @classmethod
    def _unit_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("unit must not be blank")
        return v


class HealthInput(BaseModel):
    """Operator/generator input. No machine ID: the Digital Twin maps machines."""

    model_config = ConfigDict(extra="forbid")
    schema_version: str = "1.0"
    source: Literal["manual", "synthetic"]
    mode: Literal["sensor_input", "health_override"]
    temperature: Measurement | None = None
    vibration: Measurement | None = None
    operating_duration: Measurement | None = None
    health_override: float | None = Field(default=None, ge=0, le=100)
    availability: Availability = "available"

    @model_validator(mode="after")
    def _cross_field(self) -> "HealthInput":
        readings = [self.temperature, self.vibration, self.operating_duration]
        if self.mode == "sensor_input":
            if self.health_override is not None:
                raise ValueError("sensor_input mode must not include health_override")
            if all(r is None for r in readings):
                raise ValueError("sensor_input mode requires at least one reading")
        else:
            if self.health_override is None:
                raise ValueError("health_override mode requires health_override")
            if any(r is not None for r in readings):
                raise ValueError("health_override mode must not include sensor readings")
        return self


class Readings(BaseModel):
    model_config = ConfigDict(extra="forbid")
    temperature: Measurement | None = None
    vibration: Measurement | None = None
    operating_duration: Measurement | None = None


class HealthResult(BaseModel):
    model_config = ConfigDict(extra="forbid")
    health_score: float = Field(ge=0, le=100)
    health_category: Category
    calculation: dict[str, Any] | None = None


class HealthRecord(BaseModel):
    """Structured output returned to the backend (see README for JSON example)."""

    model_config = ConfigDict(extra="forbid")
    schema_version: str
    scenario_id: str
    source: Literal["manual", "synthetic"]
    health_source: Literal["calculated", "manual"]
    mode: Literal["sensor_input", "health_override"]
    readings: Readings
    health_result: HealthResult
    availability: Availability
    scenario_type: str | None = None
    random_seed: int | None = None
    step: int | None = None
    generator_version: str
    config_version: str
    thresholds_status: str
    created_at_utc: str
