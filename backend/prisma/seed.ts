import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Create Roles
  const adminRole = await prisma.roles.upsert({
    where: { code: 'ADMIN' },
    update: {},
    create: {
      code: 'ADMIN',
      name: 'Administrator',
      is_active: true,
    },
  });

  const userRole = await prisma.roles.upsert({
    where: { code: 'USER' },
    update: {},
    create: {
      code: 'USER',
      name: 'User',
      is_active: true,
    },
  });

  const policeRole = await prisma.roles.upsert({
    where: { code: 'POLICE' },
    update: {},
    create: {
      code: 'POLICE',
      name: 'Police Officer',
      is_active: true,
    },
  });

  // Create States
  const telangana = await prisma.states.upsert({
    where: { name: 'Telangana' },
    update: {},
    create: {
      name: 'Telangana',
    },
  });

  // Create Districts
  const hyderabad = await prisma.districts.upsert({
    where: { name: 'Hyderabad' },
    update: {},
    create: {
      name: 'Hyderabad',
      stateId: telangana.id,
    },
  });

  // Create Zones for Hyderabad
  const zoneEast = await prisma.zones.upsert({
    where: { name: 'East Zone' },
    update: {},
    create: {
      name: 'East Zone',
      districtId: hyderabad.id,
    },
  });
  const zoneCentral = await prisma.zones.upsert({
    where: { name: 'Central Zone' },
    update: {},
    create: {
      name: 'Central Zone',
      districtId: hyderabad.id,
    },
  });
  const zoneSouth = await prisma.zones.upsert({
    where: { name: 'South Zone' },
    update: {},
    create: {
      name: 'South Zone',
      districtId: hyderabad.id,
    },
  });

  // Create Divisions for Hyderabad Zones
  const divisionMahankali = await prisma.divisions.upsert({
    where: { name: 'Mahankali' },
    update: {},
    create: {
      name: 'Mahankali',
      zoneId: zoneEast.id,
    },
  });
  const divisionAsifNagar = await prisma.divisions.upsert({
    where: { name: 'Asif Nagar' },
    update: {},
    create: {
      name: 'Asif Nagar',
      zoneId: zoneCentral.id,
    },
  });
  const divisionChilkalguda = await prisma.divisions.upsert({
    where: { name: 'Chilkalguda' },
    update: {},
    create: {
      name: 'Chilkalguda',
      zoneId: zoneEast.id,
    },
  });
  const divisionBegumpet = await prisma.divisions.upsert({
    where: { name: 'Begumpet' },
    update: {},
    create: {
      name: 'Begumpet',
      zoneId: zoneCentral.id,
    },
  });
  const divisionSaidabad = await prisma.divisions.upsert({
    where: { name: 'Saidabad' },
    update: {},
    create: {
      name: 'Saidabad',
      zoneId: zoneSouth.id,
    },
  });

  // Create Police Stations for Hyderabad Divisions
  const psReinBazar = await prisma.policeStations.upsert({
    where: { name: 'Rein Bazar PS' },
    update: {},
    create: {
      name: 'Rein Bazar PS',
      divisionId: divisionMahankali.id,
    },
  });
  const psBanjaraHills = await prisma.policeStations.upsert({
    where: { name: 'Banjara Hills PS' },
    update: {},
    create: {
      name: 'Banjara Hills PS',
      divisionId: divisionBegumpet.id,
    },
  });
  const psBandlaguda = await prisma.policeStations.upsert({
    where: { name: 'BANDLAGUDA PS' },
    update: {},
    create: {
      name: 'BANDLAGUDA PS',
      divisionId: divisionAsifNagar.id,
    },
  });
  const psSultanBazar = await prisma.policeStations.upsert({
    where: { name: 'Sultan Bazar PS' },
    update: {},
    create: {
      name: 'Sultan Bazar PS',
      divisionId: divisionChilkalguda.id,
    },
  });
  const psKulsumpura = await prisma.policeStations.upsert({
    where: { name: 'Kulsumpura PS' },
    update: {},
    create: {
      name: 'Kulsumpura PS',
      divisionId: divisionSaidabad.id,
    },
  });

  // Create Application Statuses
  const statusDraft = await prisma.statuses.upsert({
    where: { code: 'DRAFT' },
    update: {},
    create: {
      code: 'DRAFT',
      name: 'Draft',
      description: 'Application is in draft state',
      isActive: true,
    },
  });

  const statusSubmitted = await prisma.statuses.upsert({
    where: { code: 'SUBMITTED' },
    update: {},
    create: {
      code: 'SUBMITTED',
      name: 'Submitted',
      description: 'Application has been submitted for review',
      isActive: true,
    },
  });

  const statusUnderReview = await prisma.statuses.upsert({
    where: { code: 'UNDER_REVIEW' },
    update: {},
    create: {
      code: 'UNDER_REVIEW',
      name: 'Under Review',
      description: 'Application is being reviewed by authorities',
      isActive: true,
    },
  });

  const statusDocumentVerification = await prisma.statuses.upsert({
    where: { code: 'DOCUMENT_VERIFICATION' },
    update: {},
    create: {
      code: 'DOCUMENT_VERIFICATION',
      name: 'Document Verification',
      description: 'Documents are being verified',
      isActive: true,
    },
  });

  const statusFieldVerification = await prisma.statuses.upsert({
    where: { code: 'FIELD_VERIFICATION' },
    update: {},
    create: {
      code: 'FIELD_VERIFICATION',
      name: 'Field Verification',
      description: 'Field verification is in progress',
      isActive: true,
    },
  });

  const statusInterviewScheduled = await prisma.statuses.upsert({
    where: { code: 'INTERVIEW_SCHEDULED' },
    update: {},
    create: {
      code: 'INTERVIEW_SCHEDULED',
      name: 'Interview Scheduled',
      description: 'Interview has been scheduled',
      isActive: true,
    },
  });

  const statusApproved = await prisma.statuses.upsert({
    where: { code: 'APPROVED' },
    update: {},
    create: {
      code: 'APPROVED',
      name: 'Approved',
      description: 'Application has been approved',
      isActive: true,
    },
  });

  const statusRejected = await prisma.statuses.upsert({
    where: { code: 'REJECTED' },
    update: {},
    create: {
      code: 'REJECTED',
      name: 'Rejected',
      description: 'Application has been rejected',
      isActive: true,
    },
  });

  const statusOnHold = await prisma.statuses.upsert({
    where: { code: 'ON_HOLD' },
    update: {},
    create: {
      code: 'ON_HOLD',
      name: 'On Hold',
      description: 'Application is temporarily on hold',
      isActive: true,
    },
  });

  const statusCancelled = await prisma.statuses.upsert({
    where: { code: 'CANCELLED' },
    update: {},
    create: {
      code: 'CANCELLED',
      name: 'Cancelled',
      description: 'Application has been cancelled',
      isActive: true,
    },
  });

  console.log('Database seeding completed successfully!');
  console.log(`Created roles: ${adminRole.name}, ${userRole.name}, ${policeRole.name}`);
  console.log(`Created state: ${telangana.name}`);
  console.log(`Created district: ${hyderabad.name}`);
  console.log('Created application statuses: Draft, Submitted, Under Review, Document Verification, Field Verification, Interview Scheduled, Approved, Rejected, On Hold, Cancelled');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
