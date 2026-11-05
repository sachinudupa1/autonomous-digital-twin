"""
System state schema.

Initial structural model.
The final shared contract must be approved by Teammate 1.
"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class SystemState(BaseModel):
    model_config = ConfigDict(extra="allow")

    schema_version: str = "1.0"

    state_id: str

    state_version: int = Field(ge=1)

    timestamp_utc: datetime

    orders: list[dict[str, Any]] = Field(
        default_factory=list
    )

    system_conditions: dict[str, Any] = Field(
        default_factory=dict
    )

    machine_health: list[dict[str, Any]] = Field(
        default_factory=list
    )

    resource_state: dict[str, Any] = Field(
        default_factory=dict
    )