import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { getDb, getPool } from './client';
import { orgs, users, orgModules, plans } from './schema';
import { MODULE_IDS, PLANS } from '@x/shared';

async function main() {
  const db = getDb();
  console.log('[x/db] Idempotent seed starting…');

  // 1) Plans — upsert all defined plans
  console.log('  • plans');
  for (const p of PLANS) {
    await db
      .insert(plans)
      .values({
        id: p.id,
        name: p.name,
        tagline: p.tagline,
        priceCentsTry: p.priceMonthlyTry,
        trialDays: p.trialDays,
        features: p.features,
        moduleIds: p.modules,
        quotas: {
          max_users: p.quotas.maxUsers,
          max_orgs_per_owner: p.quotas.maxOrgsPerOwner,
          ai_tokens_per_month: p.quotas.aiTokensPerMonth,
          storage_mb: p.quotas.storageMb,
          api_calls_per_day: p.quotas.apiCallsPerDay,
        },
        isPublic: true,
        sortOrder: PLANS.indexOf(p),
      })
      .onConflictDoUpdate({
        target: plans.id,
        set: {
          name: p.name,
          tagline: p.tagline,
          priceCentsTry: p.priceMonthlyTry,
          trialDays: p.trialDays,
          features: p.features,
          moduleIds: p.modules,
        },
      });
  }
  console.log('    ✓', PLANS.length, 'plans');

  // 2) Demo org (only if no orgs exist)
  const existingOrgs = await db.select({ count: sql<number>`count(*)::int` }).from(orgs);
  const orgCount = existingOrgs[0]?.count ?? 0;
  if (orgCount === 0) {
    console.log('  • demo org (no orgs yet)');
    const [demo] = await db
      .insert(orgs)
      .values({
        name: 'Demo Holding',
        slug: 'demo',
        sectorBundle: 'tam_pakcage',
        plan: 'trial',
        kvkkConsentText: 'Demo amaçlı KVKK metni.',
      })
      .returning();

    await db.insert(users).values({
      orgId: demo.id,
      email: 'owner@demo.local',
      fullName: 'Demo Owner',
      role: 'owner',
    });

    for (const moduleId of MODULE_IDS) {
      await db.insert(orgModules).values({
        orgId: demo.id,
        moduleId,
        isEnabled: true,
      });
    }
    console.log('    ✓ demo org with', MODULE_IDS.length, 'modules');
  } else {
    console.log('  • skipping demo org —', orgCount, 'orgs already exist');
  }

  await getPool().end();
  console.log('[x/db] ✅ Seed complete');
}

main().catch((err) => {
  console.error('[x/db] ❌ Seed failed:', err);
  process.exit(1);
});
