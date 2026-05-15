import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const magicLinkTokens = pgTable(
  'magic_link_tokens',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    tokenHash: text('token_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    requestIp: text('request_ip'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    hashIdx: index('magic_link_tokens_hash_idx').on(t.tokenHash),
    emailIdx: index('magic_link_tokens_email_idx').on(t.email, t.expiresAt),
  }),
);

export type MagicLinkToken = typeof magicLinkTokens.$inferSelect;
