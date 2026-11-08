"""Rule 2 - Rush priority (with deadline/feasibility checks)."""
from __future__ import annotations

from ..schemas.state import Order


def is_rush(order: Order) -> bool:
    return order.order_type == "rush"


def rush_flags(order: Order, time_remaining: float | None, slack: float | None) -> list[str]:
    """Feasibility flags for a rush order. Flags inform; they never delete an order."""
    if not is_rush(order):
        return []
    flags: list[str] = []
    if order.requested_deadline_utc is None:
        flags.append("rush_missing_deadline")
        return flags
    if time_remaining is not None and time_remaining < 0:
        flags.append("deadline_passed")
    if slack is None:
        flags.append("no_processing_estimate")
    elif slack < 0:
        flags.append("negative_slack_deadline_at_risk")
    return flags
