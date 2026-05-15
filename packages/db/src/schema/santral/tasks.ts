import { sql } from 'drizzle-orm';
import { boolean, index, jsonb, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { santralSchema, santralTaskPriorityEnum, santralTaskStatusEnum } from './enums';
import { orgs } from '../orgs';
import { users } from '../users';

export const santralTasks = santralSchema.table(
  'tasks',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    org_id: uuid('org_id').notNull().references(() => orgs.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    assignee_id: uuid('assignee_id').references(() => users.id, { onDelete: 'set null' }),
    priority: santralTaskPriorityEnum('priority').notNull().default('normal'),
    status: santralTaskStatusEnum('status').notNull().default('open'),
    due_at: timestamp('due_at', { withTimezone: true }),
    related_people: jsonb('related_people').default([]),
    created_by: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    is_active: boolean('is_active').notNull().default(true),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    orgStatusIdx: index('idx_santral_tasks_org_status').on(t.org_id, t.status),
    assigneeIdx: index('idx_santral_tasks_assignee').on(t.assignee_id),
  }),
);

export const santralCalendarEvents = santralSchema.table(
  'calendar_events',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    org_id: uuid('org_id').notNull().references(() => orgs.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    location: text('location'),
    start_at: timestamp('start_at', { withTimezone: true }).notNull(),
    end_at: timestamp('end_at', { withTimezone: true }).notNull(),
    is_all_day: boolean('is_all_day').notNull().default(false),
    is_cancelled: boolean('is_cancelled').notNull().default(false),
    visibility: text('visibility').notNull().default('org'),
    owner_id: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ orgStartIdx: index('idx_santral_calendar_org_start').on(t.org_id, t.start_at) }),
);

export type SantralTask = typeof santralTasks.$inferSelect;
export type SantralCalendarEvent = typeof santralCalendarEvents.$inferSelect;
