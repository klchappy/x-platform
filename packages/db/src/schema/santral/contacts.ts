import { sql } from 'drizzle-orm';
import { boolean, index, jsonb, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { santralSchema } from './enums';
import { orgs } from '../orgs';
import { users } from '../users';

export const santralContacts = santralSchema.table(
  'contacts',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    org_id: uuid('org_id').notNull().references(() => orgs.id, { onDelete: 'cascade' }),
    full_name: text('full_name').notNull(),
    company: text('company'),
    title: text('title'),
    email: text('email'),
    phone: text('phone'),
    phone_alt: text('phone_alt'),
    tags: jsonb('tags').$type<string[]>().default([]),
    notes: text('notes'),
    is_active: boolean('is_active').notNull().default(true),
    created_by: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    orgIdx: index('idx_santral_contacts_org').on(t.org_id),
    nameIdx: index('idx_santral_contacts_name').on(t.org_id, t.full_name),
  }),
);

export const santralDirectoryEntries = santralSchema.table(
  'directory_entries',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    org_id: uuid('org_id').notNull().references(() => orgs.id, { onDelete: 'cascade' }),
    user_id: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    full_name: text('full_name').notNull(),
    department: text('department'),
    manager_id: uuid('manager_id').references(() => users.id, { onDelete: 'set null' }),
    phone_work: text('phone_work'),
    phone_mobile: text('phone_mobile'),
    phone_internal: text('phone_internal'),
    extra: jsonb('extra').default({}),
    is_active: boolean('is_active').notNull().default(true),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ orgIdx: index('idx_santral_directory_org').on(t.org_id) }),
);

export type SantralContact = typeof santralContacts.$inferSelect;
export type SantralDirectoryEntry = typeof santralDirectoryEntries.$inferSelect;
