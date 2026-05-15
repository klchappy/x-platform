import { sql } from 'drizzle-orm';
import { boolean, index, integer, jsonb, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { lokmaSchema, lokmaKitchenTypeEnum } from './enums';
import { orgs } from '../orgs';
import { users } from '../users';

export const lokmaKitchens = lokmaSchema.table(
  'kitchens',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    org_id: uuid('org_id').notNull().references(() => orgs.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    kitchen_type: lokmaKitchenTypeEnum('kitchen_type').notNull().default('restaurant'),
    address: text('address'),
    capacity: integer('capacity'),
    timezone: text('timezone').notNull().default('Europe/Istanbul'),
    settings: jsonb('settings').default({}),
    is_active: boolean('is_active').notNull().default(true),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ orgIdx: index('idx_lokma_kitchens_org').on(t.org_id) }),
);

export const lokmaSuppliers = lokmaSchema.table(
  'suppliers',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    org_id: uuid('org_id').notNull().references(() => orgs.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    contact_person: text('contact_person'),
    phone: text('phone'),
    email: text('email'),
    address: text('address'),
    payment_terms: text('payment_terms'),
    tax_no: text('tax_no'),
    is_active: boolean('is_active').notNull().default(true),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ orgIdx: index('idx_lokma_suppliers_org').on(t.org_id) }),
);

export type LokmaKitchen = typeof lokmaKitchens.$inferSelect;
export type LokmaSupplier = typeof lokmaSuppliers.$inferSelect;
