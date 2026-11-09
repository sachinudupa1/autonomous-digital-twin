from datetime import datetime, timezone
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator


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
    context: dict[str, Any] = Field(default_factory=dict)

    @field_validator("occurred_at_utc")
    @classmethod
    def ensure_utc_timestamp(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("Timestamp must include a timezone")
        return value.astimezone(timezone.utc)
