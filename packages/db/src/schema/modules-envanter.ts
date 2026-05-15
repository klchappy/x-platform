import { pgTable, uuid, text, timestamp, real, integer, index } from 'drizzle-orm/pg-core';
import { orgs } from './orgs';
import { users } from './users';

/**
 * Envanter — ürün kataloğu + stok hareket (giriş/çıkış/sayım).
 * Lokma'nın stockLots / ticaret'in ürünlerinden bağımsız, yalın bir varyantı.
 * Tek depoyu varsayar (warehouseId opsiyonel — V2'de eklenir).
 */
export const envanterProducts = pgTable(
  'envanter_products',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => orgs.id, { onDelete: 'cascade' }),
    sku: text('sku'),
    barcode: text('barcode'),
    name: text('name').notNull(),
    category: text('category'),
    unit: text('unit').notNull().default('adet'),
    minStock: real('min_stock').notNull().default(0),
    currentStock: real('current_stock').notNull().default(0),
    costCentsTry: integer('cost_cents_try').notNull().default(0),
    priceCentsTry: integer('price_cents_try').notNull().default(0),
    location: text('location'),
    notes: text('notes'),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    orgIdx: index('envanter_products_org_idx').on(t.orgId),
    skuIdx: index('envanter_products_sku_idx').on(t.sku),
    barcodeIdx: index('envanter_products_barcode_idx').on(t.barcode),
  }),
);

/**
 * Stok hareket günlüğü — her ürün için append-only ledger.
 * type: in (giriş) / out (çıkış) / count (sayım düzeltmesi)
 */
export const envanterMovements = pgTable(
  'envanter_movements',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => orgs.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => envanterProducts.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    quantity: real('quantity').notNull(),
    reason: text('reason'),
    referenceNo: text('reference_no'),
    notes: text('notes'),
    occurredAt: text('occurred_at').notNull(),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    orgProductIdx: index('envanter_movements_org_product_idx').on(t.orgId, t.productId),
    orgTimeIdx: index('envanter_movements_org_time_idx').on(t.orgId, t.occurredAt),
  }),
);

export type EnvanterProduct = typeof envanterProducts.$inferSelect;
export type EnvanterMovement = typeof envanterMovements.$inferSelect;
