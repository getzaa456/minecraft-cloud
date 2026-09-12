# Minecraft Cloud

A small self-service Minecraft server hosting platform built as a DevOps / Platform Engineering portfolio project.

The goal is to let a user create and manage isolated Minecraft server instances from a web dashboard while demonstrating practical DevOps workflows without trying to reproduce the full scope of Aternos.

## Project Goals

- Create, start, stop, restart, and delete Minecraft servers from a web UI.
- Run each Minecraft server as an isolated Docker container.
- Persist Minecraft worlds independently from container lifecycle.
- Apply CPU and memory limits to game-server workloads.
- Store durable platform metadata in PostgreSQL.
- Deploy the platform as a single-host Docker Compose stack.
- Automate application delivery with CI/CD.
- Provision and configure infrastructure using Infrastructure as Code.
- Monitor host and container health with Prometheus and Grafana.

## Stack

| Area | Technology |
| --- | --- |
| Frontend | React + Vite |
| Backend API | Node.js + Express |
| Database | PostgreSQL |
| Runtime | Docker / Docker Compose |
| Reverse Proxy | Caddy |
| Docker Control | Dockerode + Docker Socket Proxy |
| CI/CD | GitHub Actions + GHCR |
| Infrastructure | Terraform |
| Configuration Management | Ansible |
| Monitoring | Prometheus + Grafana + cAdvisor + Node Exporter |
| Minecraft Runtime | Dockerized Minecraft server image |

## High-Level Architecture

```text
Browser
   |
   v
Caddy
   |
   +-------------------+
   |                   |
   v                   v
Frontend          Node.js + Express
                        |
                +-------+-------+
                |               |
                v               v
           PostgreSQL    Docker Socket Proxy
                                |
                                v
                           Docker Engine
                                |
                   +------------+------------+
                   |            |            |
                   v            v            v
                 MC #1        MC #2        MC #3
                   |            |            |
                 Volume       Volume       Volume

Node Exporter ----+
cAdvisor ----------+--> Prometheus --> Grafana
Backend metrics ---+
```

The browser never talks directly to Docker. Minecraft lifecycle operations are owned by the backend control plane, which reaches Docker through an internal Docker socket proxy.

## Repository Structure

```text
minecraft-cloud/
├── backend/                # Node.js + Express control-plane API
├── frontend/               # React + Vite web dashboard
├── deploy/
│   └── compose/            # Production Docker Compose deployment
├── infra/
│   ├── terraform/          # Infrastructure provisioning
│   └── ansible/            # Host configuration
├── monitoring/
│   ├── prometheus/         # Prometheus configuration
│   └── grafana/            # Grafana provisioning and dashboards
├── scripts/                # Local/dev/ops helper scripts
├── docs/                   # Architecture and phase documentation
├── .github/
│   └── workflows/          # CI/CD pipelines
├── .env.example
├── .gitignore
└── README.md
```

## Project Phases

- **Phase 0** - Architecture and repository structure ✅
- **Phase 1** - Minecraft Docker prototype ✅
- **Phase 2** - Node.js + Express server-management API ✅
- **Phase 3** - React web dashboard ✅
- **Phase 4** - PostgreSQL metadata persistence and workload hardening ✅
- **Phase 5** - Single-host Docker Compose deployment ✅
- **Phase 6** - CI/CD with GitHub Actions
- **Phase 7** - Terraform infrastructure
- **Phase 8** - Ansible configuration management
- **Phase 9** - Prometheus and Grafana monitoring
- **Phase 10** - Security hardening and documentation

## Current Platform Capabilities

### Minecraft Server Lifecycle

- Create Minecraft servers from the web dashboard.
- List and inspect managed servers.
- Start, stop, and restart servers.
- Delete a server and its associated world volume.
- Allocate Minecraft host ports from a controlled range.
- Persist world data in named Docker volumes.
- Apply configurable CPU and memory limits.

### Control Plane

The backend is implemented with Node.js + Express and uses `dockerode` to manage Docker workloads.

Current backend capabilities include:

- Docker and PostgreSQL health checks.
- Input validation for CPU, memory, Minecraft version, and player count.
- Managed workload discovery using Docker labels.
- PostgreSQL-backed platform metadata.
- Startup reconciliation between PostgreSQL and Docker runtime state.
- Bounded Docker log rotation.
- PID limits and `no-new-privileges` workload hardening.
- Best-effort cleanup when provisioning fails.

See `docs/phase-2-node-express-api.md` and `docs/phase-4-persistence-hardening.md` for details.

### Web Dashboard

The React + Vite dashboard supports:

- Create server.
- Start, stop, restart, and delete actions.
- Server status and connection port display.
- CPU, memory, version, and max-player information.
- Platform health status.
- Automatic server-list refresh.

See `docs/phase-3-web-dashboard.md` for setup and verification.

### Docker Compose Deployment

The current deployment stack includes:

```text
Caddy
Frontend
Backend
PostgreSQL
Docker Socket Proxy
```

Only Caddy publishes an HTTP port to the host. Backend and PostgreSQL are reachable only through the Compose network, while Docker API access is isolated on a dedicated internal network.

See `docs/phase-5-docker-compose-deployment.md` for the deployment runbook.

## Quick Start

Create the platform environment file:

```powershell
Copy-Item .env.example .env
```

Edit `.env` and change the default PostgreSQL password before deployment.

Build and start the platform:

```powershell
docker compose `
  --env-file .env `
  -f deploy/compose/platform.compose.yml `
  up -d --build
```

Then open:

```text
http://localhost
```

Check platform status:

```powershell
docker compose `
  --env-file .env `
  -f deploy/compose/platform.compose.yml `
  ps
```

## MVP Scope

The first complete version is focused on:

- Minecraft server lifecycle management.
- Persistent world storage.
- CPU and memory limits.
- PostgreSQL-backed platform metadata.
- Web-based management.
- Docker Compose deployment.
- CI/CD.
- Infrastructure automation.
- Host and container monitoring.

## Explicitly Out of Scope for the MVP

To keep the project suitable for a student portfolio, the MVP does not include:

- Billing or payments.
- Public multi-tenant hosting.
- Plugin or mod marketplace.
- Kubernetes.
- Multi-region infrastructure.
- Autoscaling.
- Web terminal.
- FTP or full file manager.
- OAuth or social login.
- Scheduled backups.

These can be added later as optional extensions after the core platform is stable.

## Status

**Current phase: Phase 5 - Single-host Docker Compose deployment implemented. Next: Phase 6 CI/CD with GitHub Actions.**




