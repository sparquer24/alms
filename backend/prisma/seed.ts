import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // --- Hyderabad Police Users and Roles Seeding ---
  // --- Statuses Seeding ---
  await prisma.statuses.deleteMany({});
  const statuses = [
    { code: 'FORWARD', name: 'Forward', description: 'Application forwarded to next stage' },
    { code: 'REJECT', name: 'Reject', description: 'Application rejected' },
    { code: 'APPROVED', name: 'Approved', description: 'Application approved' },
    { code: 'CANCEL', name: 'Cancel', description: 'Application cancelled' },
    { code: 'RE_ENQUIRY', name: 'Re-Enquiry', description: 'Re-enquiry required' },
    { code: 'GROUND_REPORT', name: 'Ground Report', description: 'Ground report required' },
    { code: 'DISPOSE', name: 'Dispose', description: 'Application disposed' },
    { code: 'RED_FLAG', name: 'Red-Flag', description: 'Red-flagged application' },
    { code: 'INITIATE', name: 'Initiate', description: 'Application initiated' },
    { code: 'CLOSE', name: 'Close', description: 'Application closed' },
    { code: 'RECOMMEND', name: 'Recommend', description: 'Application recommended' },
  ];
  for (const status of statuses) {
    await prisma.statuses.create({
      data: {
        code: status.code,
        name: status.name,
        description: status.description,
        isActive: true,
      },
    });
  }
  await prisma.users.deleteMany({});
  await prisma.roles.deleteMany({});
  // const roles = [
  //   { code: 'APPLICANT', name: 'Citizen Applicant' },
  //   { code: 'ZS', name: 'Zonal Superintendent' },
  //   { code: 'SHO', name: 'Station House Officer' },
  //   { code: 'ACP', name: 'Assistant Commissioner of Police' },
  //   { code: 'DCP', name: 'Deputy Commissioner of Police' },
  //   { code: 'AS', name: 'Arms Superintendent' },
  //   { code: 'ADO', name: 'Administrative Officer' },
  //   { code: 'CADO', name: 'Chief Administrative Officer' },
  //   { code: 'JTCP', name: 'Joint Commissioner of Police' },
  //   { code: 'CP', name: 'Commissioner of Police' },
  //   { code: 'ARMS_SUPDT', name: 'Arms Superintendent' },
  //   { code: 'ARMS_SEAT', name: 'Arms Seat' },
  //   { code: 'ACO', name: 'Assistant Compliance Officer' },
  //   { code: 'ADMIN', name: 'System Administrator' },
  // ];
  // for (const role of roles) {
  //   await prisma.roles.create({
  //     data: {
  //       code: role.code,
  //       name: role.name,
  //       is_active: true,
  //       can_forward: false,
  //       can_re_enquiry: false,
  //       can_generate_ground_report: false,
  //       can_FLAF: false,
  //     },
  //   });
  // }

  const roleMap: Record<string, number> = {};
  const dbRoles = await prisma.roles.findMany();
  dbRoles.forEach(r => { roleMap[r.code] = r.id; });

  const state = await prisma.states.findUnique({ where: { name: 'Telangana' } });
  const district = await prisma.districts.findUnique({ where: { name: 'Hyderabad' } });

  // Fetch police stations, zones, divisions
  const policeStations = await prisma.policeStations.findMany();
  const zones = await prisma.zones.findMany();
  const divisions = await prisma.divisions.findMany();

  // Helper: get first available ID from each table
  const policeStationId = policeStations.length > 0 ? policeStations[0].id : undefined;
  const zonalId = zones.length > 0 ? zones[0].id : undefined;
  const divisionId = divisions.length > 0 ? divisions[0].id : undefined;

  // Users array and creation loop
  const users = [
    {
      username: 'CADO_HYD',
      email: 'cado-admin-hyd@tspolice.gov.in',
      password: 'password',
      phoneNo: '8712660022',
      role: 'CADO',
      stateId: state ? state.id : undefined,
      districtId: district ? district.id : undefined,
      policeStationId,
      zoneId: zonalId,
      divisionId,
    },
    {
      username: 'JTCP_ADMIN',
      email: 'jtcp-admnhyd@tspolice.gov.in',
      password: 'password',
      phoneNo: '8712660798', // made unique
      role: 'JTCP',
      stateId: state ? state.id : undefined,
      districtId: district ? district.id : undefined,
      policeStationId,
      zonalId,
      divisionId,
    },
    {
      username: 'SUPDT_STORES_HYD',
      email: 'supdt-stores-hyd@tspolice.gov.in',
      password: 'password',
      phoneNo: '8712660003',
      role: 'STORE',
      stateId: state ? state.id : undefined,
      districtId: district ? district.id : undefined,
      policeStationId,
      zonalId,
      divisionId,
    },
    {
      username: 'SUPDT_TL_HYD',
      email: 'supdt-tnl-hyd@tspolice.gov.in',
      password: 'password',
      phoneNo: '8712660032',
      role: 'TL',
      stateId: state ? state.id : undefined,
      districtId: district ? district.id : undefined,
      policeStationId,
      zonalId,
      divisionId,
    },
    {
      username: 'CP_HYD',
      email: 'cp-hyderabad@tspolice.gov.in',
      password: 'password',
      phoneNo: '8712660799',
      role: 'CP',
      stateId: state ? state.id : undefined,
      districtId: district ? district.id : undefined,
      policeStationId,
      zonalId,
      divisionId,
    },
    {
      username: 'ACP_NORTH',
      email: 'acp-north@tspolice.gov.in',
      password: 'password',
      phoneNo: '8712660101',
      role: 'ACP',
      stateId: state ? state.id : undefined,
      districtId: district ? district.id : undefined,
      policeStationId,
      zonalId,
      divisionId,
    },
    {
      username: 'DCP_CENTRAL',
      email: 'dcp-central@tspolice.gov.in',
      password: 'password',
      phoneNo: '8712660202',
      role: 'DCP',
      stateId: state ? state.id : undefined,
      districtId: district ? district.id : undefined,
      policeStationId,
      zonalId,
      divisionId,
    },
    {
      username: 'SHO_WEST',
      email: 'sho-west@tspolice.gov.in',
      password: 'password',
      phoneNo: '8712660303',
      role: 'SHO',
      stateId: state ? state.id : undefined,
      districtId: district ? district.id : undefined,
      policeStationId,
      zonalId,
      divisionId,
    },
    {
      username: 'ADMIN_USER',
      email: 'admin@tspolice.gov.in',
      password: 'password',
      phoneNo: '8712660404',
      role: 'ADMIN',
      stateId: state ? state.id : undefined,
      districtId: district ? district.id : undefined,
      policeStationId,
      zonalId,
      divisionId,
    },
    // ...add all other users from the provided list, mapping division/zone/ps if available...
  ];

  for (const user of users) {
    if (!roleMap[user.role]) continue;
    await prisma.users.create({
      data: {
        username: user.username,
        email: user.email,
        password: user.password,
        phoneNo: user.phoneNo,
        roleId: roleMap[user.role],
        stateId: user.stateId,
        districtId: user.districtId,
        policeStationId: user.policeStationId,
        zoneId: user.zoneId,
        divisionId: user.divisionId,
      },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    // process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
