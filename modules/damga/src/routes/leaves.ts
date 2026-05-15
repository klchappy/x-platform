import { Router } from 'express';
import { z } from 'zod';
import { and, desc, eq, sql } from 'drizzle-orm';
import { getDb } from '@x/db/client';
import { schema } from '@x/db';
import { httpError } from '@x/shared';
import { withTenant } from '@x/module-api';

const router = Router();
const { damgaLeaves } = schema;

const LeaveSchema = z.object({
  type: z.enum(['annual', 'sick', 'unpaid', 'maternity', 'paternity', 'compassionate']).default('annual'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  half_day: z.boolean().default(false),
  reason: z.string().optional(),
});

const DecisionSchema = z.object({
  rejection_reason: z.string().optional(),
});

function businessDays(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  let days = 0;
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) days += 1;
  }
  return days;
}

router.post(
  '/',
  withTenant(async (req, res, _next, t) => {
    const data = LeaveSchema.parse(req.body);
    if (data.end_date < data.start_date) throw httpError(400, 'Bitiş tarihi başlangıçtan önce olamaz', 'invalid_range');
    const bd = data.half_day ? 0.5 : businessDays(data.start_date, data.end_date);
    if (bd < 0.5) throw httpError(400, 'En az 0.5 iş günü olmalı', 'invalid_range');

    const [row] = await getDb()
      .insert(damgaLeaves)
      .values({
        org_id: t.orgId,
        user_id: t.userId,
        type: data.type,
        start_date: data.start_date,
        end_date: data.end_date,
        half_day: data.half_day,
        business_days: Math.ceil(bd),
        reason: data.reason,
        status: 'pending',
      })
      .returning();
    res.status(201).json(row);
  }),
);

router.get(
  '/',
  withTenant(async (req, res, _next, t) => {
    const isManager = ['owner', 'admin', 'manager'].includes(t.role);
    const all = req.query.all === '1' && isManager;
    const status = typeof req.query.status === 'string' ? req.query.status : null;
    const baseWhere = all
      ? eq(damgaLeaves.org_id, t.orgId)
      : and(eq(damgaLeaves.org_id, t.orgId), eq(damgaLeaves.user_id, t.userId));
    const where = status
      ? and(baseWhere, eq(damgaLeaves.status, status as 'pending' | 'approved' | 'rejected' | 'cancelled'))
      : baseWhere;
    const rows = await getDb()
      .select()
      .from(damgaLeaves)
      .where(where)
      .orderBy(desc(damgaLeaves.created_at))
      .limit(300);
    res.json(rows);
  }),
);

router.patch(
  '/:id/approve',
  withTenant(async (req, res, _next, t) => {
    if (!['owner', 'admin', 'manager'].includes(t.role)) throw httpError(403, 'Yetkisiz', 'forbidden');
    const id = String(req.params.id);
    const [row] = await getDb()
      .update(damgaLeaves)
      .set({
        status: 'approved',
        approved_by_user_id: t.userId,
        approved_at: new Date(),
        updated_at: new Date(),
      })
      .where(and(eq(damgaLeaves.id, id), eq(damgaLeaves.org_id, t.orgId)))
      .returning();
    if (!row) throw httpError(404, 'İzin bulunamadı');
    res.json(row);
  }),
);

router.patch(
  '/:id/reject',
  withTenant(async (req, res, _next, t) => {
    if (!['owner', 'admin', 'manager'].includes(t.role)) throw httpError(403, 'Yetkisiz', 'forbidden');
    const id = String(req.params.id);
    const data = DecisionSchema.parse(req.body);
    const [row] = await getDb()
      .update(damgaLeaves)
      .set({
        status: 'rejected',
        approved_by_user_id: t.userId,
        approved_at: new Date(),
        rejection_reason: data.rejection_reason,
        updated_at: new Date(),
      })
      .where(and(eq(damgaLeaves.id, id), eq(damgaLeaves.org_id, t.orgId)))
      .returning();
    if (!row) throw httpError(404, 'İzin bulunamadı');
    res.json(row);
  }),
);

router.get(
  '/stats',
  withTenant(async (_req, res, _next, t) => {
    const db = getDb();
    const [pending] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(damgaLeaves)
      .where(and(eq(damgaLeaves.org_id, t.orgId), eq(damgaLeaves.status, 'pending')));
    const [approved] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(damgaLeaves)
      .where(and(eq(damgaLeaves.org_id, t.orgId), eq(damgaLeaves.status, 'approved')));
    res.json({ pending: pending?.count ?? 0, approved: approved?.count ?? 0 });
  }),
);

export default router;
