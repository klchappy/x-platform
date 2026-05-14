import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { logger } from './lib/logger.js';
import { errorHandler } from './middleware/error.js';
import authRoutes from './routes/auth.js';
import healthRoutes from './routes/health.js';
import meRoutes from './routes/me.js';
import orgsRoutes from './routes/orgs.js';
import modulesRoutes from './routes/modules.js';
import platformRoutes from './routes/platform.js';
import aiRoutes from './routes/ai.js';
import billingRoutes from './routes/billing.js';
import invitationsRoutes from './routes/invitations.js';
import iyzicoRoutes from './routes/iyzico.js';
import { mountModules } from './modules-loader.js';

export async function createApp(): Promise<Express> {
  const app = express();

  app.set('trust proxy', 1);
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
    }),
  );

  const corsOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:5200,https://x.deploi.net')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        if (corsOrigins.includes(origin)) return cb(null, true);
        if (origin.endsWith('.deploi.net')) return cb(null, true);
        cb(null, false);
      },
      credentials: true,
    }),
  );

  app.use(express.json({ limit: '2mb' }));
  app.use(cookieParser());
  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/health' } }));

  // v1 API surface
  app.use('/health', healthRoutes);
  app.use('/v1/auth', authRoutes);
  app.use('/v1/me', meRoutes);
  app.use('/v1/orgs', orgsRoutes);
  app.use('/v1/modules', modulesRoutes);
  app.use('/v1/platform', platformRoutes);
  app.use('/v1/ai', aiRoutes);
  app.use('/v1/billing', billingRoutes);
  app.use('/v1/invitations', invitationsRoutes);
  app.use('/v1/iyzico', iyzicoRoutes);

  // Mount per-module routers under /v1/modules/<id>/*
  await mountModules(app);

  app.use(errorHandler);

  return app;
}
