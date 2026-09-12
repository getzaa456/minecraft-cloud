# Phase 5 - Docker Compose Deployment

Phase 5 packages the Minecraft Cloud control plane into a single-host Docker Compose deployment.

## Services

- **Caddy** - the only public HTTP entrypoint.
- **Frontend** - production React build served by Nginx.
- **Backend** - Node.js + Express control plane.
- **PostgreSQL** - persistent platform metadata.
- **Docker Socket Proxy** - restricted internal bridge between the backend and the host Docker API.

Minecraft game-server containers are still created dynamically by the backend and are not declared as static Compose services.

## Traffic Flow

```text
Browser
  |
  v
Caddy :80
  |-------------------|
  v                   v
Frontend :80       Backend :8000
                      |
                      +--> PostgreSQL :5432
                      |
                      +--> Docker Socket Proxy :2375
                                  |
                                  v
                           Host Docker Engine
                                  |
                         Dynamic MC containers
```

Only Caddy publishes an HTTP port. Frontend, backend, PostgreSQL, and the Docker API proxy are reachable only through internal Docker networks.

Minecraft server ports are dynamically published on the host from the configured range (default `25565-25665`).

## Docker API Isolation

The backend does not mount `/var/run/docker.sock` directly. A dedicated socket-proxy container mounts the host socket and exposes only the Docker API groups required by the project:

- containers
- images
- volumes
- ping/version
- write operations required for lifecycle management

This reduces direct socket exposure, but the backend remains a trusted control-plane component. Any service with Docker write access must still be treated as security-sensitive.

## Local Deployment

Copy the environment template:

```powershell
Copy-Item .env.example .env
```

Review at least `POSTGRES_PASSWORD` before using the stack outside a throwaway local environment.

Validate configuration:

```powershell
docker compose --env-file .env -f deploy/compose/platform.compose.yml config
```

Build and start:

```powershell
docker compose --env-file .env -f deploy/compose/platform.compose.yml up -d --build
```

Open:

```text
http://localhost
```

Check services:

```powershell
docker compose --env-file .env -f deploy/compose/platform.compose.yml ps
```

View logs:

```powershell
docker compose --env-file .env -f deploy/compose/platform.compose.yml logs -f
```

Backend logs only:

```powershell
docker compose --env-file .env -f deploy/compose/platform.compose.yml logs -f backend
```

## Stop / Restart

Stop while keeping persistent data:

```powershell
docker compose --env-file .env -f deploy/compose/platform.compose.yml down
```

Start again:

```powershell
docker compose --env-file .env -f deploy/compose/platform.compose.yml up -d
```

Do not use `down -v` unless you intentionally want to remove Compose-managed PostgreSQL and Caddy volumes.

Minecraft world volumes are created dynamically by the backend and are not declared in this Compose file.

## Development Workflow

The React application now uses same-origin API paths. During local Vite development, `vite.config.js` proxies `/api` and `/health` to `http://localhost:8000`. In the Compose deployment, Caddy performs the equivalent routing.

This keeps the frontend configuration identical between development and deployment and avoids exposing backend port `8000` publicly.

## Phase Boundary

Phase 5 intentionally does not include:

- CI/CD automation (Phase 6)
- Ansible host configuration (Phase 7)
- Prometheus/Grafana monitoring (Phase 8)
- public TLS/domain hardening and broader security review (Phase 9)


