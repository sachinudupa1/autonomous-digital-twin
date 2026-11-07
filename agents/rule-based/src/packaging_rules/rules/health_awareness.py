"""Rule 6 - Health awareness.

The agent NEVER picks a machine or maps a reading to a machine (the Digital Twin
does that). It only reads the general machine_health_summary of the state to:
  * flag uncertainty (missing / inconsistent health information),
  * flag possible capacity problems,
  * optionally scale processing estimates when an approved slowdown factor exists.
Missing health is never assumed to mean "normal". No safety thresholds are invented.

Illustrative summary fields (final fields need Teammate 1's approval):
  {"overall_availability": "available|degraded|unavailable",
   "health_category": "normal|warning|abnormal|critical",
   "health_score": 0-100, "source": "manual|synthetic"}
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from ..config import RuleConfig


@dataclass
class HealthAssessment:
    enabled: bool = True
    uncertain: bool = False
    uncertainty_reasons: list[str] = field(default_factory=list)
    flags: list[str] = field(default_factory=list)
    availability: str | None = None
    category: str | None = None
    slowdown_factor: float = 1.0
    capacity_affected: bool = False

    def as_dict(self) -> dict:
        return {
            "considered": self.enabled,
            "availability": self.availability,
            "health_category": self.category,
            "slowdown_factor_applied": self.slowdown_factor,
            "flags": list(self.flags),
        }


def assess_health(summary: dict[str, Any] | None, cfg: RuleConfig) -> HealthAssessment:
    ha = cfg.health_awareness
    out = HealthAssessment(enabled=cfg.rules.health_awareness_enabled)
    if not out.enabled:
        return out
    if not summary:  # None or {}
        out.uncertain = True
        out.uncertainty_reasons.append("machine_health_missing")
        out.flags.append("health_information_missing")
        return out

    problems: list[str] = []
    avail = summary.get("overall_availability")
    cat = summary.get("health_category")
    score = summary.get("health_score")
    if avail is not None and avail not in ha.allowed_availability:
        problems.append(f"unknown overall_availability '{avail}'")
    if cat is not None and cat not in ha.allowed_categories:
        problems.append(f"unknown health_category '{cat}'")
    if score is not None and (isinstance(score, bool) or not isinstance(score, (int, float)) or not 0 <= score <= 100):
        problems.append(f"health_score {score!r} is not a number between 0 and 100")
    if avail is None and cat is None and score is None:
        problems.append("no recognised health fields (overall_availability, health_category, health_score)")
    if problems:
        out.uncertain = True
        out.uncertainty_reasons.append("inconsistent_health_information: " + "; ".join(problems))
        out.flags.append("health_information_inconsistent")
        return out

    out.availability, out.category = avail, cat
    if avail is None or cat is None:
        out.uncertain = True
        out.uncertainty_reasons.append("machine_health_incomplete: need overall_availability and health_category")
        out.flags.append("health_information_incomplete")
    if avail == "unavailable":
        out.flags.append("capacity_unavailable")
        out.capacity_affected = True
    elif avail == "degraded":
        out.flags.append("capacity_degraded")
        out.capacity_affected = True
    if cat in ("warning", "abnormal", "critical"):
        out.flags.append(f"health_{cat}")
        out.capacity_affected = True
    factor = ha.slowdown_factor_by_category.get(cat) if cat else None
    if factor is not None:
        out.slowdown_factor = float(factor)
    return out


def order_health_flags(order_is_rush_with_deadline: bool, health: HealthAssessment) -> list[str]:
    """Order-level flag: a rush deadline may be at risk if capacity is affected."""
    if health.enabled and health.capacity_affected and order_is_rush_with_deadline:
        return ["deadline_at_risk_due_to_health"]
    return []
