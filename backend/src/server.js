import { app } from './app.js';
import { config } from './config.js';

const server = app.listen(config.port, config.host, () => {
  console.log(`Minecraft Cloud API listening on http://${config.host}:${config.port}`);
});

const shutdown = (signal) => {
  console.log(`${signal} received, shutting down HTTP server`);
  server.close(() => process.exit(0));
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
