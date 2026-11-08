"""Apply eligibility, health assessment and ranking to a validated state."""
from __future__ import annotations

from dataclasses import dataclass

from ..config import RuleConfig
from ..explanation import explain_ranking
from ..rules.eligibility import Exclusion, split_orders
from ..rules.health_awareness import HealthAssessment, assess_health
from ..schemas.state import SystemState
from .ranking import RankedOrder, rank_orders


@dataclass
class ScheduleResult:
    order_sequence: list[str]
    ranked: list[RankedOrder]
    excluded: list[Exclusion]
    health: HealthAssessment


def build_schedule(state: SystemState, cfg: RuleConfig) -> ScheduleResult:
    eligible, excluded = split_orders(state, cfg)
    health = assess_health(state.machine_health_summary, cfg)
    ranked = rank_orders(eligible, state.timestamp_utc, cfg, health)
    explain_ranking(ranked, cfg)
    sequence = [r.order_id for r in ranked]
    if len(sequence) != len(eligible) or len(set(sequence)) != len(sequence):  # defensive invariant
        raise RuntimeError("Scheduler invariant violated: eligible orders were lost or duplicated")
    return ScheduleResult(sequence, ranked, excluded, health)
