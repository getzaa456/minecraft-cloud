import 'dotenv/config';

const numberFromEnv = (name, fallback) => {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isFinite(value)) {
    throw new Error(`${name} must be a valid number`);
  }
  return value;
};

export const config = {
  host: process.env.BACKEND_HOST ?? '0.0.0.0',
  port: numberFromEnv('BACKEND_PORT', 8000),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
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
