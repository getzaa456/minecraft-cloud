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

Only Caddy publishes an HTTP port. Frontend, backend, PostgreSQL, and the Docker API proxy stay on Compose networks.

Minecraft server ports are dynamically published on the host from the configured range (default `25565-25665`).

## Docker API Isolation

The backend does not mount `/var/run/docker.sock` directly. A dedicated socket-proxy container mounts the host socket and exposes only the Docker API groups required by the project:

- containers
- images
- volumes
- ping
- write operations required for lifecycle management

The backend remains a trusted control-plane component because it can still perform Docker write operations through the proxy.

## Local Deployment

Create the environment file:

```powershell
Copy-Item .env.example .env
```

Review at least `POSTGRES_PASSWORD` before using the stack outside a throwaway local environment.

Validate configuration:

```powershell
docker compose config
```

Build and start:

```powershell
docker compose up -d --build
```

Open:

```text
http://localhost
```

Check services:

```powershell
docker compose ps
```

View logs:

```powershell
docker compose logs -f
```

Backend logs only:

```powershell
docker compose logs -f backend
```

## Stop / Restart

Stop while keeping persistent data:

```powershell
docker compose down
```

Start again:

```powershell
docker compose up -d
```

Do not use `down -v` unless you intentionally want to remove Compose-managed persistent data.

Minecraft world volumes are created dynamically by the backend and are not declared in this Compose file.

## Local vs Production Images

The root `docker-compose.yml` defines both `build` and `image` for backend and frontend.

For local development, the default image names are used and `--build` builds from local source.

For production, Phase 6 writes GHCR image references into `.env` through:

```text
BACKEND_IMAGE=ghcr.io/<owner>/minecraft-cloud-backend:sha-<commit>
FRONTEND_IMAGE=ghcr.io/<owner>/minecraft-cloud-frontend:sha-<commit>
```

The self-hosted runner then pulls and starts those images with `--no-build`.

## Development Workflow

The React application uses same-origin API paths. During local Vite development, `vite.config.js` proxies `/api` and `/health` to `http://localhost:8000`. In the Compose deployment, Caddy performs the equivalent routing.

This keeps the frontend configuration consistent and avoids exposing backend port `8000` publicly.

## Phase Boundary

Phase 5 intentionally does not include:

- CI/CD and production deployment automation (Phase 6)
- Prometheus/Grafana monitoring (Phase 7)
- public TLS/domain hardening and broader security review (Phase 8)
