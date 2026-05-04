const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

(async () => {
  try {
    const result = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'Renewal%'
      ORDER BY table_name
    `;
    
    console.log('Renewal tables found in database:');
    if (result.length === 0) {
      console.log('❌ NO RENEWAL TABLES FOUND!');
    } else {
      result.forEach(row => {
        console.log(`  ✅ ${row.table_name}`);
      });
    }
    
    // Also check all tables in public schema
    console.log('\n--- All tables in public schema ---');
    const allTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log(`Total tables: ${allTables.length}`);
    allTables.forEach(row => {
      console.log(`  ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();
