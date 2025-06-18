import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // 1. Insert Roles
  const roles = [
    { code: 'APPLICANT', name: 'Citizen Applicant', description: 'Individual applying for an arms license', level: 14 },
    { code: 'ZS', name: 'Zonal Superintendent', description: 'Initial processor of applications', level: 13 },
    { code: 'SHO', name: 'Station House Officer', description: 'Conducts field enquiries on applications', level: 12 },
    { code: 'ACP', name: 'Assistant Commissioner of Police', description: 'Reviews and forwards applications', level: 11 },
    { code: 'DCP', name: 'Deputy Commissioner of Police', description: 'Authority for TA license approval', level: 10 },
    { code: 'AS', name: 'Arms Superintendent', description: 'Handles administrative processing', level: 9 },
    { code: 'ADO', name: 'Administrative Officer', description: 'Processes documentation', level: 8 },
    { code: 'CADO', name: 'Chief Administrative Officer', description: 'Final administrative check', level: 7 },
    { code: 'JTCP', name: 'Joint Commissioner of Police', description: 'Reviews and forwards to CP', level: 6 },
    { code: 'CP', name: 'Commissioner of Police', description: 'Final approval authority for AI licenses', level: 5 },
    { code: 'ARMS_SUPDT', name: 'Arms Superintendent', description: 'Verifies application details', level: 4 },
    { code: 'ARMS_SEAT', name: 'Arms Seat', description: 'Processes application documentation', level: 3 },
    { code: 'ACO', name: 'Assistant Compliance Officer', description: 'Ensures compliance with regulations', level: 2 },
    { code: 'ADMIN', name: 'System Administrator', description: 'Administrator with full access', level: 1 },
  ];
  for (const role of roles) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: {},
      create: role,
    });
  }

  // 2. Insert Permissions
  const permissions = [
    // View Permissions
    { code: 'VIEW_FRESH_FORM', name: 'View Fresh Form', description: 'Ability to view newly created applications', category: 'VIEW' },
    { code: 'VIEW_FORWARDED', name: 'View Forwarded', description: 'Ability to view applications forwarded to the user', category: 'VIEW' },
    { code: 'VIEW_RETURNED', name: 'View Returned', description: 'Ability to view applications that have been returned', category: 'VIEW' },
    { code: 'VIEW_RED_FLAGGED', name: 'View Red Flagged', description: 'Ability to view applications that have been red flagged', category: 'VIEW' },
    { code: 'VIEW_DISPOSED', name: 'View Disposed', description: 'Ability to view applications that have been disposed', category: 'VIEW' },
    { code: 'VIEW_SENT', name: 'View Sent', description: 'Ability to view applications sent by the user', category: 'VIEW' },
    { code: 'VIEW_FINAL_DISPOSAL', name: 'View Final Disposal', description: 'Ability to view finally approved or rejected applications', category: 'VIEW' },
    { code: 'VIEW_REPORTS', name: 'View Reports', description: 'Ability to view reports', category: 'VIEW' },
    { code: 'ACCESS_SETTINGS', name: 'Access Settings', description: 'Ability to access system settings', category: 'VIEW' },
    // Action Permissions
    { code: 'SUBMIT_APPLICATION', name: 'Submit Application', description: 'Ability to submit new application', category: 'ACTION' },
    { code: 'CAPTURE_UIN', name: 'Capture UIN', description: 'Ability to capture Unique Identification Number', category: 'ACTION' },
    { code: 'CAPTURE_BIOMETRICS', name: 'Capture Biometrics', description: 'Ability to capture biometric data', category: 'ACTION' },
    { code: 'UPLOAD_DOCUMENTS', name: 'Upload Documents', description: 'Ability to upload documents', category: 'ACTION' },
    { code: 'FORWARD_TO_ACP', name: 'Forward to ACP', description: 'Ability to forward application to ACP', category: 'ACTION' },
    { code: 'FORWARD_TO_SHO', name: 'Forward to SHO', description: 'Ability to forward application to SHO', category: 'ACTION' },
    { code: 'FORWARD_TO_DCP', name: 'Forward to DCP', description: 'Ability to forward application to DCP', category: 'ACTION' },
    { code: 'FORWARD_TO_AS', name: 'Forward to AS', description: 'Ability to forward application to Arms Superintendent', category: 'ACTION' },
    { code: 'FORWARD_TO_ADO', name: 'Forward to ADO', description: 'Ability to forward application to Administrative Officer', category: 'ACTION' },
    { code: 'FORWARD_TO_CADO', name: 'Forward to CADO', description: 'Ability to forward application to Chief Administrative Officer', category: 'ACTION' },
    { code: 'FORWARD_TO_JTCP', name: 'Forward to JTCP', description: 'Ability to forward application to Joint Commissioner of Police', category: 'ACTION' },
    { code: 'FORWARD_TO_CP', name: 'Forward to CP', description: 'Ability to forward application to Commissioner of Police', category: 'ACTION' },
    { code: 'CONDUCT_ENQUIRY', name: 'Conduct Enquiry', description: 'Ability to conduct enquiry on application', category: 'ACTION' },
    { code: 'ADD_REMARKS', name: 'Add Remarks', description: 'Ability to add remarks to application', category: 'ACTION' },
    { code: 'APPROVE_TA', name: 'Approve TA', description: 'Ability to approve Transport Authority license', category: 'ACTION' },
    { code: 'APPROVE_AI', name: 'Approve AI', description: 'Ability to approve Arms Import license', category: 'ACTION' },
    { code: 'REJECT', name: 'Reject', description: 'Ability to reject application', category: 'ACTION' },
    { code: 'REQUEST_RESUBMISSION', name: 'Request Resubmission', description: 'Ability to request resubmission of application', category: 'ACTION' },
    { code: 'GENERATE_PDF', name: 'Generate PDF', description: 'Ability to generate PDF for application', category: 'ACTION' },
    { code: 'RED_FLAG', name: 'Red Flag', description: 'Ability to red flag an application', category: 'ACTION' },
    { code: 'RETURN_APPLICATION', name: 'Return Application', description: 'Ability to return an application', category: 'ACTION' },
    { code: 'DISPOSE_APPLICATION', name: 'Dispose Application', description: 'Ability to dispose an application', category: 'ACTION' },
  ];
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: {},
      create: permission,
    });
  }

  // 4. Insert Role Hierarchy
  // Fetch all roles
  const allRoles = await prisma.role.findMany();
  const roleMap = Object.fromEntries(allRoles.map(r => [r.code, r.id]));
  const hierarchyPairs = [
    ['ZS', 'ACP'], ['ZS', 'DCP'], ['SHO', 'ACP'], ['ACP', 'SHO'], ['ACP', 'DCP'], ['DCP', 'ACP'], ['DCP', 'AS'], ['DCP', 'CP'],
    ['AS', 'ADO'], ['AS', 'DCP'], ['ADO', 'CADO'], ['CADO', 'JTCP'], ['JTCP', 'CP'], ['CP', 'DCP'], ['ARMS_SUPDT', 'ARMS_SEAT'],
    ['ARMS_SUPDT', 'ADO'], ['ARMS_SEAT', 'ADO'], ['ARMS_SEAT', 'ARMS_SUPDT'], ['ACO', 'ACP'], ['ACO', 'DCP'], ['ACO', 'CP']
  ];
  for (const [from, to] of hierarchyPairs) {
    if (roleMap[from] && roleMap[to]) {
      await prisma.roleHierarchy.upsert({
        where: { from_role_id_to_role_id: { from_role_id: roleMap[from], to_role_id: roleMap[to] } },
        update: {},
        create: { from_role_id: roleMap[from], to_role_id: roleMap[to] },
      });
    }
  }
  // Grant ADMIN forwarding access to all roles
  const adminId = roleMap['ADMIN'];
  for (const code in roleMap) {
    if (code !== 'ADMIN') {
      await prisma.roleHierarchy.upsert({
        where: { from_role_id_to_role_id: { from_role_id: adminId, to_role_id: roleMap[code] } },
        update: {},
        create: { from_role_id: adminId, to_role_id: roleMap[code] },
      });
    }
  }
}

main().finally(() => prisma.$disconnect());
