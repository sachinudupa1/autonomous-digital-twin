from rules_helpers import HEALTHY, cfg_dict, order, propose, seq

T = "2026-11-03T{}Z"
ORDERS = [order("A", "rush", deadline=T.format("13:00:00"), est=300), order("B")]


def test_normal_health_no_flags_not_uncertain():
    p = propose(ORDERS)
    assert not p["metadata"]["uncertain"] and p["metadata"]["health_considered"]["flags"] == []


def test_warning_and_abnormal_flag_capacity_and_rush_deadline_risk():
    for cat in ("warning", "abnormal", "critical"):
        p = propose(ORDERS, {"overall_availability": "available", "health_category": cat, "health_score": 40})
        assert f"health_{cat}" in p["metadata"]["health_considered"]["flags"]
        a = [d for d in p["metadata"]["order_details"] if d["order_id"] == "A"][0]
        assert "deadline_at_risk_due_to_health" in a["flags"]
        assert not p["metadata"]["uncertain"]


def test_unavailable_resource_flagged_but_orders_still_sequenced():
    p = propose(ORDERS, {"overall_availability": "unavailable", "health_category": "normal", "health_score": 90})
    assert "capacity_unavailable" in p["metadata"]["health_considered"]["flags"]
    assert sorted(seq(p)) == ["A", "B"]


def test_missing_health_is_uncertain_never_assumed_normal():
    for h in (None, {}):
        p = propose(ORDERS, h)
        assert p["metadata"]["uncertain"] is True
        assert "machine_health_missing" in p["metadata"]["uncertainty_reasons"]
        assert p["metadata"]["health_considered"]["health_category"] is None
        assert "UNCERTAIN" in p["explanation"]


def test_inconsistent_health_is_uncertain():
    for bad in ({"overall_availability": "on_fire", "health_category": "normal"},
                {"overall_availability": "available", "health_category": "meh"},
                {"overall_availability": "available", "health_category": "normal", "health_score": 250},
                {"foo": "bar"}):
        p = propose(ORDERS, bad)
        assert p["metadata"]["uncertain"] is True, bad


def test_incomplete_health_is_uncertain():
    assert propose(ORDERS, {"health_category": "normal"})["metadata"]["uncertain"] is True


def test_health_does_not_change_ordering_without_approved_factor():
    base = seq(propose(ORDERS, HEALTHY))
    for cat in ("warning", "abnormal", "critical"):
        assert seq(propose(ORDERS, {"overall_availability": "degraded", "health_category": cat, "health_score": 20})) == base


def test_approved_slowdown_factor_changes_slack():
    cfg = cfg_dict(health_awareness={"slowdown_factor_by_category": {"normal": None, "warning": 2.0, "abnormal": None, "critical": None}})
    o = [order("A", deadline=T.format("13:00:00"), est=600)]
    p = propose(o, {"overall_availability": "available", "health_category": "warning", "health_score": 70}, config=cfg)
    assert p["metadata"]["order_details"][0]["slack_seconds"] == 3600 - 1200


def test_health_awareness_can_be_disabled():
    cfg = cfg_dict(rules={"health_awareness_enabled": False})
    p = propose(ORDERS, None, config=cfg)
    assert not p["metadata"]["uncertain"] and p["metadata"]["health_considered"]["considered"] is False


def test_no_machine_is_selected_or_assigned():
    p = propose(ORDERS, {"overall_availability": "available", "health_category": "normal", "health_score": 90,
                         "machines": {"M1": {"health_category": "critical"}}})
    text = str(p).lower()
    assert "machine_id" not in text and "assigned_machine" not in text
    assert set(p["schedule"]) == {"order_sequence"}
