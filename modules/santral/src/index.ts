import { defineModule, withTenant } from '@x/module-api';
import { z } from 'zod';
import { desc, eq, and, sql } from 'drizzle-orm';
import { getDb } from '@x/db/client';
import { santralContacts, santralCalls } from '@x/db/schema';

const ContactSchema = z.object({
  fullName: z.string().min(2),
  company: z.string().optional(),
  title: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  phoneAlt: z.string().optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

const CallSchema = z.object({
  direction: z.enum(['inbound', 'outbound', 'missed']),
  contactId: z.string().uuid().optional(),
  externalNumber: z.string().optional(),
  durationSec: z.number().int().nonnegative().optional(),
  notes: z.string().optional(),
});

export default defineModule({
  id: 'santral',
  version: '0.2.0',
  registerRoutes(router, ctx) {
    router.get('/health', (_req, res) => res.json({ ok: true, module: 'santral', version: '0.2.0' }));

    router.get('/overview', (_req, res) => {
      res.json({
        name: 'Santral',
        tagline: 'Sesli asistan & CRM',
        capabilities: ['contacts.crud', 'calls.log', 'calls.list'],
      });
    });

    router.post(
      '/contacts',
      withTenant(async (req, res, _next, t) => {
        const data = ContactSchema.parse(req.body);
        const [row] = await getDb()
          .insert(santralContacts)
          .values({ orgId: t.orgId, createdBy: t.userId, ...data, email: data.email || null })
          .returning();
        ctx.log('santral.contact.created', { name: data.fullName });
        res.status(201).json(row);
      }),
    );

    router.get(
      '/contacts',
      withTenant(async (_req, res, _next, t) => {
        const rows = await getDb()
          .select()
          .from(santralContacts)
          .where(eq(santralContacts.orgId, t.orgId))
          .orderBy(desc(santralContacts.createdAt))
          .limit(500);
        res.json(rows);
      }),
    );

    router.post(
      '/calls',
      withTenant(async (req, res, _next, t) => {
        const data = CallSchema.parse(req.body);
        const [row] = await getDb()
          .insert(santralCalls)
          .values({
            orgId: t.orgId,
            answeredByUserId: t.userId,
            ...data,
          })
          .returning();
        ctx.log('santral.call.logged', { direction: data.direction });
        res.status(201).json(row);
      }),
    );

    router.get(
      '/calls',
      withTenant(async (_req, res, _next, t) => {
        const rows = await getDb()
          .select()
          .from(santralCalls)
          .where(eq(santralCalls.orgId, t.orgId))
          .orderBy(desc(santralCalls.occurredAt))
          .limit(200);
        res.json(rows);
      }),
    );

    router.get(
      '/stats',
      withTenant(async (_req, res, _next, t) => {
        const db = getDb();
        const [c] = await db.select({ count: sql<number>`count(*)::int` }).from(santralContacts).where(eq(santralContacts.orgId, t.orgId));
        const [k] = await db.select({ count: sql<number>`count(*)::int` }).from(santralCalls).where(eq(santralCalls.orgId, t.orgId));
        res.json({ totalContacts: c?.count ?? 0, totalCalls: k?.count ?? 0 });
      }),
    );

    ctx.log('santral module registered', { routes: 6 });
  },
});
