# Firestore Database Schema — Version 1

Status: Draft for team review
Database: Cloud Firestore
Owner: Teammate 1
Server-side access: FastAPI using Firebase Admin SDK

## Architecture and access

- Frontend applications communicate with FastAPI.
- FastAPI performs application-data reads and writes through Firebase Admin SDK.
- Firebase Authentication identifies users.
- Deny direct client access to protected application collections by default.
- Backend authorization must be enforced independently; Firebase Admin SDK bypasses Firestore Security Rules.
- Never commit service-account credentials or private environment files.

## Proposed collections

### orders/{order_id}

Purpose: Customer orders and execution status.

Fields:
- schema_version: number
- order_id: string
- product_quantities: map containing P1, P2, P3 and P4 quantities
- order_type: normal or rush
- requested_deadline: timestamp or null
- status: string
- created_at: timestamp
- updated_at: timestamp
- actual_completion_time: timestamp or null
- tracking_token_hash: string

Allowed customer-visible statuses:
- Order Received
- Queued
- Packing
- Completed

Predicted completion information must not be exposed to customers.

### health_readings/{reading_id}

Purpose: Machine-health readings.

Fields:
- schema_version: number
- reading_id: string
- recorded_at: timestamp
- source: manual, synthetic or calculated
- measurements: map
- health_classification: string
- metadata: map

Exact measurement fields and units require Teammate 5's agreement.

### scheduling_runs/{run_id}

Purpose: Track scheduling executions.

Fields:
- schema_version: number
- run_id: string
- created_at: timestamp
- status: string
- order_ids: array
- evaluation_status: string
- selected_schedule_id: string or null

Detailed proposal and evaluation structures require review by Teammates 2 and 4.

### schedules/{schedule_id}

Purpose: Store candidate and selected schedules.

Fields:
- schema_version: number
- schedule_id: string
- run_id: string
- source_agent: string
- schedule_type: string
- assignments: array
- evaluation_results: map
- is_selected: boolean
- created_at: timestamp

Final assignment and evaluation structures require scheduling-team review.

### simulation_runs/{simulation_id}

Purpose: Track production simulation execution.

Fields:
- schema_version: number
- simulation_id: string
- schedule_id: string
- status: string
- started_at: timestamp or null
- completed_at: timestamp or null
- progress: map
- error: map or null
- updated_at: timestamp

Exact progress structure requires Digital Twin coordination.

### decision_logs/{log_id}

Purpose: Main Agent decisions and explanations.

Fields:
- schema_version: number
- log_id: string
- run_id: string
- created_at: timestamp
- decision: map
- explanation: string
- metadata: map

Teammate 4 owns the detailed decision-log schema and logic.

### users/{uid}

Purpose: Application user profiles and roles.

Fields:
- uid: string
- display_name: string
- role: string
- created_at: timestamp
- updated_at: timestamp

Firebase Authentication remains the identity provider. Never store passwords in Firestore.

## Security principles

- Deny direct client access to protected application collections by default.
- Permit only explicitly approved client operations.
- Perform application-data writes through the authenticated backend.
- Verify user identity and authorization on every protected backend operation.
- Keep service-account credentials exclusively on the backend.
- Do not expose internal decision logs or tracking-token hashes to customers.

## Indexes

Create composite indexes when required by actual Firestore queries. Document each index's collection, fields, sort order and query purpose.

## Team ownership

- Teammate 1: Firestore structure, documentation, Authentication configuration and coordination.
- Teammate 3: Firebase Admin SDK, backend Firestore access and persistence.
- Teammate 4: Decision-log schema and logic.
- Teammate 5: Health measurement definitions.
- Teammate 2: Scheduling-agent proposal interface review.

## Pending decisions

1. Health measurement fields and units.
2. Scheduling proposal and evaluation structures.
3. Main Agent decision-log structure.
4. Simulation progress and event structures.
5. Required Firestore queries and indexes.
6. Authentication roles and customer tracking authorization.

This is a proposed database contract. Firebase has not yet been configured.
