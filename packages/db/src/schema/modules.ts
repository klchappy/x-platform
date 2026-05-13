import { pgTable, uuid, text, timestamp, boolean, jsonb, uniqueIndex } from 'drizzle-orm/pg-core';
import { orgs } from './orgs.js';

export const orgModules = pgTable(
  'org_modules',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => orgs.id, { onDelete: 'cascade' }),
    moduleId: text('module_id').notNull(),
    isEnabled: boolean('is_enabled').notNull().default(true),
    config: jsonb('config').$type<Record<string, unknown>>().default({}),
    enabledAt: timestamp('enabled_at', { withTimezone: true }).defaultNow().notNull(),
    disabledAt: timestamp('disabled_at', { withTimezone: true }),
  },
  (t) => ({
    orgModuleUq: uniqueIndex('org_modules_org_module_uq').on(t.orgId, t.moduleId),
  }),
);

export type OrgModule = typeof orgModules.$inferSelect;
export type NewOrgModule = typeof orgModules.$inferInsert;
