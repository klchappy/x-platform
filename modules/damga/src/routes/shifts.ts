import { Router } from 'express';
import { z } from 'zod';
import { and, desc, eq } from 'drizzle-orm';
import { getDb } from '@x/db/client';
import { schema } from '@x/db';
import { httpError } from '@x/shared';
import { withTenant } from '@x/module-api';

const router = Router();
const { damgaShiftTemplates, damgaShiftAssignments } = schema;

const TemplateSchema = z.object({
  name: z.string().min(2),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
  break_minutes: z.number().int().nonnegative().default(60),
  color: z.string().default('#94a3b8'),
  overtime_threshold_minutes: z.number().int().nonnegative().default(15),
  location_id: z.string().uuid().optional(),
});

const AssignmentSchema = z.object({
  shift_template_id: z.string().uuid(),
  user_id: z.string().uuid(),
  shift_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  override_start: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  override_end: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  notes: z.string().optional(),
});

router.post(
  '/templates',
  withTenant(async (req, res, _next, t) => {
    if (!['owner', 'admin', 'manager'].includes(t.role)) throw httpError(403, 'Yetkisiz', 'forbidden');
    const data = TemplateSchema.parse(req.body);
    const [row] = await getDb()
      .insert(damgaShiftTemplates)
      .values({ org_id: t.orgId, created_by_user_id: t.userId, ...data })
      .returning();
    res.status(201).json(row);
  }),
);

router.get(
  '/templates',
  withTenant(async (_req, res, _next, t) => {
    const rows = await getDb()
      .select()
      .from(damgaShiftTemplates)
      .where(eq(damgaShiftTemplates.org_id, t.orgId))
      .orderBy(desc(damgaShiftTemplates.created_at));
    res.json(rows);
  }),
);

router.post(
  '/assignments',
  withTenant(async (req, res, _next, t) => {
    if (!['owner', 'admin', 'manager'].includes(t.role)) throw httpError(403, 'Yetkisiz', 'forbidden');
    const data = AssignmentSchema.parse(req.body);
    const [row] = await getDb().insert(damgaShiftAssignments).values({ org_id: t.orgId, ...data }).returning();
    res.status(201).json(row);
  }),
);

router.get(
  '/assignments',
  withTenant(async (req, res, _next, t) => {
    const isManager = ['owner', 'admin', 'manager'].includes(t.role);
    const all = req.query.all === '1' && isManager;
    const where = all
      ? eq(damgaShiftAssignments.org_id, t.orgId)
      : and(eq(damgaShiftAssignments.org_id, t.orgId), eq(damgaShiftAssignments.user_id, t.userId));
    const rows = await getDb()
      .select()
      .from(damgaShiftAssignments)
      .where(where)
      .orderBy(desc(damgaShiftAssignments.shift_date))
      .limit(200);
    res.json(rows);
  }),
);

export default router;
