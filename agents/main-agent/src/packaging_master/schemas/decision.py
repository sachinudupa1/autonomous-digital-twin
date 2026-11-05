"""
Main-Agent decision output schema.
"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class MainAgentDecision(BaseModel):
    model_config = ConfigDict(extra="allow")

    schema_version: str = "1.0"

    decision_id: str

    state_id: str

    state_version: int

    selected_proposal_id: str | None = None

    selected_schedule: dict[str, Any] | None = None

    rejected_proposals: list[str] = Field(
        default_factory=list
    )

    evaluation_results: list[dict[str, Any]] = Field(
        default_factory=list
    )

    score_breakdown: dict[str, Any] = Field(
        default_factory=dict
    )

    fallback_used: bool = False

    guardrail_status: str | None = None

    reason: str | None = None

    created_at_utc: datetime