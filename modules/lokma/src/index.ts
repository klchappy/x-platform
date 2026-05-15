import { defineModule } from '@x/module-api';
import ingredientsRoutes from './routes/ingredients';
import recipesRoutes from './routes/recipes';
import stockRoutes from './routes/stock';
import kitchensRoutes from './routes/kitchens';
import menuRoutes from './routes/menu';

export default defineModule({
  id: 'lokma',
  version: '1.0.0',
  async registerRoutes(router, ctx) {
    router.get('/health', (_req, res) =>
      res.json({ ok: true, module: 'lokma', version: '1.0.0' }),
    );
    router.get('/overview', (_req, res) =>
      res.json({
        name: 'Lokma',
        tagline: 'Mutfak yönetimi · Tarif · Stok · Menü planlama (full port)',
        capabilities: [
          'kitchens.crud',
          'suppliers.crud',
          'ingredients.crud',
          'recipes.crud',
          'stock.lots',
          'stock.movements',
          'stock.expiring',
          'menu.plans',
          'menu.items',
        ],
      }),
    );

    router.use('/kitchens', kitchensRoutes);
    router.use('/ingredients', ingredientsRoutes);
    router.use('/recipes', recipesRoutes);
    router.use('/stock', stockRoutes);
    router.use('/menu', menuRoutes);

    ctx.log('lokma module fully ported', { schema: 'lokma', subRouters: 5 });
  },
});
