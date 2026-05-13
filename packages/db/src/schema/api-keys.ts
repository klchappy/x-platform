import { pgTable, uuid, text, timestamp, boolean, jsonb, integer, index } from 'drizzle-orm/pg-core';
import { orgs } from './orgs.js';

export const apiKeys = pgTable(
  'api_keys',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').references(() => orgs.id, { onDelete: 'cascade' }),
    keyType: text('key_type').notNull().default('org_admin'),
    name: text('name').notNull(),
    keyHash: text('key_hash').notNull(),
    keyPrefix: text('key_prefix').notNull(),
    moduleScopes: jsonb('module_scopes').$type<string[]>().default([]),
    scopes: jsonb('scopes').$type<string[]>().default([]),
    rateLimitPerMin: integer('rate_limit_per_min').default(120),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    orgIdx: index('api_keys_org_idx').on(t.orgId),
    prefixIdx: index('api_keys_prefix_idx').on(t.keyPrefix),
  }),
);

export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
