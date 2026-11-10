from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

MAX_BALLS_PER_ORDER = 20


class OrderItems(BaseModel):
    model_config = ConfigDict(extra='forbid')

    ball_1: int = Field(ge=0, le=5, strict=True)
    ball_2: int = Field(ge=0, le=5, strict=True)
    ball_3: int = Field(ge=0, le=5, strict=True)
    ball_4: int = Field(ge=0, le=5, strict=True)

    def total_quantity(self) -> int:
        return self.ball_1 + self.ball_2 + self.ball_3 + self.ball_4

    @model_validator(mode='after')
    def check_total(self):
        total = self.total_quantity()
        if total < 1:
            raise ValueError('An order must contain at least one ball.')
        if total > MAX_BALLS_PER_ORDER:
            raise ValueError('An order can contain at most 20 balls.')
        return self


class CreateOrderRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')

    schema_version: Literal['1.0'] = '1.0'
    items: OrderItems
    order_type: Literal['normal', 'rush']
    requested_deadline_utc: datetime | None = None

    @model_validator(mode='after')
    def check_deadline(self):
        deadline = self.requested_deadline_utc
        if self.order_type == 'rush':
            if deadline is None:
                raise ValueError('A rush order must have requested_deadline_utc.')
            if deadline.tzinfo is None:
                raise ValueError('requested_deadline_utc must include a timezone, for example Z.')
            if deadline <= datetime.now(timezone.utc):
                raise ValueError('requested_deadline_utc must be in the future.')
        elif deadline is not None:
            raise ValueError('A normal order must not have a deadline.')
        return self


class CreateOrderResponse(BaseModel):
    order_id: str
    status: str
    tracking_token: str | None
    message: str


class TrackingResponse(BaseModel):
    order_id: str
    items: dict[str, int]
    status: Literal['Order Received', 'Queued', 'Packing', 'Completed']
    completed_at_utc: datetime | None = None


class InternalOrder(BaseModel):
    order_id: str
    items: dict[str, int]
    total_quantity: int
    order_type: str
    requested_deadline_utc: datetime | None = None
    status: str
    scheduling_run_id: str | None = None
    created_at_utc: datetime | None = None
    updated_at_utc: datetime | None = None
    queued_at_utc: datetime | None = None
    packing_started_at_utc: datetime | None = None
    completed_at_utc: datetime | None = None