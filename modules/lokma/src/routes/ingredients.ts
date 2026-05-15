import { Router } from 'express';
import { z } from 'zod';
import { and, desc, eq, ilike, sql } from 'drizzle-orm';
import { getDb } from '@x/db/client';
import { schema } from '@x/db';
import { httpError } from '@x/shared';
import { withTenant } from '@x/module-api';

const router = Router();
const { lokmaIngredients } = schema;

const IngredientSchema = z.object({
  name: z.string().min(2),
  category: z.string().optional(),
  sku: z.string().optional(),
  default_unit: z.string().default('kg'),
  default_waste_pct: z.number().nonnegative().default(0),
  last_unit_price: z.number().nonnegative().default(0),
  allergens: z.array(z.string()).default([]),
  storage_info: z.string().optional(),
});

router.post(
  '/',
  withTenant(async (req, res, _next, t) => {
    const data = IngredientSchema.parse(req.body);
    const [row] = await getDb()
      .insert(lokmaIngredients)
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
      .from(lokmaIngredients)
      .where(
        q
          ? and(eq(lokmaIngredients.org_id, t.orgId), ilike(lokmaIngredients.name, `%${q}%`))
          : eq(lokmaIngredients.org_id, t.orgId),
      )
      .orderBy(lokmaIngredients.name)
      .limit(500);
    res.json(rows);
  }),
);

router.patch(
  '/:id',
  withTenant(async (req, res, _next, t) => {
    const id = String(req.params.id);
    const data = IngredientSchema.partial().parse(req.body);
    const [row] = await getDb()
      .update(lokmaIngredients)
      .set(data)
      .where(and(eq(lokmaIngredients.id, id), eq(lokmaIngredients.org_id, t.orgId)))
      .returning();
    if (!row) throw httpError(404, 'Malzeme bulunamadı');
    res.json(row);
  }),
);

router.delete(
  '/:id',
  withTenant(async (req, res, _next, t) => {
    const id = String(req.params.id);
    const [row] = await getDb()
      .update(lokmaIngredients)
      .set({ is_active: false })
      .where(and(eq(lokmaIngredients.id, id), eq(lokmaIngredients.org_id, t.orgId)))
      .returning();
    if (!row) throw httpError(404, 'Malzeme bulunamadı');
    res.json({ ok: true });
  }),
);

router.get(
  '/stats/summary',
  withTenant(async (_req, res, _next, t) => {
    const db = getDb();
    const [c] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(lokmaIngredients)
      .where(and(eq(lokmaIngredients.org_id, t.orgId), eq(lokmaIngredients.is_active, true)));
    res.json({ total: c?.count ?? 0 });
  }),
);

export default router;
