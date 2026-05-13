import { defineModule } from '@x/module-api';

export default defineModule({
  id: 'lokma',
  version: '0.1.0',
  registerRoutes(router, ctx) {
    router.get('/health', (_req, res) => {
      res.json({ ok: true, module: 'lokma', version: '0.1.0' });
    });
    router.get('/overview', (_req, res) => {
      res.json({
        name: 'Lokma',
        tagline: 'Mutfak işletim sistemi',
        capabilities: [
          'recipes.scale',
          'ingredients.catalog',
          'stock.lot.fefo',
          'stock.movement.audit',
          'suppliers.po',
          'menu.weekly.plan',
          'menu.shopping.list',
          'ai.recipe.suggest',
          'waste.tracking',
          'cost.cogs',
        ],
        roadmap: [
          'Phase 1: shell + AI öneri köprüsü (✓)',
          'Phase 2: kitchens + recipes + ingredients port',
          'Phase 3: stok lot + tedarikçi + satın alma',
          'Phase 4: menü planı + alışveriş listesi + maliyetlendirme',
        ],
      });
    });
    ctx.log('lokma module registered', { routes: 2 });
  },
});
