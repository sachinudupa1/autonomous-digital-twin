"""Shared helpers for rule-agent tests (plain module, no fixtures)."""
import copy
from datetime import datetime, timezone

from packaging_rules import generate_rule_based_proposal

NOW = datetime(2026, 11, 3, 12, 0, 0, tzinfo=timezone.utc)
STATE_TS = "2026-11-03T12:00:00Z"
HEALTHY = {"overall_availability": "available", "health_category": "normal", "health_score": 90}


def order(oid, otype="normal", created="2026-11-03T11:50:00Z", deadline=None, est=None,
          q=(1, 1, 0, 0), status="queued", **extra):
    d = {
        "order_id": oid, "order_type": otype,
        "items": dict(zip(["ball_1", "ball_2", "ball_3", "ball_4"], q)),
        "total_quantity": sum(q), "created_at_utc": created,
        "requested_deadline_utc": deadline, "status": status,
        "estimated_processing_seconds": est,
    }
    d.update(extra)
    return d


def state(orders, health=HEALTHY, **extra):
    s = {"schema_version": "1.0", "state_id": "STATE-001", "state_version": 3,
         "timestamp_utc": STATE_TS, "orders": orders,
         "machine_health_summary": copy.deepcopy(health), "resource_state": {}, "constraints": {}}
    s.update(extra)
    return s


def propose(orders, health=HEALTHY, config=None, **extra):
    return generate_rule_based_proposal(state(orders, health, **extra), config, now=NOW, proposal_id="RULE-PROP-TEST")


def seq(p):
    return p["schedule"]["order_sequence"]


def excluded(p):
    return {e["order_id"]: e["reason"] for e in p["metadata"]["excluded_orders"]}


def cfg_dict(**overrides):
    """Default config as a dict with nested overrides, e.g. cfg_dict(rules={'rush_priority_enabled': False})."""
    from packaging_rules.config import load_rule_config
    base = load_rule_config().model_dump()
    for k, v in overrides.items():
        base[k].update(v) if isinstance(v, dict) else base.__setitem__(k, v)
    return base
