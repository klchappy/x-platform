import type { Router, Request, Response, NextFunction, RequestHandler } from 'express';
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

/**
 * Tenant scope: every module endpoint must wrap its handler with this to
 * guarantee the request has a valid org context. Forbids cross-tenant access
 * at the framework boundary.
 */
export interface TenantContext {
  orgId: string;
  userId: string;
  role: string;
}

export type TenantHandler<T = unknown> = (
  req: Request,
  res: Response,
  next: NextFunction,
  tenant: TenantContext,
) => Promise<T> | T;

export function withTenant(handler: TenantHandler): RequestHandler {
  return async (req, res, next) => {
    const orgId = (req as Request & { authOrgId?: string }).authOrgId;
    const userId = (req as Request & { authUserId?: string }).authUserId;
    const user = (req as Request & { authUser?: { role?: string } }).authUser;
    if (!orgId || !userId) {
      res.status(403).json({
        error: { message: 'Tenant context required (no org)', code: 'no_tenant' },
      });
      return;
    }
    try {
      await handler(req, res, next, { orgId, userId, role: user?.role ?? 'employee' });
    } catch (err) {
      next(err);
    }
  };
}

export type { ModuleId };
