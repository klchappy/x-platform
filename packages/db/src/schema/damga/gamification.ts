import { sql } from 'drizzle-orm';
import { boolean, index, integer, text, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';
import { damgaSchema } from './enums';
import { orgs } from '../orgs';
import { users } from '../users';

export const damgaXpTransactions = damgaSchema.table(
  'xp_transactions',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    org_id: uuid('org_id').notNull().references(() => orgs.id, { onDelete: 'cascade' }),
    user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    source: text('source').notNull(),
    amount: integer('amount').notNull(),
    description: text('description'),
    ref_id: uuid('ref_id'),
    ref_type: text('ref_type'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userTimeIdx: index('idx_damga_xp_user_time').on(t.user_id, t.created_at),
    orgTimeIdx: index('idx_damga_xp_org_time').on(t.org_id, t.created_at),
    sourceIdx: index('idx_damga_xp_source').on(t.source),
  }),
);

export const damgaRewards = damgaSchema.table(
  'rewards',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    org_id: uuid('org_id').notNull().references(() => orgs.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    icon: text('icon').notNull().default('🎁'),
    cost_xp: integer('cost_xp').notNull(),
    stock: integer('stock'),
    per_user_limit: integer('per_user_limit'),
    is_active: boolean('is_active').notNull().default(true),
    market_type: text('market_type').notNull().default('standard'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    orgIdx: index('idx_damga_rewards_org').on(t.org_id),
  }),
);

export const damgaUserRedemptions = damgaSchema.table(
  'user_redemptions',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    org_id: uuid('org_id').notNull().references(() => orgs.id, { onDelete: 'cascade' }),
    user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    reward_id: uuid('reward_id').notNull().references(() => damgaRewards.id, { onDelete: 'restrict' }),
    cost_xp: integer('cost_xp').notNull(),
    status: text('status').notNull().default('pending'),
    xp_transaction_id: uuid('xp_transaction_id').references(() => damgaXpTransactions.id),
    fulfilled_by_user_id: uuid('fulfilled_by_user_id').references(() => users.id),
    fulfilled_at: timestamp('fulfilled_at', { withTimezone: true }),
    notes: text('notes'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    orgUserIdx: index('idx_damga_redemptions_org_user').on(t.org_id, t.user_id),
  }),
);

export type DamgaXpTransaction = typeof damgaXpTransactions.$inferSelect;
export type DamgaReward = typeof damgaRewards.$inferSelect;
export type DamgaUserRedemption = typeof damgaUserRedemptions.$inferSelect;
