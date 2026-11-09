
from typing import Any, Sequence


def build_rl_proposal(
    order_sequence: Sequence[str],
    proposal_id: str,
    input_state_id: str,
    input_state_version: int,
    created_at_utc: str,
    schema_version: str = "1.0",
    confidence: float | None = None,
    explanation: str = (
        "Global order sequence generated using the RL policy."
    ),
) -> dict[str, Any]:
    """
    Build an RL scheduling proposal using the common proposal structure.

    The RL agent provides a global order sequence only.
    Line allocation is the responsibility of the Main Agent.
    """

    # Validate required metadata.
    required_strings = {
        "proposal_id": proposal_id,
        "input_state_id": input_state_id,
        "created_at_utc": created_at_utc,
        "schema_version": schema_version,
    }

    for field, value in required_strings.items():
        if not isinstance(value, str) or not value.strip():
            raise ValueError(f"{field} must be a non-empty string")

    if (
        isinstance(input_state_version, bool)
        or not isinstance(input_state_version, int)
        or input_state_version < 1
    ):
        raise ValueError(
            "input_state_version must be a positive integer"
        )

    # Validate the global order sequence.
    if isinstance(order_sequence, (str, bytes)):
        raise TypeError("order_sequence must be a sequence of order IDs")

    if not isinstance(order_sequence, Sequence):
        raise TypeError("order_sequence must be a sequence")

    normalized_sequence = list(order_sequence)

    if not normalized_sequence:
        raise ValueError("order_sequence cannot be empty")

    if any(
        not isinstance(order_id, str) or not order_id.strip()
        for order_id in normalized_sequence
    ):
        raise ValueError(
            "Every order ID must be a non-empty string"
        )

    if len(normalized_sequence) != len(set(normalized_sequence)):
        raise ValueError("order_sequence cannot contain duplicate order IDs")

    if not isinstance(explanation, str):
        raise TypeError("explanation must be a string")

    # Build the common proposal envelope.
    # Do not add line_assignments here.
    proposal = {
        "schema_version": schema_version,
        "proposal_id": proposal_id,
        "agent_id": "rl_agent",
        "agent_type": "reinforcement_learning",
        "input_state_id": input_state_id,
        "input_state_version": input_state_version,
        "created_at_utc": created_at_utc,
        "schedule": {
            "order_sequence": normalized_sequence,
        },
        "confidence": confidence,
        "explanation": explanation,
    }

    return proposal
