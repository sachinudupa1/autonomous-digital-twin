"""Rule 1 - Eligibility. Invalid/ineligible orders are NEVER silently dropped:
each one is returned as an Exclusion with a reason."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any

from pydantic import ValidationError

from ..config import RuleConfig
from ..schemas.state import Order, SystemState


@dataclass(frozen=True)
class Exclusion:
    order_id: str | None
    index: int
    reason: str
    detail: str = ""

    def as_dict(self) -> dict:
        return {"order_id": self.order_id, "input_index": self.index, "reason": self.reason, "detail": self.detail}


def split_orders(state: SystemState, cfg: RuleConfig) -> tuple[list[Order], list[Exclusion]]:
    eligible: list[Order] = []
    excluded: list[Exclusion] = []
    seen: set[str] = set()
    window = state.constraints.get("scheduling_window_order_ids")
    window_set = set(window) if isinstance(window, list) else None
    now: datetime = state.timestamp_utc
    statuses = {s.lower() for s in cfg.eligibility.eligible_statuses}

    for idx, raw in enumerate(state.orders):
        if not isinstance(raw, dict):
            excluded.append(Exclusion(None, idx, "invalid_order_data", "order entry is not an object"))
            continue
        raw_id = raw.get("order_id") if isinstance(raw.get("order_id"), str) else None
        try:
            order = Order(**raw)
        except (ValidationError, TypeError) as exc:
            msgs = (
                "; ".join(f"{'.'.join(str(p) for p in e['loc'])}: {e['msg']}" for e in exc.errors())
                if isinstance(exc, ValidationError)
                else str(exc)
            )
            excluded.append(Exclusion(raw_id, idx, "invalid_order_data", msgs))
            continue
        if order.order_id in seen:
            excluded.append(Exclusion(order.order_id, idx, "duplicate_order_id", "an earlier entry has the same order_id"))
            continue
        seen.add(order.order_id)
        if order.status not in statuses:
            excluded.append(Exclusion(order.order_id, idx, f"status_{order.status}", "status is not schedulable"))
            continue
        if window_set is not None and order.order_id not in window_set:
            excluded.append(Exclusion(order.order_id, idx, "outside_scheduling_window", ""))
            continue
        if order.created_at_utc > now:
            excluded.append(Exclusion(order.order_id, idx, "created_after_state_timestamp", "order is dated after the state snapshot"))
            continue
        eligible.append(order)
    return eligible, excluded
