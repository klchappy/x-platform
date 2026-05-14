import { pgTable, uuid, text, timestamp, integer, real, jsonb, index } from 'drizzle-orm/pg-core';
import { orgs } from './orgs';

export const lokmaRecipes = pgTable(
  'lokma_recipes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => orgs.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    category: text('category'),
    baseYield: real('base_yield').notNull().default(1),
    yieldUnit: text('yield_unit').notNull().default('porsiyon'),
    prepMinutes: integer('prep_minutes'),
    cookMinutes: integer('cook_minutes'),
    instructions: text('instructions'),
    ingredients: jsonb('ingredients').$type<Array<{ name: string; qty: number; unit: string }>>().default([]),
    tags: jsonb('tags').$type<string[]>().default([]),
    photoUrl: text('photo_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    orgIdx: index('lokma_recipes_org_idx').on(t.orgId),
  }),
);

export type LokmaRecipe = typeof lokmaRecipes.$inferSelect;
