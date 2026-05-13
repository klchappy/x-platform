import { and, eq, sql } from 'drizzle-orm';
import { getDb } from '@x/db/client';
import { subscriptions, usageCounters, plans } from '@x/db/schema';
import { PLAN_BY_ID, type PlanDef } from '@x/shared';

export function currentMonthKey(d = new Date()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function todayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

const ACTIVE_SUB_STATUSES = ['active', 'trialing'];

export async function getActivePlan(orgId: string): Promise<PlanDef> {
  const db = getDb();
  try {
    const sub = await db.query.subscriptions.findFirst({
      where: (s, { and: a, eq: e, inArray: ia }) =>
        a(e(s.orgId, orgId), ia(s.status, ACTIVE_SUB_STATUSES)),
      orderBy: (s, { desc: d }) => [d(s.createdAt)],
    });
    if (sub) {
      const p = PLAN_BY_ID[sub.planId];
      if (p) return p;
    }
  } catch {
    // DB not migrated yet — fall back to free
  }
  return PLAN_BY_ID['free']!;
}

export interface UsageResult {
  metric: string;
  used: number;
  limit: number;
  remaining: number;
  periodKey: string;
}

export async function getUsage(orgId: string, metric: string, periodKey: string, limit: number): Promise<UsageResult> {
  const db = getDb();
  try {
    const row = await db.query.usageCounters.findFirst({
      where: (u, { and: a, eq: e }) => a(e(u.orgId, orgId), e(u.metric, metric), e(u.periodKey, periodKey)),
    });
    const used = row?.counter ?? 0;
    return { metric, used, limit, remaining: Math.max(0, limit - used), periodKey };
  } catch {
    return { metric, used: 0, limit, remaining: limit, periodKey };
  }
}

export async function incrUsage(orgId: string, metric: string, periodKey: string, delta: number): Promise<void> {
  const db = getDb();
  try {
    const existing = await db.query.usageCounters.findFirst({
      where: (u, { and: a, eq: e }) => a(e(u.orgId, orgId), e(u.metric, metric), e(u.periodKey, periodKey)),
    });
    if (existing) {
      await db
        .update(usageCounters)
        .set({ counter: existing.counter + delta, updatedAt: new Date() })
        .where(eq(usageCounters.id, existing.id));
    } else {
      await db.insert(usageCounters).values({ orgId, metric, periodKey, counter: delta });
    }
  } catch {
    // ignored: usage tracking is best-effort
  }
}
