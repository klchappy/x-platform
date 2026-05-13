import { pgTable, text, integer, jsonb, timestamp, boolean, uuid, index } from 'drizzle-orm/pg-core';
import { orgs } from './orgs';

export const plans = pgTable('plans', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  tagline: text('tagline'),
  priceCentsTry: integer('price_cents_try').notNull().default(0),
  isPublic: boolean('is_public').notNull().default(true),
  trialDays: integer('trial_days').notNull().default(14),
  features: jsonb('features').$type<string[]>().notNull().default([]),
  moduleIds: jsonb('module_ids').$type<string[]>().notNull().default([]),
  quotas: jsonb('quotas')
    .$type<{
      max_users: number;
      max_orgs_per_owner: number;
      ai_tokens_per_month: number;
      storage_mb: number;
      api_calls_per_day: number;
    }>()
    .notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => orgs.id, { onDelete: 'cascade' }),
    planId: text('plan_id')
      .notNull()
      .references(() => plans.id),
    status: text('status').notNull().default('trialing'),
    periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
    periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
    cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
    canceledAt: timestamp('canceled_at', { withTimezone: true }),
    iyzicoSubscriptionRef: text('iyzico_subscription_ref'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    orgIdx: index('subscriptions_org_idx').on(t.orgId),
    statusIdx: index('subscriptions_status_idx').on(t.status, t.periodEnd),
  }),
);

export const usageCounters = pgTable(
  'usage_counters',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => orgs.id, { onDelete: 'cascade' }),
    metric: text('metric').notNull(),
    periodKey: text('period_key').notNull(),
    counter: integer('counter').notNull().default(0),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    orgPeriodIdx: index('usage_counters_org_period_idx').on(t.orgId, t.metric, t.periodKey),
  }),
);

export const aiUsage = pgTable(
  'ai_usage',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => orgs.id, { onDelete: 'cascade' }),
    userId: uuid('user_id'),
    moduleId: text('module_id'),
    provider: text('provider').notNull(),
    model: text('model').notNull(),
    inputTokens: integer('input_tokens').notNull().default(0),
    outputTokens: integer('output_tokens').notNull().default(0),
    totalTokens: integer('total_tokens').notNull().default(0),
    costCentsTry: integer('cost_cents_try').notNull().default(0),
    purpose: text('purpose'),
    success: boolean('success').notNull().default(true),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    orgTimeIdx: index('ai_usage_org_time_idx').on(t.orgId, t.createdAt),
    providerIdx: index('ai_usage_provider_idx').on(t.provider, t.createdAt),
  }),
);

export type Plan = typeof plans.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type UsageCounter = typeof usageCounters.$inferSelect;
export type AiUsageRow = typeof aiUsage.$inferSelect;
