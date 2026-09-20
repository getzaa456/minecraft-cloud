import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config.js';
import { pingDatabase } from './db/database.js';
import { errorHandler, notFoundHandler } from './middleware/errors.js';
import { metricsHandler, metricsMiddleware } from './middleware/metrics.js';
import serversRouter from './routes/servers.js';
import { pingDocker } from './services/docker.js';

export const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(
  cors({
    origin: config.corsOrigin,
  }),
);
app.use(express.json({ limit: '32kb' }));
app.use(morgan('dev'));
app.use(metricsMiddleware);

app.get('/metrics', metricsHandler);

app.get('/health', async (_req, res) => {
  const health = {
    status: 'ok',
    docker: 'reachable',
    database: 'reachable',
  };

  try {
    await pingDocker();
  } catch {
    health.status = 'degraded';
    health.docker = 'unreachable';
  }

  try {
    await pingDatabase();
  } catch {
    health.status = 'degraded';
    health.database = 'unreachable';
  }

  res.status(health.status === 'ok' ? 200 : 503).json(health);
});

app.use('/api/servers', serversRouter);
app.use(notFoundHandler);
app.use(errorHandler);
