import 'dotenv/config';
import pg from 'pg';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema/index.js';

const { Pool } = pg;

let _pool: pg.Pool | null = null;
let _db: NodePgDatabase<typeof schema> | null = null;

export function getPool(): pg.Pool {
  if (!_pool) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error('DATABASE_URL is required');
    }
    // SSL: only enable for external/managed DBs (hostnames with dots like supabase.co).
    // Coolify internal hostnames (UUIDs, no dots) and localhost use plain TCP.
    const host = (() => {
      try {
        return new URL(url).hostname;
      } catch {
        return '';
      }
    })();
    const useSsl =
      host.includes('.') && !host.endsWith('.local') && host !== 'localhost' && host !== '127.0.0.1';
    _pool = new Pool({
      connectionString: url,
      max: 10,
      idleTimeoutMillis: 30_000,
      ssl: useSsl ? { rejectUnauthorized: false } : false,
    });
  }
  return _pool;
}

export function getDb(): NodePgDatabase<typeof schema> {
  if (!_db) {
    _db = drizzle(getPool(), { schema });
  }
  return _db;
}

export type Db = NodePgDatabase<typeof schema>;
export { schema };
