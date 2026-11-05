# Packaging Master Agent

## Project
Autonomous Multi-Agent Decision Twin for Dynamic Packaging Scheduling.

## Owner
Teammate 4 - Shravya.

## Purpose
The Main Agent evaluates scheduling proposals from the
Rule-Based, ML and RL scheduling agents.

It will eventually use Digital Twin evaluation results,
hard constraints, agent reliability and previous mistakes
to select a suitable schedule.

## Technology
- Python 3.13
- Pydantic
- PyYAML
- pytest
- Git and GitHub

## Package Structure
Source code is located inside:

src/packaging_master/

## Main Modules
- schemas: Data structures.
- validation: Proposal and constraint validation.
- evaluation: Scoring and comparison.
- reliability: Historical performance.
- decision: Decision engine and fallback.
- reporting: Decision explanations.
- logging: Error and decision logging.
- interfaces: External component interfaces.

## Database
Firestore persistence is handled by the shared backend.
This package does not connect directly to Firestore.

## Current Status
Initial package structure created.
Implementation is in progress.

## Dependencies
- Teammate 1: Digital Twin and shared architecture.
- Teammate 2: RL Agent and interface review.
- Teammate 3: Backend, ML Agent and log persistence.
- Teammate 5: Rule-Based Agent.