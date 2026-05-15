import { sql } from 'drizzle-orm';
import { boolean, date, index, jsonb, real, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { lokmaSchema, lokmaStockMovementTypeEnum } from './enums';
import { lokmaKitchens } from './kitchens';
import { lokmaIngredients } from './recipes';
import { orgs } from '../orgs';
import { users } from '../users';

export const lokmaStockLots = lokmaSchema.table(
  'stock_lots',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    org_id: uuid('org_id').notNull().references(() => orgs.id, { onDelete: 'cascade' }),
    kitchen_id: uuid('kitchen_id').references(() => lokmaKitchens.id, { onDelete: 'set null' }),
    ingredient_id: uuid('ingredient_id').notNull().references(() => lokmaIngredients.id, { onDelete: 'cascade' }),
    lot_code: text('lot_code'),
    qty_received: real('qty_received').notNull(),
    qty_remaining: real('qty_remaining').notNull(),
    unit: text('unit').notNull(),
    unit_price: real('unit_price').notNull().default(0),
    received_at: date('received_at'),
    expiry_date: date('expiry_date'),
    supplier_name: text('supplier_name'),
    notes: text('notes'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    orgIngredientIdx: index('idx_lokma_lots_org_ing').on(t.org_id, t.ingredient_id),
    expiryIdx: index('idx_lokma_lots_expiry').on(t.expiry_date),
  }),
);

export const lokmaStockMovements = lokmaSchema.table(
  'stock_movements',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    org_id: uuid('org_id').notNull().references(() => orgs.id, { onDelete: 'cascade' }),
    kitchen_id: uuid('kitchen_id').references(() => lokmaKitchens.id, { onDelete: 'set null' }),
    ingredient_id: uuid('ingredient_id').notNull().references(() => lokmaIngredients.id, { onDelete: 'cascade' }),
    lot_id: uuid('lot_id').references(() => lokmaStockLots.id, { onDelete: 'set null' }),
    movement_type: lokmaStockMovementTypeEnum('movement_type').notNull(),
    quantity: real('quantity').notNull(),
    unit: text('unit').notNull(),
    unit_price: real('unit_price'),
    reference_type: text('reference_type'),
    reference_id: uuid('reference_id'),
    reason: text('reason'),
    notes: text('notes'),
    occurred_at: timestamp('occurred_at', { withTimezone: true }).defaultNow().notNull(),
    created_by: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    orgIngTimeIdx: index('idx_lokma_movements_org_ing_time').on(t.org_id, t.ingredient_id, t.occurred_at),
    typeIdx: index('idx_lokma_movements_type').on(t.movement_type),
  }),
);

export const lokmaPurchaseOrders = lokmaSchema.table(
  'purchase_orders',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    org_id: uuid('org_id').notNull().references(() => orgs.id, { onDelete: 'cascade' }),
    kitchen_id: uuid('kitchen_id').references(() => lokmaKitchens.id, { onDelete: 'set null' }),
    supplier_name: text('supplier_name').notNull(),
    order_date: date('order_date').notNull().default(sql`current_date`),
    expected_date: date('expected_date'),
    received_date: date('received_date'),
    total_amount: real('total_amount').notNull().default(0),
    currency: text('currency').notNull().default('TRY'),
    status: text('status').notNull().default('draft'),
    items: jsonb('items').$type<Array<{ ingredient_id?: string; name: string; qty: number; unit: string; unit_price: number }>>().default([]),
    notes: text('notes'),
    created_by: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    orgStatusIdx: index('idx_lokma_po_org_status').on(t.org_id, t.status),
    dateIdx: index('idx_lokma_po_date').on(t.order_date),
  }),
);

export type LokmaStockLot = typeof lokmaStockLots.$inferSelect;
export type LokmaStockMovement = typeof lokmaStockMovements.$inferSelect;
export type LokmaPurchaseOrder = typeof lokmaPurchaseOrders.$inferSelect;
