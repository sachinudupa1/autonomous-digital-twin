def validate_proposal(proposal, state):

    if not proposal.get("proposal_id"):
        return False, "Missing proposal ID"

    if proposal.get("agent_id") not in {
        "rule_based",
        "ml",
        "rl",
    }:
        return False, "Unknown agent type"

    if proposal.get("state_version") != state["state_version"]:
        return False, "Incorrect state version"

    schedule = proposal.get("schedule")

    if not isinstance(schedule, list):
        return False, "Invalid schedule"

    if len(schedule) != len(set(schedule)):
        return False, "Duplicate order IDs"

    valid_orders = {
        order["order_id"]
        for order in state["orders"]
    }

    if set(schedule) != valid_orders:
        return False, "Missing or non-existent order IDs"

    return True, "Proposal is valid"