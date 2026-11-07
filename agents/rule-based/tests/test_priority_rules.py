from rules_helpers import order, propose, seq

T = "2026-11-03T{}Z"


def test_single_rush_order():
    assert seq(propose([order("R", "rush", deadline=T.format("13:00:00"))])) == ["R"]


def test_rush_before_normal():
    p = propose([order("N1"), order("R", "rush", deadline=T.format("14:00:00")), order("N2")])
    assert seq(p)[0] == "R"


def test_rush_orders_by_earlier_deadline():
    p = propose([order("R1", "rush", deadline=T.format("15:00:00")), order("R2", "rush", deadline=T.format("13:00:00")),
                 order("R3", "rush", deadline=T.format("14:00:00"))])
    assert seq(p) == ["R2", "R3", "R1"]


def test_rush_without_deadline_flagged_and_after_rush_with_deadline():
    p = propose([order("RN", "rush"), order("RD", "rush", deadline=T.format("14:00:00"))])
    assert seq(p) == ["RD", "RN"]
    flags = {d["order_id"]: d["flags"] for d in p["metadata"]["order_details"]}
    assert "rush_missing_deadline" in flags["RN"]


def test_rush_with_missing_estimate_flagged_not_dropped():
    p = propose([order("R", "rush", deadline=T.format("14:00:00"), est=None)])
    assert "no_processing_estimate" in p["metadata"]["order_details"][0]["flags"] and seq(p) == ["R"]


def test_rush_with_negative_slack_flagged_but_kept():
    p = propose([order("R", "rush", deadline=T.format("12:10:00"), est=3600)])
    assert "negative_slack_deadline_at_risk" in p["metadata"]["order_details"][0]["flags"] and seq(p) == ["R"]


def test_earlier_deadline_first_for_normal_orders():
    p = propose([order("A", deadline=T.format("16:00:00")), order("B", deadline=T.format("14:00:00"))])
    assert seq(p) == ["B", "A"]


def test_orders_with_deadline_before_orders_without():
    assert seq(propose([order("A"), order("B", deadline=T.format("20:00:00"))])) == ["B", "A"]


def test_equal_deadlines_fall_back_to_waiting_time():
    p = propose([order("A", created="2026-11-03T11:55:00Z", deadline=T.format("14:00:00")),
                 order("B", created="2026-11-03T11:00:00Z", deadline=T.format("14:00:00"))])
    assert seq(p) == ["B", "A"]


def test_deadline_already_passed_is_most_urgent_and_flagged():
    p = propose([order("A", deadline=T.format("13:00:00")), order("P", created="2026-11-03T09:00:00Z", deadline=T.format("11:00:00"))])
    assert seq(p)[0] == "P" and "deadline_passed" in p["metadata"]["order_details"][0]["flags"]


def test_timezone_aware_offsets_are_converted():
    # 14:00+02:00 == 12:00Z (earlier) vs 13:00Z
    p = propose([order("A", deadline="2026-11-03T13:00:00+00:00"), order("B", deadline="2026-11-03T14:00:00+02:00")])
    assert seq(p) == ["B", "A"]


def test_least_slack_beats_less_remaining_time():
    # A: 2h left, 110 min work -> slack 10 min.   B: 1.5h left, 10 min work -> slack 80 min
    p = propose([order("B", deadline=T.format("13:30:00"), est=600), order("A", deadline=T.format("14:00:00"), est=6600)])
    assert seq(p) == ["A", "B"]


def test_estimate_available_ranks_ahead_of_missing_estimate_with_same_tier():
    p = propose([order("A", deadline=T.format("13:00:00"), est=None), order("B", deadline=T.format("15:00:00"), est=60)])
    assert seq(p) == ["B", "A"]


def test_short_wait_vs_long_wait_normal_orders():
    p = propose([order("New", created="2026-11-03T11:59:00Z"), order("Old", created="2026-11-03T11:00:00Z")])
    assert seq(p) == ["Old", "New"]


def test_equal_waiting_uses_arrival_then_id():
    same = dict(created="2026-11-03T11:00:00Z")
    p = propose([order("B", **same), order("A", **same)])
    assert seq(p) == ["A", "B"]


def test_starvation_promotion_lets_old_normal_order_compete_with_rush():
    old = order("Old", created="2026-11-03T08:00:00Z", deadline=T.format("12:20:00"))
    rush = order("R", "rush", created="2026-11-03T11:55:00Z", deadline=T.format("13:00:00"))
    assert seq(propose([rush, old])) == ["Old", "R"]   # promoted + earlier deadline


def test_normal_order_below_threshold_not_promoted():
    p = propose([order("N", created="2026-11-03T11:00:00Z", deadline=T.format("12:20:00")),
                 order("R", "rush", deadline=T.format("13:00:00"))])
    assert seq(p) == ["R", "N"]
