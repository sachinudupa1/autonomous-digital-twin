"""Ranking: one deterministic sort key per order, built from the configured rules.

Hierarchy (each component is compared in this order; smaller = higher priority):
  priority_tier            0 = rush (or normal order promoted for long waiting), 1 = other
  has_deadline             0 = has requested deadline
  has_slack, slack_seconds 0 = processing estimate available; then least slack first
  time_remaining_seconds   least time to deadline first
  tie-breakers             earlier deadline, longer wait, earlier arrival, Order ID
The explanation is generated FROM these same components, so it cannot contradict the ranking.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime

from ..config import RuleConfig
from ..rules.deadline_urgency import slack_time, time_remaining
from ..rules.health_awareness import HealthAssessment, order_health_flags
from ..rules.rush_priority import is_rush, rush_flags
from ..rules.tie_breaking import tie_break_components
from ..rules.waiting_time import is_aged, waiting_seconds
from ..schemas.state import Order


@dataclass
class RankedOrder:
    order: Order
    components: list[tuple[str, object]]
    waiting: float
    remaining: float | None
    slack: float | None
    tier: str  # "rush" | "aged" | "normal"
    flags: list[str] = field(default_factory=list)
    rank: int = 0
    reason: str = ""

    @property
    def order_id(self) -> str:
        return self.order.order_id

    def sort_key(self) -> list:
        return [v for _, v in self.components]


def rank_orders(orders: list[Order], now: datetime, cfg: RuleConfig, health: HealthAssessment) -> list[RankedOrder]:
    rules = cfg.rules
    ranked: list[RankedOrder] = []
    for o in orders:
        waiting = waiting_seconds(o, now)
        remaining = time_remaining(o, now)
        slack = slack_time(remaining, o.estimated_processing_seconds, health.slowdown_factor)
        rush = rules.rush_priority_enabled and is_rush(o)
        aged = is_aged(waiting, cfg)
        tier = "rush" if rush else ("aged" if aged else "normal")

        comps: list[tuple[str, object]] = [("priority_tier", 0 if (rush or aged) else 1)]
        if rules.deadline_urgency_enabled:
            comps.append(("has_deadline", 0 if remaining is not None else 1))
        if rules.slack_time_enabled:
            comps.append(("has_slack", 0 if slack is not None else 1))
            comps.append(("slack_seconds", float(slack) if slack is not None else 0.0))
        if rules.deadline_urgency_enabled:
            comps.append(("time_remaining_seconds", float(remaining) if remaining is not None else 0.0))
        comps += tie_break_components(o, waiting, cfg)

        flags = rush_flags(o, remaining, slack)
        if remaining is not None and remaining < 0 and "deadline_passed" not in flags:
            flags.append("deadline_passed")
        flags += order_health_flags(is_rush(o) and o.requested_deadline_utc is not None, health)
        ranked.append(RankedOrder(o, comps, waiting, remaining, slack, tier, flags))

    ranked.sort(key=lambda r: r.sort_key())
    for i, r in enumerate(ranked, start=1):
        r.rank = i
    return ranked
