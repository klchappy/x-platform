import { Router } from 'express';
import { z } from 'zod';
import { randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { getDb } from '@x/db/client';
import { invitations, users } from '@x/db/schema';
import { OrgRoleSchema, httpError } from '@x/shared';
import { requireAuth, requireOrg, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const CreateInviteSchema = z.object({
  email: z.string().email(),
  role: OrgRoleSchema.default('employee'),
  moduleScopes: z.array(z.string()).default([]),
});

router.get('/', requireOrg, requireRole('admin', 'owner'), async (req, res, next) => {
  try {
    const rows = await getDb()
      .select()
      .from(invitations)
      .where(eq(invitations.orgId, req.authOrgId!));
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.post('/', requireOrg, requireRole('admin', 'owner'), async (req, res, next) => {
  try {
    const data = CreateInviteSchema.parse(req.body);
    const token = randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const [inv] = await getDb()
      .insert(invitations)
      .values({
        orgId: req.authOrgId!,
        email: data.email,
        role: data.role,
        moduleScopes: data.moduleScopes,
        token,
        invitedByUserId: req.authUserId!,
        expiresAt,
      })
      .returning();
    res.status(201).json({
      ...inv,
      acceptUrl: `${process.env.APP_URL ?? 'https://x.deploi.net'}/invite/${token}`,
    });
  } catch (e) {
    next(e);
  }
});

const AcceptSchema = z.object({ token: z.string().min(8) });

router.post('/accept', async (req, res, next) => {
  try {
    const { token } = AcceptSchema.parse(req.body);
    const db = getDb();
    const inv = await db.query.invitations.findFirst({ where: (i, { eq: e }) => e(i.token, token) });
    if (!inv) throw httpError(404, 'Davet bulunamadı', 'invite_not_found');
    if (inv.status !== 'pending') throw httpError(409, 'Davet zaten kullanılmış', 'invite_used');
    if (inv.expiresAt < new Date()) throw httpError(410, 'Davet süresi dolmuş', 'invite_expired');

    const user = req.authUser;
    if (!user) throw httpError(401, 'Önce giriş yapmalısınız', 'login_required');
    if (user.email.toLowerCase() !== inv.email.toLowerCase()) {
      throw httpError(403, `Davet ${inv.email} için, ${user.email} olarak giriş yaptınız`, 'invite_email_mismatch');
    }

    await db.update(users).set({ orgId: inv.orgId, role: inv.role, isPending: false }).where(eq(users.id, user.id));
    await db
      .update(invitations)
      .set({ status: 'accepted', acceptedAt: new Date() })
      .where(eq(invitations.id, inv.id));

    res.json({ ok: true, orgId: inv.orgId, role: inv.role });
  } catch (e) {
    next(e);
  }
});

router.post('/:id/revoke', requireOrg, requireRole('admin', 'owner'), async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const [updated] = await getDb()
      .update(invitations)
      .set({ status: 'revoked', revokedAt: new Date() })
      .where(eq(invitations.id, id))
      .returning();
    if (!updated) throw httpError(404, 'Davet bulunamadı');
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

export default router;
