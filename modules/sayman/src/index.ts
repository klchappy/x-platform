import { defineModule } from '@x/module-api';
import payablesRoutes from './routes/payables';
import paymentsRoutes from './routes/payments';
import partiesRoutes from './routes/parties';

export default defineModule({
  id: 'sayman',
  version: '1.0.0',
  async registerRoutes(router, ctx) {
    router.get('/health', (_req, res) => res.json({ ok: true, module: 'sayman', version: '1.0.0' }));
    router.get('/overview', (_req, res) =>
      res.json({
        name: 'Sayman',
        tagline: 'Muhasebe & ödeme takibi (full port)',
        capabilities: [
          'parties.companies',
          'parties.persons',
          'parties.institutions',
          'parties.banks',
          'payables.crud',
          'payables.auto_status',
          'payments.record',
          'payments.multi_partial',
          'cashflow.stats',
        ],
      }),
    );

    router.use('/payables', payablesRoutes);
    router.use('/payments', paymentsRoutes);
    router.use('/parties', partiesRoutes);

    ctx.log('sayman module fully ported', { schema: 'sayman', subRouters: 3 });
  },
});
