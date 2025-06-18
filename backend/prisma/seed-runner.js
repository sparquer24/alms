const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  try {
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'seed-data.sql');
    const sqlData = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split the SQL data into individual statements
    const statements = sqlData.split(';').filter(statement => statement.trim() !== '');
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (const statement of statements) {
      try {
        await prisma.$executeRawUnsafe(`${statement};`);
        console.log('Statement executed successfully');
      } catch (error) {
        console.error('Error executing statement:', error.message);
        console.error('Statement:', statement);
      }
    }
    
    console.log('All statements executed');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
