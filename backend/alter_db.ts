import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Adding stateId and districtId columns to RoleFlowMapping...');
    await prisma.$executeRawUnsafe(`ALTER TABLE "RoleFlowMapping" ADD COLUMN IF NOT EXISTS "stateId" INT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "RoleFlowMapping" ADD COLUMN IF NOT EXISTS "districtId" INT;`);

    console.log('Adding foreign keys...');
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "RoleFlowMapping" ADD CONSTRAINT "RoleFlowMapping_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "States"("id") ON DELETE CASCADE ON UPDATE CASCADE;`);
    } catch (e: any) {
      console.log('State foreign key might already exist.', e.message);
    }
    
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "RoleFlowMapping" ADD CONSTRAINT "RoleFlowMapping_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "Districts"("id") ON DELETE CASCADE ON UPDATE CASCADE;`);
    } catch (e: any) {
      console.log('District foreign key might already exist.', e.message);
    }

    console.log('Dropping old unique constraint...');
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "RoleFlowMapping" DROP CONSTRAINT IF EXISTS "RoleFlowMapping_currentRoleId_applicationType_purpose_key";`);
      await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS "RoleFlowMapping_currentRoleId_applicationType_purpose_key";`);
    } catch (e: any) {
      console.log('Old constraint might not exist.', e.message);
    }

    console.log('Creating new unique constraint...');
    try {
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX "RoleFlowMapping_currentRoleId_applicationType_purpose_state_key" ON "RoleFlowMapping"("currentRoleId", "applicationType", "purpose", "stateId", "districtId");`);
    } catch (e: any) {
      console.log('New constraint might already exist.', e.message);
    }

    console.log('Done.');
  } catch (error) {
    console.error('Error executing query:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
