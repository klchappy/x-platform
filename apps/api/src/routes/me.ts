import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { getDb } from '@x/db/client';
import { orgs, orgModules } from '@x/db/schema';
import { MODULES, type ModuleId } from '@x/shared';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const user = req.authUser!;
    let org = null;
    let modules: { id: ModuleId; enabled: boolean }[] = [];
    if (user.orgId) {
      org = await getDb().query.orgs.findFirst({ where: eq(orgs.id, user.orgId) });
      const enabled = await getDb()
        .select()
        .from(orgModules)
        .where(eq(orgModules.orgId, user.orgId));
      modules = enabled.map((m) => ({ id: m.moduleId as ModuleId, enabled: m.isEnabled }));
    }
    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isPlatformAdmin: user.isPlatformAdmin,
        orgId: user.orgId,
      },
      org,
      modules,
      catalog: MODULES,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
