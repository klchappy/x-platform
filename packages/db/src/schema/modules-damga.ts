import { pgTable, uuid, text, timestamp, integer, jsonb, real, index } from 'drizzle-orm/pg-core';
import { orgs } from './orgs';
import { users } from './users';

export const damgaAttendance = pgTable(
  'damga_attendance',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => orgs.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    type: text('type').notNull(),
    method: text('method'),
    latitude: real('latitude'),
    longitude: real('longitude'),
    accuracyM: real('accuracy_m'),
    notes: text('notes'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
    clientTime: timestamp('client_time', { withTimezone: true }),
    serverTime: timestamp('server_time', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    orgTimeIdx: index('damga_attendance_org_time_idx').on(t.orgId, t.serverTime),
    userIdx: index('damga_attendance_user_idx').on(t.userId),
  }),
);

export const damgaLeaves = pgTable(
  'damga_leaves',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => orgs.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull().default('annual'),
    startDate: text('start_date').notNull(),
    endDate: text('end_date').notNull(),
    businessDays: integer('business_days').notNull().default(0),
    reason: text('reason'),
    status: text('status').notNull().default('pending'),
    decidedByUserId: uuid('decided_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    decidedAt: timestamp('decided_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    orgIdx: index('damga_leaves_org_idx').on(t.orgId, t.status),
  }),
);

export type DamgaAttendance = typeof damgaAttendance.$inferSelect;
export type DamgaLeave = typeof damgaLeaves.$inferSelect;
