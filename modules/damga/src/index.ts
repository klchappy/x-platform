import { defineModule, withTenant } from '@x/module-api';
import attendanceRoutes from './routes/attendance';
import leavesRoutes from './routes/leaves';
import shiftsRoutes from './routes/shifts';
import locationsRoutes from './routes/locations';
import gamificationRoutes from './routes/gamification';

export default defineModule({
  id: 'damga',
  version: '1.0.0',
  async registerRoutes(router, ctx) {
    router.get('/health', (_req, res) => res.json({ ok: true, module: 'damga', version: '1.0.0' }));

    router.get('/overview', (_req, res) => {
      res.json({
        name: 'Damga',
        tagline: 'Şeffaf personel takibi (full port)',
        capabilities: [
          'attendance.checkin.hashchain',
          'attendance.checkout',
          'attendance.history',
          'attendance.verify',
          'shifts.template',
          'shifts.assignment',
          'leaves.request',
          'leaves.approve',
          'leaves.reject',
          'overtime.auto',
          'gamification.xp',
          'gamification.rewards',
          'locations.geofence',
          'locations.nfc',
          'locations.qr',
        ],
      });
    });

    router.use('/attendance', attendanceRoutes);
    router.use('/leaves', leavesRoutes);
    router.use('/shifts', shiftsRoutes);
    router.use('/locations', locationsRoutes);
    router.use('/gamification', gamificationRoutes);

    ctx.log('damga module fully ported', { schema: 'damga', subRouters: 5 });
  },
});
