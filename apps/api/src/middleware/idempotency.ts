import type { RequestHandler } from 'express';
import { createHash } from 'node:crypto';
import { and, eq, lt } from 'drizzle-orm';
import { getDb } from '@x/db/client';
import { idempotencyKeys } from '@x/db/schema';

const IDEMPOTENCY_HEADER = 'idempotency-key';
const RETENTION_HOURS = 24;
const METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function hashBody(body: unknown): string {
  return createHash('sha256').update(JSON.stringify(body ?? null)).digest('hex');
}

/**
 * Blueprint-uyumlu Idempotency middleware.
 * Headers:
 *   Idempotency-Key: <client-generated unique string, 8-200 char>
 * Davranış:
 *   - Sadece POST/PUT/PATCH/DELETE'te çalışır
 *   - (key, method, path) için kayıtlı response varsa onu döner + `Idempotent-Replay: true`
 *   - Aynı key + farklı body → 422 IDEMPOTENCY_KEY_REUSED
 *   - 24h TTL, 5xx response'lar cache'lenmez (retry edilebilirler)
 */
export const idempotency: RequestHandler = async (req, res, next) => {
  if (!METHODS.has(req.method)) return next();
  const key = req.header(IDEMPOTENCY_HEADER);
  if (!key) return next();
  if (key.length < 8 || key.length > 200) {
    res.status(400).json({
      error: { message: 'Idempotency-Key 8-200 karakter olmalı', code: 'invalid_idempotency_key' },
    });
    return;
  }

  const method = req.method;
  const path = req.path;
  const requestHash = hashBody(req.body);

  try {
    const db = getDb();

    // TTL geçmiş kayıtları temizle (best-effort)
    const cutoff = new Date(Date.now() - RETENTION_HOURS * 60 * 60 * 1000);
    db.delete(idempotencyKeys).where(lt(idempotencyKeys.createdAt, cutoff)).execute().catch(() => undefined);

    const existing = await db.query.idempotencyKeys.findFirst({
      where: (k, { and: a, eq: e }) => a(e(k.key, key), e(k.method, method), e(k.path, path)),
    });

    if (existing) {
      if (existing.requestHash !== requestHash) {
        res.status(422).json({
          error: {
            message: 'Aynı Idempotency-Key ile farklı body gönderildi',
            code: 'IDEMPOTENCY_KEY_REUSED',
          },
        });
        return;
      }
      if (existing.responseStatus && existing.responseBody) {
        res.setHeader('Idempotent-Replay', 'true');
        res.status(existing.responseStatus).json(existing.responseBody);
        return;
      }
    }

    // Yanıtı yakala
    const orgId = (req as { authOrgId?: string }).authOrgId ?? null;
    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      const status = res.statusCode;
      if (status < 500) {
        db.insert(idempotencyKeys)
          .values({
            key,
            method,
            path,
            requestHash,
            responseStatus: status,
            responseBody: body as Record<string, unknown>,
            orgId,
          })
          .onConflictDoNothing()
          .execute()
          .catch(() => undefined);
      }
      return originalJson(body);
    };

    next();
  } catch (err) {
    next(err);
  }
};
