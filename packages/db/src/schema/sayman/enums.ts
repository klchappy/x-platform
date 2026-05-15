import { pgSchema } from 'drizzle-orm/pg-core';

export const saymanSchema = pgSchema('sayman');

export const saymanOwnerTypeEnum = saymanSchema.enum('owner_type', ['company', 'person', 'institution']);

export const saymanPayableStatusEnum = saymanSchema.enum('payable_status', [
  'draft',
  'pending',
  'approaching',
  'overdue',
  'partial_paid',
  'paid',
  'cancelled',
  'archived',
  'needs_review',
  'waiting_approval',
]);

export const saymanPaymentMethodEnum = saymanSchema.enum('payment_method', [
  'havale',
  'eft',
  'kart',
  'nakit',
  'cek',
  'senet',
  'otomatik',
  'diger',
]);

export const saymanTransactionStatusEnum = saymanSchema.enum('transaction_status', [
  'pending',
  'approved',
  'rejected',
  'reversed',
]);
