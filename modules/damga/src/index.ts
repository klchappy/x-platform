import { defineModule } from '@x/module-api';

export default defineModule({
  id: 'damga',
  version: '0.1.0',
  registerRoutes(router, ctx) {
    router.get('/health', (_req, res) => {
      res.json({ ok: true, module: 'damga', version: '0.1.0' });
    });
    router.get('/overview', (_req, res) => {
      res.json({
        name: 'Damga',
        tagline: 'Şeffaf personel takibi',
        capabilities: [
          'attendance.checkin',
          'attendance.checkout',
          'verification.nfc',
          'verification.qr',
          'verification.gps',
          'shifts.plan',
          'shifts.swap',
          'leaves.request',
          'overtime.calc',
          'gamification.xp',
          'audit.hashchain',
        ],
        roadmap: [
          'Phase 1: shell entegrasyonu + sağlık endpoint (✓)',
          'Phase 2: attendance_events + hash-chain port',
          'Phase 3: shift/leave/overtime API',
          'Phase 4: NFC/QR mobile + gamification',
        ],
      });
    });
    ctx.log('damga module registered', { routes: 2 });
  },
});
