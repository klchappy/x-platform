import { defineModule, withTenant } from '@x/module-api';
import { z } from 'zod';
import { and, desc, eq, sql } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';
import { getDb } from '@x/db/client';
import { etikReports, etikInvestigationNotes } from '@x/db/schema';
import { httpError } from '@x/shared';

const REPORT_CATEGORIES = [
  'mobbing',
  'taciz',
  'ayrimcilik',
  'yolsuzluk',
  'cikar_catismasi',
  'guvenlik',
  'cevre',
  'veri_kvkk',
  'diger',
] as const;

const ReportSchema = z.object({
  title: z.string().min(4).max(200),
  description: z.string().min(20),
  category: z.enum(REPORT_CATEGORIES).default('diger'),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  isAnonymous: z.boolean().default(true),
  reporterContact: z.string().max(200).optional(),
  accusedDescription: z.string().max(500).optional(),
  incidentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  incidentLocation: z.string().max(200).optional(),
  evidence: z
    .array(z.object({ kind: z.string(), uri: z.string().optional(), description: z.string().optional() }))
    .default([]),
});

const DecideSchema = z.object({
  decision: z.enum(['upheld', 'dismissed', 'partial']),
  notes: z.string().optional(),
});

const NoteSchema = z.object({
  body: z.string().min(2),
  kind: z.enum(['note', 'evidence', 'contact', 'decision']).default('note'),
  isInternal: z.boolean().default(true),
});

function generatePublicId(): string {
  const year = new Date().getUTCFullYear();
  const rand = randomBytes(4).toString('hex').toUpperCase();
  return `ETK-${year}-${rand}`;
}

