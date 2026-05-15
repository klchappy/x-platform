import { sql } from 'drizzle-orm';
import { boolean, date, index, jsonb, numeric, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import {
  saymanSchema,
  saymanOwnerTypeEnum,
  saymanPayableStatusEnum,
  saymanPaymentMethodEnum,
  saymanTransactionStatusEnum,
} from './enums';
import { saymanCompanies, saymanPersons, saymanInstitutions } from './parties';
import { orgs } from '../orgs';
import { users } from '../users';

/**
 * sayman.payable_items — takip edilen fatura/borç/ödeme kalemi.
 * Tenant (org) scoped + parties cross-references.
 */
export const saymanPayableItems = saymanSchema.table(
  'payable_items',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    org_id: uuid('org_id').notNull().references(() => orgs.id, { onDelete: 'cascade' }),

    owner_type: saymanOwnerTypeEnum('owner_type').notNull().default('company'),
    company_id: uuid('company_id').references(() => saymanCompanies.id, { onDelete: 'set null' }),
    person_id: uuid('person_id').references(() => saymanPersons.id, { onDelete: 'set null' }),
    institution_id: uuid('institution_id').references(() => saymanInstitutions.id, { onDelete: 'set null' }),

    title: text('title').notNull(),
    category: text('category'),
    supplier_name: text('supplier_name'),
    invoice_number: text('invoice_number'),
    subscription_reference: text('subscription_reference'),
    period_label: text('period_label'),

    issue_date: date('issue_date'),
    due_date: date('due_date'),
    auto_payment_date: date('auto_payment_date'),

    amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
    paid_amount: numeric('paid_amount', { precision: 15, scale: 2 }).notNull().default('0'),
    currency: text('currency').notNull().default('TRY'),

    status: saymanPayableStatusEnum('status').notNull().default('pending'),
    expected_method: saymanPaymentMethodEnum('expected_method'),

    notes: text('notes'),
    metadata: jsonb('metadata').default({}).notNull(),

    needs_review: boolean('needs_review').notNull().default(false),
    auto_created_source: text('auto_created_source'),
    reviewed_at: timestamp('reviewed_at', { withTimezone: true }),
    reviewed_by: uuid('reviewed_by').references(() => users.id, { onDelete: 'set null' }),

    created_by: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    is_active: boolean('is_active').notNull().default(true),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    orgIdx: index('idx_sayman_payable_org').on(t.org_id),
    statusIdx: index('idx_sayman_payable_status').on(t.status),
    dueIdx: index('idx_sayman_payable_due').on(t.due_date),
    periodIdx: index('idx_sayman_payable_period').on(t.org_id, t.period_label),
  }),
);

export const saymanPaymentTransactions = saymanSchema.table(
  'payment_transactions',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    org_id: uuid('org_id').notNull().references(() => orgs.id, { onDelete: 'cascade' }),
    payable_id: uuid('payable_id').notNull().references(() => saymanPayableItems.id, { onDelete: 'cascade' }),

    paid_at: date('paid_at').notNull(),
    amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
    method: saymanPaymentMethodEnum('method').notNull(),

    bank_short_code: text('bank_short_code'),
    receipt_url: text('receipt_url'),
    reference_no: text('reference_no'),

    status: saymanTransactionStatusEnum('status').notNull().default('approved'),
    notes: text('notes'),

    created_by: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    orgPayableIdx: index('idx_sayman_tx_org_payable').on(t.org_id, t.payable_id),
    paidAtIdx: index('idx_sayman_tx_paid_at').on(t.paid_at),
  }),
);

/**
 * regular_payments — periyodik abonelikler (TT, CK, Netflix, kira, vb.)
 * Belirli aralıklarla otomatik payable_item yaratılmasının kaynağı.
 */
export const saymanRegularPayments = saymanSchema.table(
  'regular_payments',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    org_id: uuid('org_id').notNull().references(() => orgs.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    institution_id: uuid('institution_id').references(() => saymanInstitutions.id, { onDelete: 'set null' }),
    company_id: uuid('company_id').references(() => saymanCompanies.id, { onDelete: 'set null' }),
    person_id: uuid('person_id').references(() => saymanPersons.id, { onDelete: 'set null' }),
    cadence: text('cadence').notNull().default('monthly'),
    day_of_month: text('day_of_month'),
    estimated_amount: numeric('estimated_amount', { precision: 15, scale: 2 }),
    currency: text('currency').notNull().default('TRY'),
    expected_method: saymanPaymentMethodEnum('expected_method'),
    notes: text('notes'),
    is_active: boolean('is_active').notNull().default(true),
    next_due_date: date('next_due_date'),
    created_by: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ orgIdx: index('idx_sayman_regular_org').on(t.org_id) }),
);

export type SaymanPayableItem = typeof saymanPayableItems.$inferSelect;
export type SaymanPaymentTransaction = typeof saymanPaymentTransactions.$inferSelect;
export type SaymanRegularPayment = typeof saymanRegularPayments.$inferSelect;
