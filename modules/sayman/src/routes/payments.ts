import { Router } from 'express';
import { z } from 'zod';
import { and, desc, eq } from 'drizzle-orm';
import { getDb } from '@x/db/client';
import { schema } from '@x/db';
import { httpError } from '@x/shared';
import { withTenant } from '@x/module-api';

const router = Router();
const { saymanPaymentTransactions, saymanPayableItems } = schema;

const PaymentSchema = z.object({
  payable_id: z.string().uuid(),
  paid_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.number().positive(),
  method: z.enum(['havale', 'eft', 'kart', 'nakit', 'cek', 'senet', 'otomatik', 'diger']),
  bank_short_code: z.string().optional(),
  reference_no: z.string().optional(),
  notes: z.string().optional(),
});

router.post(
  '/',
  withTenant(async (req, res, _next, t) => {
    const data = PaymentSchema.parse(req.body);
    const db = getDb();
    const payable = await db.query.saymanPayableItems.findFirst({
      where: (p, { and: a, eq: e }) => a(e(p.id, data.payable_id), e(p.org_id, t.orgId)),
    });
    if (!payable) throw httpError(404, 'Borç bulunamadı');

    const [payment] = await db
      .insert(saymanPaymentTransactions)
      .values({
        org_id: t.orgId,
        payable_id: data.payable_id,
        paid_at: data.paid_at,
        amount: data.amount.toString(),
        method: data.method,
        bank_short_code: data.bank_short_code,
        reference_no: data.reference_no,
        notes: data.notes,
        created_by: t.userId,
      })
      .returning();

    const totalAmount = Number(payable.amount);
    const newPaid = Number(payable.paid_amount) + data.amount;
    let newStatus: typeof saymanPayableItems.$inferSelect['status'] = payable.status;
    if (newPaid >= totalAmount) newStatus = 'paid';
    else if (newPaid > 0) newStatus = 'partial_paid';

    await db
      .update(saymanPayableItems)
      .set({ paid_amount: newPaid.toString(), status: newStatus, updated_at: new Date() })
      .where(eq(saymanPayableItems.id, data.payable_id));

    res.status(201).json({ payment, payable_new_status: newStatus, payable_new_paid: newPaid });
  }),
);

router.get(
  '/',
  withTenant(async (_req, res, _next, t) => {
    const rows = await getDb()
      .select()
      .from(saymanPaymentTransactions)
      .where(eq(saymanPaymentTransactions.org_id, t.orgId))
      .orderBy(desc(saymanPaymentTransactions.paid_at))
      .limit(300);
    res.json(rows);
  }),
);

export default router;
