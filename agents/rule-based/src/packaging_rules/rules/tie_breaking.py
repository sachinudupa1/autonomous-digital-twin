"""Rule 7 - Deterministic tie-breaking. Order ID is ALWAYS the final component."""
from __future__ import annotations

import math

from ..config import RuleConfig
from ..schemas.state import Order


def tie_break_components(order: Order, waiting: float, cfg: RuleConfig) -> list[tuple[str, object]]:
    tb = cfg.tie_breaking
    comps: list[tuple[str, object]] = []
    if tb.earlier_deadline:
        d = order.requested_deadline_utc
        comps.append(("earlier_deadline", d.timestamp() if d else math.inf))
    if tb.longer_waiting_time:
        comps.append(("longer_waiting_time", -waiting))
    if tb.earlier_arrival:
        comps.append(("earlier_arrival", order.created_at_utc.timestamp()))
    comps.append(("order_id", order.order_id))  # always last -> total, deterministic order
    return comps
