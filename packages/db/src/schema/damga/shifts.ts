import { sql } from 'drizzle-orm';
import { boolean, index, integer, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { damgaSchema } from './enums';
import { damgaAttendanceEvents } from './attendance';
import { damgaLocations } from './locations';
import { orgs } from '../orgs';
import { users } from '../users';

export const damgaShiftTemplates = damgaSchema.table(
  'shift_templates',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    org_id: uuid('org_id').notNull().references(() => orgs.id, { onDelete: 'cascade' }),
    location_id: uuid('location_id').references(() => damgaLocations.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    start_time: text('start_time').notNull(),
    end_time: text('end_time').notNull(),
    break_minutes: integer('break_minutes').notNull().default(60),
    color: text('color').notNull().default('#94a3b8'),
    overtime_threshold_minutes: integer('overtime_threshold_minutes').notNull().default(15),
    is_active: boolean('is_active').notNull().default(true),
    created_by_user_id: uuid('created_by_user_id').references(() => users.id),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    orgIdx: index('idx_damga_shift_templates_org').on(t.org_id),
  }),
);

export const damgaShiftAssignments = damgaSchema.table(
  'shift_assignments',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    org_id: uuid('org_id').notNull().references(() => orgs.id, { onDelete: 'cascade' }),
    shift_template_id: uuid('shift_template_id')
      .notNull()
      .references(() => damgaShiftTemplates.id, { onDelete: 'restrict' }),
    user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    shift_date: text('shift_date').notNull(),
    override_start: text('override_start'),
    override_end: text('override_end'),
    status: text('status').notNull().default('scheduled'),
    notes: text('notes'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    orgUserDateIdx: index('idx_damga_shift_assignments_org_user_date').on(t.org_id, t.user_id, t.shift_date),
  }),
);

export const damgaOvertimeRecords = damgaSchema.table(
  'overtime_records',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    org_id: uuid('org_id').notNull().references(() => orgs.id, { onDelete: 'cascade' }),
    user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    shift_assignment_id: uuid('shift_assignment_id').references(() => damgaShiftAssignments.id, { onDelete: 'set null' }),
    event_id: uuid('event_id').references(() => damgaAttendanceEvents.id, { onDelete: 'set null' }),
    overtime_minutes: integer('overtime_minutes').notNull(),
    expected_end: timestamp('expected_end', { withTimezone: true }).notNull(),
    actual_end: timestamp('actual_end', { withTimezone: true }).notNull(),
    reason: text('reason'),
    status: text('status').notNull().default('pending'),
    approved_by_user_id: uuid('approved_by_user_id').references(() => users.id),
    approved_at: timestamp('approved_at', { withTimezone: true }),
    rejection_reason: text('rejection_reason'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    orgUserIdx: index('idx_damga_overtime_org_user').on(t.org_id, t.user_id),
  }),
);

export type DamgaShiftTemplate = typeof damgaShiftTemplates.$inferSelect;
export type DamgaShiftAssignment = typeof damgaShiftAssignments.$inferSelect;
export type DamgaOvertimeRecord = typeof damgaOvertimeRecords.$inferSelect;
