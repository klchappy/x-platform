import { pgTable, uuid, text, timestamp, integer, jsonb, index } from 'drizzle-orm/pg-core';
import { orgs } from './orgs';
import { users } from './users';

export const saymanPayables = pgTable(
  'sayman_payables',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => orgs.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    counterparty: text('counterparty'),
    category: text('category'),
    invoiceNo: text('invoice_no'),
    periodLabel: text('period_label'),
    amountCentsTry: integer('amount_cents_try').notNull().default(0),
    paidCentsTry: integer('paid_cents_try').notNull().default(0),
    currency: text('currency').notNull().default('TRY'),
    dueDate: text('due_date'),
    status: text('status').notNull().default('pending'),
    notes: text('notes'),
    tags: jsonb('tags').$type<string[]>().default([]),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    orgStatusIdx: index('sayman_payables_org_status_idx').on(t.orgId, t.status),
    orgDueIdx: index('sayman_payables_org_due_idx').on(t.orgId, t.dueDate),
  }),
);

export const saymanPayments = pgTable(
  'sayman_payments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => orgs.id, { onDelete: 'cascade' }),
    payableId: uuid('payable_id').references(() => saymanPayables.id, { onDelete: 'set null' }),
    paidAt: text('paid_at').notNull(),
    amountCentsTry: integer('amount_cents_try').notNull(),
    method: text('method').notNull().default('havale'),
    referenceNo: text('reference_no'),
    notes: text('notes'),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    orgPayableIdx: index('sayman_payments_org_payable_idx').on(t.orgId, t.payableId),
    orgPaidAtIdx: index('sayman_payments_org_paid_at_idx').on(t.orgId, t.paidAt),
  }),
);

export type SaymanPayable = typeof saymanPayables.$inferSelect;
export type SaymanPayment = typeof saymanPayments.$inferSelect;
