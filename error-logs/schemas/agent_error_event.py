"""
Individual scheduling-agent error event.

Initial schema draft.
Final shared fields require team approval.
"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class AgentErrorEvent(BaseModel):

    model_config = ConfigDict(extra="allow")

    schema_version: str = "1.0"

    event_id: str

    agent_id: str

    proposal_id: str | None = None

    error_category: str

    severity: str

    error_message: str

    occurred_at_utc: datetime

    context: dict[str, Any] = Field(
        default_factory=dict
    )