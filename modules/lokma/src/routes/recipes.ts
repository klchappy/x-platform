import { Router } from 'express';
import { z } from 'zod';
import { and, desc, eq, ilike, sql } from 'drizzle-orm';
import { getDb } from '@x/db/client';
import { schema } from '@x/db';
import { httpError } from '@x/shared';
import { withTenant } from '@x/module-api';

const router = Router();
const { lokmaRecipes } = schema;

const IngredientLineSchema = z.object({
  name: z.string().min(1),
  qty: z.number().positive(),
  unit: z.string().min(1),
  waste_pct: z.number().nonnegative().optional(),
});

const RecipeSchema = z.object({
  name: z.string().min(2),
  category: z.string().optional(),
  kitchen_id: z.string().uuid().optional(),
  base_yield: z.number().positive().default(1),
  yield_unit: z.string().default('porsiyon'),
  prep_minutes: z.number().int().nonnegative().optional(),
  cook_minutes: z.number().int().nonnegative().optional(),
  instructions: z.string().optional(),
  ingredients: z.array(IngredientLineSchema).default([]),
  tags: z.array(z.string()).default([]),
  photo_url: z.string().url().optional(),
});

router.post(
  '/',
  withTenant(async (req, res, _next, t) => {
    const data = RecipeSchema.parse(req.body);
    const [row] = await getDb()
      .insert(lokmaRecipes)
      .values({ org_id: t.orgId, ...data })
      .returning();
    res.status(201).json(row);
  }),
);

router.get(
  '/',
  withTenant(async (req, res, _next, t) => {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const rows = await getDb()
      .select()
      .from(lokmaRecipes)
      .where(
        q
          ? and(eq(lokmaRecipes.org_id, t.orgId), ilike(lokmaRecipes.name, `%${q}%`))
          : eq(lokmaRecipes.org_id, t.orgId),
      )
      .orderBy(desc(lokmaRecipes.created_at))
      .limit(300);
    res.json(rows);
  }),
);

router.get(
  '/:id',
  withTenant(async (req, res, _next, t) => {
    const id = String(req.params.id);
    const row = await getDb().query.lokmaRecipes.findFirst({
      where: (r, { and: a, eq: e }) => a(e(r.id, id), e(r.org_id, t.orgId)),
    });
    if (!row) throw httpError(404, 'Tarif bulunamadı');
    res.json(row);
  }),
);

router.patch(
  '/:id',
  withTenant(async (req, res, _next, t) => {
    const id = String(req.params.id);
    const data = RecipeSchema.partial().parse(req.body);
    const [row] = await getDb()
      .update(lokmaRecipes)
      .set({ ...data, updated_at: new Date() })
      .where(and(eq(lokmaRecipes.id, id), eq(lokmaRecipes.org_id, t.orgId)))
      .returning();
    if (!row) throw httpError(404, 'Tarif bulunamadı');
    res.json(row);
  }),
);

router.delete(
  '/:id',
  withTenant(async (req, res, _next, t) => {
    const id = String(req.params.id);
    const [row] = await getDb()
      .update(lokmaRecipes)
      .set({ is_active: false, updated_at: new Date() })
      .where(and(eq(lokmaRecipes.id, id), eq(lokmaRecipes.org_id, t.orgId)))
      .returning();
    if (!row) throw httpError(404, 'Tarif bulunamadı');
    res.json({ ok: true });
  }),
);

router.get(
  '/stats/summary',
  withTenant(async (_req, res, _next, t) => {
    const db = getDb();
    const [c] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(lokmaRecipes)
      .where(and(eq(lokmaRecipes.org_id, t.orgId), eq(lokmaRecipes.is_active, true)));
    res.json({ total: c?.count ?? 0 });
  }),
);

export default router;
