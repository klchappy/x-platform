import { sql } from 'drizzle-orm';
import { boolean, index, integer, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { damgaSchema, damgaLeaveStatusEnum, damgaLeaveTypeEnum } from './enums';
import { orgs } from '../orgs';
import { users } from '../users';

export const damgaLeaves = damgaSchema.table(
  'leaves',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    org_id: uuid('org_id').notNull().references(() => orgs.id, { onDelete: 'cascade' }),
    user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    type: damgaLeaveTypeEnum('type').notNull().default('annual'),
    start_date: text('start_date').notNull(),
    end_date: text('end_date').notNull(),
    half_day: boolean('half_day').notNull().default(false),
    business_days: integer('business_days').notNull().default(0),
    reason: text('reason'),
    status: damgaLeaveStatusEnum('status').notNull().default('pending'),
    approved_by_user_id: uuid('approved_by_user_id').references(() => users.id),
    approved_at: timestamp('approved_at', { withTimezone: true }),
    rejection_reason: text('rejection_reason'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    orgUserIdx: index('idx_damga_leaves_org_user').on(t.org_id, t.user_id),
    orgStatusIdx: index('idx_damga_leaves_org_status').on(t.org_id, t.status),
  }),
);

export type DamgaLeave = typeof damgaLeaves.$inferSelect;
export type NewDamgaLeave = typeof damgaLeaves.$inferInsert;
