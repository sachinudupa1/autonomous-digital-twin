"""Shared helpers for tests (plain module, no fixtures)."""
from datetime import datetime, timezone

from packaging_health import load_config

FIXED_NOW = datetime(2026, 11, 3, 12, 0, 0, tzinfo=timezone.utc)


def cfg():
    return load_config()


def manual_sensor(temp=45, vib=2.0, dur=120, **extra):
    return {
        "source": "manual",
        "mode": "sensor_input",
        "readings": {
            "temperature": {"value": temp, "unit": "C"},
            "vibration": {"value": vib, "unit": "configured_unit"},
        },
        "operating_duration": {"value": dur, "unit": "minutes"},
        **extra,
    }
