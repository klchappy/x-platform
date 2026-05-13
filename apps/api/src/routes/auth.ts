import { Router } from 'express';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { createClient } from '@supabase/supabase-js';
import { getDb } from '@x/db/client';
import { users } from '@x/db/schema';
import { httpError } from '@x/shared';

const router = Router();

let _sb: ReturnType<typeof createClient> | null = null;
function sb() {
  if (!_sb) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error('SUPABASE_URL + SUPABASE_*_KEY required');
    _sb = createClient(url, key);
  }
  return _sb;
}

const MagicLinkSchema = z.object({ email: z.string().email() });

router.post('/magic-link', async (req, res, next) => {
  try {
    const { email } = MagicLinkSchema.parse(req.body);
    const redirectTo = `${process.env.APP_URL ?? 'http://localhost:5200'}/auth/callback`;
    const { error } = await sb().auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
    if (error) throw httpError(400, error.message, 'magic_link_failed');
    res.json({ ok: true, message: 'Email gönderildi' });
  } catch (e) {
    next(e);
  }
});

const ResolveSchema = z.object({ identifier: z.string().min(2) });

router.post('/resolve-identifier', async (req, res, next) => {
  try {
    const { identifier } = ResolveSchema.parse(req.body);
    const dbUser = await getDb().query.users.findFirst({ where: eq(users.email, identifier) });
    res.json({ exists: !!dbUser, isPending: dbUser?.isPending ?? false });
  } catch (e) {
    next(e);
  }
});

export default router;
