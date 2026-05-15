import { defineModule, withTenant } from '@x/module-api';
import { z } from 'zod';
import { and, desc, eq, sql } from 'drizzle-orm';
import { getDb } from '@x/db/client';
import { saymanPayables, saymanPayments } from '@x/db/schema';
import { httpError } from '@x/shared';

const PayableSchema = z.object({
  title: z.string().min(2),
  counterparty: z.string().optional(),
  category: z.string().optional(),
  invoiceNo: z.string().optional(),
  periodLabel: z.string().optional(),
  amountCentsTry: z.number().int().nonnegative(),
  currency: z.string().default('TRY'),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD bekleniyor')
    .optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

const PaymentSchema = z.object({
  payableId: z.string().uuid().optional(),
  paidAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amountCentsTry: z.number().int().positive(),
  method: z.enum(['havale', 'eft', 'kart', 'nakit', 'cek', 'diger']).default('havale'),
  referenceNo: z.string().optional(),
  notes: z.string().optional(),
});

function computeStatus(amount: number, paid: number, dueDate?: string | null): string {
  if (paid >= amount && amount > 0) return 'paid';
  if (paid > 0 && paid < amount) return 'partial_paid';
  if (dueDate) {
    const today = new Date().toISOString().slice(0, 10);
    if (dueDate < today) return 'overdue';
    const due = new Date(dueDate);
    const daysLeft = Math.floor((due.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
    if (daysLeft <= 3) return 'approaching';
  }
  return 'pending';
}

export default defineModule({
  id: 'sayman',
  version: '0.1.0',
  registerRoutes(router, ctx) {
    router.get('/health', (_req, res) => res.json({ ok: true, module: 'sayman', version: '0.1.0' }));

    router.get('/overview', (_req, res) => {
      res.json({
        name: 'Sayman',
        tagline: 'Muhasebe & ödeme takibi',
        capabilities: [
          'payables.crud',
          'payments.record',
          'status.auto',
          'cashflow.stats',
        ],
      });
    });

    // POST /payables — yeni borç/fatura kaydı
    router.post(
      '/payables',
      withTenant(async (req, res, _next, t) => {
        const data = PayableSchema.parse(req.body);
        const status = computeStatus(data.amountCentsTry, 0, data.dueDate);
        const [row] = await getDb()
          .insert(saymanPayables)
          .values({
            orgId: t.orgId,
            createdBy: t.userId,
            ...data,
            status,
          })
          .returning();
        ctx.log('sayman.payable.created', { title: data.title, amount: data.amountCentsTry });
        res.status(201).json(row);
      }),
    );

    // GET /payables — filtreler: ?status=, ?period=
    router.get(
      '/payables',
      withTenant(async (req, res, _next, t) => {
        const limit = Math.min(500, Number(req.query.limit ?? 200));
        const status = typeof req.query.status === 'string' ? req.query.status : null;
        const where = status
          ? and(eq(saymanPayables.orgId, t.orgId), eq(saymanPayables.status, status))
          : eq(saymanPayables.orgId, t.orgId);
        const rows = await getDb()
          .select()
          .from(saymanPayables)
          .where(where)
          .orderBy(desc(saymanPayables.createdAt))
          .limit(limit);
        res.json(rows);
      }),
    );

    // GET /payables/:id — tek kayıt + ilgili ödemeler
    router.get(
      '/payables/:id',
      withTenant(async (req, res, _next, t) => {
        const id = String(req.params.id);
        const db = getDb();
        const row = await db.query.saymanPayables.findFirst({
          where: (p, { and: a, eq: e }) => a(e(p.id, id), e(p.orgId, t.orgId)),
        });
        if (!row) throw httpError(404, 'Kayıt bulunamadı', 'not_found');
        const payments = await db
          .select()
          .from(saymanPayments)
          .where(and(eq(saymanPayments.orgId, t.orgId), eq(saymanPayments.payableId, id)))
          .orderBy(desc(saymanPayments.paidAt));
        res.json({ ...row, payments });
      }),
    );

    // POST /payments — ödeme kaydet (ilgili payable status güncellenir)
    router.post(
      '/payments',
      withTenant(async (req, res, _next, t) => {
        const data = PaymentSchema.parse(req.body);
        const db = getDb();
        const [row] = await db
          .insert(saymanPayments)
          .values({ orgId: t.orgId, createdBy: t.userId, ...data })
          .returning();

        if (data.payableId) {
          const payable = await db.query.saymanPayables.findFirst({
            where: (p, { and: a, eq: e }) => a(e(p.id, data.payableId!), e(p.orgId, t.orgId)),
          });
          if (payable) {
            const newPaid = payable.paidCentsTry + data.amountCentsTry;
            const newStatus = computeStatus(payable.amountCentsTry, newPaid, payable.dueDate);
            await db
              .update(saymanPayables)
              .set({ paidCentsTry: newPaid, status: newStatus, updatedAt: new Date() })
              .where(eq(saymanPayables.id, payable.id));
          }
        }
        ctx.log('sayman.payment.recorded', { amount: data.amountCentsTry, method: data.method });
        res.status(201).json(row);
      }),
    );

    // GET /payments — son ödemeler
    router.get(
      '/payments',
      withTenant(async (_req, res, _next, t) => {
        const rows = await getDb()
          .select()
          .from(saymanPayments)
          .where(eq(saymanPayments.orgId, t.orgId))
          .orderBy(desc(saymanPayments.paidAt))
          .limit(200);
        res.json(rows);
      }),
    );

    // GET /stats — özet KPI
    router.get(
      '/stats',
      withTenant(async (_req, res, _next, t) => {
        const db = getDb();
        const [agg] = await db
          .select({
            total: sql<number>`coalesce(sum(${saymanPayables.amountCentsTry}),0)::int`,
            paid: sql<number>`coalesce(sum(${saymanPayables.paidCentsTry}),0)::int`,
            count: sql<number>`count(*)::int`,
          })
          .from(saymanPayables)
          .where(eq(saymanPayables.orgId, t.orgId));
        const [overdue] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(saymanPayables)
          .where(and(eq(saymanPayables.orgId, t.orgId), eq(saymanPayables.status, 'overdue')));
        const [pending] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(saymanPayables)
          .where(and(eq(saymanPayables.orgId, t.orgId), eq(saymanPayables.status, 'pending')));
        res.json({
          totalPayablesCount: agg?.count ?? 0,
          totalAmountCentsTry: agg?.total ?? 0,
          paidCentsTry: agg?.paid ?? 0,
          openCentsTry: (agg?.total ?? 0) - (agg?.paid ?? 0),
          overdueCount: overdue?.count ?? 0,
          pendingCount: pending?.count ?? 0,
        });
      }),
    );

    ctx.log('sayman module registered', { routes: 7 });
  },
});
