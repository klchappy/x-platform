import { pgTable, uuid, text, timestamp, integer, jsonb, index } from 'drizzle-orm/pg-core';
import { orgs } from './orgs';
import { users } from './users';

export const santralContacts = pgTable(
  'santral_contacts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => orgs.id, { onDelete: 'cascade' }),
    fullName: text('full_name').notNull(),
    company: text('company'),
    title: text('title'),
    email: text('email'),
    phone: text('phone'),
    phoneAlt: text('phone_alt'),
    tags: jsonb('tags').$type<string[]>().default([]),
    notes: text('notes'),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    orgIdx: index('santral_contacts_org_idx').on(t.orgId),
    nameIdx: index('santral_contacts_name_idx').on(t.fullName),
  }),
);

export const santralCalls = pgTable(
  'santral_calls',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => orgs.id, { onDelete: 'cascade' }),
    direction: text('direction').notNull(),
    contactId: uuid('contact_id').references(() => santralContacts.id, { onDelete: 'set null' }),
    externalNumber: text('external_number'),
    answeredByUserId: uuid('answered_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    durationSec: integer('duration_sec'),
    notes: text('notes'),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    orgTimeIdx: index('santral_calls_org_time_idx').on(t.orgId, t.occurredAt),
  }),
);

export type SantralContact = typeof santralContacts.$inferSelect;
export type SantralCall = typeof santralCalls.$inferSelect;
