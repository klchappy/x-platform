import { pgTable, uuid, text, timestamp, jsonb, boolean, index } from 'drizzle-orm/pg-core';
import { orgs } from './orgs';
import { users } from './users';

/**
 * Etik bildirim sistemi (whistleblower / etik kurul).
 * - Anonim raporlar destekler (reporterUserId nullable + reporterToken)
 * - Vaka durumu: open → under_review → decided (upheld/dismissed) → closed
 * - KVKK uyumlu: anonim raporlar için reporter kimliği saklanmaz
 */
export const etikReports = pgTable(
  'etik_reports',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => orgs.id, { onDelete: 'cascade' }),
    publicId: text('public_id').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    category: text('category').notNull().default('other'),
    severity: text('severity').notNull().default('medium'),
    isAnonymous: boolean('is_anonymous').notNull().default(true),
    reporterUserId: uuid('reporter_user_id').references(() => users.id, { onDelete: 'set null' }),
    reporterToken: text('reporter_token'),
    reporterContact: text('reporter_contact'),
    accusedDescription: text('accused_description'),
    incidentDate: text('incident_date'),
    incidentLocation: text('incident_location'),
    evidence: jsonb('evidence').$type<Array<{ kind: string; uri?: string; description?: string }>>().default([]),
    status: text('status').notNull().default('open'),
    assignedToUserId: uuid('assigned_to_user_id').references(() => users.id, { onDelete: 'set null' }),
    decision: text('decision'),
    decidedAt: timestamp('decided_at', { withTimezone: true }),
    decidedByUserId: uuid('decided_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    orgStatusIdx: index('etik_reports_org_status_idx').on(t.orgId, t.status),
    orgPublicIdIdx: index('etik_reports_org_public_id_idx').on(t.orgId, t.publicId),
    orgCreatedIdx: index('etik_reports_org_created_idx').on(t.orgId, t.createdAt),
  }),
);

/**
 * Soruşturma sırasında eklenen iç notlar / kanıtlar / etkileşimler.
 * Sadece kurul üyeleri görür (etik_reports.assignedToUserId veya admin/owner role).
 */
export const etikInvestigationNotes = pgTable(
  'etik_investigation_notes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => orgs.id, { onDelete: 'cascade' }),
    reportId: uuid('report_id')
      .notNull()
      .references(() => etikReports.id, { onDelete: 'cascade' }),
    authorUserId: uuid('author_user_id').references(() => users.id, { onDelete: 'set null' }),
    kind: text('kind').notNull().default('note'),
    body: text('body').notNull(),
    isInternal: boolean('is_internal').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    reportIdx: index('etik_notes_report_idx').on(t.reportId),
  }),
);

export type EtikReport = typeof etikReports.$inferSelect;
export type EtikNote = typeof etikInvestigationNotes.$inferSelect;
