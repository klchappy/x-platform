import { Router } from 'express';
import { z } from 'zod';
import { and, desc, eq, sql } from 'drizzle-orm';
import { getDb } from '@x/db/client';
import { schema } from '@x/db';
import { httpError } from '@x/shared';
import { withTenant } from '@x/module-api';

const router = Router();
const { damgaXpTransactions, damgaRewards, damgaUserRedemptions } = schema;

const RewardSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  icon: z.string().default('🎁'),
  cost_xp: z.number().int().positive(),
  stock: z.number().int().nonnegative().optional(),
  per_user_limit: z.number().int().nonnegative().optional(),
});

router.get(
  '/me',
  withTenant(async (_req, res, _next, t) => {
    const db = getDb();
    const [agg] = await db
      .select({ total: sql<number>`coalesce(sum(${damgaXpTransactions.amount}),0)::int` })
      .from(damgaXpTransactions)
      .where(and(eq(damgaXpTransactions.org_id, t.orgId), eq(damgaXpTransactions.user_id, t.userId)));
    const recent = await db
      .select()
      .from(damgaXpTransactions)
      .where(and(eq(damgaXpTransactions.org_id, t.orgId), eq(damgaXpTransactions.user_id, t.userId)))
      .orderBy(desc(damgaXpTransactions.created_at))
      .limit(20);
    const totalXp = agg?.total ?? 0;
    const level = Math.floor(Math.sqrt(totalXp / 100)) + 1;
    res.json({ totalXp, level, recent });
  }),
);

router.get(
  '/leaderboard',
  withTenant(async (_req, res, _next, t) => {
    const rows = await getDb()
      .select({
        user_id: damgaXpTransactions.user_id,
        total: sql<number>`coalesce(sum(${damgaXpTransactions.amount}),0)::int`,
      })
      .from(damgaXpTransactions)
      .where(eq(damgaXpTransactions.org_id, t.orgId))
      .groupBy(damgaXpTransactions.user_id)
      .orderBy(desc(sql`total`))
      .limit(20);
    res.json(rows);
  }),
);

router.post(
  '/rewards',
  withTenant(async (req, res, _next, t) => {
    if (!['owner', 'admin'].includes(t.role)) throw httpError(403, 'Yetkisiz', 'forbidden');
    const data = RewardSchema.parse(req.body);
    const [row] = await getDb().insert(damgaRewards).values({ org_id: t.orgId, ...data }).returning();
    res.status(201).json(row);
  }),
);

router.get(
  '/rewards',
  withTenant(async (_req, res, _next, t) => {
    const rows = await getDb()
      .select()
      .from(damgaRewards)
      .where(and(eq(damgaRewards.org_id, t.orgId), eq(damgaRewards.is_active, true)))
      .orderBy(damgaRewards.cost_xp);
    res.json(rows);
  }),
);

router.post(
  '/rewards/:id/redeem',
  withTenant(async (req, res, _next, t) => {
    const id = String(req.params.id);
    const db = getDb();
    const reward = await db.query.damgaRewards.findFirst({
      where: (r, { and: a, eq: e }) => a(e(r.id, id), e(r.org_id, t.orgId), e(r.is_active, true)),
    });
    if (!reward) throw httpError(404, 'Ödül bulunamadı');

    const [agg] = await db
      .select({ total: sql<number>`coalesce(sum(${damgaXpTransactions.amount}),0)::int` })
      .from(damgaXpTransactions)
      .where(and(eq(damgaXpTransactions.org_id, t.orgId), eq(damgaXpTransactions.user_id, t.userId)));
    const balance = agg?.total ?? 0;
    if (balance < reward.cost_xp) throw httpError(400, 'Yetersiz XP', 'insufficient_xp');

    const [xp] = await db
      .insert(damgaXpTransactions)
      .values({
        org_id: t.orgId,
        user_id: t.userId,
        source: 'redeem',
        amount: -reward.cost_xp,
        description: `Ödül: ${reward.name}`,
        ref_id: reward.id,
        ref_type: 'reward',
      })
      .returning();
    const [redemption] = await db
      .insert(damgaUserRedemptions)
      .values({
        org_id: t.orgId,
        user_id: t.userId,
        reward_id: reward.id,
        cost_xp: reward.cost_xp,
        xp_transaction_id: xp.id,
      })
      .returning();
    res.status(201).json(redemption);
  }),
);

export default router;
