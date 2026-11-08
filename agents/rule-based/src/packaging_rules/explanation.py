"""Explanations generated from the same sort-key components used for ranking."""
from __future__ import annotations

from .config import RuleConfig
from .rules.eligibility import Exclusion
from .rules.health_awareness import HealthAssessment
from .scheduling.ranking import RankedOrder


def _s(x: float | None) -> str:
    return "n/a" if x is None else f"{x:.0f}s"


def tier_label(r: RankedOrder) -> str:
    if r.tier == "rush":
        return "a rush order"
    if r.tier == "aged":
        return f"an order promoted for long waiting ({_s(r.waiting)})"
    return "a normal order"


def _phrase(name: str, r: RankedOrder, p: RankedOrder) -> str:
    """Why previous order `p` outranks `r` on component `name`."""
    if name == "priority_tier":
        return f"{p.order_id} is {tier_label(p)}, whereas {r.order_id} is {tier_label(r)}"
    if name == "has_deadline":
        return f"{p.order_id} has a requested deadline but {r.order_id} has none"
    if name == "has_slack":
        return f"{p.order_id} has a processing estimate (slack can be computed) but {r.order_id} has none"
    if name == "slack_seconds":
        return f"{p.order_id} has less slack ({_s(p.slack)}) than {r.order_id} ({_s(r.slack)})"
    if name == "time_remaining_seconds":
        return f"{p.order_id} has less time left to its deadline ({_s(p.remaining)}) than {r.order_id} ({_s(r.remaining)})"
    if name == "earlier_deadline":
        return f"{p.order_id} has an earlier deadline than {r.order_id}"
    if name == "longer_waiting_time":
        return f"{p.order_id} has waited longer ({_s(p.waiting)}) than {r.order_id} ({_s(r.waiting)})"
    if name == "earlier_arrival":
        return f"{p.order_id} arrived earlier than {r.order_id}"
    return f"all other factors are equal, so the Order ID breaks the tie ({p.order_id} sorts before {r.order_id})"


def _first_reason(r: RankedOrder, cfg: RuleConfig) -> str:
    parts = [f"it is {tier_label(r)}"]
    if cfg.rules.deadline_urgency_enabled:
        if r.remaining is None:
            parts.append("it has no requested deadline")
        elif r.remaining < 0:
            parts.append(f"its deadline passed {_s(-r.remaining)} before the state snapshot")
        else:
            parts.append(f"its deadline is {_s(r.remaining)} after the state snapshot")
    if cfg.rules.slack_time_enabled and r.slack is not None:
        parts.append(f"its slack is {_s(r.slack)}")
    parts.append(f"it has waited {_s(r.waiting)}")
    return "highest-ranked under the configured rules: " + "; ".join(parts)


def explain_ranking(ranked: list[RankedOrder], cfg: RuleConfig) -> None:
    """Fill `reason` on each RankedOrder (in place)."""
    for i, r in enumerate(ranked):
        if i == 0:
            r.reason = _first_reason(r, cfg)
            continue
        p = ranked[i - 1]
        for (name, a), (_, b) in zip(r.components, p.components):
            if a != b:
                r.reason = f"ranked after {p.order_id} because {_phrase(name, r, p)}"
                break
        else:  # pragma: no cover - order_id is unique so this cannot happen
            r.reason = f"ranked after {p.order_id}"


def active_rules(cfg: RuleConfig) -> list[str]:
    ru = cfg.rules
    names = []
    if ru.rush_priority_enabled:
        names.append("rush priority")
    if ru.deadline_urgency_enabled:
        names.append("deadline urgency")
    if ru.slack_time_enabled:
        names.append("least slack (where an estimate exists)")
    if ru.waiting_time_enabled:
        names.append("waiting time")
    if ru.health_awareness_enabled:
        names.append("health awareness (flags only)")
    return names or ["tie-breakers only"]


def build_explanation(
    ranked: list[RankedOrder], excluded: list[Exclusion], health: HealthAssessment, cfg: RuleConfig
) -> str:
    lines = [
        f"Ranked {len(ranked)} eligible order(s) using: {', '.join(active_rules(cfg))}; "
        "ties broken deterministically (earlier deadline, longer wait, earlier arrival, Order ID)."
    ]
    if excluded:
        lines.append(f"{len(excluded)} order(s) excluded: " + "; ".join(
            f"{e.order_id or f'#{e.index}'} ({e.reason})" for e in excluded) + ".")
    if health.uncertain:
        lines.append("UNCERTAIN proposal: " + "; ".join(health.uncertainty_reasons) + ".")
    elif health.enabled and health.flags:
        lines.append("Health flags (no machine selected, ordering not changed by health): " + ", ".join(health.flags) + ".")
    for r in ranked:
        extra = f" [flags: {', '.join(r.flags)}]" if r.flags else ""
        lines.append(f"{r.rank}. {r.order_id}: {r.reason}.{extra}")
    return "\n".join(lines)
