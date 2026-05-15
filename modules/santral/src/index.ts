import { defineModule } from '@x/module-api';
import contactsRoutes from './routes/contacts';
import callsRoutes from './routes/calls';
import tasksRoutes from './routes/tasks';

export default defineModule({
  id: 'santral',
  version: '1.0.0',
  async registerRoutes(router, ctx) {
    router.get('/health', (_req, res) =>
      res.json({ ok: true, module: 'santral', version: '1.0.0' }),
    );
    router.get('/overview', (_req, res) =>
      res.json({
        name: 'Santral',
        tagline: 'Sekreterlik, fihrist, çağrı & görev takibi (full port)',
        capabilities: [
          'contacts.crud',
          'contacts.search',
          'directory.org',
          'calls.log',
          'calls.stats',
          'tasks.crud',
          'tasks.kanban',
          'calendar.events',
        ],
      }),
    );

    router.use('/contacts', contactsRoutes);
    router.use('/calls', callsRoutes);
    router.use('/tasks', tasksRoutes);

    ctx.log('santral module fully ported', { schema: 'santral', subRouters: 3 });
  },
});
