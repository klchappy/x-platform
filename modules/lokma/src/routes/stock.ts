import { Router } from 'express';
import { z } from 'zod';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { getDb } from '@x/db/client';
import { schema } from '@x/db';
import { httpError } from '@x/shared';
import { withTenant } from '@x/module-api';

const router = Router();
const { lokmaStockLots, lokmaStockMovements, lokmaIngredients } = schema;

const LotSchema = z.object({
  ingredient_id: z.string().uuid(),
  kitchen_id: z.string().uuid().optional(),
  lot_code: z.string().optional(),
  qty_received: z.number().positive(),
  unit: z.string().min(1),
  unit_price: z.number().nonnegative().default(0),
  received_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  supplier_name: z.string().optional(),
  notes: z.string().optional(),
});

const MovementSchema = z.object({
  ingredient_id: z.string().uuid(),
  kitchen_id: z.string().uuid().optional(),
  lot_id: z.string().uuid().optional(),
  movement_type: z.enum(['in', 'out_prod', 'out_waste', 'transfer', 'adjustment']),
  quantity: z.number(),
  unit: z.string().min(1),
  unit_price: z.number().nonnegative().optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

router.post(
  '/lots',
  withTenant(async (req, res, _next, t) => {
    const data = LotSchema.parse(req.body);
    const db = getDb();
    const [lot] = await db
      .insert(lokmaStockLots)
      .values({
        org_id: t.orgId,
        ingredient_id: data.ingredient_id,
        kitchen_id: data.kitchen_id ?? null,
        lot_code: data.lot_code ?? null,
        qty_received: data.qty_received,
        qty_remaining: data.qty_received,
        unit: data.unit,
        unit_price: data.unit_price,
        received_at: data.received_at ?? null,
        expiry_date: data.expiry_date ?? null,
        supplier_name: data.supplier_name ?? null,
        notes: data.notes ?? null,
      })
      .returning();
    // Stok girişi olarak movement kaydı oluştur
    await db.insert(lokmaStockMovements).values({
      org_id: t.orgId,
      ingredient_id: data.ingredient_id,
      kitchen_id: data.kitchen_id ?? null,
      lot_id: lot.id,
      movement_type: 'in',
      quantity: data.qty_received,
      unit: data.unit,
      unit_price: data.unit_price,
      reference_type: 'lot',
      reference_id: lot.id,
      notes: data.notes ?? null,
      created_by: t.userId,
    });
    // Son birim fiyatı güncelle
    await db
      .update(lokmaIngredients)
      .set({ last_unit_price: data.unit_price })
      .where(and(eq(lokmaIngredients.id, data.ingredient_id), eq(lokmaIngredients.org_id, t.orgId)));
    res.status(201).json(lot);
  }),
);

router.get(
  '/lots',
  withTenant(async (req, res, _next, t) => {
    const ingredient_id = typeof req.query.ingredient_id === 'string' ? req.query.ingredient_id : undefined;
    const conds = [eq(lokmaStockLots.org_id, t.orgId)];
    if (ingredient_id) conds.push(eq(lokmaStockLots.ingredient_id, ingredient_id));
    const rows = await getDb()
      .select()
      .from(lokmaStockLots)
      .where(and(...conds))
      .orderBy(desc(lokmaStockLots.created_at))
      .limit(300);
    res.json(rows);
  }),
);

router.post(
  '/movements',
  withTenant(async (req, res, _next, t) => {
    const data = MovementSchema.parse(req.body);
    const [row] = await getDb()
      .insert(lokmaStockMovements)
      .values({
        org_id: t.orgId,
        ingredient_id: data.ingredient_id,
        kitchen_id: data.kitchen_id ?? null,
        lot_id: data.lot_id ?? null,
        movement_type: data.movement_type,
        quantity: data.quantity,
        unit: data.unit,
        unit_price: data.unit_price ?? null,
        reason: data.reason ?? null,
        notes: data.notes ?? null,
        created_by: t.userId,
      })
      .returning();
    // out_* tipinde ise lot'tan düşür
    if ((data.movement_type === 'out_prod' || data.movement_type === 'out_waste') && data.lot_id) {
      await getDb()
        .update(lokmaStockLots)
        .set({ qty_remaining: sql`${lokmaStockLots.qty_remaining} - ${data.quantity}` })
        .where(and(eq(lokmaStockLots.id, data.lot_id), eq(lokmaStockLots.org_id, t.orgId)));
    }
    res.status(201).json(row);
  }),
);

router.get(
  '/movements',
  withTenant(async (req, res, _next, t) => {
    const ingredient_id = typeof req.query.ingredient_id === 'string' ? req.query.ingredient_id : undefined;
    const conds = [eq(lokmaStockMovements.org_id, t.orgId)];
    if (ingredient_id) conds.push(eq(lokmaStockMovements.ingredient_id, ingredient_id));
    const rows = await getDb()
      .select()
      .from(lokmaStockMovements)
      .where(and(...conds))
      .orderBy(desc(lokmaStockMovements.occurred_at))
      .limit(300);
    res.json(rows);
  }),
);

router.get(
  '/levels',
  withTenant(async (_req, res, _next, t) => {
    const rows = await getDb()
      .select({
        ingredient_id: lokmaStockLots.ingredient_id,
        on_hand: sql<number>`coalesce(sum(${lokmaStockLots.qty_remaining}), 0)::float`,
      })
      .from(lokmaStockLots)
      .where(eq(lokmaStockLots.org_id, t.orgId))
      .groupBy(lokmaStockLots.ingredient_id);
    res.json(rows);
  }),
);

router.get(
  '/expiring',
  withTenant(async (req, res, _next, t) => {
    const days = Number(req.query.days ?? '7');
    const limit = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const rows = await getDb()
      .select()
      .from(lokmaStockLots)
      .where(
        and(
          eq(lokmaStockLots.org_id, t.orgId),
          sql`${lokmaStockLots.expiry_date} <= ${limit}`,
          sql`${lokmaStockLots.qty_remaining} > 0`,
        ),
      )
      .orderBy(lokmaStockLots.expiry_date)
      .limit(100);
    res.json(rows);
  }),
);

export default router;
