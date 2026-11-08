# Autonomous Multi-Agent Decision Twin for Dynamic Packaging Scheduling

An AI-powered packaging scheduling and Digital Twin project developed by a five-member student team.

The system combines three scheduling agents, a Main Agent, a Digital Twin simulation, a simulated packaging production line, machine-health condition data and three web applications.

## Project objectives

- Accept customer packaging orders through a website.
- Generate scheduling proposals using Rule-Based, Machine Learning and Reinforcement Learning agents.
- Compare candidate schedules through a Digital Twin simulation.
- Let the Main Agent evaluate proposals and select the final schedule.
- Simulate execution of the selected schedule in a separate Production Model.
- Monitor and display machine-health conditions using clearly labelled manual, synthetic and calculated data.
- Display project activity and simulation state through a dashboard.

This is a software simulation and visualization project. It does not control physical production equipment or use physical machine sensors.

## Project architecture

The project contains:

1. Customer Website - customer order submission and order tracking.
2. Machine Health Controls - manual readings and synthetic condition controls.
3. Project/Digital Twin Dashboard - project information, scheduling results and 3D visualization.
4. FastAPI Backend - central API and integration layer.
5. Three Scheduling Agents - Rule-Based, ML and RL.
6. Main Agent - validates and evaluates proposals and selects the final schedule.
7. Digital Twin - evaluates candidate schedules.
8. Production Model - simulates execution of the selected schedule.
9. Digital Twin 3D Model - represents the simulated system for candidate evaluation and visualization.

The Digital Twin evaluates candidate schedules; the Main Agent makes the final scheduling decision.

See [System Architecture](docs/architecture/system-architecture.md).

## Customer order requirements

- Four product types: Ball 1, Ball 2, Ball 3 and Ball 4.
- Each product type has a distinct colour.
- Quantity per product type: 0 to 5.
- Total order quantity: at least 1 and at most 20.
- Customers can submit normal or rush orders.
- Rush orders require a requested deadline.
- The backend generates a unique Order ID.
- Customer-facing tracking stages are Order Received, Queued, Packing and Completed.
- Customers must not see predicted completion times or delay estimates.
- Actual completion time is displayed only after completion.

## Technology stack

| Area | Technology |
|---|---|
| Frontend | React, JavaScript, Vite, Tailwind CSS |
| Frontend charts | Recharts |
| Browser 3D viewer | Three.js |
| Backend | Python, FastAPI, Uvicorn, Pydantic |
| Database and authentication | Firebase Cloud Firestore, Firebase Authentication |
| ML | scikit-learn, Pandas, NumPy |
| RL | Gymnasium, Stable-Baselines3, PyTorch |
| 3D modelling | SolidWorks |
| Simulation | CoppeliaSim Edu, ZeroMQ Remote API |
| Testing | pytest, Postman |
| Version control | Git and GitHub |
| Hosting plan | Firebase Hosting and Render |

## Repository structure

```text
autonomous-digital-twin/
├── team-work/             # Team planning, daily reports and handovers
├── apps/                  # Three React applications
├── backend/               # FastAPI backend
├── agents/                # Four scheduling-agent packages
├── synthetic-data/        # Machine-health data generation
├── digital-twin/          # Simulation and evaluation
├── 3d-models/              # Production and Digital Twin models
├── shared/                # Shared contracts, schemas and constants
├── database/              # Firestore rules and documentation
├── error-logs/             # Project error-log resources
├── experiments/           # ML, RL, baseline and simulation experiments
├── tests/                 # Unit, integration and end-to-end tests
├── docs/                  # Project documentation
└── scripts/               # Utility scripts
```

The `team-work` directory is for task documentation and evidence. Actual source code belongs in the central directories above.

## Development environment

The initial project standard is:

- Windows 10 or Windows 11.
- Python 3.12.x.
- Node.js 24 LTS and npm.
- Git for Windows.
- Visual Studio Code.
- Firebase CLI.

Use separate Python virtual environments for independently developed Python components.

Detailed installation and execution instructions will be added to `docs/setup/`.

## Git collaboration

The project uses one shared GitHub repository with a separate feature branch for each teammate.

| Owner | Branch |
|---|---|
| Teammate 1 | `feature/t1-websites-twin` |
| Teammate 2 | `feature/t2-rl-baselines` |
| Teammate 3 | `feature/t3-backend-ml` |
| Teammate 4 | `feature/t4-main-agent-logs` |
| Teammate 5 | `feature/t5-rule-health-data` |

The `main` branch is the shared integration branch. Teammates should develop in their assigned feature branches and merge reviewed work through pull requests.

See [Team Allocation](docs/teammate-guides/team-allocation.md).

## Security requirements

- Never commit real `.env` files.
- Never commit Firebase service-account credentials, passwords, private keys or tokens.
- Keep private configuration in local environment variables or approved hosting secrets.
- Do not expose the local CoppeliaSim ZeroMQ port to the public internet.
- The local Python bridge communicates with the cloud backend through authenticated outbound HTTPS requests.

## Current project status

Initial repository and team-workspace setup is in progress.

The project implementation, shared data contracts, integration and testing will be completed in subsequent development stages.

## Team

Five student developers. See the team allocation document for individual responsibilities.
