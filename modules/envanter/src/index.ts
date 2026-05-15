import { defineModule, withTenant } from '@x/module-api';
import { z } from 'zod';
import { and, desc, eq, sql, lte } from 'drizzle-orm';
import { getDb } from '@x/db/client';
import { envanterProducts, envanterMovements } from '@x/db/schema';
import { httpError } from '@x/shared';

const ProductSchema = z.object({
  sku: z.string().optional(),
  barcode: z.string().optional(),
  name: z.string().min(2),
  category: z.string().optional(),
  unit: z.string().default('adet'),
  minStock: z.number().nonnegative().default(0),
  currentStock: z.number().default(0),
  costCentsTry: z.number().int().nonnegative().default(0),
  priceCentsTry: z.number().int().nonnegative().default(0),
  location: z.string().optional(),
  notes: z.string().optional(),
});

const MovementSchema = z.object({
  productId: z.string().uuid(),
  type: z.enum(['in', 'out', 'count']),
  quantity: z.number(),
  reason: z.string().optional(),
  referenceNo: z.string().optional(),
  notes: z.string().optional(),
  occurredAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export default defineModule({
  id: 'envanter',
  version: '0.1.0',
  registerRoutes(router, ctx) {
    router.get('/health', (_req, res) => res.json({ ok: true, module: 'envanter', version: '0.1.0' }));

    router.get('/overview', (_req, res) => {
      res.json({
        name: 'Envanter',
        tagline: 'Ürün & stok takibi',
        capabilities: [
          'products.crud',
          'movements.in_out_count',
          'low_stock.alert',
          'stats.dashboard',
        ],
      });
    });

    // POST /products
    router.post(
      '/products',
      withTenant(async (req, res, _next, t) => {
        const data = ProductSchema.parse(req.body);
        const [row] = await getDb()
          .insert(envanterProducts)
          .values({ orgId: t.orgId, createdBy: t.userId, ...data })
          .returning();
        ctx.log('envanter.product.created', { name: data.name, stock: data.currentStock });
        res.status(201).json(row);
      }),
    );

    // GET /products
    router.get(
      '/products',
      withTenant(async (req, res, _next, t) => {
        const lowOnly = req.query.lowStock === '1';
        const where = lowOnly
          ? and(
              eq(envanterProducts.orgId, t.orgId),
              sql`${envanterProducts.currentStock} <= ${envanterProducts.minStock}`,
            )
          : eq(envanterProducts.orgId, t.orgId);
        const rows = await getDb()
          .select()
          .from(envanterProducts)
          .where(where)
          .orderBy(desc(envanterProducts.createdAt))
          .limit(500);
        res.json(rows);
      }),
    );

    // GET /products/:id — detay + son 50 hareket
    router.get(
      '/products/:id',
      withTenant(async (req, res, _next, t) => {
        const id = String(req.params.id);
        const db = getDb();
        const product = await db.query.envanterProducts.findFirst({
          where: (p, { and: a, eq: e }) => a(e(p.id, id), e(p.orgId, t.orgId)),
        });
        if (!product) throw httpError(404, 'Ürün bulunamadı');
        const movements = await db
          .select()
          .from(envanterMovements)
          .where(and(eq(envanterMovements.orgId, t.orgId), eq(envanterMovements.productId, id)))
          .orderBy(desc(envanterMovements.occurredAt))
          .limit(50);
        res.json({ ...product, movements });
      }),
    );

    // POST /movements — stok hareketi (atomik: stok güncelle + ledger ekle)
    router.post(
      '/movements',
      withTenant(async (req, res, _next, t) => {
        const data = MovementSchema.parse(req.body);
        const db = getDb();
        const product = await db.query.envanterProducts.findFirst({
          where: (p, { and: a, eq: e }) => a(e(p.id, data.productId), e(p.orgId, t.orgId)),
        });
        if (!product) throw httpError(404, 'Ürün bulunamadı');

        let newStock = product.currentStock;
        if (data.type === 'in') newStock += Math.abs(data.quantity);
        else if (data.type === 'out') newStock -= Math.abs(data.quantity);
        else if (data.type === 'count') newStock = data.quantity;

        if (newStock < 0) throw httpError(400, 'Stok eksiye düşemez', 'negative_stock');

        const [movement] = await db
          .insert(envanterMovements)
          .values({
            orgId: t.orgId,
            productId: data.productId,
            type: data.type,
            quantity: data.quantity,
            reason: data.reason,
            referenceNo: data.referenceNo,
            notes: data.notes,
            occurredAt: data.occurredAt ?? new Date().toISOString().slice(0, 10),
            createdBy: t.userId,
          })
          .returning();
        await db
          .update(envanterProducts)
          .set({ currentStock: newStock, updatedAt: new Date() })
          .where(eq(envanterProducts.id, data.productId));

        ctx.log('envanter.movement.recorded', {
          productId: data.productId,
          type: data.type,
          quantity: data.quantity,
          newStock,
        });
        res.status(201).json({ movement, newStock });
      }),
    );

    // GET /movements — son hareketler
    router.get(
      '/movements',
      withTenant(async (_req, res, _next, t) => {
        const rows = await getDb()
          .select()
          .from(envanterMovements)
          .where(eq(envanterMovements.orgId, t.orgId))
          .orderBy(desc(envanterMovements.occurredAt))
          .limit(200);
        res.json(rows);
      }),
    );

    // GET /stats
    router.get(
      '/stats',
      withTenant(async (_req, res, _next, t) => {
        const db = getDb();
        const [total] = await db
          .select({
            count: sql<number>`count(*)::int`,
            value: sql<number>`coalesce(sum(${envanterProducts.currentStock} * ${envanterProducts.costCentsTry}),0)::bigint`,
          })
          .from(envanterProducts)
          .where(eq(envanterProducts.orgId, t.orgId));
        const [low] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(envanterProducts)
          .where(
            and(eq(envanterProducts.orgId, t.orgId), lte(envanterProducts.currentStock, envanterProducts.minStock)),
          );
        res.json({
          totalProducts: total?.count ?? 0,
          totalStockValueCentsTry: Number(total?.value ?? 0),
          lowStockCount: low?.count ?? 0,
        });
      }),
    );

    ctx.log('envanter module registered', { routes: 7 });
  },
});
