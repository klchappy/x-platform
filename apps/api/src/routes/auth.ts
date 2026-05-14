import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { getDb } from '@x/db/client';
import { users, orgs, orgModules, subscriptions } from '@x/db/schema';
import { httpError, MODULE_IDS, OrgRoleSchema, PLAN_BY_ID } from '@x/shared';
import { signJwt } from '../lib/jwt.js';

const router = Router();

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[ıİ]/g, 'i')
    .replace(/[şŞ]/g, 's')
    .replace(/[ğĞ]/g, 'g')
    .replace(/[üÜ]/g, 'u')
    .replace(/[öÖ]/g, 'o')
    .replace(/[çÇ]/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

async function uniqueSlug(base: string): Promise<string> {
  const db = getDb();
  let slug = base || 'org';
  let i = 0;
  while (true) {
    const probe = i === 0 ? slug : `${slug}-${i}`;
    const exists = await db.query.orgs.findFirst({ where: (o, { eq: e }) => e(o.slug, probe) });
    if (!exists) return probe;
    i += 1;
    if (i > 100) throw httpError(500, 'Slug üretilemedi');
  }
}

const SignUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'En az 8 karakter'),
  fullName: z.string().min(2),
  orgName: z.string().min(2),
  planId: z.string().optional().default('starter'),
});

router.post('/sign-up', async (req, res, next) => {
  try {
    const data = SignUpSchema.parse(req.body);
    const db = getDb();

    const existing = await db.query.users.findFirst({ where: (u, { eq: e }) => e(u.email, data.email.toLowerCase()) });
    if (existing) throw httpError(409, 'Bu e-posta zaten kayıtlı', 'email_taken');

    const plan = PLAN_BY_ID[data.planId] ?? PLAN_BY_ID['starter']!;
    const slug = await uniqueSlug(slugify(data.orgName));
    const passwordHash = await bcrypt.hash(data.password, 12);

    const trialDays = plan.trialDays;
    const trialEndsAt = trialDays > 0 ? new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000) : null;

    const [org] = await db
      .insert(orgs)
      .values({
        name: data.orgName,
        slug,
        sectorBundle: 'tam_pakcage',
        plan: 'trial',
        trialEndsAt,
      })
      .returning();

    const [user] = await db
      .insert(users)
      .values({
        orgId: org.id,
        email: data.email.toLowerCase(),
        passwordHash,
        fullName: data.fullName,
        role: 'owner',
      })
      .returning();

    for (const moduleId of MODULE_IDS) {
      await db.insert(orgModules).values({ orgId: org.id, moduleId, isEnabled: true });
    }

    const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await db.insert(subscriptions).values({
      orgId: org.id,
      planId: plan.id,
      status: plan.priceMonthlyTry === 0 ? 'active' : 'trialing',
      periodStart: new Date(),
      periodEnd,
    });

    const token = signJwt({ sub: user.id, email: user.email, org: org.id, role: 'owner' });
    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, fullName: user.fullName, role: 'owner' },
      org: { id: org.id, name: org.name, slug: org.slug, plan: plan.id, trialEndsAt },
    });
  } catch (e) {
    next(e);
  }
});

const SignInSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

router.post('/sign-in', async (req, res, next) => {
  try {
    const { email, password } = SignInSchema.parse(req.body);
    const db = getDb();
    const user = await db.query.users.findFirst({ where: (u, { eq: e }) => e(u.email, email.toLowerCase()) });
    if (!user || !user.passwordHash) throw httpError(401, 'Geçersiz e-posta veya şifre', 'invalid_credentials');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw httpError(401, 'Geçersiz e-posta veya şifre', 'invalid_credentials');
    if (!user.isActive) throw httpError(403, 'Hesabınız pasif durumda', 'inactive');

    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

    const token = signJwt({ sub: user.id, email: user.email, org: user.orgId, role: user.role });
    res.json({
      token,
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, orgId: user.orgId },
    });
  } catch (e) {
    next(e);
  }
});

const ResolveSchema = z.object({ identifier: z.string().min(2) });

router.post('/resolve-identifier', async (req, res, next) => {
  try {
    const { identifier } = ResolveSchema.parse(req.body);
    const db = getDb();
    const u = await db.query.users.findFirst({ where: (us, { eq: e }) => e(us.email, identifier.toLowerCase()) });
    res.json({ exists: !!u, hasPassword: !!u?.passwordHash, isPending: u?.isPending ?? false });
  } catch (e) {
    next(e);
  }
});

router.post('/sign-out', (_req, res) => {
  res.json({ ok: true });
});

export default router;
