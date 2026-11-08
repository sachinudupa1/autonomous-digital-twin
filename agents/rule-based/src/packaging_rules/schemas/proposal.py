"""Proposal output contract (preliminary; to be approved by Teammate 1, checked by Teammate 2).

Top-level fields follow the shared contract. Rule-specific extras live under
`metadata` so the common fields stay identical to the ML/RL agents.
"""
from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, model_validator


class Schedule(BaseModel):
    model_config = ConfigDict(extra="forbid")
    order_sequence: list[str]

    @model_validator(mode="after")
    def _unique(self) -> "Schedule":
        if len(set(self.order_sequence)) != len(self.order_sequence):
            raise ValueError("order_sequence contains duplicate Order IDs")
        return self


class Proposal(BaseModel):
    model_config = ConfigDict(extra="forbid")
    schema_version: str
    agent_id: str
    agent_type: str
    proposal_id: str
    input_state_id: str
    input_state_version: int
    schedule: Schedule
    confidence: float | None = None
    rule_config_version: str
    explanation: str
    created_at_utc: str
    metadata: dict[str, Any] = {}
