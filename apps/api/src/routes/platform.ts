import { Router } from 'express';
import { z } from 'zod';
import { getDb } from '@x/db/client';
import { orgs, users, orgModules } from '@x/db/schema';
import { MODULE_IDS, httpError } from '@x/shared';
import { requireAuth, requirePlatformAdmin } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth, requirePlatformAdmin);

router.get('/orgs', async (_req, res, next) => {
  try {
    const rows = await getDb().select().from(orgs);
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

const CreateOrgSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  ownerEmail: z.string().email(),
  ownerName: z.string().optional(),
  sectorBundle: z.string().optional(),
});

router.post('/orgs', async (req, res, next) => {
  try {
    const data = CreateOrgSchema.parse(req.body);
    const db = getDb();
    const existing = await db.query.orgs.findFirst({ where: (o, { eq }) => eq(o.slug, data.slug) });
    if (existing) throw httpError(409, 'Slug already in use', 'slug_taken');

    const [org] = await db
      .insert(orgs)
      .values({
        name: data.name,
        slug: data.slug,
        sectorBundle: data.sectorBundle,
        plan: 'trial',
      })
      .returning();

    await db.insert(users).values({
      orgId: org.id,
      email: data.ownerEmail,
      fullName: data.ownerName,
      role: 'owner',
    });

    for (const mid of MODULE_IDS) {
      await db.insert(orgModules).values({ orgId: org.id, moduleId: mid, isEnabled: true });
    }

    res.status(201).json(org);
  } catch (e) {
    next(e);
  }
});

export default router;
