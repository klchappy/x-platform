import { defineModule, withTenant } from '@x/module-api';
import { z } from 'zod';
import { desc, eq, sql } from 'drizzle-orm';
import { getDb } from '@x/db/client';
import { ticaretProducts, ticaretCustomers } from '@x/db/schema';

const ProductSchema = z.object({
  sku: z.string().optional(),
  name: z.string().min(2),
  category: z.string().optional(),
  unit: z.string().default('adet'),
  priceCentsTry: z.number().int().nonnegative().default(0),
  taxRatePct: z.number().min(0).max(50).default(20),
  stockOnHand: z.number().default(0),
});

const CustomerSchema = z.object({
  name: z.string().min(2),
  taxNo: z.string().optional(),
  taxOffice: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  creditLimitCentsTry: z.number().int().nonnegative().default(0),
});

export default defineModule({
  id: 'ticaret',
  version: '0.2.0',
  registerRoutes(router, ctx) {
    router.get('/health', (_req, res) => res.json({ ok: true, module: 'ticaret', version: '0.2.0' }));

    router.get('/overview', (_req, res) => {
      res.json({
        name: 'Ticaret',
        tagline: 'Üretim & ihracat ERP',
        capabilities: ['products.crud', 'customers.crud', 'inventory.stats'],
      });
    });

    router.post(
      '/products',
      withTenant(async (req, res, _next, t) => {
        const data = ProductSchema.parse(req.body);
        const [row] = await getDb().insert(ticaretProducts).values({ orgId: t.orgId, ...data }).returning();
        ctx.log('ticaret.product.created', { name: data.name });
        res.status(201).json(row);
      }),
    );

    router.get(
      '/products',
      withTenant(async (_req, res, _next, t) => {
        const rows = await getDb()
          .select()
          .from(ticaretProducts)
          .where(eq(ticaretProducts.orgId, t.orgId))
          .orderBy(desc(ticaretProducts.createdAt))
          .limit(500);
        res.json(rows);
      }),
    );

    router.post(
      '/customers',
      withTenant(async (req, res, _next, t) => {
        const data = CustomerSchema.parse(req.body);
        const [row] = await getDb()
          .insert(ticaretCustomers)
          .values({ orgId: t.orgId, createdBy: t.userId, ...data, email: data.email || null })
          .returning();
        ctx.log('ticaret.customer.created', { name: data.name });
        res.status(201).json(row);
      }),
    );

    router.get(
      '/customers',
      withTenant(async (_req, res, _next, t) => {
        const rows = await getDb()
          .select()
          .from(ticaretCustomers)
          .where(eq(ticaretCustomers.orgId, t.orgId))
          .orderBy(desc(ticaretCustomers.createdAt))
          .limit(500);
        res.json(rows);
      }),
    );

    router.get(
      '/stats',
      withTenant(async (_req, res, _next, t) => {
        const db = getDb();
        const [p] = await db.select({ count: sql<number>`count(*)::int` }).from(ticaretProducts).where(eq(ticaretProducts.orgId, t.orgId));
        const [c] = await db.select({ count: sql<number>`count(*)::int` }).from(ticaretCustomers).where(eq(ticaretCustomers.orgId, t.orgId));
        res.json({ totalProducts: p?.count ?? 0, totalCustomers: c?.count ?? 0 });
      }),
    );

    ctx.log('ticaret module registered', { routes: 6 });
  },
});
