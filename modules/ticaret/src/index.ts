import { defineModule } from '@x/module-api';

export default defineModule({
  id: 'ticaret',
  version: '0.1.0',
  registerRoutes(router, ctx) {
    router.get('/health', (_req, res) => {
      res.json({ ok: true, module: 'ticaret', version: '0.1.0' });
    });
    router.get('/overview', (_req, res) => {
      res.json({
        name: 'Ticaret',
        tagline: 'Üretim & ihracat ERP',
        capabilities: [
          'sales.quote.order.shipment',
          'inventory.goods.barcode.qr',
          'purchase.supplier.po',
          'cash.register.zreport',
          'einvoice.efatura',
          'kep.secure.mail',
          'approval.workflow.discount',
          'risk.score.customer',
          'pricing.dynamic.tier',
          'labels.zpl.barcode',
        ],
        roadmap: [
          'Phase 1: shell entegrasyonu (✓)',
          'Phase 2: customer + supplier + product/variant',
          'Phase 3: sales + shipment + goods receipt',
          'Phase 4: e-Fatura + KEP + cash register + onay akışları',
        ],
      });
    });
    ctx.log('ticaret module registered', { routes: 2 });
  },
});
