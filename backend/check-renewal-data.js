const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

(async () => {
  try {
    console.log('🔍 Checking Renewal Applications Data...\n');
    
    // Check renewal applications
    const renewalApps = await prisma.renewalFormPersonalDetails.findMany({
      include: {
        workflowStatus: true,
        currentUser: true,
      },
      take: 10,
    });
    
    console.log(`✅ Found ${renewalApps.length} renewal applications`);
    
    if (renewalApps.length > 0) {
      console.log('\n📋 Recent Renewal Applications:');
      renewalApps.forEach((app, index) => {
        console.log(`\n[${index + 1}] License: ${app.licenseNumber}`);
        console.log(`    Name: ${app.firstName} ${app.lastName}`);
        console.log(`    Acknowledgement: ${app.acknowledgementNo}`);
        console.log(`    Status: ${app.workflowStatus?.name || 'N/A'}`);
        console.log(`    Created: ${app.createdAt}`);
      });
    } else {
      console.log('❌ No renewal applications found in database');
    }
    
    // Check database tables
    console.log('\n\n🔍 Checking Renewal Tables...\n');
    
    const tables = [
      'RenewalFormPersonalDetails',
      'RenewalAddressesAndContactDetails',
      'RenewalOccupationAndBusiness',
      'RenewalLicenseDetails',
      'RenewalFileUploads',
      'RenewalBiometricDatas',
      'RenewalApplicationsFormWorkflowHistories',
    ];
    
    for (const table of tables) {
      const result = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*) as count FROM "${table}"`
      );
      console.log(`📊 ${table}: ${result[0].count} records`);
    }
    
    console.log('\n✅ Database connection successful!');
    console.log('\n📍 Database Details:');
    console.log('   Host: almsdev.cta888eqmcrq.ap-south-1.rds.amazonaws.com');
    console.log('   Port: 5432');
    console.log('   Database: alms');
    console.log('   Schema: public');
    console.log('   Region: ap-south-1 (Asia Pacific - Mumbai)');
    console.log('   Type: AWS RDS PostgreSQL (Cloud)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();
