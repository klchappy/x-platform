import type { Express, Router } from 'express';
import { Router as makeRouter } from 'express';
import { MODULE_IDS } from '@x/shared';
import damga from '@x/mod-damga';
import lokma from '@x/mod-lokma';
import santral from '@x/mod-santral';
import ticaret from '@x/mod-ticaret';
import { logger } from './lib/logger.js';

const modules = { damga, lokma, santral, ticaret } as const;

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
    app.use(`/v1/modules/${id}`, router);
    logger.info({ id, version: mod.version }, `✓ mounted module`);
  }
}
