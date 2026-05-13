import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { createClient } from '@supabase/supabase-js';
import { eq } from 'drizzle-orm';
import { getDb } from '@x/db/client';
import { users, type User } from '@x/db/schema';
import { httpError, type OrgRole, hasRole } from '@x/shared';
import { logger } from '../lib/logger.js';

let _sb: ReturnType<typeof createClient> | null = null;
function sb() {
  if (!_sb) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) required');
    }
    _sb = createClient(url, key);
  }
  return _sb;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      authUser?: User;
      authOrgId?: string | null;
      authUserId?: string;
    }
  }
}

export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;
    const bearer = header?.startsWith('Bearer ') ? header.slice(7) : null;
    const cookieToken = (req.cookies?.['x_session'] as string | undefined) ?? null;
    const token = bearer ?? cookieToken;

    if (!token) {
      // Allow demo mode for the initial deploy — read X-Demo-User
      const demoEmail = req.headers['x-demo-user'];
      if (typeof demoEmail === 'string' && process.env.ALLOW_DEMO_AUTH === '1') {
        const dbUser = await getDb().query.users.findFirst({ where: eq(users.email, demoEmail) });
        if (dbUser) {
          req.authUser = dbUser;
          req.authOrgId = dbUser.orgId;
          req.authUserId = dbUser.id;
          return next();
        }
      }
      throw httpError(401, 'Auth required', 'no_token');
    }

    let supabaseUserId: string | undefined;
    let email: string | undefined;
    try {
      const { data, error } = await sb().auth.getUser(token);
      if (error || !data?.user) throw new Error(error?.message ?? 'invalid_token');
      supabaseUserId = data.user.id;
      email = data.user.email ?? undefined;
    } catch (err) {
      logger.warn({ err }, 'supabase getUser failed');
      throw httpError(401, 'Invalid token', 'invalid_token');
    }

    if (!email) throw httpError(401, 'No email on token', 'no_email');

    const dbUser = await getDb().query.users.findFirst({ where: eq(users.email, email) });
    if (!dbUser) throw httpError(403, 'User not provisioned', 'no_local_user');

    req.authUser = dbUser;
    req.authOrgId = dbUser.orgId;
    req.authUserId = dbUser.id;
    next();
  } catch (err) {
    next(err);
  }
};

export const requireOrg: RequestHandler = (req, _res, next) => {
  if (!req.authOrgId) return next(httpError(403, 'No org context', 'no_org'));
  next();
};

export const requireRole = (...roles: OrgRole[]): RequestHandler => (req, _res, next) => {
  const user = req.authUser;
  if (!user) return next(httpError(401, 'Auth required', 'no_user'));
  const ok = roles.some((r) => hasRole(user.role as OrgRole, r));
  if (!ok) return next(httpError(403, 'Insufficient role', 'insufficient_role'));
  next();
};

export const requirePlatformAdmin: RequestHandler = (req, _res, next) => {
  if (!req.authUser?.isPlatformAdmin) return next(httpError(403, 'Platform admin required', 'not_platform_admin'));
  next();
};

export type AuthedRequest = Request & { authUser: User; authOrgId: string; authUserId: string };

export function _asAuthed(req: Request): AuthedRequest {
  return req as AuthedRequest;
}

// Re-export for typing convenience
export type { Request, Response, NextFunction };
