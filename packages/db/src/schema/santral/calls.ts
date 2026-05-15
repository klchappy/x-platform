import { sql } from 'drizzle-orm';
import { index, integer, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { santralSchema, santralCallDirectionEnum } from './enums';
import { santralContacts } from './contacts';
import { orgs } from '../orgs';
import { users } from '../users';

export const santralCalls = santralSchema.table(
  'calls',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    org_id: uuid('org_id').notNull().references(() => orgs.id, { onDelete: 'cascade' }),
    direction: santralCallDirectionEnum('direction').notNull(),
    contact_id: uuid('contact_id').references(() => santralContacts.id, { onDelete: 'set null' }),
    external_number: text('external_number'),
    answered_by_user_id: uuid('answered_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    forwarded_to_user_id: uuid('forwarded_to_user_id').references(() => users.id, { onDelete: 'set null' }),
    duration_sec: integer('duration_sec'),
    notes: text('notes'),
    occurred_at: timestamp('occurred_at', { withTimezone: true }).defaultNow().notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    orgTimeIdx: index('idx_santral_calls_org_time').on(t.org_id, t.occurred_at),
    contactIdx: index('idx_santral_calls_contact').on(t.contact_id),
  }),
);

export type SantralCall = typeof santralCalls.$inferSelect;
