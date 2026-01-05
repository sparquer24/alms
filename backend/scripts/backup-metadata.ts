import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// allow passing a database URL via CLI: --database-url <url> or -d <url>
const argv = process.argv.slice(2);
const dbArgIndex = argv.findIndex((a) => a === '--database-url' || a === '-d');
if (dbArgIndex !== -1 && argv[dbArgIndex + 1]) {
  process.env.DATABASE_URL = argv[dbArgIndex + 1];
}

const prisma = new PrismaClient();

async function checkConnection(): Promise<boolean> {
  try {
    // simple lightweight query to validate connectivity
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await prisma.$queryRawUnsafe('SELECT 1');
    return true;
  } catch (e) {
    return false;
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('No DATABASE_URL found. Set the DATABASE_URL environment variable or pass --database-url <url>');
    process.exit(1);
  }

  const ok = await checkConnection();
  if (!ok) {
    const hostPort = process.env.DATABASE_URL.split('@').pop();
    console.error(`Cannot reach database server at ${hostPort}`);
    console.error('Ensure the database is reachable from this machine, credentials are correct, and any required VPN/VPC/SSH tunnelling is active.');
    console.error('You can also run this script from a host with network access to the DB or pass a different URL via --database-url');
    process.exit(1);
  }

  // fetch user tables from the public schema
  const tablesRaw: Array<{ tablename: string }> =
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    (await prisma.$queryRawUnsafe(
      `SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public' AND tablename NOT LIKE 'pg_%' AND tablename NOT LIKE 'sql_%'`
    )) as any;

  const result: Record<string, any[]> = {};

  for (const t of tablesRaw) {
    const table = t.tablename;
    try {
      // Use raw select to get all rows for the table
      // We quote the table name to preserve case/special chars
      // $queryRawUnsafe is used because table name is dynamic
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const rows = (await prisma.$queryRawUnsafe(`SELECT * FROM "${table}"`)) as any[];
      result[table] = Array.isArray(rows) ? rows : [];
    } catch (err) {
      console.error(`Error reading table ${table}:`, err);
      result[table] = [];
    }
  }

  const outDir = path.resolve(__dirname, '..', 'backups');
  fs.mkdirSync(outDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outFile = path.join(outDir, `metadata-${timestamp}.json`);
  fs.writeFileSync(outFile, JSON.stringify(result, null, 2), 'utf8');

  console.log(`Backup written to: ${outFile}`);
}

main()
  .catch((e) => {
    console.error('Backup failed:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });