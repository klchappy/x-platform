import { Router } from 'express';
import { z } from 'zod';
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { getDb } from '@x/db/client';
import { schema } from '@x/db';
import { httpError } from '@x/shared';
import { withTenant } from '@x/module-api';

const router = Router();
const { santralContacts, santralDirectoryEntries } = schema;

const ContactSchema = z.object({
  full_name: z.string().min(2),
  company: z.string().optional(),
  title: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  phone_alt: z.string().optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

const DirectoryEntrySchema = z.object({
  full_name: z.string().min(2),
  user_id: z.string().uuid().optional(),
  department: z.string().optional(),
  manager_id: z.string().uuid().optional(),
  phone_work: z.string().optional(),
  phone_mobile: z.string().optional(),
  phone_internal: z.string().optional(),
});

router.post(
  '/',
  withTenant(async (req, res, _next, t) => {
    const data = ContactSchema.parse(req.body);
    const [row] = await getDb()
      .insert(santralContacts)
      .values({ org_id: t.orgId, created_by: t.userId, ...data, email: data.email || null })
      .returning();
    res.status(201).json(row);
  }),
);

router.get(
  '/',
  withTenant(async (req, res, _next, t) => {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const db = getDb();
    let query = db
      .select()
      .from(santralContacts)
      .where(
        q
          ? and(
              eq(santralContacts.org_id, t.orgId),
              or(ilike(santralContacts.full_name, `%${q}%`), ilike(santralContacts.company, `%${q}%`), ilike(santralContacts.phone, `%${q}%`)),
            )
          : eq(santralContacts.org_id, t.orgId),
      )
      .orderBy(desc(santralContacts.created_at))
      .limit(500);
    const rows = await query;
    res.json(rows);
  }),
);

router.get(
  '/:id',
  withTenant(async (req, res, _next, t) => {
    const id = String(req.params.id);
    const row = await getDb().query.santralContacts.findFirst({
      where: (c, { and: a, eq: e }) => a(e(c.id, id), e(c.org_id, t.orgId)),
    });
    if (!row) throw httpError(404, 'Kişi bulunamadı');
    res.json(row);
  }),
);

router.patch(
  '/:id',
  withTenant(async (req, res, _next, t) => {
    const id = String(req.params.id);
    const data = ContactSchema.partial().parse(req.body);
    const [row] = await getDb()
      .update(santralContacts)
      .set({ ...data, email: data.email === '' ? null : data.email, updated_at: new Date() })
      .where(and(eq(santralContacts.id, id), eq(santralContacts.org_id, t.orgId)))
      .returning();
    if (!row) throw httpError(404, 'Kişi bulunamadı');
    res.json(row);
  }),
);

router.delete(
  '/:id',
  withTenant(async (req, res, _next, t) => {
    const id = String(req.params.id);
    const [row] = await getDb()
      .update(santralContacts)
      .set({ is_active: false, updated_at: new Date() })
      .where(and(eq(santralContacts.id, id), eq(santralContacts.org_id, t.orgId)))
      .returning();
    if (!row) throw httpError(404, 'Kişi bulunamadı');
    res.json({ ok: true });
  }),
);

router.post(
  '/directory',
  withTenant(async (req, res, _next, t) => {
    const data = DirectoryEntrySchema.parse(req.body);
    const [row] = await getDb()
      .insert(santralDirectoryEntries)
      .values({ org_id: t.orgId, ...data })
      .returning();
    res.status(201).json(row);
  }),
);

router.get(
  '/directory/list',
  withTenant(async (_req, res, _next, t) => {
    const rows = await getDb()
      .select()
      .from(santralDirectoryEntries)
      .where(and(eq(santralDirectoryEntries.org_id, t.orgId), eq(santralDirectoryEntries.is_active, true)))
      .orderBy(santralDirectoryEntries.full_name);
    res.json(rows);
  }),
);

router.get(
  '/stats/summary',
  withTenant(async (_req, res, _next, t) => {
    const db = getDb();
    const [c] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(santralContacts)
      .where(and(eq(santralContacts.org_id, t.orgId), eq(santralContacts.is_active, true)));
    const [d] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(santralDirectoryEntries)
      .where(and(eq(santralDirectoryEntries.org_id, t.orgId), eq(santralDirectoryEntries.is_active, true)));
    res.json({ contacts: c?.count ?? 0, directory: d?.count ?? 0 });
  }),
);

export default router;
