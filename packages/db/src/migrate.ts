import 'dotenv/config';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { getDb, getPool } from './client.js';

async function main() {
  console.log('[x/db] Running migrations…');
  await migrate(getDb(), { migrationsFolder: './migrations' });
  console.log('[x/db] ✅ Migrations complete');
  await getPool().end();
}

main().catch((err) => {
  console.error('[x/db] ❌ Migration failed:', err);
  process.exit(1);
});
