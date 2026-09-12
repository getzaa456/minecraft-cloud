import { Router } from 'express';
import { config } from '../config.js';
import {
  createServer,
  deleteServer,
  getServer,
  listServers,
  restartServer,
  startServer,
  stopServer,
} from '../services/docker.js';

const router = Router();

const badRequest = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  throw error;
};

const validateServerId = (serverId) => {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(serverId)) {
    badRequest('Invalid server id');
  }
};

const validateCreateServer = (body = {}) => {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name || name.length > 40 || /[\r\n\0]/.test(name)) {
    badRequest('name is required and must be 1-40 characters without control characters');
  }

  const version = typeof body.version === 'string' ? body.version.trim() : 'LATEST';
  if (!/^[A-Za-z0-9._+-]{1,32}$/.test(version)) {
    badRequest('version contains unsupported characters');
  }

  const memoryMb = body.memoryMb ?? config.minecraft.defaultMemoryMb;
  if (!Number.isInteger(memoryMb) || memoryMb < 512 || memoryMb > config.minecraft.maxMemoryMb) {
    badRequest(`memoryMb must be an integer between 512 and ${config.minecraft.maxMemoryMb}`);
  }

  const cpu = body.cpu ?? config.minecraft.defaultCpu;
  if (typeof cpu !== 'number' || !Number.isFinite(cpu) || cpu < 0.25 || cpu > config.minecraft.maxCpu) {
    badRequest(`cpu must be between 0.25 and ${config.minecraft.maxCpu}`);
  }

  const maxPlayers = body.maxPlayers ?? config.minecraft.defaultMaxPlayers;
  if (!Number.isInteger(maxPlayers) || maxPlayers < 1 || maxPlayers > 100) {
    badRequest('maxPlayers must be an integer between 1 and 100');
  }

  return { name, version, memoryMb, cpu, maxPlayers };
};

router.get('/', async (_req, res) => {
  res.json({ servers: await listServers() });
});

router.post('/', async (req, res) => {
  const server = await createServer(validateCreateServer(req.body));
  res.status(201).json({ server });
});

router.get('/:serverId', async (req, res) => {
  validateServerId(req.params.serverId);
  res.json({ server: await getServer(req.params.serverId) });
});

router.post('/:serverId/start', async (req, res) => {
  validateServerId(req.params.serverId);
  res.json({ server: await startServer(req.params.serverId) });
});

router.post('/:serverId/stop', async (req, res) => {
  validateServerId(req.params.serverId);
  res.json({ server: await stopServer(req.params.serverId) });
});

router.post('/:serverId/restart', async (req, res) => {
  validateServerId(req.params.serverId);
  res.json({ server: await restartServer(req.params.serverId) });
});

router.delete('/:serverId', async (req, res) => {
  validateServerId(req.params.serverId);
  const server = await deleteServer(req.params.serverId);
  res.json({ deleted: true, server });
});

export default router;
