"""Rule-Based Scheduling Agent entry point.

Proposes an order sequence only. It never executes a schedule, never selects a
machine, and returns confidence=None (no calibrated confidence exists).
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from .config import RuleConfig, resolve_rule_config
from .explanation import build_explanation
from .schemas.proposal import Proposal, Schedule
from .schemas.state import validate_state
from .scheduling.scheduler import build_schedule

AGENT_ID = "rule_based_agent"
AGENT_TYPE = "rule_based"
SCHEMA_VERSION = "1.0"


def _iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def generate_rule_based_proposal(
    system_state: Any,
    config: RuleConfig | dict | str | None = None,
    *,
    now: datetime | None = None,
    proposal_id: str | None = None,
) -> dict:
    """Validate the state, apply the rules and return a proposal dict (JSON-serialisable).

    The ORDER of the sequence depends only on (state, config): `now` and
    `proposal_id` only affect created_at_utc / proposal_id.
    Raises StateValidationError for an invalid state, RuleConfigError for a bad config.
    """
    cfg = resolve_rule_config(config)
    state = validate_state(system_state)
    result = build_schedule(state, cfg)

    health = result.health
    metadata = {
        "uncertain": health.uncertain,
        "uncertainty_reasons": health.uncertainty_reasons,
        "health_considered": health.as_dict(),
        "excluded_orders": [e.as_dict() for e in result.excluded],
        "order_details": [
            {
                "order_id": r.order_id,
                "position": r.rank,
                "order_type": r.order.order_type,
                "priority_tier": r.tier,
                "waiting_seconds": r.waiting,
                "time_remaining_seconds": r.remaining,
                "slack_seconds": r.slack,
                "flags": r.flags,
                "reason": r.reason,
            }
            for r in result.ranked
        ],
        "reference_time_utc": _iso(state.timestamp_utc),
        "config_approval_status": cfg.approval_status,
    }
    proposal = Proposal(
        schema_version=SCHEMA_VERSION,
        agent_id=AGENT_ID,
        agent_type=AGENT_TYPE,
        proposal_id=proposal_id or f"RULE-PROP-{uuid.uuid4().hex[:12].upper()}",
        input_state_id=state.state_id,
        input_state_version=state.state_version,
        schedule=Schedule(order_sequence=result.order_sequence),
        confidence=None,
        rule_config_version=cfg.rule_config_version,
        explanation=build_explanation(result.ranked, result.excluded, health, cfg),
        created_at_utc=_iso(now or datetime.now(timezone.utc)),
        metadata=metadata,
    )
    return proposal.model_dump(mode="json")
