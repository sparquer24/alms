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
    { code: 'APPLICANT', name: 'Citizen Applicant', dashboardTitle: 'Applicant Dashboard', menuItems: [], permissions: [], canAccessSettings: false },
    { code: 'ZS', name: 'Zonal Superintendent', dashboardTitle: 'ZS Dashboard', menuItems: ['freshform', 'inbox', 'sent', 'closed', 'finaldisposal', 'reports'], permissions: ['read', 'write', 'canViewFreshForm'], canAccessSettings: false },
    { code: 'SHO', name: 'Station House Officer', dashboardTitle: 'SHO Dashboard', menuItems: ['inbox', 'sent', 'finaldisposal', 'reports', 'logout'], permissions: ['read'], canAccessSettings: true },
    { code: 'ACP', name: 'Assistant Commissioner of Police', dashboardTitle: 'ACP Dashboard', menuItems: ['inbox', 'sent', 'finaldisposal', 'reports', 'logout'], permissions: ['read', 'write'], canAccessSettings: true },
    { code: 'DCP', name: 'Deputy Commissioner of Police', dashboardTitle: 'DCP Dashboard', menuItems: ['inbox', 'sent', 'finaldisposal', 'reports'], permissions: ['read', 'write', 'approve'], canAccessSettings: true },
    { code: 'AS', name: 'Arms Superintendent', dashboardTitle: 'AS Dashboard', menuItems: [], permissions: [], canAccessSettings: false },
    { code: 'ADO', name: 'Administrative Officer', dashboardTitle: 'ADO Dashboard', menuItems: [], permissions: [], canAccessSettings: false },
    { code: 'CADO', name: 'Chief Administrative Officer', dashboardTitle: 'CADO Dashboard', menuItems: ['inbox', 'sent', 'finaldisposal', 'reports', 'logout'], permissions: ['read', 'write'], canAccessSettings: true },
    { code: 'JTCP', name: 'Joint Commissioner of Police', dashboardTitle: 'JTCP Dashboard', menuItems: [], permissions: [], canAccessSettings: false },
    { code: 'CP', name: 'Commissioner of Police', dashboardTitle: 'CP Dashboard', menuItems: [], permissions: [], canAccessSettings: false },
    { code: 'ARMS_SUPDT', name: 'Arms Superintendent', dashboardTitle: 'ARMS_SUPDT Dashboard', menuItems: [], permissions: [], canAccessSettings: false },
    { code: 'ARMS_SEAT', name: 'Arms Seat', dashboardTitle: 'ARMS_SEAT Dashboard', menuItems: [], permissions: [], canAccessSettings: false },
    { code: 'ACO', name: 'Assistant Compliance Officer', dashboardTitle: 'ACO Dashboard', menuItems: [], permissions: [], canAccessSettings: false },
    { code: 'ADMIN', name: 'System Administrator', dashboardTitle: 'Admin Dashboard', menuItems: ['userManagement', 'roleMapping', 'analytics'], permissions: ['read', 'write', 'admin'], canAccessSettings: true },
    { code: 'STORE', name: 'Store Superintendent', dashboardTitle: 'STORE Dashboard', menuItems: [], permissions: [], canAccessSettings: false },
    { code: 'TL', name: 'Traffic License Superintendent', dashboardTitle: 'TL Dashboard', menuItems: [], permissions: [], canAccessSettings: false },
  ];
  for (const role of roles) {
    // Check if role already exists
    const existingRole = await prisma.roles.findUnique({ where: { code: role.code } });
    if (existingRole) continue;

    const roleData: any = {
      code: role.code,
      name: role.name,
      is_active: true,
      dashboard_title: role.dashboardTitle || null,
      menu_items: role.menuItems ? JSON.stringify(role.menuItems) : null,
      permissions: role.permissions ? JSON.stringify(role.permissions) : null,
      can_access_settings: role.canAccessSettings || false,
      can_forward: false,
      can_re_enquiry: false,
      can_generate_ground_report: false,
      can_FLAF: false,
    };

    await prisma.roles.create({ data: roleData as any });
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
    // Ensure we have the state before creating district
    if (!state) {
      console.error('State not found. Cannot create district.');
      return;
    }

    district = await prisma.districts.create({
      data: {
        name: 'Hyderabad',
        stateId: state.id,
      },
    });
    console.log(`Created district: Hyderabad in state: ${state.name}`);
  }

  console.log('Seeding zones...');
  // Seed zones for Hyderabad district using dynamic district ID
  const zonesToSeed = [
    { name: "Central Zone", districtName: "Hyderabad" },
    { name: "East Zone", districtName: "Hyderabad" },
    { name: "North Zone", districtName: "Hyderabad" },
    { name: "South East Zone", districtName: "Hyderabad" },
    { name: "South West Zone", districtName: "Hyderabad" },
    { name: "South Zone", districtName: "Hyderabad" },
    { name: "West Zone", districtName: "Hyderabad" },
  ];

  for (const zone of zonesToSeed) {
    // Check if zone already exists
    const existingZone = await prisma.zones.findUnique({ where: { name: zone.name } });
    if (existingZone) {
      console.log(`Zone '${zone.name}' already exists. Skipping.`);
      continue;
    }

    // Get the actual district ID
    const targetDistrict = await prisma.districts.findUnique({ where: { name: zone.districtName } });
    if (!targetDistrict) {
      console.error(`District '${zone.districtName}' not found for zone '${zone.name}'. Skipping.`);
      continue;
    }

    try {
      await prisma.zones.create({
        data: {
          name: zone.name,
          districtId: targetDistrict.id,
        },
      });
      console.log(`Created zone: ${zone.name} in district: ${zone.districtName}`);
    } catch (error) {
      console.error(`Error creating zone ${zone.name}:`, error);
    }
  }

  console.log('Seeding divisions...');

  // Fetch zones from database to get actual IDs
  const zonesFromDb = await prisma.zones.findMany();
  const zoneMap: Record<string, number> = {};
  zonesFromDb.forEach(zone => {
    zoneMap[zone.name] = zone.id;
  });

  // Seed divisions with dynamic zone mapping
  const divisionsToSeed = [
    // Central Zone
    { name: "Abids", zoneName: "Central Zone" },
    { name: "Chikkadpally", zoneName: "Central Zone" },
    { name: "Gandhinagar", zoneName: "Central Zone" },
    { name: "Saifabad", zoneName: "Central Zone" },
    // East Zone
    { name: "Kachiguda", zoneName: "East Zone" },
    { name: "Chilkalguda", zoneName: "East Zone" },
    { name: "Osmania University", zoneName: "East Zone" },
    { name: "Sultan Bazar", zoneName: "East Zone" },
    // North Zone
    { name: "Begumpet", zoneName: "North Zone" },
    { name: "Gopalpuram", zoneName: "North Zone" },
    { name: "Mahankali", zoneName: "North Zone" },
    { name: "Trimulgherry", zoneName: "North Zone" },
    // South East Zone
    { name: "Chandrayangutta", zoneName: "South East Zone" },
    { name: "Santosh Nagar", zoneName: "South East Zone" },
    { name: "Saidabad", zoneName: "South East Zone" },
    { name: "Malakpet", zoneName: "South East Zone" },
    // South West Zone
    { name: "Asif Nagar", zoneName: "South West Zone" },
    { name: "Goshamahal", zoneName: "South West Zone" },
    { name: "Golconda", zoneName: "South West Zone" },
    { name: "Kulsumpura", zoneName: "South West Zone" },
    // South Zone
    { name: "Charminar", zoneName: "South Zone" },
    { name: "Falaknuma", zoneName: "South Zone" },
    { name: "Chatrinaka", zoneName: "South Zone" },
    { name: "Mirchowk", zoneName: "South Zone" },
    // West Zone
    { name: "Banjara Hills", zoneName: "West Zone" },
    { name: "Jubilee Hills", zoneName: "West Zone" },
    { name: "Panjagutta", zoneName: "West Zone" },
    { name: "SR Nagar", zoneName: "West Zone" }
  ];

  for (const division of divisionsToSeed) {
    // Check if division already exists
    const existingDivision = await prisma.divisions.findUnique({ where: { name: division.name } });
    if (existingDivision) {
      console.log(`Division '${division.name}' already exists. Skipping.`);
      continue;
    }

    // Get the actual zone ID from the zone map
    const zoneId = zoneMap[division.zoneName];
    if (!zoneId) {
      console.error(`Zone '${division.zoneName}' not found for division '${division.name}'. Skipping.`);
      continue;
    }

    try {
      await prisma.divisions.create({
        data: {
          name: division.name,
          zoneId: zoneId,
        },
      });
      console.log(`Created division: ${division.name} in zone: ${division.zoneName}`);
    } catch (error) {
      console.error(`Error creating division ${division.name}:`, error);
    }
  }

  console.log('Seeding police stations...');

  // Fetch divisions from database to get actual IDs
  const divisionsFromDb = await prisma.divisions.findMany();
  const divisionMap: Record<string, number> = {};
  divisionsFromDb.forEach(division => {
    divisionMap[division.name] = division.id;
  });

  // Seed police stations with dynamic division mapping
  const policeStationsToSeed = [
    // Central Zone - Abids Division
    { name: "Abids Road PS", divisionName: "Abids" },
    { name: "Begum Bazar PS", divisionName: "Abids" },
    // Central Zone - Chikkadpally Division
    { name: "Chikkadapally PS", divisionName: "Chikkadpally" },
    { name: "Musheerabad PS", divisionName: "Chikkadpally" },
    // Central Zone - Gandhinagar Division
    { name: "Gandhi Nagar PS", divisionName: "Gandhinagar" },
    { name: "DOMALGUDA PS", divisionName: "Gandhinagar" },
    { name: "SECRETARIAT PS", divisionName: "Gandhinagar" },
    // Central Zone - Saifabad Division
    { name: "Saifabad PS", divisionName: "Saifabad" },
    { name: "Nampally PS", divisionName: "Saifabad" },
    { name: "KHAIRATABAD PS", divisionName: "Saifabad" },

    // East Zone - Kachiguda Division
    { name: "Amberpet PS", divisionName: "Kachiguda" },
    { name: "Kachiguda PS", divisionName: "Kachiguda" },
    // East Zone - Chilkalguda Division
    { name: "Lalaguda PS", divisionName: "Chilkalguda" },
    { name: "Chilkalguda PS", divisionName: "Chilkalguda" },
    { name: "WARASIGUDA PS", divisionName: "Chilkalguda" },
    // East Zone - Osmania University Division
    { name: "Osmania University PS", divisionName: "Osmania University" },
    { name: "Nallakunta PS", divisionName: "Osmania University" },
    // East Zone - Sultan Bazar Division
    { name: "Sultan Bazar PS", divisionName: "Sultan Bazar" },
    { name: "Afzal Gunj PS", divisionName: "Sultan Bazar" },
    { name: "Narayanaguda PS", divisionName: "Sultan Bazar" },

    // North Zone - Begumpet Division
    { name: "Begumpet PS", divisionName: "Begumpet" },
    { name: "Bowenpally PS", divisionName: "Begumpet" },
    // North Zone - Gopalpuram Division
    { name: "Gopalpuram PS", divisionName: "Gopalpuram" },
    { name: "Tukaramgate PS", divisionName: "Gopalpuram" },
    { name: "Marredpally PS", divisionName: "Gopalpuram" },
    // North Zone - Mahankali Division
    { name: "Ramgopalpet PS", divisionName: "Mahankali" },
    { name: "Mahankali PS", divisionName: "Mahankali" },
    { name: "Market PS", divisionName: "Mahankali" },
    // North Zone - Trimulgherry Division
    { name: "Bollarum PS", divisionName: "Trimulgherry" },
    { name: "Trimulgherry PS", divisionName: "Trimulgherry" },
    { name: "Karkhana PS", divisionName: "Trimulgherry" },

    // South East Zone - Chandrayangutta Division
    { name: "Chandrayangutta PS", divisionName: "Chandrayangutta" },
    { name: "BANDLAGUDA PS", divisionName: "Chandrayangutta" },
    { name: "Kanchanbagh PS", divisionName: "Chandrayangutta" },
    // South East Zone - Santosh Nagar Division
    { name: "Santosh Nagar PS", divisionName: "Santosh Nagar" },
    { name: "I S SADAN PS", divisionName: "Santosh Nagar" },
    // South East Zone - Saidabad Division
    { name: "Madannapet PS", divisionName: "Saidabad" },
    { name: "Saidabad PS", divisionName: "Saidabad" },
    // South East Zone - Malakpet Division
    { name: "Malakpet PS", divisionName: "Malakpet" },
    { name: "Chaderghat PS", divisionName: "Malakpet" },
    { name: "Dabeerpura PS", divisionName: "Malakpet" },

    // South West Zone - Asif Nagar Division
    { name: "Asif Nagar PS", divisionName: "Asif Nagar" },
    { name: "Humayun Nagar PS", divisionName: "Asif Nagar" },
    { name: "Habeeb Nagar PS", divisionName: "Asif Nagar" },
    // South West Zone - Goshamahal Division
    { name: "Shahinayathgunj PS", divisionName: "Goshamahal" },
    { name: "Mangalhat PS", divisionName: "Goshamahal" },
    // South West Zone - Golconda Division
    { name: "Golconda PS", divisionName: "Golconda" },
    { name: "Langar House PS", divisionName: "Golconda" },
    // South West Zone - Kulsumpura Division
    { name: "GUDIMALKAPUR PS", divisionName: "Kulsumpura" },
    { name: "Kulsumpura PS", divisionName: "Kulsumpura" },
    { name: "Tapachabutra PS", divisionName: "Kulsumpura" },

    // South Zone - Charminar Division
    { name: "Charminar PS", divisionName: "Charminar" },
    { name: "Kamatipura PS", divisionName: "Charminar" },
    { name: "Hussainialam PS", divisionName: "Charminar" },
    // South Zone - Falaknuma Division
    { name: "Falaknuma PS", divisionName: "Falaknuma" },
    { name: "Bahadurpura PS", divisionName: "Falaknuma" },
    { name: "Kalapathar PS", divisionName: "Falaknuma" },
    // South Zone - Chatrinaka Division
    { name: "Moghalpura PS", divisionName: "Chatrinaka" },
    { name: "Chatrinaka PS", divisionName: "Chatrinaka" },
    { name: "Shalibanda PS", divisionName: "Chatrinaka" },
    // South Zone - Mirchowk Division
    { name: "Mirchowk PS", divisionName: "Mirchowk" },
    { name: "Bhavaninagar PS", divisionName: "Mirchowk" },
    { name: "Rein Bazar PS", divisionName: "Mirchowk" },

    // West Zone - Banjara Hills Division
    { name: "Banjara Hills PS", divisionName: "Banjara Hills" },
    { name: "MASAB TANK PS", divisionName: "Banjara Hills" },
    // West Zone - Jubilee Hills Division
    { name: "Jubilee Hills PS", divisionName: "Jubilee Hills" },
    { name: "FILM NAGAR PS", divisionName: "Jubilee Hills" },
    // West Zone - Panjagutta Division
    { name: "Panjagutta PS", divisionName: "Panjagutta" },
    { name: "MADHURA NAGAR PS", divisionName: "Panjagutta" },
    // West Zone - SR Nagar Division
    { name: "S.R. Nagar PS", divisionName: "SR Nagar" },
    { name: "BORABANDA PS", divisionName: "SR Nagar" }
  ];

  for (const policeStation of policeStationsToSeed) {
    // Check if police station already exists
    const existingPoliceStation = await prisma.policeStations.findUnique({ where: { name: policeStation.name } });
    if (existingPoliceStation) {
      console.log(`Police Station '${policeStation.name}' already exists. Skipping.`);
      continue;
    }

    // Get the actual division ID from the division map
    const divisionId = divisionMap[policeStation.divisionName];
    if (!divisionId) {
      console.error(`Division '${policeStation.divisionName}' not found for police station '${policeStation.name}'. Skipping.`);
      continue;
    }

    try {
      await prisma.policeStations.create({
        data: {
          name: policeStation.name,
          divisionId: divisionId,
        },
      });
      console.log(`Created police station: ${policeStation.name} in division: ${policeStation.divisionName}`);
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

    // Delete the test user (use deleteMany since username is not a unique field in Prisma schema)
    await prisma.users.deleteMany({ where: { username: 'test_user' } });
    console.log('Test user deleted');
  } catch (error) {
    console.error('Error creating simple test user:', error);
    return; // Exit early if we can't even create a simple user
  }

  // Create location-based users with proper hierarchy mapping
  const locationUsers: any[] = [];

  // Zone-level users (DCP role)
  const zonesForUsers = await prisma.zones.findMany();
  for (const zone of zonesForUsers) {
    const zoneShortForm = zone.name.replace(/\s+/g, '').substring(0, 3).toUpperCase(); // e.g., "Central Zone" -> "CEN"
    locationUsers.push({
      username: `DCP_${zoneShortForm}_HYD`,
      email: `dcp-${zone.name.toLowerCase().replace(/\s+/g, '-')}@tspolice.gov.in`,
      password: 'password',
      phoneNo: `871266${String(zone.id).padStart(4, '0')}`, // Dynamic phone numbers
      role: 'DCP',
      stateId: state ? state.id : undefined,
      districtId: district ? district.id : undefined,
      zoneId: zone.id
    });
  }

  // Division-level users (ACP role)
  const divisionsForUsers = await prisma.divisions.findMany({ include: { zone: true } });
  for (const division of divisionsForUsers) {
    const divisionShortForm = division.name.replace(/\s+/g, '').substring(0, 3).toUpperCase(); // e.g., "Abids" -> "ABI"
    locationUsers.push({
      username: `ACP_${divisionShortForm}_HYD`,
      email: `acp-${division.name.toLowerCase().replace(/\s+/g, '-')}@tspolice.gov.in`,
      password: 'password',
      phoneNo: `872266${String(division.id).padStart(4, '0')}`, // Dynamic phone numbers
      role: 'ACP',
      stateId: state ? state.id : undefined,
      districtId: district ? district.id : undefined,
      zoneId: division.zoneId,
      divisionId: division.id
    });
  }

  // Police Station-level users (SHO role)
  const policeStationsForUsers = await prisma.policeStations.findMany({
    include: {
      division: { include: { zone: true } }
    }
  });
  for (const policeStation of policeStationsForUsers) {
    // Create short form from police station name (remove "PS" and spaces)
    const psShortForm = policeStation.name
      .replace(/\s+PS$/i, '')
      .replace(/\s+/g, '')
      .substring(0, 4)
      .toUpperCase(); // e.g., "Abids Road PS" -> "ABID"

    locationUsers.push({
      username: `SHO_${psShortForm}_HYD`,
      email: `sho-${policeStation.name.toLowerCase().replace(/\s+/g, '-').replace('-ps', '')}@tspolice.gov.in`,
      password: 'password',
      phoneNo: `873366${String(policeStation.id).padStart(4, '0')}`, // Dynamic phone numbers
      role: 'SHO',
      stateId: state ? state.id : undefined,
      districtId: district ? district.id : undefined,
      zoneId: policeStation.division?.zoneId,
      divisionId: policeStation.divisionId,
      policeStationId: policeStation.id
    });
  }

  // Users array and creation loop - keep existing admin users + add location users
  const users: any[] = [
    // Existing administrative users
    {
      username: 'CADO_HYD',
      email: 'cado-admin-hyd@tspolice.gov.in',
      password: 'password',
      phoneNo: '8712660022',
      role: 'CADO',
      stateId: state ? state.id : undefined,
      districtId: district ? district.id : undefined
    },
    {
      username: 'JTCP_ADMIN',
      email: 'jtcp-admnhyd@tspolice.gov.in',
      password: 'password',
      phoneNo: '8712660798',
      role: 'JTCP',
      stateId: state ? state.id : undefined,
      districtId: district ? district.id : undefined
    },
    {
      username: 'CP_HYD',
      email: 'cp-hyderabad@tspolice.gov.in',
      password: 'password',
      phoneNo: '8712660799',
      role: 'CP',
      stateId: state ? state.id : undefined,
      districtId: district ? district.id : undefined
    },
    {
      username: 'ZS_ADMIN',
      email: 'zs-admin@tspolice.gov.in',
      password: 'password',
      phoneNo: '8712660505',
      role: 'ZS',
      stateId: state ? state.id : undefined,
      districtId: district ? district.id : undefined
    },
    {
      username: 'ADMIN_USER',
      email: 'admin@tspolice.gov.in',
      password: 'password',
      phoneNo: '8712660404',
      role: 'ADMIN',
      stateId: state ? state.id : undefined,
      districtId: district ? district.id : undefined
    },
    // Add all location-based users
    ...locationUsers
  ];

  for (const user of users) {
    if (!roleMap[user.role]) {
      console.warn(`Role '${user.role}' not found for user '${user.username}'. Skipping user.`);
      continue;
    }

    // Check if user already exists
    const existingUser = await prisma.users.findFirst({ where: { username: user.username } });
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
