import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { eq } from 'drizzle-orm';
import { getDb } from '@x/db/client';
import { users, type User } from '@x/db/schema';
import { httpError, type OrgRole, hasRole } from '@x/shared';
import { logger } from '../lib/logger.js';
import { verifyJwt } from '../lib/jwt.js';

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
      // Allow demo mode (set ALLOW_DEMO_AUTH=1) — read X-Demo-User for testing
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
      throw httpError(401, 'Giriş yapmanız gerekiyor', 'no_token');
    }

    const claims = verifyJwt(token);
    if (!claims) {
      logger.warn({ tokenPrefix: token.slice(0, 8) }, 'jwt verify failed');
      throw httpError(401, 'Geçersiz veya süresi dolmuş oturum', 'invalid_token');
    }

    const dbUser = await getDb().query.users.findFirst({ where: eq(users.id, claims.sub) });
    if (!dbUser) throw httpError(403, 'Kullanıcı bulunamadı', 'no_local_user');
    if (!dbUser.isActive) throw httpError(403, 'Hesap pasif', 'inactive');

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
