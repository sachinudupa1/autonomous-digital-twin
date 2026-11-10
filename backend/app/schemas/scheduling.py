from typing import Literal

from pydantic import BaseModel, ConfigDict


class SchedulingRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')

    trigger: Literal['manual', 'new_order'] = 'manual'


class SchedulingRequestCreated(BaseModel):
    request_id: str
    status: str
    state_id: str
    state_version: int