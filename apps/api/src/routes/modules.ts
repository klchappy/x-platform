import { Router } from 'express';
import { MODULES, SECTOR_BUNDLES } from '@x/shared';

const router = Router();

router.get('/catalog', (_req, res) => {
  res.json({ modules: MODULES, sectorBundles: SECTOR_BUNDLES });
});

export default router;
