import json

import pytest

from packaging_rules import RuleConfigError, StateValidationError, generate_rule_based_proposal
from packaging_rules.config import parse_rule_config
from rules_helpers import NOW, STATE_TS, cfg_dict, order, propose, seq, state

T = "2026-11-03T{}Z"
THREE = [order("ORDER-001", est=120), order("ORDER-002", deadline=T.format("16:00:00"), est=120),
         order("ORDER-003", "rush", deadline=T.format("12:30:00"), est=120)]


def test_valid_json_and_required_fields():
    p = propose(THREE)
    json.loads(json.dumps(p))
    for k in ("schema_version", "agent_id", "agent_type", "proposal_id", "input_state_id",
              "input_state_version", "schedule", "confidence", "rule_config_version", "explanation", "created_at_utc"):
        assert k in p
    assert p["agent_id"] == "rule_based_agent" and p["agent_type"] == "rule_based"
    assert p["input_state_id"] == "STATE-001" and p["input_state_version"] == 3
    assert p["confidence"] is None
    assert p["rule_config_version"] == "rules-v1-dev"
    assert p["created_at_utc"] == "2026-11-03T12:00:00Z"


def test_sequence_valid_no_duplicates_no_fabricated_ids():
    s = seq(propose(THREE))
    assert len(s) == len(set(s)) == 3 and set(s) == {"ORDER-001", "ORDER-002", "ORDER-003"}
    assert s[0] == "ORDER-003"


def test_all_valid_eligible_orders_preserved():
    many = [order(f"O{i:02d}", created=f"2026-11-03T11:{i:02d}:00Z") for i in range(30)]
    assert sorted(seq(propose(many))) == sorted(o["order_id"] for o in many)


def test_unique_proposal_ids_by_default():
    ids = {generate_rule_based_proposal(state(THREE), now=NOW)["proposal_id"] for _ in range(5)}
    assert len(ids) == 5 and all(i.startswith("RULE-PROP-") for i in ids)


def test_deterministic_sequence_and_explanation():
    a, b = propose(THREE), propose(list(reversed(THREE)))
    assert seq(a) == seq(b)
    assert a["explanation"] == b["explanation"]


def test_deterministic_over_many_shuffles():
    import random
    orders = [order(f"O{i}", created=f"2026-11-03T11:{i:02d}:00Z", deadline=(T.format(f"1{3 + i % 3}:00:00") if i % 2 else None)) for i in range(8)]
    base = seq(propose(orders))
    for s in range(20):
        random.Random(s).shuffle(orders)
        assert seq(propose(orders)) == base


def test_explanation_matches_ranking():
    p = propose(THREE)
    assert "ORDER-003" in p["explanation"].split("1. ")[1].split("\n")[0]
    for d in p["metadata"]["order_details"]:
        assert d["reason"] in p["explanation"]
    assert "ranked after ORDER-003" in p["explanation"]


def test_explanation_reflects_disabled_rules():
    cfg = cfg_dict(rules={"rush_priority_enabled": False})
    p = propose([order("N", deadline=T.format("12:30:00")), order("R", "rush", deadline=T.format("14:00:00"))], config=cfg)
    assert seq(p) == ["N", "R"] and "rush priority" not in p["explanation"].split("using:")[1].split(";")[0]


def test_invalid_states_rejected():
    good = state(THREE)
    bad_cases = [
        None, [], "x", {},
        {**good, "state_id": ""},
        {**good, "state_version": -1},
        {**good, "timestamp_utc": "2026-11-03T12:00:00"},     # naive
        {**good, "timestamp_utc": "yesterday"},
        {**good, "timestamp_utc": 1700000000},
        {k: v for k, v in good.items() if k != "orders"},
        {**good, "orders": "nope"},
    ]
    for b in bad_cases:
        with pytest.raises(StateValidationError):
            generate_rule_based_proposal(b)


def test_config_validation():
    for bad in (cfg_dict(waiting_time={"starvation_promotion_seconds": -5}),
                cfg_dict(health_awareness={"slowdown_factor_by_category": {"normal": 0.5}}),
                {"rule_config_version": "x"}):
        with pytest.raises(RuleConfigError):
            parse_rule_config(bad)


def test_agent_never_executes_or_assigns_machines():
    p = propose(THREE)
    assert "execute" not in p and "machine" not in json.dumps(p["schedule"])


def test_waiting_seconds_field_overrides_computed_value():
    a = order("A", created="2026-11-03T11:59:00Z", waiting_seconds=9000)
    b = order("B", created="2026-11-03T11:00:00Z")
    assert seq(propose([b, a]))[0] == "A"
