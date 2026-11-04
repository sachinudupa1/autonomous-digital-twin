# Team Allocation and Ownership

## 1. Project ownership

The project is developed by five teammates in one shared GitHub repository.

The project owner coordinates the shared folder structure, integration, shared contracts and overall project progress.

The `team-work/` directory is used for planning, daily reports, task evidence and handovers. Actual implementation belongs in the central source-code folders.

## 2. Teammate 1 - Project Owner

**Git branch:** `feature/t1-websites-twin`

Responsibilities:

1. Customer Website - `apps/customer-website/`
2. Machine Health Controls Website - `apps/health-controls/`
3. Project/Digital Twin Dashboard - `apps/dashboard/`
4. Firestore structure and ownership - `database/`
5. Digital Twin simulation - `digital-twin/`
6. Production 3D Model - `3d-models/production-model/`
7. Digital Twin 3D Model - `3d-models/digital-twin-model/`
8. Animation and browser viewer.
9. Overall integration of all five teammates' components.

The project owner coordinates the final shared contracts, system architecture and integration.

## 3. Teammate 2 - Reinforcement Learning and Baselines

**Git branch:** `feature/t2-rl-baselines`

Responsibilities:

1. Reinforcement Learning Agent - `agents/reinforcement-learning/`
2. FIFO baseline.
3. EDD baseline.
4. SJF baseline.
5. Priority Orders First baseline.
6. Least Slack Time First baseline.
7. Review and verify the interfaces of all three scheduling agents.
8. Record RL and baseline experiments and results.

## 4. Teammate 3 - Backend and Machine Learning

**Git branch:** `feature/t3-backend-ml`

Responsibilities:

1. FastAPI backend - `backend/`
2. Machine Learning Agent - `agents/machine-learning/`
3. Firebase Admin SDK integration in the backend.
4. Backend persistence and database communication.
5. Backend and agent integration.
6. Backend deployment configuration.
7. Backend and ML testing and documentation.

The backend owns server-side Firestore integration and persistence.

## 5. Teammate 4 - Main Agent and Decision Logging

**Git branch:** `feature/t4-main-agent-logs`

Responsibilities:

1. Main Agent - `agents/main-agent/`
2. Proposal validation.
3. Decision scoring and comparison.
4. Failure handling and fallback decisions.
5. Individual-agent error logging.
6. Main-Agent decision logging.
7. Decision explanations and reports.
8. Main Agent testing and documentation.

The Main Agent is an importable Python package. It receives the Digital Twin evaluator through callback or dependency injection.

Teammate 4 does not directly connect the Main Agent to CoppeliaSim or Firestore.

Teammate 4 owns the logging schemas and logic. Teammate 3's backend is responsible for persistence through FastAPI.

## 6. Teammate 5 - Synthetic Machine Health and Rule-Based Agent

**Git branch:** `feature/t5-rule-health-data`

Responsibilities:

1. Temperature data generator.
2. Vibration data generator.
3. Operating-duration data generator.
4. Controlled synthetic scenario generator.
5. Machine-health calculation and classifications.
6. Manual input validation and processing.
7. Rule-Based Agent - `agents/rule-based/`
8. Scheduling rules.
9. Rule-Based Agent proposal interface.
10. Testing and documentation.

The generator must distinguish manual, synthetic and calculated data.

Teammate 5 does not own the health-controls website, backend, database, Digital Twin, 3D models or overall integration.

## 7. Shared ownership boundaries

| Component | Primary owner |
|---|---|
| Customer Website | Teammate 1 |
| Health Controls Website | Teammate 1 |
| Project Dashboard | Teammate 1 |
| Firestore structure | Teammate 1 |
| Digital Twin | Teammate 1 |
| Production and Digital Twin 3D models | Teammate 1 |
| RL Agent and five baselines | Teammate 2 |
| FastAPI backend | Teammate 3 |
| ML Agent | Teammate 3 |
| Backend Firestore Admin SDK integration | Teammate 3 |
| Main Agent and decision logs | Teammate 4 |
| Synthetic health data and Rule-Based Agent | Teammate 5 |
| Shared contracts and overall integration | Teammate 1 coordinates |

## 8. Git collaboration

Each teammate develops on their assigned feature branch.

The `main` branch is the shared integration branch.

The project owner manages repository structure and coordinates integration. Completed feature branches should be reviewed before merging into `main`.

Do not commit:
- Real environment files.
- Firebase service-account credentials.
- Passwords, API secrets or tokens.
- Local virtual environments or `node_modules/`.

## 9. Progress reporting

Each teammate maintains:

- Task-specific README files in their workspace.
- Dated daily reports in `team-work/teammate-X/daily-reports/`.
- Handover notes in `team-work/teammate-X/handover/`.

Daily status cutoff: 9:00 PM IST.
Team status meeting: 9:15 PM IST.

Reports should state completed work, files changed, tests performed, results, blockers and next tasks.
