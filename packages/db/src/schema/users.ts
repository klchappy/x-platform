import { pgTable, uuid, text, timestamp, boolean, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { orgs } from './orgs.js';

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').references(() => orgs.id, { onDelete: 'cascade' }),
    authUserId: text('auth_user_id'),
    email: text('email').notNull(),
    fullName: text('full_name'),
    phone: text('phone'),
    role: text('role').notNull().default('employee'),
    department: text('department'),
    isActive: boolean('is_active').notNull().default(true),
    isPending: boolean('is_pending').notNull().default(false),
    isPlatformAdmin: boolean('is_platform_admin').notNull().default(false),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    orgIdx: index('users_org_idx').on(t.orgId),
    emailIdx: index('users_email_idx').on(t.email),
    authIdx: index('users_auth_idx').on(t.authUserId),
    orgEmailUq: uniqueIndex('users_org_email_uq').on(t.orgId, t.email),
  }),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
