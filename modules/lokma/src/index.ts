import { defineModule, withTenant } from '@x/module-api';
import { z } from 'zod';
import { desc, eq, and, sql } from 'drizzle-orm';
import { getDb } from '@x/db/client';
import { lokmaRecipes } from '@x/db/schema';

const RecipeSchema = z.object({
  name: z.string().min(2),
  category: z.string().optional(),
  baseYield: z.number().positive().default(1),
  yieldUnit: z.string().default('porsiyon'),
  prepMinutes: z.number().int().nonnegative().optional(),
  cookMinutes: z.number().int().nonnegative().optional(),
  instructions: z.string().optional(),
  ingredients: z
    .array(z.object({ name: z.string(), qty: z.number(), unit: z.string() }))
    .default([]),
  tags: z.array(z.string()).default([]),
});

export default defineModule({
  id: 'lokma',
  version: '0.2.0',
  registerRoutes(router, ctx) {
    router.get('/health', (_req, res) => res.json({ ok: true, module: 'lokma', version: '0.2.0' }));

    router.get('/overview', (_req, res) => {
      res.json({
        name: 'Lokma',
        tagline: 'Mutfak işletim sistemi',
        capabilities: ['recipes.crud', 'recipes.scale', 'ingredients.list'],
      });
    });

    // POST /recipes
    router.post(
      '/recipes',
      withTenant(async (req, res, _next, t) => {
        const data = RecipeSchema.parse(req.body);
        const [row] = await getDb()
          .insert(lokmaRecipes)
          .values({ orgId: t.orgId, ...data })
          .returning();
        ctx.log('lokma.recipe.created', { name: data.name });
        res.status(201).json(row);
      }),
    );

    // GET /recipes
    router.get(
      '/recipes',
      withTenant(async (_req, res, _next, t) => {
        const rows = await getDb()
          .select()
          .from(lokmaRecipes)
          .where(eq(lokmaRecipes.orgId, t.orgId))
          .orderBy(desc(lokmaRecipes.createdAt))
          .limit(200);
        res.json(rows);
      }),
    );

    // GET /recipes/:id
    router.get(
      '/recipes/:id',
      withTenant(async (req, res, _next, t) => {
        const id = String(req.params.id);
        const row = await getDb().query.lokmaRecipes.findFirst({
          where: (r, { eq: e, and: a }) => a(e(r.id, id), e(r.orgId, t.orgId)),
        });
        if (!row) return res.status(404).json({ error: { message: 'Reçete bulunamadı' } });
        res.json(row);
      }),
    );

    // GET /stats
    router.get(
      '/stats',
      withTenant(async (_req, res, _next, t) => {
        const [r] = await getDb()
          .select({ count: sql<number>`count(*)::int` })
          .from(lokmaRecipes)
          .where(eq(lokmaRecipes.orgId, t.orgId));
        res.json({ totalRecipes: r?.count ?? 0 });
      }),
    );

    ctx.log('lokma module registered', { routes: 5 });
  },
});
