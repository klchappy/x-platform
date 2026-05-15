import { Router } from 'express';
import { z } from 'zod';
import { and, asc, desc, eq, gte, lte } from 'drizzle-orm';
import { getDb } from '@x/db/client';
import { schema } from '@x/db';
import { httpError } from '@x/shared';
import { withTenant } from '@x/module-api';

const router = Router();
const { lokmaMenuPlans, lokmaMenuItems } = schema;

const PlanSchema = z.object({
  kitchen_id: z.string().uuid().optional(),
  plan_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).default('lunch'),
  expected_servings: z.number().int().nonnegative().default(0),
  notes: z.string().optional(),
});

const ItemSchema = z.object({
  plan_id: z.string().uuid(),
  recipe_id: z.string().uuid().optional(),
  recipe_name: z.string().min(2),
  portions: z.number().positive().default(1),
  course: z.string().optional(),
});

router.post(
  '/plans',
  withTenant(async (req, res, _next, t) => {
    const data = PlanSchema.parse(req.body);
    const [row] = await getDb().insert(lokmaMenuPlans).values({ org_id: t.orgId, ...data }).returning();
    res.status(201).json(row);
  }),
);

router.get(
  '/plans',
  withTenant(async (req, res, _next, t) => {
    const from = typeof req.query.from === 'string' ? req.query.from : undefined;
    const to = typeof req.query.to === 'string' ? req.query.to : undefined;
    const conds = [eq(lokmaMenuPlans.org_id, t.orgId)];
    if (from) conds.push(gte(lokmaMenuPlans.plan_date, from));
    if (to) conds.push(lte(lokmaMenuPlans.plan_date, to));
    const rows = await getDb()
      .select()
      .from(lokmaMenuPlans)
      .where(and(...conds))
      .orderBy(asc(lokmaMenuPlans.plan_date))
      .limit(200);
    res.json(rows);
  }),
);

router.post(
  '/items',
  withTenant(async (req, res, _next, t) => {
    const data = ItemSchema.parse(req.body);
    const [row] = await getDb().insert(lokmaMenuItems).values({ org_id: t.orgId, ...data }).returning();
    res.status(201).json(row);
  }),
);

router.get(
  '/items',
  withTenant(async (req, res, _next, t) => {
    const plan_id = typeof req.query.plan_id === 'string' ? req.query.plan_id : undefined;
    const conds = [eq(lokmaMenuItems.org_id, t.orgId), eq(lokmaMenuItems.is_active, true)];
    if (plan_id) conds.push(eq(lokmaMenuItems.plan_id, plan_id));
    const rows = await getDb()
      .select()
      .from(lokmaMenuItems)
      .where(and(...conds))
      .orderBy(asc(lokmaMenuItems.course));
    res.json(rows);
  }),
);

router.delete(
  '/items/:id',
  withTenant(async (req, res, _next, t) => {
    const id = String(req.params.id);
    const [row] = await getDb()
      .update(lokmaMenuItems)
      .set({ is_active: false })
      .where(and(eq(lokmaMenuItems.id, id), eq(lokmaMenuItems.org_id, t.orgId)))
      .returning();
    if (!row) throw httpError(404, 'Menü kalemi bulunamadı');
    res.json({ ok: true });
  }),
);

export default router;
