import type { Router } from 'express';
import type { ModuleId } from '@x/shared';

export interface ModuleContext {
  log: (msg: string, meta?: Record<string, unknown>) => void;
}

export interface XModule {
  id: ModuleId;
  version: string;
  registerRoutes(router: Router, ctx: ModuleContext): void | Promise<void>;
  onInstall?(orgId: string, ctx: ModuleContext): Promise<void>;
  onUninstall?(orgId: string, ctx: ModuleContext): Promise<void>;
}

export function defineModule(mod: XModule): XModule {
  return mod;
}

export type { ModuleId };
