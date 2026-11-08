"""Rule 5 - Waiting time (anti-starvation)."""
from __future__ import annotations

from datetime import datetime

from ..config import RuleConfig
from ..schemas.state import Order


def waiting_seconds(order: Order, now: datetime) -> float:
    """Supplied waiting_seconds if present, else snapshot time minus creation time."""
    if order.waiting_seconds is not None:
        return float(order.waiting_seconds)
    return max(0.0, (now - order.created_at_utc).total_seconds())


def is_aged(waiting: float, cfg: RuleConfig) -> bool:
    """True if a normal order has waited long enough to be promoted into the rush tier."""
    limit = cfg.waiting_time.starvation_promotion_seconds
    return bool(cfg.rules.waiting_time_enabled and limit is not None and waiting >= limit)
