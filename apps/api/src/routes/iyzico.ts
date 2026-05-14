import { Router } from 'express';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { getDb } from '@x/db/client';
import { subscriptions } from '@x/db/schema';
import { PLAN_BY_ID, httpError } from '@x/shared';
import { requireAuth, requireOrg, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const InitSchema = z.object({ planId: z.string() });

/**
 * Iyzico CheckoutForm initialization (placeholder).
 * When IYZICO_API_KEY + IYZICO_SECRET_KEY are configured, this would call
 * https://api.iyzipay.com/payment/iyzipos/checkoutform/initialize/auth/ecom
 * and return the iframe URL.
 * Until then, it returns a "not configured" response.
 */
router.post('/checkout/init', requireOrg, requireRole('owner'), async (req, res, next) => {
  try {
    const { planId } = InitSchema.parse(req.body);
    const plan = PLAN_BY_ID[planId];
    if (!plan) throw httpError(404, 'Plan bulunamadı', 'plan_not_found');
    if (plan.priceMonthlyTry === 0) {
      throw httpError(400, 'Ücretsiz plan için ödeme gerekmez', 'free_plan');
    }

    const apiKey = process.env.IYZICO_API_KEY;
    const secret = process.env.IYZICO_SECRET_KEY;
    if (!apiKey || !secret) {
      // Placeholder — return offline mock so frontend can render UI
      return res.json({
        status: 'iyzico_not_configured',
        message:
          'Iyzico API anahtarları henüz yapılandırılmadı. IYZICO_API_KEY + IYZICO_SECRET_KEY environment variables ekleyin.',
        plan: { id: plan.id, name: plan.name, priceMonthlyTry: plan.priceMonthlyTry },
        mock_checkout_url: null,
      });
    }

    // TODO: real Iyzico CheckoutForm initialize call
    res.json({
      status: 'pending_implementation',
      message: 'Iyzico entegrasyonu yakında — anahtarlar mevcut ama checkout API henüz bağlanmadı.',
    });
  } catch (e) {
    next(e);
  }
});

/**
 * Iyzico webhook handler for successful payments.
 * Configure in Iyzico panel: https://x.deploi.net/v1/iyzico/webhook
 */
router.post('/webhook', async (req, res, next) => {
  try {
    if (!process.env.IYZICO_SECRET_KEY) {
      return res.status(503).json({ error: 'Iyzico webhook not configured' });
    }
    // TODO: verify Iyzico signature, lookup conversationId → org subscription,
    //       update subscriptions.status to 'active'
    res.json({ received: true, todo: true });
  } catch (e) {
    next(e);
  }
});

router.get('/status', (_req, res) => {
  res.json({
    configured: !!(process.env.IYZICO_API_KEY && process.env.IYZICO_SECRET_KEY),
    sandbox: (process.env.IYZICO_BASE_URL ?? '').includes('sandbox'),
  });
});

export default router;
