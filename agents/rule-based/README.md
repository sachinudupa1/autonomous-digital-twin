# packaging_rules – Rule-Based Scheduling Agent

Deterministic, explainable **proposal generator**: given a system-state snapshot it returns an ordered list of
Order IDs. It does not execute schedules, does not select machines, and returns `confidence: null`
(a rule engine has no calibrated confidence). It is one combined, configurable heuristic – not a copy of the five
baselines owned by Teammate 2.

> Configuration values are DEVELOPMENT DEFAULTS pending approval by Teammate 1 (`configs/rule_config.yaml`).

## Install & test (Windows, from repo root)
```
python -m pip install -r agents/rule-based/requirements.txt
python -m pip install -e agents/rule-based
python -m pytest agents/rule-based/tests/ -v
```

## Public API
```python
from packaging_rules import generate_rule_based_proposal, StateValidationError, RuleConfigError

proposal = generate_rule_based_proposal(system_state, config=None, *, now=None, proposal_id=None)  # -> dict
```
Raises `StateValidationError` (`.errors`) for an invalid state. The **sequence depends only on (state, config)**;
`now` / `proposal_id` affect only `created_at_utc` / `proposal_id`. Time-to-deadline and waiting time are measured
against the state's own `timestamp_utc`.

## Rule hierarchy (strict lexicographic – no invented weights)
1. **Eligibility** – statuses not in `eligible_statuses`, invalid orders, duplicates, orders outside
   `constraints.scheduling_window_order_ids` (optional, assumption) or dated after the snapshot are excluded **and reported**
   in `metadata.excluded_orders` with a reason.
2. **Priority tier** – rush orders, plus normal orders that waited ≥ `starvation_promotion_seconds` (anti-starvation).
3. Orders **with a deadline** before those without.
4. **Least slack** (= time remaining − estimated processing) where an estimate exists; estimates are never invented.
   Orders with an estimate rank ahead of those without (fallback = time remaining).
5. **Least time remaining**.
6. Tie-breakers: earlier deadline, longer waiting, earlier arrival, **Order ID** (always last ⇒ deterministic).

Rush feasibility is *checked and flagged* (`rush_missing_deadline`, `deadline_passed`, `no_processing_estimate`,
`negative_slack_deadline_at_risk`) – flagged orders are kept, never dropped.

## Health awareness
Reads only `machine_health_summary` (illustrative fields: `overall_availability`, `health_category`, `health_score`).
Missing/inconsistent/incomplete → `metadata.uncertain = true` (never assumed "normal"). Degraded/unavailable/warning+ →
flags (`capacity_unavailable`, `health_abnormal`, `deadline_at_risk_due_to_health`, …). **Ordering is not changed by
health** unless an approved `slowdown_factor_by_category` is configured (default `null`), which scales processing
estimates in the slack calculation. No machine is chosen or mapped.

## Input (see `examples/system_state_example.json`)
`state_id`, `state_version`, `timestamp_utc` (timezone-aware), `orders[]` (`order_id`, `order_type` normal|rush,
`items.ball_1..4` 0–5, `total_quantity` ≤ 20 and equal to the sum, `created_at_utc`, `requested_deadline_utc|null`,
`status`, `estimated_processing_seconds|null`, optional `waiting_seconds`), `machine_health_summary`,
`resource_state`, `constraints`. Naive timestamps are rejected.

## Output (see `examples/proposal_example.json`)
Top-level contract fields: `schema_version, agent_id ("rule_based_agent"), agent_type ("rule_based"), proposal_id,
input_state_id, input_state_version, schedule.order_sequence, confidence (null), rule_config_version, explanation,
created_at_utc`. Rule-specific extras are under `metadata` (`uncertain`, `uncertainty_reasons`, `excluded_orders`,
`order_details`, `health_considered`, `reference_time_utc`, `config_approval_status`) – **the `metadata` object is an addition
to approve with Teammates 1/2/4**. The `explanation` is generated from the same sort-key components used for ranking.

## Known limitations / open items
Final state & proposal schemas; health-summary field names; whether rush orders with passed deadlines should be demoted
(currently kept and flagged); promotion threshold value; `scheduling_window_order_ids` convention.
