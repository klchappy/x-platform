import { Router } from 'express';
import { z } from 'zod';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { getDb } from '@x/db/client';
import { schema } from '@x/db';
import { httpError } from '@x/shared';
import { withTenant } from '@x/module-api';

const router = Router();
const { santralCalls, santralContacts } = schema;

const CallSchema = z.object({
  direction: z.enum(['inbound', 'outbound', 'missed']),
  contact_id: z.string().uuid().optional(),
  external_number: z.string().optional(),
  forwarded_to_user_id: z.string().uuid().optional(),
  duration_sec: z.number().int().nonnegative().optional(),
  notes: z.string().optional(),
  occurred_at: z.string().datetime().optional(),
});

router.post(
  '/',
  withTenant(async (req, res, _next, t) => {
    const data = CallSchema.parse(req.body);
    const [row] = await getDb()
      .insert(santralCalls)
      .values({
        org_id: t.orgId,
        answered_by_user_id: t.userId,
        direction: data.direction,
        contact_id: data.contact_id ?? null,
        external_number: data.external_number ?? null,
        forwarded_to_user_id: data.forwarded_to_user_id ?? null,
        duration_sec: data.duration_sec ?? null,
        notes: data.notes ?? null,
        occurred_at: data.occurred_at ? new Date(data.occurred_at) : new Date(),
      })
      .returning();
    res.status(201).json(row);
  }),
);

router.get(
  '/',
  withTenant(async (req, res, _next, t) => {
    const direction = typeof req.query.direction === 'string' ? req.query.direction : undefined;
    const db = getDb();
    const conds = [eq(santralCalls.org_id, t.orgId)];
    if (direction === 'inbound' || direction === 'outbound' || direction === 'missed') {
      conds.push(eq(santralCalls.direction, direction));
    }
    const rows = await db
      .select({
        id: santralCalls.id,
        direction: santralCalls.direction,
        contact_id: santralCalls.contact_id,
        contact_name: santralContacts.full_name,
        external_number: santralCalls.external_number,
        answered_by_user_id: santralCalls.answered_by_user_id,
        duration_sec: santralCalls.duration_sec,
        notes: santralCalls.notes,
        occurred_at: santralCalls.occurred_at,
      })
      .from(santralCalls)
      .leftJoin(santralContacts, eq(santralCalls.contact_id, santralContacts.id))
      .where(and(...conds))
      .orderBy(desc(santralCalls.occurred_at))
      .limit(300);
    res.json(rows);
  }),
);

router.delete(
  '/:id',
  withTenant(async (req, res, _next, t) => {
    const id = String(req.params.id);
    const [row] = await getDb()
      .delete(santralCalls)
      .where(and(eq(santralCalls.id, id), eq(santralCalls.org_id, t.orgId)))
      .returning();
    if (!row) throw httpError(404, 'Çağrı bulunamadı');
    res.json({ ok: true });
  }),
);

router.get(
  '/stats/summary',
  withTenant(async (_req, res, _next, t) => {
    const db = getDb();
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [total] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(santralCalls)
      .where(eq(santralCalls.org_id, t.orgId));
    const [last30] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(santralCalls)
      .where(and(eq(santralCalls.org_id, t.orgId), gte(santralCalls.occurred_at, since)));
    const byDir = await db
      .select({ direction: santralCalls.direction, count: sql<number>`count(*)::int` })
      .from(santralCalls)
      .where(and(eq(santralCalls.org_id, t.orgId), gte(santralCalls.occurred_at, since)))
      .groupBy(santralCalls.direction);
    res.json({ total: total?.count ?? 0, last30: last30?.count ?? 0, byDirection: byDir });
  }),
);

export default router;
