"""Creates validated Main-Agent decision events."""

from packaging_master.schemas.decision_event import DecisionEvent


def create_master_decision_log(event_data):
    """
    Create and validate a Main-Agent decision event.

    Args:
        event_data: Dictionary containing decision event information.

    Returns:
        DecisionEvent: Validated decision event.
    """
    return DecisionEvent.model_validate(event_data)