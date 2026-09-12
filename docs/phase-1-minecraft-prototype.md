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

## Files

- `deploy/compose/minecraft-prototype.compose.yml` - standalone prototype workload.
- `deploy/compose/.env.prototype.example` - safe local configuration template.

## Design

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
Copy-Item deploy/compose/.env.prototype.example deploy/compose/.env.prototype
```

Review the values in `.env.prototype`. The default prototype uses one CPU and limits the container to 1536 MB while assigning 1 GB to the Minecraft JVM.

## Start the prototype

```powershell
docker compose --env-file deploy/compose/.env.prototype -f deploy/compose/minecraft-prototype.compose.yml up -d
```

The first startup can take longer because Docker must pull the image and Minecraft must create the initial world.

## Check status

```powershell
docker compose -f deploy/compose/minecraft-prototype.compose.yml ps
```

Follow the server logs:

```powershell
docker compose -f deploy/compose/minecraft-prototype.compose.yml logs -f minecraft
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
docker compose -f deploy/compose/minecraft-prototype.compose.yml stop minecraft
docker compose -f deploy/compose/minecraft-prototype.compose.yml start minecraft
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
docker compose -f deploy/compose/minecraft-prototype.compose.yml down
```

To intentionally reset the prototype world as well:

```powershell
docker compose -f deploy/compose/minecraft-prototype.compose.yml down -v
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

