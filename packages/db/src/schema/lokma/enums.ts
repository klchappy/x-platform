import { pgSchema } from 'drizzle-orm/pg-core';

export const lokmaSchema = pgSchema('lokma');

export const lokmaKitchenTypeEnum = lokmaSchema.enum('kitchen_type', [
  'restaurant',
  'hotel',
  'home',
  'catering',
  'cloud_kitchen',
  'cafeteria',
]);
export const lokmaUnitKindEnum = lokmaSchema.enum('unit_kind', ['mass', 'volume', 'count', 'length']);
export const lokmaMealTypeEnum = lokmaSchema.enum('meal_type', ['breakfast', 'lunch', 'dinner', 'snack']);
export const lokmaStockMovementTypeEnum = lokmaSchema.enum('stock_movement_type', [
  'in',
  'out_prod',
  'out_waste',
  'transfer',
  'adjustment',
]);
