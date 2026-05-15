import { Router } from 'express';
import { z } from 'zod';
import { and, desc, eq } from 'drizzle-orm';
import { getDb } from '@x/db/client';
import { schema } from '@x/db';
import { httpError } from '@x/shared';
import { withTenant } from '@x/module-api';

const router = Router();
const { damgaLocations } = schema;

const LocationSchema = z.object({
  name: z.string().min(2),
  address: z.string().optional(),
  city: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  geofence_radius_m: z.number().int().positive().default(100),
  wifi_bssids: z.array(z.string()).default([]),
  work_hours_start: z.string().regex(/^\d{2}:\d{2}$/).default('09:00'),
  work_hours_end: z.string().regex(/^\d{2}:\d{2}$/).default('18:00'),
});

router.post(
  '/',
  withTenant(async (req, res, _next, t) => {
    if (!['owner', 'admin'].includes(t.role)) throw httpError(403, 'Yetkisiz', 'forbidden');
    const data = LocationSchema.parse(req.body);
    const [row] = await getDb()
      .insert(damgaLocations)
      .values({ org_id: t.orgId, ...data })
      .returning();
    res.status(201).json(row);
  }),
);

router.get(
  '/',
  withTenant(async (_req, res, _next, t) => {
    const rows = await getDb()
      .select()
      .from(damgaLocations)
      .where(eq(damgaLocations.org_id, t.orgId))
      .orderBy(desc(damgaLocations.created_at));
    res.json(rows);
  }),
);

router.get(
  '/:id',
  withTenant(async (req, res, _next, t) => {
    const id = String(req.params.id);
    const row = await getDb().query.damgaLocations.findFirst({
      where: (l, { and: a, eq: e }) => a(e(l.id, id), e(l.org_id, t.orgId)),
    });
    if (!row) throw httpError(404, 'Lokasyon bulunamadı');
    res.json(row);
  }),
);

export default router;
