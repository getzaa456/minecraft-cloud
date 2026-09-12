import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config.js';
import { errorHandler, notFoundHandler } from './middleware/errors.js';
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

app.get('/health', async (_req, res) => {
  try {
    await pingDocker();
    res.json({ status: 'ok', docker: 'reachable' });
  } catch {
    res.status(503).json({ status: 'degraded', docker: 'unreachable' });
  }
});

app.use('/api/servers', serversRouter);
app.use(notFoundHandler);
app.use(errorHandler);
