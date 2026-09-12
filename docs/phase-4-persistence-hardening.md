# Phase 4 - Persistent Metadata and Workload Hardening

Phase 4 moves Minecraft Cloud from a Docker-only prototype toward a small platform control plane with persistent metadata and safer workload lifecycle behavior.

## Goals

- Store Minecraft server metadata in PostgreSQL.
- Keep Docker as the runtime layer while PostgreSQL becomes the platform metadata source of truth.
- Reconcile managed Docker containers back into PostgreSQL after backend restarts.
- Surface missing containers instead of silently dropping server records.
- Improve Docker resource and lifecycle safety.

## Metadata Model

The backend automatically creates a `minecraft_servers` table at startup.

Stored fields include:

- server UUID
- display name
- Docker container ID and name
- published Minecraft port
- Minecraft version
- memory allocation
- CPU allocation
- max players
- Docker volume name
- lifecycle status
- last reconciliation error
- created and updated timestamps

## Reconciliation

At backend startup, the control plane scans Docker containers labeled as Minecraft Cloud workloads and upserts their metadata into PostgreSQL.

The same reconciliation runs before the server list is returned. If PostgreSQL contains a server record but its managed Docker container no longer exists, the record is retained and marked as `missing`.

This avoids treating Docker's current container list as the only durable source of platform state.

## Workload Hardening

Dynamic Minecraft containers now include:

- CPU limits
- memory limits with JVM headroom
- PID limit
- `no-new-privileges`
- bounded Docker JSON logs
- graceful stop timeout
- `unless-stopped` restart policy
- persistent named volume for `/data`

Port allocation now checks published ports from all local Docker containers, not only Minecraft Cloud containers, reducing accidental host-port conflicts.

Container creation also performs best-effort rollback. If container creation or startup fails, the backend attempts to remove the partial container and its newly-created volume.

## Local PostgreSQL

Start the development database from the project root:

```powershell
docker compose --env-file .env -f deploy/compose/platform.compose.yml up -d postgres
```

Check it:

```powershell
docker compose --env-file .env -f deploy/compose/platform.compose.yml ps postgres
```

Prepare backend environment variables if needed:

```powershell
Copy-Item .env.example .env
```

Then run the API:

```powershell
cd backend
npm install
npm run dev
```

The backend initializes the schema automatically.

## Health Check

`GET /health` now reports both dependencies:

```json
{
  "status": "ok",
  "docker": "reachable",
  "database": "reachable"
}
```

If Docker or PostgreSQL is unavailable, the API returns a degraded health response.

## Phase Boundary

Phase 4 intentionally does not create the complete application deployment stack. PostgreSQL has a small development Compose file only. Phase 5 will combine frontend, backend, PostgreSQL, reverse proxy, and related platform services into the main Docker Compose deployment.


