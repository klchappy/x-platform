import { Router } from 'express';
import { z } from 'zod';
import { and, desc, eq } from 'drizzle-orm';
import { getDb } from '@x/db/client';
import { schema } from '@x/db';
import { httpError } from '@x/shared';
import { withTenant } from '@x/module-api';

const router = Router();
const { lokmaKitchens, lokmaSuppliers } = schema;

const KitchenSchema = z.object({
  name: z.string().min(2),
  kitchen_type: z.enum(['restaurant', 'hotel', 'home', 'catering', 'cloud_kitchen', 'cafeteria']).default('restaurant'),
  address: z.string().optional(),
  capacity: z.number().int().positive().optional(),
  timezone: z.string().default('Europe/Istanbul'),
});

const SupplierSchema = z.object({
  name: z.string().min(2),
  contact_person: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  payment_terms: z.string().optional(),
  tax_no: z.string().optional(),
});

router.post(
  '/',
  withTenant(async (req, res, _next, t) => {
    const data = KitchenSchema.parse(req.body);
    const [row] = await getDb().insert(lokmaKitchens).values({ org_id: t.orgId, ...data }).returning();
    res.status(201).json(row);
  }),
);

router.get(
  '/',
  withTenant(async (_req, res, _next, t) => {
    const rows = await getDb()
      .select()
      .from(lokmaKitchens)
      .where(and(eq(lokmaKitchens.org_id, t.orgId), eq(lokmaKitchens.is_active, true)))
      .orderBy(lokmaKitchens.name);
    res.json(rows);
  }),
);

router.post(
  '/suppliers',
  withTenant(async (req, res, _next, t) => {
    const data = SupplierSchema.parse(req.body);
    const [row] = await getDb()
      .insert(lokmaSuppliers)
      .values({ org_id: t.orgId, ...data, email: data.email || null })
      .returning();
    res.status(201).json(row);
  }),
);

router.get(
  '/suppliers',
  withTenant(async (_req, res, _next, t) => {
    const rows = await getDb()
      .select()
      .from(lokmaSuppliers)
      .where(and(eq(lokmaSuppliers.org_id, t.orgId), eq(lokmaSuppliers.is_active, true)))
      .orderBy(lokmaSuppliers.name);
    res.json(rows);
  }),
);

export default router;
