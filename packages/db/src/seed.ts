import 'dotenv/config';
import { getDb, getPool } from './client.js';
import { orgs, users, orgModules } from './schema/index.js';
import { MODULE_IDS } from '@x/shared';

async function main() {
  const db = getDb();
  console.log('[x/db] Seeding…');

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
  console.log('  • org:', demo.slug);

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
  console.log('  •', MODULE_IDS.length, 'modules enabled');

  await getPool().end();
  console.log('[x/db] ✅ Seed complete');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
