import { pgTable, uuid, text, timestamp, boolean, jsonb, index } from 'drizzle-orm/pg-core';
import { orgs } from './orgs';

export const integrationConnections = pgTable(
  'integration_connections',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => orgs.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull(),
    serviceType: text('service_type').notNull(),
    name: text('name').notNull(),
    moduleId: text('module_id'),
    config: jsonb('config').$type<Record<string, unknown>>().default({}),
    encryptedSecrets: jsonb('encrypted_secrets').$type<Record<string, unknown>>().default({}),
    isActive: boolean('is_active').notNull().default(true),
    healthStatus: text('health_status').default('unknown'),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    orgIdx: index('integration_connections_org_idx').on(t.orgId),
    providerIdx: index('integration_connections_provider_idx').on(t.provider),
  }),
);

export type IntegrationConnection = typeof integrationConnections.$inferSelect;
export type NewIntegrationConnection = typeof integrationConnections.$inferInsert;
