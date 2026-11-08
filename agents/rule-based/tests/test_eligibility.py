from rules_helpers import excluded, order, propose, seq


def test_queued_orders_are_scheduled():
    assert sorted(seq(propose([order("A"), order("B")]))) == ["A", "B"]


def test_completed_and_cancelled_excluded_with_reason():
    p = propose([order("A"), order("B", status="completed"), order("C", status="cancelled")])
    assert seq(p) == ["A"]
    assert excluded(p) == {"B": "status_completed", "C": "status_cancelled"}


def test_invalid_order_reported_not_silently_dropped():
    bad = order("X", q=(9, 0, 0, 0))                      # > 5 per ball
    p = propose([order("A"), bad])
    assert seq(p) == ["A"] and excluded(p)["X"] == "invalid_order_data"


def test_total_quantity_mismatch_excluded():
    bad = order("X"); bad["total_quantity"] = 7
    assert excluded(propose([order("A"), bad]))["X"] == "invalid_order_data"


def test_total_of_exactly_20_allowed_but_21_excluded():
    ok = order("OK", q=(5, 5, 5, 5))
    over = order("OVER", q=(5, 5, 5, 5)); over["total_quantity"] = 21
    p = propose([ok, over])
    assert seq(p) == ["OK"] and excluded(p)["OVER"] == "invalid_order_data"


def test_missing_data_excluded():
    p = propose([order("A"), {"order_id": "M"}])
    assert seq(p) == ["A"] and excluded(p)["M"] == "invalid_order_data"


def test_non_object_order_and_missing_id_excluded():
    p = propose([order("A"), "garbage", {"foo": 1}])
    assert seq(p) == ["A"] and len(p["metadata"]["excluded_orders"]) == 2


def test_naive_timestamp_order_excluded():
    p = propose([order("A"), order("N", created="2026-11-03T11:00:00")])
    assert excluded(p)["N"] == "invalid_order_data"


def test_deadline_before_creation_excluded():
    p = propose([order("A"), order("D", created="2026-11-03T11:00:00Z", deadline="2026-11-03T10:00:00Z")])
    assert excluded(p)["D"] == "invalid_order_data"


def test_duplicate_order_ids_kept_once():
    p = propose([order("A"), order("A")])
    assert seq(p) == ["A"] and excluded(p) == {"A": "duplicate_order_id"}


def test_order_created_after_snapshot_excluded():
    p = propose([order("A"), order("F", created="2026-11-03T13:00:00Z")])
    assert excluded(p)["F"] == "created_after_state_timestamp"


def test_scheduling_window_respected():
    p = propose([order("A"), order("B")], constraints={"scheduling_window_order_ids": ["A"]})
    assert seq(p) == ["A"] and excluded(p) == {"B": "outside_scheduling_window"}


def test_empty_queue_gives_empty_valid_proposal():
    p = propose([])
    assert seq(p) == [] and "0 eligible" in p["explanation"]
