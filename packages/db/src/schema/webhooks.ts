import { pgTable, uuid, text, timestamp, boolean, jsonb, integer, index } from 'drizzle-orm/pg-core';
import { orgs } from './orgs';

export const webhooks = pgTable(
  'webhooks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => orgs.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    events: jsonb('events').$type<string[]>().notNull().default([]),
    secret: text('secret').notNull(),
    description: text('description'),
    isActive: boolean('is_active').notNull().default(true),
    failureCount: integer('failure_count').notNull().default(0),
    lastFailureAt: timestamp('last_failure_at', { withTimezone: true }),
    lastSuccessAt: timestamp('last_success_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    orgIdx: index('webhooks_org_idx').on(t.orgId),
  }),
);

export const webhookDeliveries = pgTable(
  'webhook_deliveries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    webhookId: uuid('webhook_id')
      .notNull()
      .references(() => webhooks.id, { onDelete: 'cascade' }),
    eventType: text('event_type').notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
    responseStatus: integer('response_status'),
    responseBody: text('response_body'),
    attempts: integer('attempts').notNull().default(0),
    nextRetryAt: timestamp('next_retry_at', { withTimezone: true }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    failedAt: timestamp('failed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    webhookIdx: index('webhook_deliveries_webhook_idx').on(t.webhookId, t.createdAt),
  }),
);

export type Webhook = typeof webhooks.$inferSelect;
export type WebhookDelivery = typeof webhookDeliveries.$inferSelect;
