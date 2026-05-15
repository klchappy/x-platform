import { sql } from 'drizzle-orm';
import { boolean, index, integer, jsonb, real, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { lokmaSchema } from './enums';
import { lokmaKitchens } from './kitchens';
import { orgs } from '../orgs';

export const lokmaIngredients = lokmaSchema.table(
  'ingredients',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    org_id: uuid('org_id').notNull().references(() => orgs.id, { onDelete: 'cascade' }),
    category: text('category'),
    name: text('name').notNull(),
    sku: text('sku'),
    default_unit: text('default_unit').notNull().default('kg'),
    default_waste_pct: real('default_waste_pct').notNull().default(0),
    last_unit_price: real('last_unit_price').notNull().default(0),
    allergens: jsonb('allergens').$type<string[]>().default([]),
    storage_info: text('storage_info'),
    is_active: boolean('is_active').notNull().default(true),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ orgIdx: index('idx_lokma_ingredients_org').on(t.org_id) }),
);

export const lokmaRecipes = lokmaSchema.table(
  'recipes',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    org_id: uuid('org_id').notNull().references(() => orgs.id, { onDelete: 'cascade' }),
    kitchen_id: uuid('kitchen_id').references(() => lokmaKitchens.id, { onDelete: 'set null' }),
    category: text('category'),
    name: text('name').notNull(),
    base_yield: real('base_yield').notNull().default(1),
    yield_unit: text('yield_unit').notNull().default('porsiyon'),
    prep_minutes: integer('prep_minutes'),
    cook_minutes: integer('cook_minutes'),
    instructions: text('instructions'),
    ingredients: jsonb('ingredients').$type<Array<{ name: string; qty: number; unit: string; waste_pct?: number }>>().default([]),
    tags: jsonb('tags').$type<string[]>().default([]),
    photo_url: text('photo_url'),
    is_active: boolean('is_active').notNull().default(true),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ orgIdx: index('idx_lokma_recipes_org').on(t.org_id) }),
);

export type LokmaIngredient = typeof lokmaIngredients.$inferSelect;
export type LokmaRecipe = typeof lokmaRecipes.$inferSelect;
