import { Router } from 'express';
import { z } from 'zod';
import { chat, ChatRequestSchema, DEFAULT_MODELS } from '@x/ai';
import { httpError } from '@x/shared';
import { getDb } from '@x/db/client';
import { aiUsage } from '@x/db/schema';
import { requireAuth, requireOrg } from '../middleware/auth.js';
import { getActivePlan, getUsage, incrUsage, currentMonthKey } from '../lib/quota.js';

const router = Router();
router.use(requireAuth, requireOrg);

const ChatSchema = ChatRequestSchema.extend({
  moduleId: z.string().optional(),
  purpose: z.string().optional(),
});

router.post('/chat', async (req, res, next) => {
  try {
    const body = ChatSchema.parse(req.body);
    const orgId = req.authOrgId!;
    const userId = req.authUserId!;

    const plan = await getActivePlan(orgId);
    const period = currentMonthKey();
    const quota = await getUsage(orgId, 'ai_tokens', period, plan.quotas.aiTokensPerMonth);
    if (quota.remaining <= 0) {
      throw httpError(429, 'AI token kotanız tükendi. Planı yükseltin.', 'ai_quota_exceeded', {
        plan: plan.id,
        used: quota.used,
        limit: quota.limit,
      });
    }

    // Resolve provider key from env (per-org integration_connections support coming)
    const provider = body.provider;
    const envKey =
      provider === 'anthropic' ? process.env.ANTHROPIC_API_KEY :
      provider === 'openai' ? process.env.OPENAI_API_KEY :
      process.env.GOOGLE_AI_API_KEY;
    if (!envKey) {
      throw httpError(503, `Bu provider için API anahtarı yapılandırılmamış: ${provider}`, 'ai_no_key');
    }

    const model = body.model ?? DEFAULT_MODELS[provider];
    const started = Date.now();
    try {
      const response = await chat(
        { provider, model, apiKey: envKey },
        body.messages,
      );

      const totalTokens = (response.inputTokens ?? 0) + (response.outputTokens ?? 0);

      await getDb()
        .insert(aiUsage)
        .values({
          orgId,
          userId,
          moduleId: body.moduleId,
          provider,
          model: response.model,
          inputTokens: response.inputTokens ?? 0,
          outputTokens: response.outputTokens ?? 0,
          totalTokens,
          purpose: body.purpose,
          success: true,
        })
        .catch(() => undefined); // best-effort

      await incrUsage(orgId, 'ai_tokens', period, totalTokens);

      res.json({
        text: response.text,
        model: response.model,
        provider,
        usage: {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens,
          monthRemaining: Math.max(0, quota.remaining - totalTokens),
          monthLimit: quota.limit,
        },
        durationMs: Date.now() - started,
      });
    } catch (err) {
      await getDb()
        .insert(aiUsage)
        .values({
          orgId,
          userId,
          moduleId: body.moduleId,
          provider,
          model,
          success: false,
          errorMessage: err instanceof Error ? err.message : 'unknown',
          purpose: body.purpose,
        })
        .catch(() => undefined);
      throw err;
    }
  } catch (e) {
    next(e);
  }
});

router.get('/usage', async (req, res, next) => {
  try {
    const orgId = req.authOrgId!;
    const plan = await getActivePlan(orgId);
    const period = currentMonthKey();
    const tokens = await getUsage(orgId, 'ai_tokens', period, plan.quotas.aiTokensPerMonth);
    res.json({
      plan: plan.id,
      period,
      tokens,
      provider_keys_available: {
        anthropic: !!process.env.ANTHROPIC_API_KEY,
        openai: !!process.env.OPENAI_API_KEY,
        google: !!process.env.GOOGLE_AI_API_KEY,
      },
    });
  } catch (e) {
    next(e);
  }
});

export default router;
