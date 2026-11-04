# Shared API Contract — Version 1

Status: Draft for team review
Base path: /api/v1
Content type: application/json
Timestamp format: ISO 8601 UTC
Schema version: 1

## Architecture

- All three frontend applications communicate with FastAPI.
- FastAPI accesses Firestore through Firebase Admin SDK.
- The local simulation bridge initiates outbound authenticated HTTPS communication with FastAPI.
- Frontend applications must not directly write application data to Firestore.

## Authentication

- Firebase Authentication identifies authenticated frontend users.
- Authenticated API requests use: Authorization: Bearer <Firebase ID token>.
- FastAPI verifies Firebase ID tokens using Firebase Admin SDK.
- Customer order tracking uses a separate tracking token, sent through X-Order-Tracking-Token.
- The bridge uses separate machine-to-machine authentication, not a Firebase user token.
- Never expose service-account credentials to frontend applications.

## Standard error response

{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "A human-readable explanation",
    "details": null
  }
}

HTTP status codes:
- 200: Successful request
- 201: Resource created
- 400: Invalid request
- 401: Authentication required or invalid
- 403: Insufficient permissions
- 404: Resource not found
- 422: Validation error
- 500: Internal server error

## Customer Website

### POST /orders

Creates an order.

Request:

{
  "schema_version": 1,
  "product_quantities": {
    "P1": 2,
    "P2": 1,
    "P3": 0,
    "P4": 3
  },
  "order_type": "normal",
  "requested_deadline": null
}

For rush orders, order_type is "rush" and requested_deadline must contain an ISO 8601 UTC timestamp.

Response:

{
  "order_id": "generated-order-id",
  "tracking_token": "secure-tracking-token",
  "status": "Order Received",
  "created_at": "2026-11-04T12:00:00Z"
}

The backend generates the order ID and tracking token. Store only a hash of the tracking token. Apply appropriate input validation and abuse protection.

### GET /orders/{order_id}

Requires X-Order-Tracking-Token.

Returns:
- order_id
- product_quantities
- order_type
- status
- created_at
- actual_completion_time (only when completed)

Never expose predicted completion times or internal scheduling decisions to customers.

Allowed statuses:
1. Order Received
2. Queued
3. Packing
4. Completed

## Machine Health Controls

All endpoints require authenticated operator access.

- POST /health/readings — submit manually entered readings.
- POST /health/scenarios — request a synthetic health scenario.
- GET /health/latest — retrieve latest readings and classifications.

Every reading identifies its source: manual, synthetic or calculated.

Exact measurement fields and units require Teammate 5's review.

## Dashboard

Requires authenticated dashboard access.

- GET /dashboard/summary — order counts, current scheduling run, scheduling results, latest health information and simulation state.
- GET /scheduling/runs/{run_id} — proposals, evaluation results and final decision.

Detailed payloads require review by Teammates 2 and 4.

## Local Simulation Bridge

The bridge initiates outbound authenticated HTTPS requests.

- GET /bridge/jobs/next — retrieve the next available simulation job.
- POST /bridge/jobs/{job_id}/events — report execution events.

Supported event types:
- started
- progress_updated
- completed
- failed

Exact simulation payloads require coordination with the Digital Twin implementation.

Never expose the local ZeroMQ port to the public internet.

## Common conventions

- Use stable IDs for orders, jobs and scheduling runs.
- Use ISO 8601 UTC timestamps.
- Include schema_version in shared payloads.
- Validate API requests using Pydantic.
- Never expose private credentials.
- Document shared contract changes before implementation.

## Pending team reviews

- Teammate 2: scheduling proposal interface.
- Teammate 3: FastAPI endpoint and backend integration.
- Teammate 4: Main Agent decision and logging payloads.
- Teammate 5: machine-health measurement schema.
- Teammate 1: final contract coordination.
