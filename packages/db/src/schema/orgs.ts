import { pgTable, uuid, text, timestamp, jsonb, boolean, index } from 'drizzle-orm/pg-core';

export const orgs = pgTable(
  'orgs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    sectorBundle: text('sector_bundle'),
    plan: text('plan').notNull().default('trial'),
    trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
    settings: jsonb('settings').$type<Record<string, unknown>>().default({}),
    kvkkConsentText: text('kvkk_consent_text'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    slugIdx: index('orgs_slug_idx').on(t.slug),
  }),
);

export type Org = typeof orgs.$inferSelect;
export type NewOrg = typeof orgs.$inferInsert;
