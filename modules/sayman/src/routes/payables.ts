import { Router } from 'express';
import { z } from 'zod';
import { and, desc, eq, sql } from 'drizzle-orm';
import { getDb } from '@x/db/client';
import { schema } from '@x/db';
import { httpError } from '@x/shared';
import { withTenant } from '@x/module-api';

const router = Router();
const { saymanPayableItems, saymanPaymentTransactions } = schema;

const PayableSchema = z.object({
  title: z.string().min(2),
  owner_type: z.enum(['company', 'person', 'institution']).default('company'),
  company_id: z.string().uuid().optional(),
  person_id: z.string().uuid().optional(),
  institution_id: z.string().uuid().optional(),
  category: z.string().optional(),
  supplier_name: z.string().optional(),
  invoice_number: z.string().optional(),
  period_label: z.string().optional(),
  issue_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  amount: z.number().positive(),
  currency: z.string().default('TRY'),
  expected_method: z.enum(['havale', 'eft', 'kart', 'nakit', 'cek', 'senet', 'otomatik', 'diger']).optional(),
  notes: z.string().optional(),
});

function computeStatus(amount: number, paid: number, dueDate?: string | null): typeof saymanPayableItems.$inferSelect['status'] {
  if (paid >= amount && amount > 0) return 'paid';
  if (paid > 0 && paid < amount) return 'partial_paid';
  if (dueDate) {
    const today = new Date().toISOString().slice(0, 10);
    if (dueDate < today) return 'overdue';
    const daysLeft = Math.floor((new Date(dueDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
    if (daysLeft <= 3) return 'approaching';
  }
  return 'pending';
}

router.post(
  '/',
  withTenant(async (req, res, _next, t) => {
    const data = PayableSchema.parse(req.body);
    const status = computeStatus(data.amount, 0, data.due_date);
    const [row] = await getDb()
      .insert(saymanPayableItems)
      .values({
        org_id: t.orgId,
        created_by: t.userId,
        title: data.title,
        owner_type: data.owner_type,
        company_id: data.company_id,
        person_id: data.person_id,
        institution_id: data.institution_id,
        category: data.category,
        supplier_name: data.supplier_name,
        invoice_number: data.invoice_number,
        period_label: data.period_label,
        issue_date: data.issue_date,
        due_date: data.due_date,
        amount: data.amount.toString(),
        currency: data.currency,
        expected_method: data.expected_method,
        notes: data.notes,
        status,
      })
      .returning();
    res.status(201).json(row);
  }),
);

router.get(
  '/',
  withTenant(async (req, res, _next, t) => {
    const status = typeof req.query.status === 'string' ? req.query.status : null;
    const where = status
      ? and(eq(saymanPayableItems.org_id, t.orgId), eq(saymanPayableItems.status, status as typeof saymanPayableItems.$inferSelect['status']))
      : eq(saymanPayableItems.org_id, t.orgId);
    const rows = await getDb()
      .select()
      .from(saymanPayableItems)
      .where(where)
      .orderBy(desc(saymanPayableItems.created_at))
      .limit(500);
    res.json(rows);
  }),
);

router.get(
  '/:id',
  withTenant(async (req, res, _next, t) => {
    const id = String(req.params.id);
    const row = await getDb().query.saymanPayableItems.findFirst({
      where: (p, { and: a, eq: e }) => a(e(p.id, id), e(p.org_id, t.orgId)),
    });
    if (!row) throw httpError(404, 'Borç bulunamadı');
    const payments = await getDb()
      .select()
      .from(saymanPaymentTransactions)
      .where(and(eq(saymanPaymentTransactions.org_id, t.orgId), eq(saymanPaymentTransactions.payable_id, id)))
      .orderBy(desc(saymanPaymentTransactions.paid_at));
    res.json({ ...row, payments });
  }),
);

router.get(
  '/stats/summary',
  withTenant(async (_req, res, _next, t) => {
    const db = getDb();
    const [agg] = await db
      .select({
        total: sql<number>`coalesce(sum(${saymanPayableItems.amount})::numeric,0)`,
        paid: sql<number>`coalesce(sum(${saymanPayableItems.paid_amount})::numeric,0)`,
        count: sql<number>`count(*)::int`,
      })
      .from(saymanPayableItems)
      .where(eq(saymanPayableItems.org_id, t.orgId));
    const [overdue] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(saymanPayableItems)
      .where(and(eq(saymanPayableItems.org_id, t.orgId), eq(saymanPayableItems.status, 'overdue')));
    res.json({
      total_count: agg?.count ?? 0,
      total_amount: Number(agg?.total ?? 0),
      paid_amount: Number(agg?.paid ?? 0),
      open_amount: Number(agg?.total ?? 0) - Number(agg?.paid ?? 0),
      overdue_count: overdue?.count ?? 0,
    });
  }),
);

export default router;
