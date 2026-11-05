"""
Scheduling proposal schema.

Initial structural model.
"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class Schedule(BaseModel):
    model_config = ConfigDict(extra="allow")

    order_sequence: list[str] = Field(
        default_factory=list
    )


class AgentProposal(BaseModel):
    model_config = ConfigDict(extra="allow")

    schema_version: str = "1.0"

    agent_id: str

    agent_type: str

    proposal_id: str

    input_state_id: str

    input_state_version: int

    schedule: Schedule

    confidence: float | None = None

    model_version: str | None = None

    explanation: str | None = None

    created_at_utc: datetime