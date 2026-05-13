import { Router } from 'express';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { getDb } from '@x/db/client';
import { orgs, orgModules } from '@x/db/schema';
import { ModuleIdSchema, httpError } from '@x/shared';
import { requireAuth, requireOrg, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/current', requireOrg, async (req, res, next) => {
  try {
    const org = await getDb().query.orgs.findFirst({ where: eq(orgs.id, req.authOrgId!) });
    if (!org) throw httpError(404, 'Org not found');
    res.json(org);
  } catch (e) {
    next(e);
  }
});

const UpdateOrgSchema = z.object({
  name: z.string().min(2).optional(),
  sectorBundle: z.string().optional(),
  settings: z.record(z.unknown()).optional(),
});

router.patch('/current', requireOrg, requireRole('owner', 'admin'), async (req, res, next) => {
  try {
    const patch = UpdateOrgSchema.parse(req.body);
    const [updated] = await getDb()
      .update(orgs)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(orgs.id, req.authOrgId!))
      .returning();
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

const ToggleSchema = z.object({ moduleId: ModuleIdSchema, enabled: z.boolean() });

router.post('/current/modules/toggle', requireOrg, requireRole('owner', 'admin'), async (req, res, next) => {
  try {
    const { moduleId, enabled } = ToggleSchema.parse(req.body);
    const existing = await getDb().query.orgModules.findFirst({
      where: (m, { and, eq }) => and(eq(m.orgId, req.authOrgId!), eq(m.moduleId, moduleId)),
    });
    if (existing) {
      const [u] = await getDb()
        .update(orgModules)
        .set({ isEnabled: enabled, disabledAt: enabled ? null : new Date() })
        .where(eq(orgModules.id, existing.id))
        .returning();
      res.json(u);
    } else {
      const [n] = await getDb()
        .insert(orgModules)
        .values({ orgId: req.authOrgId!, moduleId, isEnabled: enabled })
        .returning();
      res.json(n);
    }
  } catch (e) {
    next(e);
  }
});

export default router;
