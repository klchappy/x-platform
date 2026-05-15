import { sql } from 'drizzle-orm';
import { boolean, date, index, integer, jsonb, real, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { lokmaSchema, lokmaMealTypeEnum } from './enums';
import { lokmaKitchens } from './kitchens';
import { lokmaRecipes } from './recipes';
import { orgs } from '../orgs';

export const lokmaMenuPlans = lokmaSchema.table(
  'menu_plans',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    org_id: uuid('org_id').notNull().references(() => orgs.id, { onDelete: 'cascade' }),
    kitchen_id: uuid('kitchen_id').references(() => lokmaKitchens.id, { onDelete: 'set null' }),
    plan_date: date('plan_date').notNull(),
    meal_type: lokmaMealTypeEnum('meal_type').notNull().default('lunch'),
    expected_servings: integer('expected_servings').notNull().default(0),
    actual_servings: integer('actual_servings'),
    notes: text('notes'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    orgDateIdx: index('idx_lokma_menu_org_date').on(t.org_id, t.plan_date),
  }),
);

export const lokmaMenuItems = lokmaSchema.table(
  'menu_items',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    org_id: uuid('org_id').notNull().references(() => orgs.id, { onDelete: 'cascade' }),
    plan_id: uuid('plan_id').notNull().references(() => lokmaMenuPlans.id, { onDelete: 'cascade' }),
    recipe_id: uuid('recipe_id').references(() => lokmaRecipes.id, { onDelete: 'set null' }),
    recipe_name: text('recipe_name').notNull(),
    portions: real('portions').notNull().default(1),
    course: text('course'),
    notes: text('notes'),
    is_active: boolean('is_active').notNull().default(true),
  },
  (t) => ({
    planIdx: index('idx_lokma_menu_items_plan').on(t.plan_id),
  }),
);

export type LokmaMenuPlan = typeof lokmaMenuPlans.$inferSelect;
export type LokmaMenuItem = typeof lokmaMenuItems.$inferSelect;
