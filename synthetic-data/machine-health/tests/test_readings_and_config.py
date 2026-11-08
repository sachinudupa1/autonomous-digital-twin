import copy

import pytest

from conftest_helpers import cfg
from packaging_health import ConfigError, load_config
from packaging_health.config import validate_config
from packaging_health.generators.operating_duration import generate_operating_duration
from packaging_health.generators.temperature import generate_temperature_reading
from packaging_health.generators.vibration import generate_vibration_reading
import numpy as np


def test_temperature_generated_with_unit_and_range():
    r = generate_temperature_reading(np.random.default_rng(1), 35, 45, "C")
    assert r["unit"] == "C" and 35 <= r["value"] <= 45


def test_vibration_generated_with_unit_and_range():
    r = generate_vibration_reading(np.random.default_rng(1), 1, 3)
    assert r["unit"] == "configured_unit" and 1 <= r["value"] <= 3


def test_operating_duration_generated_with_unit_and_range():
    r = generate_operating_duration(np.random.default_rng(1), 30, 300)
    assert r["unit"] == "minutes" and 30 <= r["value"] <= 300


def test_invalid_generation_range_rejected():
    with pytest.raises(ValueError):
        generate_temperature_reading(np.random.default_rng(1), 50, 40)


def test_default_config_loads_and_is_marked_unapproved():
    c = load_config()
    assert c["approval_status"] == "development_defaults_unapproved"


def test_null_weight_rejected():
    c = copy.deepcopy(cfg())
    c["health_calculation"]["weights"]["temperature"] = None
    with pytest.raises(ConfigError):
        validate_config(c)


def test_weights_must_sum_to_one():
    c = copy.deepcopy(cfg())
    c["health_calculation"]["weights"]["temperature"] = 0.9
    with pytest.raises(ConfigError, match="sum to 1"):
        validate_config(c)


def test_category_minimums_must_decrease():
    c = copy.deepcopy(cfg())
    c["health_calculation"]["categories"]["warning"]["minimum"] = 90
    with pytest.raises(ConfigError):
        validate_config(c)


def test_risk_range_low_must_be_below_high():
    c = copy.deepcopy(cfg())
    c["health_calculation"]["risk_ranges"]["vibration"] = {"low": 5, "high": 5}
    with pytest.raises(ConfigError):
        validate_config(c)
