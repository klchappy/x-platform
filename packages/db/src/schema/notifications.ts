import { pgTable, uuid, text, timestamp, boolean, jsonb, index } from 'drizzle-orm/pg-core';
import { orgs } from './orgs';
import { users } from './users';

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => orgs.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    moduleId: text('module_id'),
    title: text('title').notNull(),
    body: text('body'),
    type: text('type').notNull().default('info'),
    severity: text('severity').default('info'),
    sourceType: text('source_type'),
    sourceId: text('source_id'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
    isRead: boolean('is_read').notNull().default(false),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    orgUserIdx: index('notifications_org_user_idx').on(t.orgId, t.userId, t.isRead),
    moduleIdx: index('notifications_module_idx').on(t.moduleId),
  }),
);

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
