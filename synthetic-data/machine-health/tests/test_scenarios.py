import copy

import pytest

from conftest_helpers import FIXED_NOW, cfg
from packaging_health import HealthValidationError, generate_health_scenario, generate_health_sequence
from packaging_health.schemas.scenarios import SCENARIO_TYPES


def scores(seq):
    return [r["health_result"]["health_score"] for r in seq]


def test_normal_scenario_is_normal():
    for seed in range(20):
        rec = generate_health_scenario("normal", seed=seed)
        assert rec["health_result"]["health_category"] == "normal"
        assert rec["availability"] == "available" and rec["source"] == "synthetic"


def test_increasing_temperature_rises_and_health_drops():
    seq = generate_health_sequence("increasing_temperature", seed=5, steps=5)
    temps = [r["readings"]["temperature"]["value"] for r in seq]
    assert temps[-1] > temps[0] + 10
    assert scores(seq)[-1] < scores(seq)[0]


def test_high_vibration_exceeds_range_and_health_drops():
    seq = generate_health_sequence("high_vibration", seed=5, steps=5)
    assert seq[-1]["readings"]["vibration"]["value"] > cfg()["health_calculation"]["risk_ranges"]["vibration"]["high"]
    assert scores(seq)[-1] < scores(seq)[0]


def test_prolonged_operation_duration_grows():
    seq = generate_health_sequence("prolonged_operation", seed=5, steps=5)
    assert seq[-1]["readings"]["operating_duration"]["value"] > seq[0]["readings"]["operating_duration"]["value"] + 500


def test_degraded_scenario():
    rec = generate_health_scenario("degraded", seed=2)
    assert rec["availability"] == "degraded"
    assert rec["health_result"]["health_category"] in ("abnormal", "warning")


def test_breakdown_scenario_unavailable_and_critical():
    rec = generate_health_scenario("breakdown", seed=2)
    assert rec["availability"] == "unavailable"
    assert rec["health_result"]["health_category"] == "critical"


def test_recovery_returns_to_normal_and_availability():
    seq = generate_health_sequence("recovery", seed=9, steps=6)
    assert scores(seq)[-1] > scores(seq)[0] + 40
    assert seq[0]["availability"] == "degraded" and seq[-1]["availability"] == "available"
    assert seq[-1]["health_result"]["health_category"] == "normal"


def test_custom_ranges_scenario_is_synthetic():
    rec = generate_health_scenario("custom", seed=4, custom={"ranges": {"temperature": {"min": 70, "max": 75}}, "availability": "degraded"})
    assert rec["source"] == "synthetic" and 70 <= rec["readings"]["temperature"]["value"] <= 75
    assert rec["availability"] == "degraded"


def test_custom_requires_parameters():
    with pytest.raises(HealthValidationError):
        generate_health_scenario("custom", seed=1)
    with pytest.raises(HealthValidationError):
        generate_health_scenario("custom", seed=1, custom={"ranges": {"temperature": {"min": 90, "max": 10}}})


def test_unknown_and_disabled_scenarios_rejected():
    with pytest.raises(HealthValidationError, match="Unknown"):
        generate_health_scenario("meltdown", seed=1)
    c = copy.deepcopy(cfg())
    c["scenarios"]["breakdown"]["enabled"] = False
    with pytest.raises(HealthValidationError, match="disabled"):
        generate_health_scenario("breakdown", seed=1, config=c)


def test_bad_seed_and_step_rejected():
    for kw in ({"seed": -1}, {"seed": "a"}, {"seed": 1, "step": -1}):
        with pytest.raises(HealthValidationError):
            generate_health_scenario("normal", **kw)


@pytest.mark.parametrize("scenario", [s for s in SCENARIO_TYPES if s != "custom"])
def test_same_seed_reproducible(scenario):
    a = generate_health_sequence(scenario, seed=42, steps=5, now=FIXED_NOW)
    b = generate_health_sequence(scenario, seed=42, steps=5, now=FIXED_NOW)
    assert a == b


def test_different_seeds_differ():
    a = generate_health_scenario("normal", seed=1)["readings"]
    b = generate_health_scenario("normal", seed=2)["readings"]
    assert a != b


def test_seed_none_is_recorded_and_repeatable():
    first = generate_health_scenario("normal", seed=None, now=FIXED_NOW)
    again = generate_health_scenario("normal", seed=first["random_seed"], now=FIXED_NOW)
    assert first == again


def test_single_step_matches_sequence_step():
    seq = generate_health_sequence("increasing_temperature", seed=8, steps=5, now=FIXED_NOW)
    one = generate_health_scenario("increasing_temperature", seed=8, step=3, total_steps=5, now=FIXED_NOW)
    assert seq[3] == one


def test_record_metadata_present():
    rec = generate_health_scenario("normal", seed=11, now=FIXED_NOW)
    assert rec["scenario_id"] == "SCEN-NORMAL-11-S000" and rec["random_seed"] == 11
    assert rec["generator_version"] == "health-generator-v1"
    assert rec["created_at_utc"] == "2026-11-03T12:00:00Z"
    assert rec["thresholds_status"] == "development_defaults_unapproved"
    assert "machine_id" not in rec


def test_changing_health_during_a_run():
    normal = generate_health_scenario("normal", seed=1)
    rising = generate_health_sequence("increasing_temperature", seed=1, steps=5)
    abnormal = generate_health_scenario("degraded", seed=1)
    assert normal["health_result"]["health_score"] > rising[-1]["health_result"]["health_score"]
    assert abnormal["health_result"]["health_category"] != "normal"
