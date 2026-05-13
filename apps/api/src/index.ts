import { config as loadEnv } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.resolve(__dirname, '../../../.env') });
loadEnv(); // also load apps/api/.env if present

const { createApp } = await import('./app.js');
const { logger } = await import('./lib/logger.js');

const port = Number(process.env.PORT ?? 4200);

async function main() {
  const app = await createApp();
  app.listen(port, () => {
    logger.info({ port }, `[x/api] 🚀 listening on http://localhost:${port}`);
  });
}

main().catch((err) => {
  logger.error({ err }, '[x/api] failed to start');
  process.exit(1);
});
