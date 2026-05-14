import { defineModule, withTenant } from '@x/module-api';
import { z } from 'zod';
import { desc, eq, and, sql } from 'drizzle-orm';
import { getDb } from '@x/db/client';
import { damgaAttendance, damgaLeaves } from '@x/db/schema';
import { httpError } from '@x/shared';

const CheckInSchema = z.object({
  type: z.enum(['check_in', 'check_out']),
  method: z.enum(['manual', 'qr', 'nfc', 'gps']).default('manual'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  notes: z.string().max(500).optional(),
});

const LeaveSchema = z.object({
  type: z.enum(['annual', 'sick', 'unpaid']).default('annual'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().max(500).optional(),
});

function businessDaysBetween(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  let days = 0;
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) days += 1;
  }
  return days;
}

export default defineModule({
  id: 'damga',
  version: '0.2.0',
  registerRoutes(router, ctx) {
    router.get('/health', (_req, res) => {
      res.json({ ok: true, module: 'damga', version: '0.2.0' });
    });

    router.get('/overview', (_req, res) => {
      res.json({
        name: 'Damga',
        tagline: 'Şeffaf personel takibi',
        capabilities: [
          'attendance.checkin',
          'attendance.checkout',
          'leaves.request',
          'leaves.approve',
        ],
      });
    });

    // POST /attendance — stamp check-in/out
    router.post(
      '/attendance',
      withTenant(async (req, res, _next, t) => {
        const data = CheckInSchema.parse(req.body);
        const [row] = await getDb()
          .insert(damgaAttendance)
          .values({
            orgId: t.orgId,
            userId: t.userId,
            type: data.type,
            method: data.method,
            latitude: data.latitude,
            longitude: data.longitude,
            notes: data.notes,
            clientTime: new Date(),
          })
          .returning();
        ctx.log('damga.attendance.created', { type: data.type, userId: t.userId });
        res.status(201).json(row);
      }),
    );

    // GET /attendance — list latest for org (manager+) or self (employee)
    router.get(
      '/attendance',
      withTenant(async (req, res, _next, t) => {
        const isManager = ['owner', 'admin', 'manager'].includes(t.role);
        const limit = Math.min(200, Number(req.query.limit ?? 50));
        const where = isManager
          ? eq(damgaAttendance.orgId, t.orgId)
          : and(eq(damgaAttendance.orgId, t.orgId), eq(damgaAttendance.userId, t.userId));
        const rows = await getDb()
          .select()
          .from(damgaAttendance)
          .where(where)
          .orderBy(desc(damgaAttendance.serverTime))
          .limit(limit);
        res.json(rows);
      }),
    );

    // POST /leaves — request leave
    router.post(
      '/leaves',
      withTenant(async (req, res, _next, t) => {
        const data = LeaveSchema.parse(req.body);
        const businessDays = businessDaysBetween(data.startDate, data.endDate);
        if (businessDays < 1) throw httpError(400, 'En az 1 iş günü olmalı', 'invalid_range');
        const [row] = await getDb()
          .insert(damgaLeaves)
          .values({
            orgId: t.orgId,
            userId: t.userId,
            type: data.type,
            startDate: data.startDate,
            endDate: data.endDate,
            businessDays,
            reason: data.reason,
            status: 'pending',
          })
          .returning();
        ctx.log('damga.leave.requested', { userId: t.userId, businessDays });
        res.status(201).json(row);
      }),
    );

    // GET /leaves — list (mine vs all)
    router.get(
      '/leaves',
      withTenant(async (req, res, _next, t) => {
        const isManager = ['owner', 'admin', 'manager'].includes(t.role);
        const all = req.query.all === '1' && isManager;
        const where = all
          ? eq(damgaLeaves.orgId, t.orgId)
          : and(eq(damgaLeaves.orgId, t.orgId), eq(damgaLeaves.userId, t.userId));
        const rows = await getDb()
          .select()
          .from(damgaLeaves)
          .where(where)
          .orderBy(desc(damgaLeaves.createdAt));
        res.json(rows);
      }),
    );

    // GET /stats — quick overview for dashboard
    router.get(
      '/stats',
      withTenant(async (_req, res, _next, t) => {
        const db = getDb();
        const [att] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(damgaAttendance)
          .where(eq(damgaAttendance.orgId, t.orgId));
        const [lv] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(damgaLeaves)
          .where(and(eq(damgaLeaves.orgId, t.orgId), eq(damgaLeaves.status, 'pending')));
        res.json({
          totalAttendance: att?.count ?? 0,
          pendingLeaves: lv?.count ?? 0,
        });
      }),
    );

    ctx.log('damga module registered', { routes: 6 });
  },
});
