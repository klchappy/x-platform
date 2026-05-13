import { Router } from 'express';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { getDb } from '@x/db/client';
import { subscriptions } from '@x/db/schema';
import { PLANS, PLAN_BY_ID, httpError } from '@x/shared';
import { requireAuth, requireOrg, requireRole } from '../middleware/auth.js';
import { getActivePlan, getUsage, currentMonthKey } from '../lib/quota.js';

const router = Router();

// Public plan catalog (no auth)
router.get('/plans', (_req, res) => {
  res.json({ plans: PLANS });
});

router.use(requireAuth);

router.get('/current', requireOrg, async (req, res, next) => {
  try {
    const orgId = req.authOrgId!;
    const plan = await getActivePlan(orgId);
    const period = currentMonthKey();
    const sub = await getDb()
      .query.subscriptions.findFirst({ where: (s, { eq: e }) => e(s.orgId, orgId) })
      .catch(() => null);
    const aiTokens = await getUsage(orgId, 'ai_tokens', period, plan.quotas.aiTokensPerMonth);

    res.json({
      plan,
      subscription: sub,
      usage: {
        period,
        ai_tokens: aiTokens,
      },
    });
  } catch (e) {
    next(e);
  }
});

const SwitchPlanSchema = z.object({ planId: z.string() });

router.post('/switch', requireOrg, requireRole('owner'), async (req, res, next) => {
  try {
    const { planId } = SwitchPlanSchema.parse(req.body);
    const plan = PLAN_BY_ID[planId];
    if (!plan) throw httpError(404, 'Plan bulunamadı', 'plan_not_found');

    const orgId = req.authOrgId!;
    const db = getDb();
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const existing = await db.query.subscriptions.findFirst({ where: (s, { eq: e }) => e(s.orgId, orgId) });

    if (existing) {
      const [updated] = await db
        .update(subscriptions)
        .set({
          planId,
          status: plan.priceMonthlyTry === 0 ? 'active' : 'trialing',
          periodStart: now,
          periodEnd,
          updatedAt: now,
        })
        .where(eq(subscriptions.id, existing.id))
        .returning();
      res.json({ ok: true, subscription: updated, requires_payment: plan.priceMonthlyTry > 0 });
    } else {
      const [created] = await db
        .insert(subscriptions)
        .values({
          orgId,
          planId,
          status: plan.priceMonthlyTry === 0 ? 'active' : 'trialing',
          periodStart: now,
          periodEnd,
        })
        .returning();
      res.json({ ok: true, subscription: created, requires_payment: plan.priceMonthlyTry > 0 });
    }
  } catch (e) {
    next(e);
  }
});

export default router;
