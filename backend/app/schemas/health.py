from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class Measurement(BaseModel):
    model_config = ConfigDict(extra='forbid')

    value: float = Field(allow_inf_nan=False)
    unit: str = Field(min_length=1, max_length=30)


class HealthInputValues(BaseModel):
    model_config = ConfigDict(extra='forbid')

    temperature: Measurement | None = None
    vibration: Measurement | None = None
    operating_duration: Measurement | None = None
    wear_percent: float | None = Field(default=None, ge=0, le=100)
    manual_health_override: float | None = Field(default=None, ge=0, le=100)

    @model_validator(mode='after')
    def need_at_least_one_value(self):
        if all(value is None for value in self.model_dump().values()):
            raise ValueError('Provide at least one health value.')
        return self


class HealthInputRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')

    schema_version: Literal['1.0'] = '1.0'
    source: Literal['manual', 'synthetic']
    input_mode: str = Field(min_length=1, max_length=50)
    line_id: Literal['line_1', 'line_2'] | None = None
    scenario_id: str | None = Field(default=None, max_length=100)
    input: HealthInputValues
    timestamp_utc: datetime

    @field_validator('timestamp_utc')
    @classmethod
    def must_have_timezone(cls, value):
        if value.tzinfo is None:
            raise ValueError('timestamp_utc must include a timezone, for example Z.')
        return value


class HealthInputResponse(BaseModel):
    reading_id: str
    status: Literal['stored']