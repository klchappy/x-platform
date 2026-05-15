import { sql } from 'drizzle-orm';
import { boolean, doublePrecision, index, integer, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { damgaSchema } from './enums';
import { orgs } from '../orgs';
import { users } from '../users';

export const damgaLocations = damgaSchema.table(
  'locations',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    org_id: uuid('org_id')
      .notNull()
      .references(() => orgs.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    address: text('address'),
    city: text('city'),
    timezone: text('timezone').notNull().default('Europe/Istanbul'),
    latitude: doublePrecision('latitude').notNull(),
    longitude: doublePrecision('longitude').notNull(),
    geofence_radius_m: integer('geofence_radius_m').notNull().default(100),
    wifi_bssids: text('wifi_bssids').array().notNull().default(sql`'{}'::text[]`),
    nfc_tag_ids: text('nfc_tag_ids').array().notNull().default(sql`'{}'::text[]`),
    qr_codes: text('qr_codes').array().notNull().default(sql`'{}'::text[]`),
    work_hours_start: text('work_hours_start').notNull().default('09:00'),
    work_hours_end: text('work_hours_end').notNull().default('18:00'),
    is_active: boolean('is_active').notNull().default(true),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    orgIdx: index('idx_damga_locations_org').on(table.org_id),
  }),
);

export const damgaLocationNfcTags = damgaSchema.table(
  'location_nfc_tags',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    location_id: uuid('location_id')
      .notNull()
      .references(() => damgaLocations.id, { onDelete: 'cascade' }),
    org_id: uuid('org_id')
      .notNull()
      .references(() => orgs.id, { onDelete: 'cascade' }),
    tag_id: text('tag_id').notNull(),
    label: text('label'),
    payload: text('payload').notNull(),
    created_by: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    last_used_at: timestamp('last_used_at', { withTimezone: true }),
    is_active: boolean('is_active').notNull().default(true),
  },
  (table) => ({
    locationIdx: index('idx_damga_nfc_tags_location').on(table.location_id),
    tagIdIdx: index('idx_damga_nfc_tags_tag_id').on(table.tag_id),
  }),
);

export const damgaLocationQrCodes = damgaSchema.table(
  'location_qr_codes',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    location_id: uuid('location_id')
      .notNull()
      .references(() => damgaLocations.id, { onDelete: 'cascade' }),
    org_id: uuid('org_id')
      .notNull()
      .references(() => orgs.id, { onDelete: 'cascade' }),
    label: text('label'),
    payload: text('payload').notNull(),
    ttl_days: integer('ttl_days').notNull().default(90),
    expires_at: timestamp('expires_at', { withTimezone: true }),
    created_by: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    last_used_at: timestamp('last_used_at', { withTimezone: true }),
    is_active: boolean('is_active').notNull().default(true),
  },
  (table) => ({
    locationIdx: index('idx_damga_qr_codes_location').on(table.location_id),
  }),
);

export type DamgaLocation = typeof damgaLocations.$inferSelect;
export type DamgaLocationNfcTag = typeof damgaLocationNfcTags.$inferSelect;
export type DamgaLocationQrCode = typeof damgaLocationQrCodes.$inferSelect;
