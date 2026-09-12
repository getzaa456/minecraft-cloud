# Minecraft Cloud

A small self-service Minecraft server hosting platform built as a DevOps / Platform Engineering portfolio project.

The goal is to let a user create and manage isolated Minecraft server instances from a web dashboard while demonstrating practical DevOps workflows without trying to reproduce the full scope of Aternos.

## Project Goals

- Create, start, stop, restart, and delete Minecraft servers from a web UI.
- Run each Minecraft server as an isolated Docker container.
- Persist Minecraft worlds independently from container lifecycle.
- Apply CPU and memory limits to game-server workloads.
- Automate application delivery with CI/CD.
- Provision and configure infrastructure using Infrastructure as Code.
- Monitor host and container health with Prometheus and Grafana.

## Planned Stack

| Area | Technology |
| --- | --- |
| Frontend | React + Vite |
| Backend API | Node.js + Express |
| Database | PostgreSQL (later phase) |
| Runtime | Docker / Docker Compose |
| Reverse Proxy | Caddy |
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
Caddy / HTTPS
   |
   +-------------------+
   |                   |
   v                   v
Frontend          Node.js + Express
                        |
                +-------+-------+
                |               |
                v               v
       PostgreSQL (later)   Docker Engine
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

The web application never talks directly to the Docker socket. Docker lifecycle operations are owned by the backend API.

## Repository Structure

```text
minecraft-cloud/
โ”โ”€โ”€ backend/                # Node.js + Express control-plane API
โ”โ”€โ”€ frontend/               # React web dashboard
โ”โ”€โ”€ deploy/
โ”   โ””โ”€โ”€ compose/            # Docker Compose deployment files and Phase 1 prototype
โ”โ”€โ”€ infra/
โ”   โ”โ”€โ”€ terraform/          # Infrastructure provisioning
โ”   โ””โ”€โ”€ ansible/            # Host configuration
โ”โ”€โ”€ monitoring/
โ”   โ”โ”€โ”€ prometheus/         # Prometheus config
โ”   โ””โ”€โ”€ grafana/            # Grafana provisioning and dashboards
โ”โ”€โ”€ scripts/                # Local/dev/ops helper scripts
โ”โ”€โ”€ docs/                   # Architecture and phase documentation
โ”โ”€โ”€ .github/
โ”   โ””โ”€โ”€ workflows/          # CI/CD pipelines
โ”โ”€โ”€ .env.example
โ”โ”€โ”€ .gitignore
โ””โ”€โ”€ README.md
```

## Project Phases

- **Phase 0** - Architecture and repository structure โ…
- **Phase 1** - Minecraft Docker prototype โ…
- **Phase 2** - Node.js + Express server-management API โ…
- **Phase 3** - Web dashboard โ…
- **Phase 4** - Persistent platform metadata and workload hardening ✅
- **Phase 5** - Docker Compose deployment ✅
- **Phase 6** - CI/CD with GitHub Actions
- **Phase 7** - Terraform infrastructure
- **Phase 8** - Ansible configuration management
- **Phase 9** - Prometheus and Grafana monitoring
- **Phase 10** - Security hardening and documentation

## Phase 1 Prototype

Phase 1 provides a standalone Minecraft Java server workload before the backend dynamically manages servers in Phase 2.

Key properties:

- Vanilla Minecraft Java server in Docker.
- Configurable host port and Minecraft version.
- Persistent `/data` storage through a named Docker volume.
- Separate JVM memory and container memory limits.
- CPU limit.
- Bounded Docker log files.
- Graceful shutdown window.

See `docs/phase-1-minecraft-prototype.md` for the local verification procedure.

## Phase 3 Dashboard

Phase 3 adds a responsive React + Vite dashboard for creating and managing Minecraft server instances through the Express control-plane API. It supports list/create/start/stop/restart/delete actions, Docker health status, resource summaries, and server connection details.

See `docs/phase-3-web-dashboard.md` for setup and verification.

## Phase 2 Control Plane

The backend is implemented with Node.js + Express and uses `dockerode` to manage Minecraft workloads through Docker Engine.

Current API capabilities:

- Docker-aware health check.
- Create and automatically start a Minecraft server.
- List managed servers.
- Inspect one server.
- Start, stop, and restart servers.
- Delete a server and its world volume.
- Allocate host ports from a bounded range.
- Validate CPU, memory, Minecraft version, and player-count input.
- Discover managed workloads through Docker labels.

See `docs/phase-2-node-express-api.md` for API usage and local setup.

## MVP Scope

The first complete version will support:

- Create server
- List servers
- Start server
- Stop server
- Restart server
- Delete server
- Persistent world storage
- CPU and memory limits
- Basic server status
- CI/CD
- Infrastructure automation
- Host/container monitoring

## Explicitly Out of Scope for the MVP

To keep this suitable for a student portfolio project, the MVP will not include:

- Billing or payments
- Public multi-tenant hosting
- Plugin/mod marketplace
- Kubernetes
- Multi-region infrastructure
- Autoscaling
- Web terminal
- FTP or full file manager
- OAuth/social login
- Scheduled backups

These can be added later as optional extensions after the core platform is stable.

## Status

**Current phase: Phase 5 - Single-host Docker Compose deployment implemented. Next: Phase 6 CI/CD with GitHub Actions.**


