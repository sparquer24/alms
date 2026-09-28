/**
 * fetch-all-data.js
 *
 * Fetches ALL rows from EVERY table in the database (public schema) and
 * writes them to a timestamped JSON file under backend/data-exports/.
 *
 * Usage (run from the backend/ directory):
 *   node fetch-all-data.js                          # uses DATABASE_URL from .env
 *   node fetch-all-data.js --database-url <url>     # override the connection string (-d also works)
 *   node fetch-all-data.js --output <path>          # write to a custom file (-o also works)
 */
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

// --- CLI arguments ---
const argv = process.argv.slice(2);
const argValue = (flag) => {
  const i = argv.findIndex((a) => a === flag);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : undefined;
};
const dbUrl = argValue('--database-url') || argValue('-d');
const outFile = argValue('--output') || argValue('-o');
if (dbUrl) process.env.DATABASE_URL = dbUrl;

const prisma = new PrismaClient();

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ No DATABASE_URL found. Set it in .env or pass --database-url <url>');
    process.exit(1);
  }

  console.log('🔌 Connecting to database...\n');

  // 1. List all user tables in the public schema
  const tables = (await prisma.$queryRawUnsafe(
    `SELECT tablename FROM pg_catalog.pg_tables
     WHERE schemaname = 'public'
       AND tablename NOT LIKE 'pg_%'
       AND tablename NOT LIKE 'sql_%'
     ORDER BY tablename`
  ));

  console.log(`📊 Found ${tables.length} tables\n`);

  // 2. Fetch all rows from each table
  const data = {};
  for (const t of tables) {
    const table = t.tablename;
    try {
      const rows = await prisma.$queryRawUnsafe(`SELECT * FROM "${table}"`);
      data[table] = rows;
      console.log(`   ✅ ${table}: ${rows.length} rows`);
    } catch (err) {
      console.error(`   ❌ ${table}: could not read - ${err.message}`);
      data[table] = [];
    }
  }

  // 3. Write everything to a JSON file
  const defaultOut = path.resolve(
    __dirname,
    'data-exports',
    `full-export-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  );
  const outputPath = outFile ? path.resolve(outFile) : defaultOut;
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');

  // 4. Summary
  const totalRows = Object.values(data).reduce((sum, rows) => sum + rows.length, 0);
  console.log('\n========================================');
  console.log('✅ Export complete!');
  console.log(`   Tables    : ${tables.length}`);
  console.log(`   Total rows: ${totalRows}`);
  console.log(`   File      : ${outputPath}`);
  console.log('========================================');
}

main()
  .catch((err) => {
    console.error('❌ Export failed:', err.message || err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
