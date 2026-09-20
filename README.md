# Minecraft Cloud

Minecraft Cloud is a small self-service Minecraft server hosting project built for learning DevOps and cloud concepts.

It lets users create and manage Minecraft servers from a web dashboard. Each game server runs in its own Docker container with persistent storage and basic CPU/RAM limits.

## Tech Stack

- React + Vite
- Node.js + Express
- PostgreSQL
- Docker / Docker Compose
- Caddy
- GitHub Actions + GHCR
- Self-hosted GitHub Actions Runner
- Prometheus + Grafana
- Node Exporter + cAdvisor

## What It Does

- Create, start, stop, restart, and delete Minecraft servers.
- Run Minecraft servers as separate Docker containers.
- Keep world data in Docker volumes.
- Store server information in PostgreSQL.
- Apply basic CPU and memory limits.
- Build and publish backend/frontend images with GitHub Actions.
- Deploy updates to an Ubuntu VM using a self-hosted runner.
- Monitor the VM, containers, and backend with Prometheus and Grafana.

## Architecture

```text
Browser
   |
   v
Caddy
   |
   +------> React Frontend
   |
   +------> Node.js Backend
                  |
            +-----+------+
            |            |
            v            v
       PostgreSQL   Docker Socket Proxy
                         |
                         v
                    Docker Engine
                         |
                  Minecraft Containers

Node Exporter -----+
cAdvisor ----------+--> Prometheus --> Grafana
Backend /metrics --+
```

## CI/CD

```text
Push / Pull Request
        |
        v
  GitHub Actions
        |
   Test + Validate
        |
        v
 Build Docker Images
        |
        v
       GHCR
        |
        v
Self-hosted Runner
        |
        v
 Docker Compose Deploy
```

The deployment uses commit-specific Docker image tags so it is easier to see which version is running.

## Run Locally

Create the environment file:

```powershell
Copy-Item .env.example .env
```

Change the default passwords in `.env`, then start the stack:

```powershell
docker compose up -d --build
```

Open:

```text
App:     http://localhost
Grafana: http://localhost:3001
```

## Documentation

- [Architecture](docs/architecture.md)
- [Deployment and CI/CD](docs/deployment.md)
- [Monitoring](docs/monitoring.md)
- [Project Scope](docs/scope.md)

## Project Scope

This is a student project built to practice Docker, CI/CD, Linux deployment, monitoring, and backend/frontend integration.

It is not intended to be a full public hosting platform. Features such as billing, Kubernetes, autoscaling, multi-region deployment, and advanced Minecraft networking are outside the current scope.
