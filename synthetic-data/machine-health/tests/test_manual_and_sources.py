import pytest

from conftest_helpers import FIXED_NOW, manual_sensor
from packaging_health import HealthValidationError, generate_health_scenario, process_manual_health_input


def test_manual_sensor_input_processed_and_labelled_manual():
    rec = process_manual_health_input(manual_sensor(), now=FIXED_NOW)
    assert rec["source"] == "manual"
    assert rec["health_source"] == "calculated"
    assert rec["readings"]["temperature"]["value"] == 45
    assert rec["health_result"]["health_category"] == "normal"
    assert rec["created_at_utc"] == "2026-11-03T12:00:00Z"
    assert "machine_id" not in rec


def test_manual_values_not_replaced_by_random():
    a = process_manual_health_input(manual_sensor(temp=51.5))
    b = process_manual_health_input(manual_sensor(temp=51.5))
    assert a["readings"] == b["readings"] and a["readings"]["temperature"]["value"] == 51.5


def test_health_override_preserved_and_labelled():
    rec = process_manual_health_input({"source": "manual", "mode": "health_override", "health_override": 45})
    assert rec["health_result"]["health_score"] == 45
    assert rec["health_source"] == "manual" and rec["source"] == "manual"
    assert rec["health_result"]["calculation"] is None
    assert rec["health_result"]["health_category"] == "abnormal"


def test_flat_payload_shape_accepted():
    p = {"source": "manual", "mode": "sensor_input",
         "temperature": {"value": 45, "unit": "C"},
         "vibration": {"value": 2, "unit": "configured_unit"},
         "operating_duration": {"value": 100, "unit": "minutes"}}
    assert process_manual_health_input(p)["source"] == "manual"


def test_availability_preserved_independent_of_score():
    rec = process_manual_health_input(manual_sensor(availability="unavailable"))
    assert rec["health_result"]["health_category"] == "normal"
    assert rec["availability"] == "unavailable"


@pytest.mark.parametrize("bad", [
    None, [], "x",
    {"source": "manual", "mode": "sensor_input"},                                  # no readings
    {"source": "manual", "mode": "health_override"},                               # no override
    {"source": "manual", "mode": "health_override", "health_override": 101},       # out of range
    {"source": "manual", "mode": "health_override", "health_override": 50,
     "temperature": {"value": 40, "unit": "C"}},                                    # mixed
    {"source": "synthetic", "mode": "health_override", "health_override": 50},     # wrong source
    {"source": "manual", "mode": "other"},
    {"source": "manual", "mode": "health_override", "health_override": 50, "machine_id": "M1"},
])
def test_invalid_payloads_rejected(bad):
    with pytest.raises(HealthValidationError):
        process_manual_health_input(bad)


def test_wrong_unit_rejected():
    p = manual_sensor()
    p["readings"]["temperature"]["unit"] = "F"
    with pytest.raises(HealthValidationError, match="unit"):
        process_manual_health_input(p)


def test_out_of_range_value_rejected():
    with pytest.raises(HealthValidationError, match="outside configured range"):
        process_manual_health_input(manual_sensor(temp=900))


def test_string_value_rejected():
    p = manual_sensor()
    p["readings"]["temperature"]["value"] = "45"
    with pytest.raises(HealthValidationError):
        process_manual_health_input(p)


def test_missing_required_reading_rejected():
    p = manual_sensor()
    del p["readings"]["vibration"]
    with pytest.raises(HealthValidationError, match="vibration"):
        process_manual_health_input(p)


def test_duplicate_reading_rejected():
    p = manual_sensor()
    p["temperature"] = {"value": 40, "unit": "C"}
    with pytest.raises(HealthValidationError, match="twice"):
        process_manual_health_input(p)


def test_synthetic_stays_synthetic_and_calculated_marked_separately():
    rec = generate_health_scenario("normal", seed=1)
    assert rec["source"] == "synthetic" and rec["health_source"] == "calculated"
    # raw readings are not overwritten by the score
    assert "value" in rec["readings"]["temperature"] and rec["readings"]["temperature"] != rec["health_result"]


def test_custom_operator_readings_labelled_manual():
    rec = generate_health_scenario("custom", seed=3, custom={"readings": {
        "temperature": {"value": 50, "unit": "C"}, "vibration": {"value": 3, "unit": "configured_unit"},
        "operating_duration": {"value": 100, "unit": "minutes"}}})
    assert rec["source"] == "manual" and rec["scenario_type"] == "custom"
