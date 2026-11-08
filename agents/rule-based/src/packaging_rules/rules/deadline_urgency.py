"""Rules 3 & 4 - Deadline urgency and least remaining slack (all times UTC, seconds)."""
from __future__ import annotations

from datetime import datetime

from ..schemas.state import Order


def time_remaining(order: Order, now: datetime) -> float | None:
    """Seconds until the requested deadline (negative if passed); None if no deadline."""
    if order.requested_deadline_utc is None:
        return None
    return (order.requested_deadline_utc - now).total_seconds()


def slack_time(remaining: float | None, estimate: float | None, slowdown_factor: float = 1.0) -> float | None:
    """Slack = time remaining - estimated remaining processing.

    Returns None when either input is missing: processing durations are never invented.
    """
    if remaining is None or estimate is None:
        return None
    return remaining - estimate * slowdown_factor
