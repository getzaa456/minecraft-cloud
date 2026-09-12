import Docker from 'dockerode';
import { randomUUID } from 'node:crypto';
import { config } from '../config.js';

const createDockerClient = () => {
  if (config.dockerHost) {
    const endpoint = new URL(config.dockerHost);
    return new Docker({
      protocol: endpoint.protocol.replace(':', ''),
      host: endpoint.hostname,
      port: Number(endpoint.port || 2375),
    });
  }

  return new Docker({ socketPath: config.dockerSocketPath });
};

const docker = createDockerClient();
const MANAGED_LABEL = 'minecraft-cloud.managed';
const SERVER_ID_LABEL = 'minecraft-cloud.server-id';

const toBytes = (mb) => Math.round(mb * 1024 * 1024);
const toNanoCpus = (cpus) => Math.round(cpus * 1_000_000_000);

const sanitizeName = (name) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'server';

const getPublishedPort = (inspect) =>
  Number(inspect.NetworkSettings?.Ports?.['25565/tcp']?.[0]?.HostPort ?? 0) || null;

const getStatus = (inspect) => {
  if (inspect.State?.Running) return 'running';
  if (inspect.State?.Restarting) return 'restarting';
  if (inspect.State?.Paused) return 'paused';
  if (inspect.State?.Dead) return 'dead';
  return 'stopped';
};

const serializeServer = (inspect) => {
  const labels = inspect.Config?.Labels ?? {};
  return {
    id: labels[SERVER_ID_LABEL],
    name: labels['minecraft-cloud.server-name'],
    status: getStatus(inspect),
    containerId: inspect.Id,
    containerName: inspect.Name?.replace(/^\//, ''),
    port: getPublishedPort(inspect),
    version: labels['minecraft-cloud.version'] ?? 'LATEST',
    memoryMb: Number(labels['minecraft-cloud.memory-mb'] ?? 0),
    cpu: Number(labels['minecraft-cloud.cpu'] ?? 0),
    maxPlayers: Number(labels['minecraft-cloud.max-players'] ?? 0),
    volume: labels['minecraft-cloud.volume'],
    createdAt: inspect.Created,
  };
};

async function ensureImage() {
  try {
    await docker.getImage(config.minecraft.image).inspect();
  } catch (error) {
    if (error.statusCode !== 404) throw error;
    const stream = await docker.pull(config.minecraft.image);
    await new Promise((resolve, reject) => {
      docker.modem.followProgress(stream, (progressError) => {
        if (progressError) reject(progressError);
        else resolve();
      });
    });
  }
}

async function getManagedContainers() {
  return docker.listContainers({
    all: true,
    filters: { label: [`${MANAGED_LABEL}=true`] },
  });
}

async function allocatePort() {
  const containers = await docker.listContainers({ all: true });
  const usedPorts = new Set(
    containers.flatMap((container) =>
      (container.Ports ?? [])
        .filter((port) => port.PublicPort)
        .map((port) => port.PublicPort),
    ),
  );

  for (let port = config.minecraft.portRangeStart; port <= config.minecraft.portRangeEnd; port += 1) {
    if (!usedPorts.has(port)) return port;
  }

  const error = new Error('No Minecraft ports are available in the configured range');
  error.statusCode = 503;
  throw error;
}

async function findContainerByServerId(serverId) {
  const containers = await docker.listContainers({
    all: true,
    filters: { label: [`${SERVER_ID_LABEL}=${serverId}`, `${MANAGED_LABEL}=true`] },
  });

  if (containers.length === 0) {
    const error = new Error('Minecraft server not found');
    error.statusCode = 404;
    throw error;
  }

  return docker.getContainer(containers[0].Id);
}

export async function pingDocker() {
  await docker.ping();
}

export async function listServers() {
  const containers = await getManagedContainers();
  const inspected = await Promise.all(containers.map((item) => docker.getContainer(item.Id).inspect()));
  return inspected.map(serializeServer);
}

export async function getServer(serverId) {
  const container = await findContainerByServerId(serverId);
  return serializeServer(await container.inspect());
}

export async function createServer({ name, version, memoryMb, cpu, maxPlayers }) {
  await ensureImage();

  const serverId = randomUUID();
  const shortId = serverId.slice(0, 8);
  const port = await allocatePort();
  const volumeName = `minecraft-cloud-${shortId}-data`;
  const containerName = `mc-${sanitizeName(name)}-${shortId}`;
  let container;

  await docker.createVolume({
    Name: volumeName,
    Labels: {
      [MANAGED_LABEL]: 'true',
      [SERVER_ID_LABEL]: serverId,
    },
  });

  try {
    container = await docker.createContainer({
      Image: config.minecraft.image,
      name: containerName,
      Labels: {
        [MANAGED_LABEL]: 'true',
        [SERVER_ID_LABEL]: serverId,
        'minecraft-cloud.server-name': name,
        'minecraft-cloud.version': version,
        'minecraft-cloud.memory-mb': String(memoryMb),
        'minecraft-cloud.cpu': String(cpu),
        'minecraft-cloud.max-players': String(maxPlayers),
        'minecraft-cloud.volume': volumeName,
      },
      Env: [
        'EULA=TRUE',
        'TYPE=VANILLA',
        `VERSION=${version}`,
        `MEMORY=${memoryMb}M`,
        `MAX_PLAYERS=${maxPlayers}`,
        `MOTD=${name}`,
        'ENABLE_RCON=false',
      ],
      ExposedPorts: { '25565/tcp': {} },
      HostConfig: {
        PortBindings: {
          '25565/tcp': [{ HostPort: String(port) }],
        },
        Mounts: [
          {
            Type: 'volume',
            Source: volumeName,
            Target: '/data',
          },
        ],
        Memory: toBytes(memoryMb + 512),
        NanoCpus: toNanoCpus(cpu),
        PidsLimit: 512,
        RestartPolicy: { Name: 'unless-stopped' },
        SecurityOpt: ['no-new-privileges:true'],
        LogConfig: {
          Type: 'json-file',
          Config: { 'max-size': '10m', 'max-file': '3' },
        },
      },
      StopTimeout: 60,
    });

    await container.start();
    return serializeServer(await container.inspect());
  } catch (error) {
    if (container) {
      try {
        await container.remove({ force: true });
      } catch {
        // Best-effort cleanup continues with the volume.
      }
    }
    try {
      await docker.getVolume(volumeName).remove();
    } catch {
      // Reconciliation can surface leftovers if cleanup cannot complete.
    }
    throw error;
  }
}

export async function startServer(serverId) {
  const container = await findContainerByServerId(serverId);
  const inspect = await container.inspect();
  if (!inspect.State.Running) await container.start();
  return serializeServer(await container.inspect());
}

export async function stopServer(serverId) {
  const container = await findContainerByServerId(serverId);
  const inspect = await container.inspect();
  if (inspect.State.Running) await container.stop({ t: 60 });
  return serializeServer(await container.inspect());
}

export async function restartServer(serverId) {
  const container = await findContainerByServerId(serverId);
  await container.restart({ t: 60 });
  return serializeServer(await container.inspect());
}

export async function deleteServer(serverId) {
  const container = await findContainerByServerId(serverId);
  const inspect = await container.inspect();
  const server = serializeServer(inspect);

  if (inspect.State.Running) await container.stop({ t: 60 });
  await container.remove();

  if (server.volume) {
    try {
      await docker.getVolume(server.volume).remove();
    } catch (error) {
      if (error.statusCode !== 404) throw error;
    }
  }

  return server;
}
