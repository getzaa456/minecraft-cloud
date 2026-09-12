import {
  createServer as createDockerServer,
  deleteServer as deleteDockerServer,
  getServer as getDockerServer,
  listServers as listDockerServers,
  restartServer as restartDockerServer,
  startServer as startDockerServer,
  stopServer as stopDockerServer,
} from './docker.js';
import {
  deleteServerRecord,
  getServerRecord,
  listServerRecords,
  updateServerStatus,
  upsertServerRecord,
} from '../db/serversRepository.js';

const notFound = () => {
  const error = new Error('Minecraft server not found');
  error.statusCode = 404;
  return error;
};

export async function reconcileServers() {
  const runtimeServers = await listDockerServers();
  const runtimeIds = new Set(runtimeServers.map((server) => server.id));

  await Promise.all(runtimeServers.map((server) => upsertServerRecord(server)));

  const records = await listServerRecords();
  await Promise.all(
    records
      .filter((record) => record.containerId && !runtimeIds.has(record.id))
      .map((record) => updateServerStatus(record.id, 'missing', 'Managed Docker container is missing')),
  );
}

export async function listServers() {
  await reconcileServers();
  return listServerRecords();
}

export async function getServer(serverId) {
  const record = await getServerRecord(serverId);
  if (!record) throw notFound();

  try {
    const runtime = await getDockerServer(serverId);
    return upsertServerRecord(runtime);
  } catch (error) {
    if (error.statusCode === 404) {
      return updateServerStatus(serverId, 'missing', 'Managed Docker container is missing');
    }
    throw error;
  }
}

export async function createServer(input) {
  const runtime = await createDockerServer(input);
  try {
    return await upsertServerRecord(runtime);
  } catch (error) {
    try {
      await deleteDockerServer(runtime.id);
    } catch {
      // Best-effort rollback; reconciliation can recover an orphan if cleanup fails.
    }
    throw error;
  }
}

async function runLifecycle(serverId, operation) {
  const record = await getServerRecord(serverId);
  if (!record) throw notFound();

  try {
    const runtime = await operation(serverId);
    return await upsertServerRecord(runtime);
  } catch (error) {
    if (error.statusCode === 404) {
      await updateServerStatus(serverId, 'missing', 'Managed Docker container is missing');
    }
    throw error;
  }
}

export const startServer = (serverId) => runLifecycle(serverId, startDockerServer);
export const stopServer = (serverId) => runLifecycle(serverId, stopDockerServer);
export const restartServer = (serverId) => runLifecycle(serverId, restartDockerServer);

export async function deleteServer(serverId) {
  const record = await getServerRecord(serverId);
  if (!record) throw notFound();

  if (record.status !== 'missing') {
    await deleteDockerServer(serverId);
  }

  await deleteServerRecord(serverId);
  return record;
}
