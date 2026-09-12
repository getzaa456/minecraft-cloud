import dotenv from 'dotenv';

// Load the single project-level environment file when running the backend directly.
dotenv.config({ path: new URL('../../.env', import.meta.url) });

const numberFromEnv = (name, fallback) => {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isFinite(value)) {
    throw new Error(`${name} must be a valid number`);
  }
  return value;
};

const postgresDb = process.env.POSTGRES_DB ?? 'minecraft_cloud';
const postgresUser = process.env.POSTGRES_USER ?? 'minecraft_cloud';
const postgresPassword = process.env.POSTGRES_PASSWORD ?? 'change-me';

export const config = {
  host: process.env.BACKEND_HOST ?? '0.0.0.0',
  port: numberFromEnv('BACKEND_PORT', 8000),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  databaseUrl:
    process.env.DATABASE_URL ??
    `postgresql://${postgresUser}:${postgresPassword}@localhost:5432/${postgresDb}`,
  dockerHost: process.env.DOCKER_HOST ?? null,
  dockerSocketPath:
    process.env.DOCKER_SOCKET_PATH ??
    (process.platform === 'win32' ? '//./pipe/docker_engine' : '/var/run/docker.sock'),
  minecraft: {
    image: process.env.MINECRAFT_IMAGE ?? 'itzg/minecraft-server:stable',
    portRangeStart: numberFromEnv('MINECRAFT_PORT_RANGE_START', 25565),
    portRangeEnd: numberFromEnv('MINECRAFT_PORT_RANGE_END', 25665),
    defaultMemoryMb: numberFromEnv('MINECRAFT_DEFAULT_MEMORY_MB', 1024),
    defaultCpu: numberFromEnv('MINECRAFT_DEFAULT_CPU', 1),
    maxMemoryMb: numberFromEnv('MINECRAFT_MAX_MEMORY_MB', 4096),
    maxCpu: numberFromEnv('MINECRAFT_MAX_CPU', 2),
    defaultMaxPlayers: numberFromEnv('MINECRAFT_DEFAULT_MAX_PLAYERS', 10),
  },
};
