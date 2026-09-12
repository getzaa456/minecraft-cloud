# Project Scope

## Problem Statement

Provide a small web-based control plane that can create and manage Minecraft server containers on a Docker host.

The project is a portfolio project, not a public hosting business. Architectural decisions therefore prioritize clarity, automation, observability, and demonstrable DevOps practices over large-scale feature coverage.

## MVP User Story

A user opens the dashboard, creates a Minecraft server with a small set of configuration options, and can then start, stop, restart, or delete it. The server world persists across container restarts/re-creation, and basic resource/status information is visible.

## MVP Capabilities

- Create one or more Minecraft server instances.
- Assign each instance a unique identifier and host port.
- Start, stop, restart, and delete an instance.
- Persist world data with Docker volumes.
- Store platform metadata in PostgreSQL.
- Set CPU and memory limits.
- Show basic server/container status.
- Deploy the platform through Docker Compose.
- Automate CI/CD through GitHub Actions.
- Configure the host with Ansible.
- Collect infrastructure/container metrics with Prometheus.
- Visualize metrics in Grafana.

## Non-Goals for MVP

- Payments or subscriptions
- Production-grade public multi-tenancy
- Kubernetes
- Multi-host scheduling
- Multi-region deployment
- Autoscaling
- Mod/plugin marketplace
- Browser terminal
- FTP/file manager
- OAuth/social login
- Email workflows
- Scheduled backup system
- Advanced Minecraft networking/proxy clusters

## Success Criteria

Phase 10 is considered successful when the repository demonstrates the complete path below:

```text
Infrastructure as Code
        ->
Configured Docker Host
        ->
Automated Application Deployment
        ->
Web-Controlled Minecraft Containers
        ->
Persistent Data + Resource Limits
        ->
Metrics + Dashboard
```

The final system should be easy to demonstrate locally or on one small Linux VM and easy to explain in a DevOps internship interview.

