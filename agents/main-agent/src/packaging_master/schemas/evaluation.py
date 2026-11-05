"""
Digital Twin evaluation result schema.

The actual Digital Twin implementation belongs
to Teammate 1.
"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class EvaluationResult(BaseModel):
    model_config = ConfigDict(extra="allow")

    schema_version: str = "1.0"

    simulation_id: str

    proposal_id: str

    state_id: str

    state_version: int

    status: str

    feasible: bool

    constraint_violations: list[str] = Field(
        default_factory=list
    )

    predicted_metrics: dict[str, Any] = Field(
        default_factory=dict
    )

    objective_cost: float | None = None

    twin_version: str | None = None

    created_at_utc: datetime