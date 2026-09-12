# Phase 2 - Node.js + Express Control Plane

Phase 2 replaces manual Docker lifecycle commands with a backend API that owns Minecraft server provisioning and lifecycle operations.

## Goals

- Expose a small REST API for Minecraft server lifecycle management.
- Keep Docker access behind the backend instead of exposing the Docker socket to the browser.
- Create each Minecraft server as an isolated Docker container.
- Assign a dedicated host port and named volume to each server.
- Apply bounded CPU and memory limits from validated API input.
- Discover platform-managed servers from Docker labels so PostgreSQL is not required yet.

## Backend Stack

- Node.js 20+
- Express 5
- dockerode
- Helmet
- CORS
- Morgan
- dotenv

## Request Flow

```text
Browser / API Client
        |
        v
Node.js + Express
        |
        v
Docker Engine
        |
        +--> mc-survival-xxxxxxxx
        |       +--> host port
        |       +--> CPU / RAM limit
        |       +--> named volume
        |
        +--> mc-creative-xxxxxxxx
                +--> host port
                +--> CPU / RAM limit
                +--> named volume
```

## Server Identity

The API generates a UUID for each server and stores platform metadata as Docker labels.

Important labels include:

- `minecraft-cloud.managed=true`
- `minecraft-cloud.server-id=<uuid>`
- `minecraft-cloud.server-name=<name>`
- `minecraft-cloud.version=<version>`
- `minecraft-cloud.memory-mb=<memory>`
- `minecraft-cloud.cpu=<cpu>`
- `minecraft-cloud.max-players=<count>`
- `minecraft-cloud.volume=<volume-name>`

Only containers with the managed label are listed or controlled by the API.

## API

### Health

`GET /health`

Returns HTTP 200 when Docker is reachable and HTTP 503 when the Docker daemon cannot be reached.

### List servers

`GET /api/servers`

### Create server

`POST /api/servers`

Example body:

```json
{
  "name": "survival",
  "version": "LATEST",
  "memoryMb": 1024,
  "cpu": 1,
  "maxPlayers": 10
}
```

Defaults are taken from environment variables when optional fields are omitted.

### Get server

`GET /api/servers/:serverId`

### Start server

`POST /api/servers/:serverId/start`

### Stop server

`POST /api/servers/:serverId/stop`

### Restart server

`POST /api/servers/:serverId/restart`

### Delete server

`DELETE /api/servers/:serverId`

Deletion removes both the managed container and its named world volume. Normal stop/start/restart operations keep the volume intact.

## Local Setup

From the project root in PowerShell:

```powershell
Copy-Item backend/.env.example backend/.env
cd backend
npm install
npm run check
npm run dev
```

The API listens on port `8000` by default.

Docker Desktop must be running on Windows. The default Windows Docker Engine socket is `//./pipe/docker_engine`.

## Example Test

Health:

```powershell
Invoke-RestMethod http://localhost:8000/health
```

Create a Minecraft server:

```powershell
$body = @{
  name = "survival"
  version = "LATEST"
  memoryMb = 1024
  cpu = 1
  maxPlayers = 10
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri http://localhost:8000/api/servers `
  -ContentType "application/json" `
  -Body $body
```

List servers:

```powershell
Invoke-RestMethod http://localhost:8000/api/servers
```

## Scope Decision

PostgreSQL is intentionally not introduced in Phase 2. Docker is the source of truth for workload state and labels carry enough metadata for the current MVP.

A later phase can add platform-level persistence for users, desired configuration, audit history, and other metadata without changing the Docker control boundary.

## Known MVP Limitations

- One Docker host only.
- No authentication yet.
- No per-user ownership yet.
- No queue for long-running image pulls or server creation.
- No distributed locking for simultaneous provisioning requests.
- No historical state stored outside Docker.

These are intentional scope limits for a student portfolio project.
