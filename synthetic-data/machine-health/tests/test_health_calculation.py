import copy

import pytest

from conftest_helpers import cfg
from packaging_health import HealthValidationError, calculate_health, classify_health
from packaging_health.health.normalization import normalize_risk


def R(t, v, d):
    return {
        "temperature": {"value": t, "unit": "C"},
        "vibration": {"value": v, "unit": "configured_unit"},
        "operating_duration": {"value": d, "unit": "minutes"},
    }


def test_normalize_bounds_and_midpoint():
    assert normalize_risk(0, 10, 20) == 0.0
    assert normalize_risk(30, 10, 20) == 1.0
    assert normalize_risk(15, 10, 20) == pytest.approx(0.5)


def test_normalize_invalid_range():
    with pytest.raises(ValueError):
        normalize_risk(1, 5, 5)


def test_temperature_risk_value():
    res = calculate_health(R(60, 2, 240), cfg())  # risk range 40..80 -> 0.5
    assert res["calculation"]["temperature_risk"] == pytest.approx(0.5)


def test_vibration_and_duration_risk_value():
    res = calculate_health(R(40, 6, 600), cfg())  # vib 2..10 -> .5 ; dur 240..960 -> .5
    assert res["calculation"]["vibration_risk"] == pytest.approx(0.5)
    assert res["calculation"]["operating_duration_risk"] == pytest.approx(0.5)


def test_combined_risk_and_score():
    res = calculate_health(R(60, 6, 600), cfg())  # all .5 -> combined .5 -> 50
    assert res["calculation"]["combined_risk"] == pytest.approx(0.5)
    assert res["health_score"] == pytest.approx(50.0)
    assert res["health_category"] == "abnormal"


def test_best_and_worst_cases():
    assert calculate_health(R(10, 0, 0), cfg())["health_score"] == 100
    worst = calculate_health(R(200, 99, 99999), cfg())
    assert worst["health_score"] == 0 and worst["health_category"] == "critical"


def test_score_decreases_when_temperature_rises():
    scores = [calculate_health(R(t, 2, 120), cfg())["health_score"] for t in (40, 50, 60, 70, 80)]
    assert scores == sorted(scores, reverse=True) and scores[0] > scores[-1]


@pytest.mark.parametrize("score,expected", [(100, "normal"), (80, "normal"), (79.99, "warning"), (60, "warning"),
                                            (59.9, "abnormal"), (30, "abnormal"), (29.99, "critical"), (0, "critical")])
def test_classification_boundaries(score, expected):
    assert classify_health(score, cfg()) == expected


def test_classification_rejects_out_of_range():
    for bad in (-1, 101, "x", None, float("nan")):
        with pytest.raises(HealthValidationError):
            classify_health(bad, cfg())


def test_missing_measurement_rejected():
    r = R(40, 2, 100)
    del r["vibration"]
    with pytest.raises(HealthValidationError, match="vibration"):
        calculate_health(r, cfg())


def test_invalid_measurement_rejected():
    r = R(40, 2, 100)
    r["temperature"] = {"value": "hot", "unit": "C"}
    with pytest.raises(HealthValidationError):
        calculate_health(r, cfg())


def test_thresholds_come_from_config():
    c = copy.deepcopy(cfg())
    c["health_calculation"]["risk_ranges"]["temperature"] = {"low": 0, "high": 100}
    assert calculate_health(R(50, 2, 120), c)["calculation"]["temperature_risk"] == pytest.approx(0.5)
