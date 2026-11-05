class AgentErrorEvent(BaseModel):

    model_config = ConfigDict(extra="allow")

    schema_version: str = "1.0"

    event_id: str