export default defineModule({
  id: 'etik',
  version: '0.1.0',
  registerRoutes(router, ctx) {
    router.get('/health', (_req, res) => res.json({ ok: true, module: 'etik', version: '0.1.0' }));

    router.get('/overview', (_req, res) => {
      res.json({
        name: 'Etik',
        tagline: 'Etik bildirim & soruşturma',
        capabilities: [
          'reports.anonymous.submit',
          'reports.list',
          'reports.assign',
          'investigation.notes',
          'decision.upheld_or_dismissed',
        ],
        categories: REPORT_CATEGORIES,
      });
    });

    // POST /reports — şikayet/bildirim oluştur
    router.post(
      '/reports',
      withTenant(async (req, res, _next, t) => {
        const data = ReportSchema.parse(req.body);
        const publicId = generatePublicId();
        const reporterToken = data.isAnonymous ? randomBytes(16).toString('hex') : null;
        const [row] = await getDb()
          .insert(etikReports)
          .values({
            orgId: t.orgId,
            publicId,
            title: data.title,
            description: data.description,
            category: data.category,
            severity: data.severity,
            isAnonymous: data.isAnonymous,
            reporterUserId: data.isAnonymous ? null : t.userId,
            reporterToken,
            reporterContact: data.reporterContact,
            accusedDescription: data.accusedDescription,
            incidentDate: data.incidentDate,
            incidentLocation: data.incidentLocation,
            evidence: data.evidence,
            status: 'open',
          })
          .returning();
        ctx.log('etik.report.submitted', { publicId, category: data.category, severity: data.severity });
        // Anonim raporlarda reporter sadece token'ı görür — kimliği saklanmaz
        const response = {
          ...row,
          reporterToken: data.isAnonymous ? reporterToken : undefined,
        };
        res.status(201).json(response);
      }),
    );

    // GET /reports — manager+ için liste (employee sadece kendi raporunu)
    router.get(
      '/reports',
      withTenant(async (req, res, _next, t) => {
        const isInvestigator = ['owner', 'admin', 'manager'].includes(t.role);
        const status = typeof req.query.status === 'string' ? req.query.status : null;
        const where = isInvestigator
          ? status
            ? and(eq(etikReports.orgId, t.orgId), eq(etikReports.status, status))
            : eq(etikReports.orgId, t.orgId)
          : and(eq(etikReports.orgId, t.orgId), eq(etikReports.reporterUserId, t.userId));
        const rows = await getDb()
          .select()
          .from(etikReports)
          .where(where)
          .orderBy(desc(etikReports.createdAt))
          .limit(300);
        // Investigator değilse, başka kişilere ait anonim raporları dışla
        res.json(rows);
      }),
    );

    // GET /reports/:id — detay + notlar
    router.get(
      '/reports/:id',
      withTenant(async (req, res, _next, t) => {
        const id = String(req.params.id);
        const db = getDb();
        const isInvestigator = ['owner', 'admin', 'manager'].includes(t.role);
        const report = await db.query.etikReports.findFirst({
          where: (r, { and: a, eq: e }) => a(e(r.id, id), e(r.orgId, t.orgId)),
        });
        if (!report) throw httpError(404, 'Rapor bulunamadı', 'not_found');
        if (!isInvestigator && report.reporterUserId !== t.userId) {
          throw httpError(403, 'Bu rapora erişiminiz yok', 'forbidden');
        }
        const notes = isInvestigator
          ? await db
              .select()
              .from(etikInvestigationNotes)
              .where(eq(etikInvestigationNotes.reportId, id))
              .orderBy(desc(etikInvestigationNotes.createdAt))
          : [];
        res.json({ ...report, notes });
      }),
    );

    // POST /reports/:id/assign — vakayı bir kurul üyesine ata
    router.post(
      '/reports/:id/assign',
      withTenant(async (req, res, _next, t) => {
        if (!['owner', 'admin'].includes(t.role)) throw httpError(403, 'Yetkisiz', 'forbidden');
        const id = String(req.params.id);
        const assigneeId = String((req.body as { userId?: string }).userId ?? '');
        if (!assigneeId) throw httpError(400, 'userId gerekli', 'missing_user');
        const [updated] = await getDb()
          .update(etikReports)
          .set({ assignedToUserId: assigneeId, status: 'under_review', updatedAt: new Date() })
          .where(and(eq(etikReports.id, id), eq(etikReports.orgId, t.orgId)))
          .returning();
        if (!updated) throw httpError(404, 'Rapor bulunamadı');
        ctx.log('etik.report.assigned', { id, to: assigneeId });
        res.json(updated);
      }),
    );

    // POST /reports/:id/decide — kararı kayıt et
    router.post(
      '/reports/:id/decide',
      withTenant(async (req, res, _next, t) => {
        if (!['owner', 'admin'].includes(t.role)) throw httpError(403, 'Yetkisiz', 'forbidden');
        const id = String(req.params.id);
        const data = DecideSchema.parse(req.body);
        const [updated] = await getDb()
          .update(etikReports)
          .set({
            decision: data.decision,
            decidedAt: new Date(),
            decidedByUserId: t.userId,
            status: 'closed',
            updatedAt: new Date(),
          })
          .where(and(eq(etikReports.id, id), eq(etikReports.orgId, t.orgId)))
          .returning();
        if (!updated) throw httpError(404, 'Rapor bulunamadı');
        if (data.notes) {
          await getDb().insert(etikInvestigationNotes).values({
            orgId: t.orgId,
            reportId: id,
            authorUserId: t.userId,
            kind: 'decision',
            body: data.notes,
            isInternal: true,
          });
        }
        ctx.log('etik.report.decided', { id, decision: data.decision });
        res.json(updated);
      }),
    );

    // POST /reports/:id/notes — soruşturma notu ekle
    router.post(
      '/reports/:id/notes',
      withTenant(async (req, res, _next, t) => {
        if (!['owner', 'admin', 'manager'].includes(t.role)) throw httpError(403, 'Yetkisiz', 'forbidden');
        const id = String(req.params.id);
        const data = NoteSchema.parse(req.body);
        const [row] = await getDb()
          .insert(etikInvestigationNotes)
          .values({
            orgId: t.orgId,
            reportId: id,
            authorUserId: t.userId,
            kind: data.kind,
            body: data.body,
            isInternal: data.isInternal,
          })
          .returning();
        res.status(201).json(row);
      }),
    );

    // GET /stats — kurul dashboard
    router.get(
      '/stats',
      withTenant(async (_req, res, _next, t) => {
        const db = getDb();
        const [open] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(etikReports)
          .where(and(eq(etikReports.orgId, t.orgId), eq(etikReports.status, 'open')));
        const [underReview] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(etikReports)
          .where(and(eq(etikReports.orgId, t.orgId), eq(etikReports.status, 'under_review')));
        const [closed] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(etikReports)
          .where(and(eq(etikReports.orgId, t.orgId), eq(etikReports.status, 'closed')));
        const [total] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(etikReports)
          .where(eq(etikReports.orgId, t.orgId));
        res.json({
          totalReports: total?.count ?? 0,
          openCount: open?.count ?? 0,
          underReviewCount: underReview?.count ?? 0,
          closedCount: closed?.count ?? 0,
        });
      }),
    );

    ctx.log('etik module registered', { routes: 8 });
  },
});
