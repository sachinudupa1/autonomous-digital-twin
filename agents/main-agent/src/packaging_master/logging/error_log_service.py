"""Creates validated individual agent error events."""

from packaging_master.schemas.agent_error_event import AgentErrorEvent


def create_agent_error_log(event_data):
    """
    Create and validate an individual agent error event.

    Args:
        event_data: Dictionary containing error event information.

    Returns:
        AgentErrorEvent: Validated error event.
    """
    return AgentErrorEvent.model_validate(event_data)