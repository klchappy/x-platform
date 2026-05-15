import { sql } from 'drizzle-orm';
import { boolean, index, jsonb, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { saymanSchema } from './enums';
import { orgs } from '../orgs';
import { users } from '../users';

export const saymanBanks = saymanSchema.table(
  'banks',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    org_id: uuid('org_id').notNull().references(() => orgs.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    short_code: text('short_code'),
    is_active: boolean('is_active').notNull().default(true),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ orgIdx: index('idx_sayman_banks_org').on(t.org_id) }),
);

export const saymanInstitutions = saymanSchema.table(
  'institutions',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    org_id: uuid('org_id').notNull().references(() => orgs.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    institution_type: text('institution_type'),
    is_active: boolean('is_active').notNull().default(true),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ orgIdx: index('idx_sayman_institutions_org').on(t.org_id) }),
);

export const saymanCompanies = saymanSchema.table(
  'companies',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    org_id: uuid('org_id').notNull().references(() => orgs.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    legal_name: text('legal_name'),
    tax_number: text('tax_number'),
    tax_office: text('tax_office'),
    registry_number: text('registry_number'),
    phone: text('phone'),
    email: text('email'),
    address: text('address'),
    notes: text('notes'),
    metadata: jsonb('metadata').default({}).notNull(),
    is_active: boolean('is_active').notNull().default(true),
    created_by: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    orgIdx: index('idx_sayman_companies_org').on(t.org_id),
    taxNoIdx: index('idx_sayman_companies_tax_no').on(t.tax_number),
  }),
);

export const saymanPersons = saymanSchema.table(
  'persons',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    org_id: uuid('org_id').notNull().references(() => orgs.id, { onDelete: 'cascade' }),
    full_name: text('full_name').notNull(),
    national_id: text('national_id'),
    phone: text('phone'),
    email: text('email'),
    family_group: text('family_group'),
    notes: text('notes'),
    is_active: boolean('is_active').notNull().default(true),
    created_by: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ orgIdx: index('idx_sayman_persons_org').on(t.org_id) }),
);

export type SaymanBank = typeof saymanBanks.$inferSelect;
export type SaymanInstitution = typeof saymanInstitutions.$inferSelect;
export type SaymanCompany = typeof saymanCompanies.$inferSelect;
export type SaymanPerson = typeof saymanPersons.$inferSelect;
