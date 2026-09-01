import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting role update process...');

  const roles = [
    { code: 'APPLICANT', name: 'Citizen Applicant', dashboardTitle: 'Applicant Dashboard', menuItems: [], permissions: [], canAccessSettings: false },
    { code: 'ZS', name: 'Zonal Superintendent', dashboardTitle: 'ZS Dashboard', menuItems: ['inbox', 'freshform', 'sent', 'closed', 'drafts', 'finaldisposal'], permissions: ['read', 'write', 'canViewFreshForm'], canAccessSettings: false },
    { code: 'SHO', name: 'Station House Officer', dashboardTitle: 'SHO Dashboard', menuItems: ['inbox', 'sent', 'logout'], permissions: ['read'], canAccessSettings: true },
    { code: 'ACP', name: 'Assistant Commissioner of Police', dashboardTitle: 'ACP Dashboard', menuItems: ['inbox', 'sent', 'logout'], permissions: ['read', 'write'], canAccessSettings: true },
    { code: 'DCP', name: 'Deputy Commissioner of Police', dashboardTitle: 'DCP Dashboard', menuItems: ['inbox', 'sent'], permissions: ['read', 'write', 'approve'], canAccessSettings: true },
    { code: 'AS', name: 'Arms Superintendent', dashboardTitle: 'AS Dashboard', menuItems: [], permissions: [], canAccessSettings: false },
    { code: 'ADO', name: 'Administrative Officer', dashboardTitle: 'ADO Dashboard', menuItems: [], permissions: [], canAccessSettings: false },
    { code: 'CADO', name: 'Chief Administrative Officer', dashboardTitle: 'CADO Dashboard', menuItems: ['inbox', 'sent', 'logout'], permissions: ['read', 'write'], canAccessSettings: true },
    { code: 'JTCP', name: 'Joint Commissioner of Police', dashboardTitle: 'JTCP Dashboard', menuItems: [], permissions: [], canAccessSettings: false },
    { code: 'CP', name: 'Commissioner of Police', dashboardTitle: 'CP Dashboard', menuItems: [], permissions: [], canAccessSettings: false },
    { code: 'ARMS_SUPDT', name: 'Arms Superintendent', dashboardTitle: 'ARMS_SUPDT Dashboard', menuItems: [], permissions: [], canAccessSettings: false },
    { code: 'ARMS_SEAT', name: 'Arms Seat', dashboardTitle: 'ARMS_SEAT Dashboard', menuItems: [], permissions: [], canAccessSettings: false },
    { code: 'ACO', name: 'Assistant Compliance Officer', dashboardTitle: 'ACO Dashboard', menuItems: [], permissions: [], canAccessSettings: false },
    { code: 'ADMIN', name: 'System Administrator', dashboardTitle: 'Admin Dashboard', menuItems: ['userManagement', 'roleMapping', 'analytics', 'flowMapping'], permissions: ['read', 'write', 'admin'], canAccessSettings: true },
    { code: 'STORE', name: 'Store Superintendent', dashboardTitle: 'STORE Dashboard', menuItems: [], permissions: [], canAccessSettings: false },
    { code: 'TL', name: 'Traffic License Superintendent', dashboardTitle: 'TL Dashboard', menuItems: [], permissions: [], canAccessSettings: false },
  ];

  for (const role of roles) {
    // Check if role already exists
    const existingRole = await prisma.roles.findUnique({ where: { code: role.code } });

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

    if (existingRole) {
      // Update existing role
      console.log(`Updating role: ${role.code}`);
      await prisma.roles.update({
        where: { code: role.code },
        data: roleData,
      });
    } else {
      // Create new role
      console.log(`Creating new role: ${role.code}`);
      await prisma.roles.create({ data: roleData as any });
    }
  }

  console.log('Role update process completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during role update:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
