import { pgTable, uuid, text, timestamp, integer, real, jsonb, index } from 'drizzle-orm/pg-core';
import { orgs } from './orgs';
import { users } from './users';

export const ticaretProducts = pgTable(
  'ticaret_products',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => orgs.id, { onDelete: 'cascade' }),
    sku: text('sku'),
    name: text('name').notNull(),
    category: text('category'),
    unit: text('unit').notNull().default('adet'),
    priceCentsTry: integer('price_cents_try').notNull().default(0),
    taxRatePct: real('tax_rate_pct').notNull().default(20),
    stockOnHand: real('stock_on_hand').notNull().default(0),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    orgIdx: index('ticaret_products_org_idx').on(t.orgId),
    skuIdx: index('ticaret_products_sku_idx').on(t.sku),
  }),
);

export const ticaretCustomers = pgTable(
  'ticaret_customers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => orgs.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    taxNo: text('tax_no'),
    taxOffice: text('tax_office'),
    address: text('address'),
    phone: text('phone'),
    email: text('email'),
    creditLimitCentsTry: integer('credit_limit_cents_try').notNull().default(0),
    riskScore: text('risk_score').default('normal'),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    orgIdx: index('ticaret_customers_org_idx').on(t.orgId),
  }),
);

export type TicaretProduct = typeof ticaretProducts.$inferSelect;
export type TicaretCustomer = typeof ticaretCustomers.$inferSelect;
