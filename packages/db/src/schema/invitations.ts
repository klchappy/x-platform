import { pgTable, uuid, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { orgs } from './orgs.js';
import { users } from './users.js';

export const invitations = pgTable(
  'invitations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => orgs.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    role: text('role').notNull().default('employee'),
    moduleScopes: jsonb('module_scopes').$type<string[]>().default([]),
    token: text('token').notNull().unique(),
    invitedByUserId: uuid('invited_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    status: text('status').notNull().default('pending'),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    orgEmailIdx: index('invitations_org_email_idx').on(t.orgId, t.email),
    tokenIdx: index('invitations_token_idx').on(t.token),
    statusIdx: index('invitations_status_idx').on(t.status, t.expiresAt),
  }),
);

export type Invitation = typeof invitations.$inferSelect;
