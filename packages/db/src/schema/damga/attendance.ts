import { sql } from 'drizzle-orm';
import { doublePrecision, index, integer, jsonb, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { damgaSchema, damgaAttendanceTypeEnum } from './enums';
import { damgaLocations } from './locations';
import { orgs } from '../orgs';
import { users } from '../users';

/**
 * damga.attendance_events — KRİTİK MİMARİ:
 *   - Append-only: UPDATE/DELETE migration'da REVOKE edilir
 *   - Hash chain: her event önceki event'in hash'ini içerir (PostgreSQL trigger)
 *   - Düzeltmeler `supersedes_event_id` ile yeni event olarak eklenir
 *
 * Hash chain doğrulaması ile veritabanı manipülasyonu tespit edilebilir.
 */
export const damgaAttendanceEvents = damgaSchema.table(
  'attendance_events',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    org_id: uuid('org_id')
      .notNull()
      .references(() => orgs.id, { onDelete: 'restrict' }),
    user_id: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    type: damgaAttendanceTypeEnum('type').notNull(),

    // Zaman alanları
    client_time: timestamp('client_time', { withTimezone: true }).notNull(),
    server_time: timestamp('server_time', { withTimezone: true }).defaultNow().notNull(),
    effective_time: timestamp('effective_time', { withTimezone: true }).notNull(),
    timezone_at_time: text('timezone_at_time').notNull().default('Europe/Istanbul'),

    // Konum
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
    gps_accuracy_m: integer('gps_accuracy_m'),
    location_id: uuid('location_id').references(() => damgaLocations.id),
    distance_from_office_m: integer('distance_from_office_m'),

    // Doğrulama kanıtları
    nfc_tag_id: text('nfc_tag_id'),
    nfc_signature: text('nfc_signature'),
    qr_code_payload: text('qr_code_payload'),
    wifi_bssid: text('wifi_bssid'),
    device_id: text('device_id'),
    ip_address: text('ip_address'),
    user_agent: text('user_agent'),
    verification_methods: text('verification_methods').array().notNull().default(sql`'{}'::text[]`),
    verification_score: integer('verification_score').notNull(),
    evidence_hash: text('evidence_hash').notNull(),

    // Hash Chain
    previous_event_hash: text('previous_event_hash'),
    this_event_hash: text('this_event_hash').notNull(),
    supersedes_event_id: uuid('supersedes_event_id'),
    edit_reason: text('edit_reason'),
    edited_by_user_id: uuid('edited_by_user_id').references(() => users.id),

    // Meta
    app_version: text('app_version'),
    device_info: jsonb('device_info').$type<Record<string, unknown>>(),
    flags: text('flags').array().notNull().default(sql`'{}'::text[]`),

    // Manuel inceleme
    review_status: text('review_status', { enum: ['approved', 'pending_review', 'rejected'] })
      .notNull()
      .default('approved'),
    selfie_url: text('selfie_url'),
    review_reasons: text('review_reasons').array().notNull().default(sql`'{}'::text[]`),
    reviewed_by_user_id: uuid('reviewed_by_user_id').references(() => users.id),
    reviewed_at: timestamp('reviewed_at', { withTimezone: true }),
    review_notes: text('review_notes'),

    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    orgUserTimeIdx: index('idx_damga_events_org_user_time').on(table.org_id, table.user_id, table.server_time),
    hashChainIdx: index('idx_damga_events_hash').on(table.this_event_hash),
    typeIdx: index('idx_damga_events_type').on(table.type),
    locationIdx: index('idx_damga_events_location').on(table.location_id),
    reviewStatusIdx: index('idx_damga_events_review_status').on(table.org_id, table.review_status),
  }),
);

export type DamgaAttendanceEvent = typeof damgaAttendanceEvents.$inferSelect;
export type NewDamgaAttendanceEvent = typeof damgaAttendanceEvents.$inferInsert;
