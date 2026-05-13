import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    ok: true,
    service: 'x-api',
    time: new Date().toISOString(),
    uptime_sec: Math.floor(process.uptime()),
  });
});

export default router;
