# Phase 1 - Minecraft Docker Prototype

## Goal

Validate the Minecraft workload independently before connecting it to the Node.js + Express control plane.

This phase proves that a Minecraft server can:

- run in an isolated Docker container;
- expose the standard Minecraft port;
- keep world data in persistent storage;
- enforce CPU and memory limits;
- be stopped and started without losing world data;
- expose logs and basic runtime state for troubleshooting.

## Historical Prototype`r`n`r`nPhase 1 originally used a standalone Compose prototype to validate the Minecraft workload. Those temporary Compose files were removed after Phase 5 consolidated deployment into `deploy/compose/platform.compose.yml`.`r`n`r`nThe validated concepts from Phase 1 remain in the current platform: persistent `/data` volumes, resource limits, graceful shutdown, and containerized Minecraft workloads.`r`n`r`n## Design

```text
Minecraft client
      |
      | TCP 25565
      v
Docker host
      |
      v
minecraft-cloud-prototype
      |
      v
minecraft-cloud-prototype-data
```

The named volume is intentionally independent from the container lifecycle. Recreating the container therefore does not recreate the Minecraft world.

## Local setup

From the repository root, create a local environment file:

```powershell
Use the Phase 5 deployment environment template: `deploy/compose/.env.platform.example`
```

Review the values in `.env.prototype`. The default prototype uses one CPU and limits the container to 1536 MB while assigning 1 GB to the Minecraft JVM.

## Start the prototype

```powershell
docker compose --env-file deploy/compose/.env.platform -f deploy/compose/platform.compose.yml up -d
```

The first startup can take longer because Docker must pull the image and Minecraft must create the initial world.

## Check status

```powershell
docker compose --env-file deploy/compose/.env.platform -f deploy/compose/platform.compose.yml ps
```

Follow the server logs:

```powershell
Use the web dashboard or backend API to create a Minecraft server, then inspect it with `docker ps` / `docker logs <container-name>`
```

Once the server reports that startup is complete, connect a Minecraft Java client to:

```text
localhost:25565
```

If `MINECRAFT_PROTOTYPE_PORT` was changed, use that host port instead.

## Verify persistent world storage

1. Join the server and make a visible change in the world.
2. Stop the container.
3. Start it again.
4. Confirm the same world and change are still present.

Commands:

```powershell
Use the dashboard Stop action for the selected server
Use the dashboard Start action for the selected server
```

The data survives because `/data` is backed by the `minecraft-cloud-prototype-data` named volume.

## Verify resource limits

```powershell
docker stats minecraft-cloud-prototype
```

The container should show the configured CPU and memory limits.

## Stop the prototype

Stop and remove only the container/network while keeping the world volume:

```powershell
docker compose --env-file deploy/compose/.env.platform -f deploy/compose/platform.compose.yml down
```

To intentionally reset the prototype world as well:

```powershell
Do not remove workload volumes unless you intentionally want to delete persisted worlds
```

Only use `-v` when you explicitly want to delete the prototype world.

## Phase 1 completion criteria

Phase 1 is complete when all of the following are demonstrated locally:

- Minecraft server starts successfully.
- Minecraft Java client can connect.
- Container can stop and restart cleanly.
- World data survives container recreation.
- CPU and memory limits are visible in Docker runtime statistics.
- Logs can be inspected for troubleshooting.

## What Phase 1 intentionally does not do

The server is still defined statically in Docker Compose. This is only the workload prototype.

In Phase 2, the Node.js + Express backend will replace this manual lifecycle by creating and controlling Minecraft containers dynamically through Docker Engine while keeping the workload concepts proven here: image, environment, ports, resource limits, and persistent volumes.

