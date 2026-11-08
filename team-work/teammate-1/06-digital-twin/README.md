# Digital Twin Simulation

**Owner:** Teammate 1

**Last updated:** 8 November 2026

## 1. Purpose

Develop and maintain the two-line Digital Twin simulation engine, CoppeliaSim communication, line controllers, state management and candidate schedule evaluation.

The Digital Twin evaluates scheduling proposals and returns simulation results to the Main Agent. It does not select a winning proposal.

## 2. Current Status

**Status: Core implementation completed and tested.**

Both Digital Twin scenes have been created, configured and tested.

| Line | Scene ID | ZeroMQ RPC port | Status |
|---|---|---:|---|
| Line A | `digital_twin_line_a` | 23000 | Implemented and tested |
| Line B | `digital_twin_line_b` | 23002 | Implemented and tested |

Both scenes have independent Python connections, line controllers and state tracking.

## 3. Implemented Components

Central implementation location: `digital-twin/`

| Component | Source file | Status |
|---|---|---|
| CoppeliaSim communication | `communication/coppelia_client.py` | Complete |
| Line controller | `simulation-engine/line_controller.py` | Complete |
| Line runner | `simulation-engine/line_runner.py` | Complete |
| Parameter generator | `simulation-engine/parameter_generator.py` | Complete |
| State Manager | `simulation-engine/state_manager.py` | Complete |
| Schedule Evaluator | `simulation-engine/schedule_evaluator.py` | Complete |
| Multi-Line Evaluator | `simulation-engine/multi_line_evaluator.py` | Complete |

### 3.1 CoppeliaSim Communication

The communication client supports the four project scenes through independent ZeroMQ connections.

For Digital Twin:

- Line A uses port 23000.
- Line B uses port 23002.

The client supports connection, object discovery, object-position access and control, and checks required scene objects.

### 3.2 Line Controllers and Simulation

Each line controller independently manages:

- Product ball inventory.
- Hopper and dispenser objects.
- Conveyor rollers.
- Box positions.
- Ball movement.
- Box handoff.
- Reset to the initial scene state.

Each clean scene contains 294 available balls of each of the four products.

Both boxes must initially be positioned at `BoxHome`.

### 3.3 Line Runner

`LineRunner` executes sequential packaging orders.

The order structure currently used internally is:

```json
{
  "order_id": "ORDER-001",
  "quantities": {
    "P1": 2,
    "P2": 1,
    "P3": 0,
    "P4": 3
  }
}
```

Supported product quantities are 0–5 per product, subject to a total of 1–20 balls per order.

Current operating parameters:

| Parameter | Valid range |
|---|---|
| Upper belt speed | 0.01–0.15 m/s |
| Box speed | 0.01–0.15 m/s |
| Dispenser RPM | 20–200 RPM |
| Settle time | 0–5 seconds |

The runner reports order counts, ball counts, completion time, average order completion time, throughput and remaining stock.

### 3.4 Schedule Evaluator

`ScheduleEvaluator` evaluates candidates sequentially on an individual Digital Twin line.

Before and after each candidate:

- The line is reset.
- The State Manager is refreshed.
- Run information is registered.
- Results or failures are recorded.
- The scene is restored to its initial state.

The State Manager now retains the last failed-run error through cleanup refreshes. A subsequent new run clears the previous error.

### 3.5 Multi-Line Evaluator

`MultiLineEvaluator` coordinates the two independent Digital Twin scenes.

For every candidate:

1. Both line schedules and operating parameters are validated.
2. Line A and Line B are evaluated concurrently.
3. Each line uses its own ScheduleEvaluator.
4. Idle lines are reset and refreshed.
5. Evaluation failures are reported independently.
6. Both line results are returned to the caller.

Different candidates are evaluated sequentially. Individual agent proposals are not merged or ranked by this component.

The returned result identifies the Main Agent as the selection authority.

## 4. CoppeliaSim Operating Requirements

The current Python line controllers use direct kinematic control through the ZeroMQ Remote API.

**CoppeliaSim physics simulation must remain stopped during these operations.**

Do not press Play while performing the tested Python-controlled kinematic operations.

The two Digital Twin scenes have been tested independently and concurrently.

Concurrent Python control of two scenes has been verified. This does not imply simultaneous CoppeliaSim physics-engine execution.

## 5. Testing and Verification

### Live Scene Tests Completed

- Independent connection and required-object discovery for both scenes.
- Initial-state reset.
- Initial box positions at `BoxHome`.
- Product dispensing for P1–P4.
- Single-ball and multi-ball dispensing.
- Consecutive order execution.
- Two-box handoff.
- Inventory restoration after candidate evaluation.
- Independent execution of Line A and Line B.
- Concurrent two-line candidate evaluation.
- Sequential multi-candidate evaluation.
- Failure handling and scene cleanup.

A three-order evaluation was run on each Digital Twin line.

Prediction report:

`experiments/digital-twin/three_order_prediction_001.json`

### Automated Tests

The overall repository test suite currently contains 96 passing tests.

Relevant test files:

- `tests/integration/test_multi_line_evaluator.py`
- `tests/integration/test_schedule_evaluator.py`

Run the following commands from the repository root:

```powershell
python -m pip install -r requirements-dev.txt
python -m pytest tests/integration/test_multi_line_evaluator.py -v
python -m pytest tests/integration/test_schedule_evaluator.py -v
python -m pytest tests -q
```

The automated tests use mocks where appropriate and do not require opening CoppeliaSim.

## 6. Integration Dependencies and Pending Work

The following remain pending:

- Final common agent proposal contract with T4.
- RL and baseline proposal adapter with T2.
- ML proposal integration with T3.
- Main Agent line-allocation interface.
- T5 machine-health calculation integration.
- Validated machine-wear and time-dependent degradation inputs.
- Health-aware operating parameters.
- Local bridge and backend communication with T3.
- Firestore persistence through the central backend.
- Complete end-to-end evaluation with actual agent proposals.

Do not introduce independent machine-to-line mappings or invent unapproved health thresholds.

## 7. Evidence and Handover

Relevant source files are maintained centrally in `digital-twin/`.

Experiment evidence:

- `experiments/digital-twin/three_order_prediction_001.json`
- `experiments/results/three_order_production_actual_001.json`
- `experiments/results/three_order_comparison_report_001.json`

The Digital Twin is implemented and tested as an independent simulation component. Its final integration into the Main Agent and backend workflow remains pending.