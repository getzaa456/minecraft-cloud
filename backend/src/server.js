import { app } from './app.js';
import { config } from './config.js';
import { closeDatabase, initDatabase } from './db/database.js';
import { reconcileServers } from './services/serverManager.js';

async function bootstrap() {
  await initDatabase();

  try {
    await reconcileServers();
  } catch (error) {
    console.warn(`Initial Docker reconciliation skipped: ${error.message}`);
  }

  const server = app.listen(config.port, config.host, () => {
    console.log(`Minecraft Cloud API listening on http://${config.host}:${config.port}`);
  });

  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down HTTP server`);
    server.close(async () => {
      await closeDatabase();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((error) => {
  console.error('Failed to start Minecraft Cloud API:', error);
  process.exit(1);
});
