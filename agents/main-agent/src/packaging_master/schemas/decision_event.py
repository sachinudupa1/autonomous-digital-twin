class DecisionEvent(BaseModel):

    model_config = ConfigDict(extra="allow")

    schema_version: str = "1.0"

    decision_id: str

    state_id: str

    state_version: int

    proposals_received: list[str] = Field(
        default_factory=list
    )

    selected_proposal_id: str | None = None

    rejected_proposals: list[str] = Field(
        default_factory=list
    )

    fallback_used: bool = False

    guardrail_status: str | None = None

    reason: str | None = None

    actual_outcome_status: str = "pending"

    created_at_utc: datetime