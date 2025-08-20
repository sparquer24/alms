import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}

async function main() {
  // --- Hyderabad Police Users and Roles Seeding ---
  console.log('Starting seeding process...');

  // --- Actions Seeding ---
  console.log('Seeding statuses and actions...');
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

  // Seed statuses if not present
  for (const status of statuses) {
    const exists = await prisma.statuses.findUnique({ where: { code: status.code } });
    if (!exists) {
      await prisma.statuses.create({
        data: {
          code: status.code,
          name: status.name,
          description: status.description,
          isActive: true,
        },
      });
    }
  }

  // Now seed actions, linking to statuses
  for (const action of statuses) {
    const status = await prisma.statuses.findUnique({ where: { code: action.code } });
    if (!status) continue;
    
    // Check if action already exists
    const existingAction = await prisma.actiones.findUnique({ where: { code: action.code } });
    if (existingAction) continue;
    
    await prisma.actiones.create({
      data: {
        code: action.code,
        name: action.name,
        description: action.description,
        isActive: true,
      },
    });
  }

  console.log('Seeding roles...');
  const roles = [
    { code: 'APPLICANT', name: 'Citizen Applicant' },
    { code: 'ZS', name: 'Zonal Superintendent' },
    { code: 'SHO', name: 'Station House Officer' },
    { code: 'ACP', name: 'Assistant Commissioner of Police' },
    { code: 'DCP', name: 'Deputy Commissioner of Police' },
    { code: 'AS', name: 'Arms Superintendent' },
    { code: 'ADO', name: 'Administrative Officer' },
    { code: 'CADO', name: 'Chief Administrative Officer' },
    { code: 'JTCP', name: 'Joint Commissioner of Police' },
    { code: 'CP', name: 'Commissioner of Police' },
    { code: 'ARMS_SUPDT', name: 'Arms Superintendent' },
    { code: 'ARMS_SEAT', name: 'Arms Seat' },
    { code: 'ACO', name: 'Assistant Compliance Officer' },
    { code: 'ADMIN', name: 'System Administrator' },
    { code: 'STORE', name: 'Store Superintendent' },
    { code: 'TL', name: 'Traffic License Superintendent' },
  ];
  for (const role of roles) {
    // Check if role already exists
    const existingRole = await prisma.roles.findUnique({ where: { code: role.code } });
    if (existingRole) continue;
    
    await prisma.roles.create({
      data: {
        code: role.code,
        name: role.name,
        is_active: true,
        can_forward: false,
        can_re_enquiry: false,
        can_generate_ground_report: false,
        can_FLAF: false,
      },
    });
  }

  const roleMap: Record<string, number> = {};
  const dbRoles = await prisma.roles.findMany();
  dbRoles.forEach(r => { roleMap[r.code] = r.id; });

  console.log('Seeding states and districts...');

  // Seed basic states and districts if they don't exist
  let state = await prisma.states.findUnique({ where: { name: 'Telangana' } });
  if (!state) {
    state = await prisma.states.create({
      data: {
        name: 'Telangana',
      },
    });
  }

  let district = await prisma.districts.findUnique({ where: { name: 'Hyderabad' } });
  if (!district) {
    district = await prisma.districts.create({
      data: {
        name: 'Hyderabad',
        stateId: state.id,
      },
    });
  }

  console.log('Seeding zones...');
  // Seed zones for Hyderabad district
  const zonesToSeed = [
    { name: "DSP COMMUNICATION", districtId: 1 },
    { name: "JOINT CP, SB", districtId: 1 },
    { name: "East Zone", districtId: 1 },
    { name: "LEARNING CENTRE BEGUMPET", districtId:1 },
    { name: "CAO", districtId: 1 },
    { name: "COMMANDANT, HOME GUARDS", districtId:1 },
    { name: "INCHARGE MAIN CONTROL ROOM", districtId: 1 },
    { name: "JTCP CORD CAMP", districtId: 1 },
    { name: "Women Safety Wing", districtId: 1 },
    { name: "LEGAL ADVISOR", districtId: 1 },
    { name: "JAO2-ADM-HYD", districtId: 1 },
    { name: "MAIN GATE, ICCC", districtId: 1 },
    { name: "Central Zone", districtId: 1 },
    { name: "JtCP ADMIN CAMP", districtId: 1 },
    { name: "CP CAMP", districtId: 1 },
  ];

  for (const zone of zonesToSeed) {
    // Check if zone already exists
    const existingZone = await prisma.zones.findUnique({ where: { name: zone.name } });
    if (existingZone) {
      console.log(`Zone '${zone.name}' already exists. Skipping.`);
      continue;
    }
    
    try {
      await prisma.zones.create({
        data: {
          name: zone.name,
          districtId: zone.districtId,
        },
      });
      console.log(`Created zone: ${zone.name}`);
    } catch (error) {
      console.error(`Error creating zone ${zone.name}:`, error);
    }
  }

  console.log('Seeding divisions...');
  // Seed divisions
  const divisionsToSeed = [
    { name: "DSP COMMUNICATION", zoneId: 1 },
    { name: "JOINT CP, SB", zoneId: 1 },
    { name: "East Zone", zoneId: 1 },
    { name: "LEARNING CENTRE BEGUMPET", zoneId: 1 },
    { name: "CAO", zoneId: 1 },
    { name: "COMMANDANT, HOME GUARDS", zoneId: 1 },
    { name: "INCHARGE MAIN CONTROL ROOM", zoneId: 1 },
    { name: "JTCP CORD CAMP", zoneId: 1 },
    { name: "Women Safety Wing", zoneId: 1 },
    { name: "LEGAL ADVISOR", zoneId: 1 },
    { name: "JAO2-ADM-HYD", zoneId: 1 },
    { name: "MAIN GATE, ICCC", zoneId: 1 },
    { name: "Central Zone", zoneId: 1 },
    { name: "JtCP ADMIN CAMP", zoneId: 1 },
    { name: "CP CAMP", zoneId: 1 }
  ];

  for (const division of divisionsToSeed) {
    // Check if division already exists
    const existingDivision = await prisma.divisions.findUnique({ where: { name: division.name } });
    if (existingDivision) {
      console.log(`Division '${division.name}' already exists. Skipping.`);
      continue;
    }
    
    try {
      await prisma.divisions.create({
        data: {
          name: division.name,
          zoneId: division.zoneId,
        },
      });
      console.log(`Created division: ${division.name}`);
    } catch (error) {
      console.error(`Error creating division ${division.name}:`, error);
    }
  }

  console.log('Seeding police stations...');
  // Seed police stations
  const policeStationsToSeed = [
    { name: "Abids Police Station", divisionId: 1 },
    { name: "Begumpet Police Station", divisionId: 1 },
    { name: "Banjara Hills Police Station", divisionId: 2 },
    { name: "Charminar Police Station", divisionId: 2 },
    { name: "Gachibowli Police Station", divisionId: 3 },
    { name: "Madhapur Police Station", divisionId: 3 },
    { name: "Jubilee Hills Police Station", divisionId: 3 },
    { name: "Kukatpally Police Station", divisionId: 4 },
    { name: "Miyapur Police Station", divisionId: 4 },
    { name: "Cyber Crime Police Station", divisionId: 5 }
  ];

  for (const policeStation of policeStationsToSeed) {
    // Check if police station already exists
    const existingPoliceStation = await prisma.policeStations.findUnique({ where: { name: policeStation.name } });
    if (existingPoliceStation) {
      console.log(`Police Station '${policeStation.name}' already exists. Skipping.`);
      continue;
    }
    
    try {
      await prisma.policeStations.create({
        data: {
          name: policeStation.name,
          divisionId: policeStation.divisionId,
        },
      });
      console.log(`Created police station: ${policeStation.name}`);
    } catch (error) {
      console.error(`Error creating police station ${policeStation.name}:`, error);
    }
  }

  // Fetch police stations, zones, divisions
  const policeStations = await prisma.policeStations.findMany();
  const zones = await prisma.zones.findMany();
  const divisions = await prisma.divisions.findMany();

  // Helper: get first available ID from each table
  const policeStationId = policeStations.length > 0 ? policeStations[0].id : undefined;
  const zonalId = zones.length > 0 ? zones[0].id : undefined;
  const divisionId = divisions.length > 0 ? divisions[0].id : undefined;

  console.log('Seeding users...');
  
  // Test creating a simple user first
  try {
    console.log('Testing simple user creation...');
    await prisma.users.create({
      data: {
        username: 'test_user',
        email: 'test@example.com',
        password: await hashPassword('password'), // Hash the password
        phoneNo: '1234567890',
        roleId: dbRoles[0].id, // Use the first role's ID
      },
    });
    console.log('Simple user created successfully');
    
    // Delete the test user
    await prisma.users.delete({
      where: { username: 'test_user' },
    });
    console.log('Test user deleted');
  } catch (error) {
    console.error('Error creating simple test user:', error);
    return; // Exit early if we can't even create a simple user
  }

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
    if (!roleMap[user.role]) {
      console.warn(`Role '${user.role}' not found for user '${user.username}'. Skipping user.`);
      continue;
    }
    
    // Check if user already exists
    const existingUser = await prisma.users.findUnique({ where: { username: user.username } });
    if (existingUser) {
      console.log(`User '${user.username}' already exists. Skipping.`);
      continue;
    }
    
    try {
      // Only include non-null/undefined values
      const userData: any = {
        username: user.username,
        email: user.email,
        password: await hashPassword(user.password), // Hash the password
        phoneNo: user.phoneNo,
        roleId: roleMap[user.role],
      };

      // Only add optional fields if they have values
      if (user.stateId) userData.stateId = user.stateId;
      if (user.districtId) userData.districtId = user.districtId;
      if (user.policeStationId) userData.policeStationId = user.policeStationId;
      if (user.zoneId) userData.zoneId = user.zoneId;
      if (user.divisionId) userData.divisionId = user.divisionId;

      await prisma.users.create({
        data: userData,
      });
      console.log(`Created user: ${user.username}`);
    } catch (error) {
      console.error(`Error creating user ${user.username}:`, error);
    }
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
