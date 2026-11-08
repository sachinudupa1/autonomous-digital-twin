# packaging_health – Synthetic Machine-Health Data Generator

Python module (no server, no database, no website) that the backend imports to
create, validate and score **synthetic or manually entered** machine-health
conditions. Nothing here comes from physical sensors.

> **All thresholds, weights and ranges are DEVELOPMENT DEFAULTS (assumptions).**
> They are not manufacturer specs or industrial safety limits. Teammate 1 must
> approve them (`configs/health_config.yaml`, `approval_status`). Every record
> carries `thresholds_status` so this is visible downstream.

## Install & test (Windows, from repo root)
```
py -3.12 -m venv synthetic-data\machine-health\.venv
synthetic-data\machine-health\.venv\Scripts\activate.bat
python -m pip install --upgrade pip
python -m pip install -r synthetic-data/machine-health/requirements.txt
python -m pip install -e synthetic-data/machine-health
python -m pytest synthetic-data/machine-health/tests/ -v
```

## Public API
```python
from packaging_health import (
    process_manual_health_input,   # (payload, config=None, *, now=None, record_id=None) -> dict
    generate_health_scenario,      # (scenario_type, seed=None, config=None, *, step=0, total_steps=None, custom=None, now=None) -> dict
    generate_health_sequence,      # (scenario_type, seed=None, config=None, *, steps=None, custom=None, now=None) -> list[dict]
    calculate_health,              # (readings, config=None) -> {health_score, health_category, calculation}
    classify_health,               # (score, config=None) -> "normal"|"warning"|"abnormal"|"critical"
    load_config, HealthValidationError, ConfigError,
)
```
`config` may be `None` (default YAML), a path, or a dict. Invalid input raises
`HealthValidationError` (`.errors` = list of readable messages).

## Scenarios (`generate_health_scenario`)
`normal`, `increasing_temperature`, `high_vibration`, `prolonged_operation`,
`degraded` (availability `degraded`), `breakdown` (availability `unavailable`),
`recovery` (readings return to the normal range; availability returns to `available`
at `availability_recovered_at`), `custom`.
Use `generate_health_sequence` for a time series (Time 0 … Time N), or call
`generate_health_scenario(..., step=i, total_steps=n)` once per operator action.
`custom`: `{"readings": {...}}` or `{"health_override": n}` → treated as operator input (`source="manual"`);
`{"ranges": {"temperature": {"min":..,"max":..}}, "availability": ...}` → synthetic readings.

**Reproducibility:** same `scenario_type` + `seed` + config (+ `step`/`total_steps`) → identical readings and
`scenario_id` (`SCEN-<TYPE>-<seed>-S<step>`). `seed=None` picks a random seed and records it in `random_seed`.
Only `created_at_utc` differs between runs unless you pass `now=`.

## Input modes (manual)
Sensor mode (nested or flat readings both accepted – final shape to be agreed with Teammate 1):
```json
{"source":"manual","mode":"sensor_input",
 "readings":{"temperature":{"value":45,"unit":"C"},"vibration":{"value":2.0,"unit":"configured_unit"}},
 "operating_duration":{"value":120,"unit":"minutes"},"availability":"available"}
```
Override mode: `{"source":"manual","mode":"health_override","health_override":45}`.
Rejected: wrong source/mode, mixed modes, missing required reading, wrong unit, out-of-range, string/boolean values,
unknown fields (e.g. `machine_id` – there is **no machine selection**; the Digital Twin maps machines).

## Output record
See `examples/` and `/shared/contracts/health_record_example.json`.
```json
{"schema_version":"1.0","scenario_id":"SCEN-NORMAL-42-S000","source":"synthetic","health_source":"calculated",
 "mode":"sensor_input","readings":{"temperature":{"value":42.74,"unit":"C"},"vibration":{"value":1.878,"unit":"configured_unit"},"operating_duration":{"value":261.8,"unit":"minutes"}},
 "health_result":{"health_score":95.97,"health_category":"normal","calculation":{"temperature_risk":0.0685,"vibration_risk":0.0,"operating_duration_risk":0.0303,"combined_risk":0.0403,"weights":{},"formula":"..."}},
 "availability":"available","scenario_type":"normal","random_seed":42,"step":0,
 "generator_version":"health-generator-v1","config_version":"health-config-dev-1",
 "thresholds_status":"development_defaults_unapproved","created_at_utc":"2026-11-03T12:00:00Z"}
```
| Field | Meaning |
|---|---|
| `source` | `manual` (operator) or `synthetic` (generated) – never changed by processing |
| `health_source` | `calculated` (from readings) or `manual` (operator override) |
| `availability` | `available` / `degraded` / `unavailable` – **independent of the score** (a score of 90 can be `unavailable`) |
| `readings` | raw readings, never overwritten by the score (`null` in override mode) |

## Units
temperature `C`; vibration `configured_unit` (**not yet approved** – do not assume a physical unit); operating duration `minutes`.

## Health calculation (illustrative, configurable)
`risk_i = clamp((value − low_i) / (high_i − low_i), 0, 1)` ; `combined = Σ weight_i · risk_i` ; `score = 100 · (1 − combined)`.

| Assumption (dev default) | Value |
|---|---|
| risk range temperature (low→high) | 40 → 80 °C |
| risk range vibration | 2 → 10 configured_unit |
| risk range operating duration | 240 → 960 min |
| weights temperature / vibration / duration | 0.5 / 0.3 / 0.2 |
| categories (score ≥) | normal 80, warning 60, abnormal 30, critical 0 |

## Known limitations / open items for approval
Vibration unit; final thresholds/weights; final manual-input field names (nested vs flat); whether `custom` operator readings
should be labelled `manual` (current choice); config path assumes an editable install (`pip install -e`).
