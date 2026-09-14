# Architecture

## Purpose

Minecraft Cloud is a single-host self-service game-server platform designed to demonstrate DevOps and Platform Engineering concepts with a deliberately small operational scope.

## Core Design Principle

The application is split into two types of workloads:

1. **Platform services** - frontend, backend, database, reverse proxy, and observability components.
2. **Minecraft workloads** - game-server containers created dynamically by the backend through the Docker API.

Minecraft workloads are intentionally not declared as fixed Docker Compose services because their lifecycle is controlled by users through the platform.

## Control Flow

```text
User
  |
  v
Web Dashboard
  |
  v
Backend API
  |
  +----> PostgreSQL (metadata)
  |
  +----> Docker Engine
             |
             +----> Minecraft Container
                        |
                        +----> Persistent Volume
```

## Deployment Flow

```text
Developer
   |
   v
GitHub
   |
   v
GitHub Actions CI
   |
   +----> test / lint
   +----> validate Compose
   |
   v
Build + push images to GHCR
   |
   v
Self-hosted GitHub Actions runner
(on the production Linux VM)
   |
   +----> pull sha-tagged images
   +----> render runtime .env from GitHub Environment values
   +----> docker compose up -d --no-build
```

The production VM and GitHub self-hosted runner are prepared manually. GitHub Actions owns application delivery after the host is ready.

## Observability

```text
Node Exporter ----+
cAdvisor ----------+--> Prometheus --> Grafana
Backend metrics ---+
```

Monitoring focuses on host health and per-container resource usage. Centralized log aggregation is optional and is not part of the MVP.

## Security Boundaries

- The browser never receives access to the Docker socket.
- Only the backend is allowed to perform Docker lifecycle operations.
- Minecraft containers receive bounded CPU and memory resources.
- Runtime secrets must be supplied through environment variables or GitHub Environment secrets, not committed to Git.
- Persistent world data is stored separately from disposable containers.
- Production deployment uses commit-specific `sha-*` container image tags.

## Initial Deployment Model

The MVP targets a **single Linux host**. This is intentional: it keeps the architecture understandable while still demonstrating container orchestration, CI/CD, automated delivery, and monitoring.
