import { pgSchema } from 'drizzle-orm/pg-core';

export const santralSchema = pgSchema('santral');

export const santralCallDirectionEnum = santralSchema.enum('call_direction', ['inbound', 'outbound', 'missed']);
export const santralTaskPriorityEnum = santralSchema.enum('task_priority', ['low', 'normal', 'high', 'urgent']);
export const santralTaskStatusEnum = santralSchema.enum('task_status', ['open', 'in_progress', 'blocked', 'done', 'cancelled']);
