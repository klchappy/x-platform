import type { Express, Router, RequestHandler } from 'express';
import { Router as makeRouter } from 'express';
import { eq } from 'drizzle-orm';
import { getDb } from '@x/db/client';
import { users } from '@x/db/schema';
import { MODULE_IDS, type ModuleId } from '@x/shared';
import damga from '@x/mod-damga';
import santral from '@x/mod-santral';
import sayman from '@x/mod-sayman';
import etik from '@x/mod-etik';
import envanter from '@x/mod-envanter';
import lokma from '@x/mod-lokma';
import { logger } from './lib/logger.js';
import { verifyJwt } from './lib/jwt.js';

const modules: Record<ModuleId, typeof damga> = {
  damga,
  santral,
  sayman,
  etik,
  envanter,
  lokma,
};

/**
 * Optional auth: if a valid bearer/cookie/demo token is present, set
 * req.authUser/authOrgId/authUserId. If not, just call next() so public
 * endpoints (e.g. /health) still work. withTenant() inside modules will
 * enforce its own 403 if context is missing.
 */
const optionalAuth: RequestHandler = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;
    const bearer = header?.startsWith('Bearer ') ? header.slice(7) : null;
    const cookieToken = (req.cookies?.['x_session'] as string | undefined) ?? null;
    const token = bearer ?? cookieToken;

    if (token) {
      const claims = verifyJwt(token);
      if (claims) {
        const u = await getDb().query.users.findFirst({ where: eq(users.id, claims.sub) });
        if (u && u.isActive) {
          (req as any).authUser = u;
          (req as any).authOrgId = u.orgId;
          (req as any).authUserId = u.id;
        }
      }
    } else if (process.env.ALLOW_DEMO_AUTH === '1') {
      const demoEmail = req.headers['x-demo-user'];
      if (typeof demoEmail === 'string') {
        const u = await getDb().query.users.findFirst({ where: eq(users.email, demoEmail) });
        if (u) {
          (req as any).authUser = u;
          (req as any).authOrgId = u.orgId;
          (req as any).authUserId = u.id;
        }
      }
    }
    next();
  } catch (err) {
    next(err);
  }
};

export async function mountModules(app: Express): Promise<void> {
  for (const id of MODULE_IDS) {
    const mod = modules[id];
    if (!mod) {
      logger.warn({ id }, 'module not bundled');
      continue;
    }
    const router: Router = makeRouter();
    await mod.registerRoutes(router, {
      log: (msg, meta) => logger.info({ module: id, ...meta }, msg),
    });
    app.use(`/v1/modules/${id}`, optionalAuth, router);
    logger.info({ id, version: mod.version }, `✓ mounted module`);
  }
}
