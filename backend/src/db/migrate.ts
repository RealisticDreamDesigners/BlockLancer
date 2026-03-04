import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './pool.js';
import pino from 'pino';

const logger = pino({ name: 'migrate' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
  const migrationsDir = path.join(__dirname, '../../migrations');
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');

    logger.info({ file }, 'Running migration...');
    try {
      await pool.query(sql);
      logger.info({ file }, 'Migration complete');
    } catch (err: any) {
      // Ignore "already exists" errors for idempotent migrations
      if (err.code === '42P07' || err.code === '23505') {
        logger.info({ file }, 'Migration already applied (skipping)');
      } else {
        logger.error({ err: err.message, file }, 'Migration failed');
        throw err;
      }
    }
  }
}

// Run directly if executed as a script
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(() => {
      logger.info('All migrations complete');
      process.exit(0);
    })
    .catch((err) => {
      logger.error({ err }, 'Migration error');
      process.exit(1);
    });
}
