import { pgTable, uuid, text, timestamp, integer, jsonb, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { orgs } from './orgs';

/**
 * POST/PUT/PATCH/DELETE retry koruması. 24h TTL.
 * (Idempotency-Key, method, path) -> cached response.
 */
export const idempotencyKeys = pgTable(
  'idempotency_keys',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    key: text('key').notNull(),
    method: text('method').notNull(),
    path: text('path').notNull(),
    requestHash: text('request_hash').notNull(),
    responseStatus: integer('response_status'),
    responseBody: jsonb('response_body'),
    orgId: uuid('org_id').references(() => orgs.id, { onDelete: 'cascade' }),
    apiKeyId: uuid('api_key_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    keyMethodPathUq: uniqueIndex('idempotency_key_method_path_uq').on(t.key, t.method, t.path),
    createdIdx: index('idempotency_created_idx').on(t.createdAt),
  }),
);

export type IdempotencyRecord = typeof idempotencyKeys.$inferSelect;
