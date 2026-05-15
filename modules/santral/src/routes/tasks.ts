import { Router } from 'express';
import { z } from 'zod';
import { and, asc, eq, gte, lte, sql } from 'drizzle-orm';
import { getDb } from '@x/db/client';
import { schema } from '@x/db';
import { httpError } from '@x/shared';
import { withTenant } from '@x/module-api';

const router = Router();
const { santralTasks, santralCalendarEvents } = schema;

const TaskSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  assignee_id: z.string().uuid().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  status: z.enum(['open', 'in_progress', 'blocked', 'done', 'cancelled']).default('open'),
  due_at: z.string().datetime().optional(),
  related_people: z.array(z.object({ name: z.string(), phone: z.string().optional() })).default([]),
});

const EventSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  location: z.string().optional(),
  start_at: z.string().datetime(),
  end_at: z.string().datetime(),
  is_all_day: z.boolean().default(false),
  visibility: z.enum(['org', 'private']).default('org'),
});

router.post(
  '/',
  withTenant(async (req, res, _next, t) => {
    const data = TaskSchema.parse(req.body);
    const [row] = await getDb()
      .insert(santralTasks)
      .values({
        org_id: t.orgId,
        created_by: t.userId,
        title: data.title,
        description: data.description ?? null,
        assignee_id: data.assignee_id ?? null,
        priority: data.priority,
        status: data.status,
        due_at: data.due_at ? new Date(data.due_at) : null,
        related_people: data.related_people,
      })
      .returning();
    res.status(201).json(row);
  }),
);

router.get(
  '/',
  withTenant(async (req, res, _next, t) => {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const conds = [eq(santralTasks.org_id, t.orgId), eq(santralTasks.is_active, true)];
    if (status && ['open', 'in_progress', 'blocked', 'done', 'cancelled'].includes(status)) {
      conds.push(eq(santralTasks.status, status as any));
    }
    const rows = await getDb()
      .select()
      .from(santralTasks)
      .where(and(...conds))
      .orderBy(asc(santralTasks.due_at))
      .limit(300);
    res.json(rows);
  }),
);

router.patch(
  '/:id',
  withTenant(async (req, res, _next, t) => {
    const id = String(req.params.id);
    const data = TaskSchema.partial().parse(req.body);
    const patch: any = { updated_at: new Date() };
    if (data.title !== undefined) patch.title = data.title;
    if (data.description !== undefined) patch.description = data.description;
    if (data.assignee_id !== undefined) patch.assignee_id = data.assignee_id;
    if (data.priority !== undefined) patch.priority = data.priority;
    if (data.status !== undefined) patch.status = data.status;
    if (data.due_at !== undefined) patch.due_at = data.due_at ? new Date(data.due_at) : null;
    if (data.related_people !== undefined) patch.related_people = data.related_people;

    const [row] = await getDb()
      .update(santralTasks)
      .set(patch)
      .where(and(eq(santralTasks.id, id), eq(santralTasks.org_id, t.orgId)))
      .returning();
    if (!row) throw httpError(404, 'Görev bulunamadı');
    res.json(row);
  }),
);

router.delete(
  '/:id',
  withTenant(async (req, res, _next, t) => {
    const id = String(req.params.id);
    const [row] = await getDb()
      .update(santralTasks)
      .set({ is_active: false, updated_at: new Date() })
      .where(and(eq(santralTasks.id, id), eq(santralTasks.org_id, t.orgId)))
      .returning();
    if (!row) throw httpError(404, 'Görev bulunamadı');
    res.json({ ok: true });
  }),
);

router.post(
  '/events',
  withTenant(async (req, res, _next, t) => {
    const data = EventSchema.parse(req.body);
    const [row] = await getDb()
      .insert(santralCalendarEvents)
      .values({
        org_id: t.orgId,
        owner_id: t.userId,
        title: data.title,
        description: data.description ?? null,
        location: data.location ?? null,
        start_at: new Date(data.start_at),
        end_at: new Date(data.end_at),
        is_all_day: data.is_all_day,
        visibility: data.visibility,
      })
      .returning();
    res.status(201).json(row);
  }),
);

router.get(
  '/events',
  withTenant(async (req, res, _next, t) => {
    const from = typeof req.query.from === 'string' ? new Date(req.query.from) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const to = typeof req.query.to === 'string' ? new Date(req.query.to) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const rows = await getDb()
      .select()
      .from(santralCalendarEvents)
      .where(
        and(
          eq(santralCalendarEvents.org_id, t.orgId),
          eq(santralCalendarEvents.is_cancelled, false),
          gte(santralCalendarEvents.start_at, from),
          lte(santralCalendarEvents.start_at, to),
        ),
      )
      .orderBy(asc(santralCalendarEvents.start_at));
    res.json(rows);
  }),
);

router.delete(
  '/events/:id',
  withTenant(async (req, res, _next, t) => {
    const id = String(req.params.id);
    const [row] = await getDb()
      .update(santralCalendarEvents)
      .set({ is_cancelled: true })
      .where(and(eq(santralCalendarEvents.id, id), eq(santralCalendarEvents.org_id, t.orgId)))
      .returning();
    if (!row) throw httpError(404, 'Etkinlik bulunamadı');
    res.json({ ok: true });
  }),
);

router.get(
  '/stats/summary',
  withTenant(async (_req, res, _next, t) => {
    const db = getDb();
    const byStatus = await db
      .select({ status: santralTasks.status, count: sql<number>`count(*)::int` })
      .from(santralTasks)
      .where(and(eq(santralTasks.org_id, t.orgId), eq(santralTasks.is_active, true)))
      .groupBy(santralTasks.status);
    const upcoming = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(santralCalendarEvents)
      .where(
        and(
          eq(santralCalendarEvents.org_id, t.orgId),
          eq(santralCalendarEvents.is_cancelled, false),
          gte(santralCalendarEvents.start_at, new Date()),
        ),
      );
    res.json({ tasksByStatus: byStatus, upcomingEvents: upcoming[0]?.count ?? 0 });
  }),
);

export default router;
