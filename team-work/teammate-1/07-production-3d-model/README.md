# Production 3D Model

**Owner:** Teammate 1

**Last updated:** 8 November 2026

## 1. Purpose

Maintain the Production Model's SolidWorks/CoppeliaSim assets and the Python components responsible for simulated production execution.

The Production Model receives the plan selected by the Main Agent and simulates its execution. It does not select proposals or make scheduling decisions.

## 2. Current Status

**Status: Core two-line CoppeliaSim implementation completed and tested.**

Both Production scenes have been created, configured and tested.

| Line | Scene ID | ZeroMQ RPC port | Status |
|---|---|---:|---|
| Line A | `production_line_a` | 23004 | Implemented and tested |
| Line B | `production_line_b` | 23006 | Implemented and tested |

The four CoppeliaSim scenes are maintained under:

- `3d-models/production-model/coppeliasim/line_A.ttt`
- `3d-models/production-model/coppeliasim/line_B.ttt`

The corresponding Digital Twin scenes are maintained under:

- `3d-models/digital-twin-model/coppeliasim/line_A.ttt`
- `3d-models/digital-twin-model/coppeliasim/line_B.ttt`

## 3. Implemented Components

Central implementation location: `digital-twin/`

| Component | Source file | Status |
|---|---|---|
| CoppeliaSim communication | `communication/coppelia_client.py` | Complete |
| Line controller | `simulation-engine/line_controller.py` | Complete |
| Line runner | `simulation-engine/line_runner.py` | Complete |
| Production Coordinator | `production-engine/production_coordinator.py` | Complete |
| Production variation policy | `production-engine/production_variation.py` | Complete |
| Production comparison | `evaluation/production_comparator.py` | Complete |

### 3.1 Production Line Controllers

Each Production line has its own CoppeliaSim scene, Python connection, inventory and box state.

Each clean scene contains 294 available balls per product:

- P1
- P2
- P3
- P4

Both boxes start at `BoxHome`.

The controllers support:

- Product dispensing.
- Conveyor movement.
- Box movement.
- Two-box handoff.
- Inventory tracking.
- Final box return to the starting position.

### 3.2 Production Coordinator

`ProductionCoordinator` accepts a `SelectedProductionPlan` from the integration caller.

The plan contains:

- Plan ID.
- Schedule ID.
- Line A order sequence and operating parameters.
- Line B order sequence and operating parameters.

Before execution, both line schedules are validated, including:

- Order structure.
- Product quantities.
- Operating parameter ranges.
- Available inventory.
- CoppeliaSim stopped state.

Both line schedules are then executed concurrently.

Different production-plan invocations are serialized. Overlapping plan execution is rejected.

### 3.3 Inventory Handling

Inventory is maintained independently for Line A and Line B.

Inventory is not automatically restored between production plans. This allows consecutive plans to consume the remaining available stock within the same running Python process.

The coordinator does not automatically reset a line after a production failure. A failed line is blocked and requires manual recovery.

A fresh clean-scene initialization must be performed deliberately when preparing a new demonstration or test session.

### 3.4 Deterministic Production Variation

`ProductionVariationPolicy` applies small deterministic operating-parameter variations to represent controlled differences between idealized Digital Twin predictions and Production execution.

Current default settings:

| Setting | Value |
|---|---|
| Variation profile | `production-variation-v1` |
| Seed | 2026 |
| Maximum relative variation | 2% |

The effective parameters are generated reproducibly using the plan ID, schedule ID, line ID, parameter name and seed.

Both requested and effective parameters are included in the execution report.

These variations are demonstration assumptions, not experimentally validated industrial measurements or machine-health degradation.

### 3.5 Production vs Digital Twin Comparison

The T1 comparator compares the prediction and actual execution reports for the same schedule.

The comparison includes:

- Order assignments and quantities.
- Total order count.
- Total ball count.
- Total completion time.
- Average order completion time.
- Orders per minute.
- Balls per minute.
- Combined two-line parallel completion time.
- Combined throughput.

The comparator reports actual-minus-predicted differences.

It does not choose proposals, establish acceptance thresholds or make Main Agent decisions.

Machine-health and wear comparisons are not implemented yet.

## 4. CoppeliaSim Operating Requirements

The Production scenes use direct Python kinematic control through their ZeroMQ Remote API connections.

**CoppeliaSim physics simulation must remain stopped during the tested Python-controlled kinematic operations.**

The four scene RPC ports are:

| Scene | Port |
|---|---:|
| Digital Twin Line A | 23000 |
| Digital Twin Line B | 23002 |
| Production Line A | 23004 |
| Production Line B | 23006 |

Never expose these local ZeroMQ ports directly to the public internet.

A future local communication bridge must handle authenticated outbound communication with the backend.

## 5. Live Testing and Demonstration Evidence

The following Production tests have been completed:

- Independent connections to Production Line A and Line B.
- Required object discovery.
- Initial box positions and inventory checks.
- Single-ball dispensing.
- Multi-product dispensing.
- Multiple consecutive orders.
- Two-box conveyor handoff.
- Concurrent two-line execution.
- Sequential production-plan execution.
- Inventory persistence across plans within one Python runtime.
- Deterministic variation reproducibility.
- Production execution using Digital Twin evaluation inputs.

A visual demonstration executed three orders on each Production line.

The corresponding reports are:

- Actual Production results: `experiments/results/three_order_production_actual_001.json`
- Digital Twin prediction: `experiments/digital-twin/three_order_prediction_001.json`
- Comparison report: `experiments/results/three_order_comparison_report_001.json`

The original CoppeliaSim scenes were also reloaded without saving runtime changes and checked for clean initial inventory and ball placement.

## 6. Automated Tests

The overall repository test suite currently contains 96 passing tests.

Relevant test files:

- `tests/integration/test_production_coordinator.py`
- `tests/unit/test_production_variation.py`
- `tests/unit/test_production_comparator.py`

Run:

```powershell
python -m pip install -r requirements-dev.txt
python -m pytest tests/integration/test_production_coordinator.py -v
python -m pytest tests/unit -v
python -m pytest tests -q
```

The automated tests use mock runners for routine testing. They do not require opening CoppeliaSim.

## 7. Dependencies and Remaining Integration Work

The following remain pending:

- Main Agent selected-plan integration with T4.
- Final line-allocation interface.
- Backend production-dispatch API with T3.
- Local Python-to-FastAPI communication bridge.
- Production execution status reporting to the backend.
- Actual completion updates to the Customer Website.
- Firestore persistence through the shared backend.
- Integration of validated machine-health information from T5.
- Health-dependent production parameter modelling, when agreed and validated.
- Full end-to-end testing.

The Production Model must continue to execute only Main-Agent-selected plans.

## 8. Evidence and Handover

Central Python implementation:

`digital-twin/production-engine/`

CoppeliaSim scene files:

`3d-models/production-model/coppeliasim/`

Experiment reports:

- `experiments/digital-twin/three_order_prediction_001.json`
- `experiments/results/three_order_production_actual_001.json`
- `experiments/results/three_order_comparison_report_001.json`

The two-line Production Model and its T1 execution/comparison components are implemented and tested. Backend dispatch, agent integration and full application workflow remain pending.