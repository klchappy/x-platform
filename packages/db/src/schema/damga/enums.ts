import { pgSchema } from 'drizzle-orm/pg-core';

export const damgaSchema = pgSchema('damga');

export const damgaAttendanceTypeEnum = damgaSchema.enum('attendance_event_type', [
  'check_in',
  'check_out',
  'edit_request',
  'manual_entry',
  'admin_correction',
  'dispute',
]);

export const damgaLeaveTypeEnum = damgaSchema.enum('leave_type', [
  'annual',
  'sick',
  'unpaid',
  'maternity',
  'paternity',
  'compassionate',
]);

export const damgaLeaveStatusEnum = damgaSchema.enum('leave_status', [
  'pending',
  'approved',
  'rejected',
  'cancelled',
]);

export const damgaStatusTypeEnum = damgaSchema.enum('status_type', [
  'running_late',
  'on_lunch',
  'sick',
  'wfh',
  'in_focus',
  'on_business',
  'on_break',
]);

export const damgaAnnouncementCategoryEnum = damgaSchema.enum('announcement_category', [
  'info',
  'celebration',
  'warning',
  'urgent',
]);
