from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


def _need_timezone(value: datetime) -> datetime:
    if value.tzinfo is None:
        raise ValueError('The time must include a timezone, for example Z.')
    return value


class CommandAck(BaseModel):
    model_config = ConfigDict(extra='forbid')

    received_at_utc: datetime

    _check_time = field_validator('received_at_utc')(_need_timezone)


class BridgeEvent(BaseModel):
    model_config = ConfigDict(extra='forbid')

    command_id: str = Field(min_length=1, max_length=100)
    event_type: Literal['order_started', 'order_completed', 'command_completed', 'error']
    order_id: str | None = Field(default=None, max_length=100)
    occurred_at_utc: datetime
    details: dict[str, Any] = Field(default_factory=dict)

    _check_time = field_validator('occurred_at_utc')(_need_timezone)

    @model_validator(mode='after')
    def order_events_need_an_order_id(self):
        if self.event_type in ('order_started', 'order_completed') and not self.order_id:
            raise ValueError('order_id is required for order events.')
        return self