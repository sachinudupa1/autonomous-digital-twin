def validate_proposal(proposal, state):
    """Validate an agent's complete schedule proposal against the input state."""

    if not isinstance(proposal, dict):
        return False, "Invalid proposal"

    if not isinstance(state, dict):
        return False, "Invalid state"

    if not proposal.get("proposal_id"):
        return False, "Missing proposal ID"

    if proposal.get("agent_id") not in {"rule_based", "ml", "rl"}:
        return False, "Unknown agent type"

    proposal_state_id = proposal.get("state_id", proposal.get("input_state_id"))
    state_id = state.get("state_id")

    if proposal_state_id is not None and proposal_state_id != state_id:
        return False, "Incorrect state ID"

    proposal_version = proposal.get(
        "state_version",
        proposal.get("input_state_version")
    )

    if proposal_version != state.get("state_version"):
        return False, "Incorrect state version"

    schedule = proposal.get("schedule")

    if not isinstance(schedule, dict):
        return False, "Invalid schedule"

    order_sequence = schedule.get("order_sequence")

    if not isinstance(order_sequence, list):
        return False, "Invalid schedule"

    if not all(isinstance(order_id, str) and order_id.strip()
               for order_id in order_sequence):
        return False, "Invalid schedule"

    if len(order_sequence) != len(set(order_sequence)):
        return False, "Duplicate order IDs"

    orders = state.get("orders")

    if not isinstance(orders, list):
        return False, "Invalid state"

    if not all(
        isinstance(order, dict) and isinstance(order.get("order_id"), str)
        for order in orders
    ):
        return False, "Invalid state"

    valid_orders = {order["order_id"] for order in orders}

    if set(order_sequence) != valid_orders:
        return False, "Missing or non-existent order IDs"

    return True, "Proposal is valid"
