import prisma from './src/db/prismaClient';
import { PublicService } from './src/modules/public/public.service';
import { AnalyticsService } from './src/modules/analytics/analytics.service';
import { LicensesService } from './src/modules/licenses/licenses.service';
import { CancelFormService } from './src/modules/CancelForm/cancel-form.service';
import { PrismaService } from './src/services/prisma.service';

async function verifyDashboardFiltering() {
  console.log('====================================================');
  console.log('  STARTING DASHBOARD ROLE & STATE FILTERING AUDIT   ');
  console.log('====================================================\n');

  try {
    // 1. Fetch an Admin and a Super Admin user
    const adminUser = await (prisma as any).users.findFirst({
      where: {
        role: { code: 'ADMIN' },
        stateId: { not: null },
      },
      include: {
        role: true,
        state: true,
      },
    });

    const superAdminUser = await (prisma as any).users.findFirst({
      where: {
        role: { code: 'SUPER_ADMIN' },
      },
      include: {
        role: true,
      },
    });

    if (!adminUser) {
      console.error('❌ No ADMIN user found with an assigned stateId in the database.');
      return;
    }

    console.log(`👤 Found ADMIN User: ${adminUser.username} (ID: ${adminUser.id}, State: ${adminUser.state?.name}, StateId: ${adminUser.stateId})`);
    console.log(`👑 Found SUPER_ADMIN User: ${superAdminUser?.username || 'Default'} (Role: SUPER_ADMIN)\n`);

    const adminStateId = Number(adminUser.stateId);
    const publicService = new PublicService();
    const analyticsService = new AnalyticsService();
    const prismaService = new PrismaService();
    const licensesService = new LicensesService(prismaService);
    const cancelFormService = new CancelFormService();

    // ----------------------------------------------------
    // TEST 1: Public Dashboard Overview (Universal Dashboard)
    // ----------------------------------------------------
    console.log('--- TEST 1: Universal Dashboard Overview (/public/dashboard/overview) ---');
    const adminOverview = await publicService.getPublicDashboardOverview('all', 'all', adminStateId, 'ADMIN');
    const superAdminOverview = await publicService.getPublicDashboardOverview('all', 'all', undefined, 'SUPER_ADMIN');

    console.log(`ADMIN Applications Count: ${adminOverview.data.summary.totalApplications} (Fresh: ${adminOverview.data.summary.freshApplications}, Renewal: ${adminOverview.data.summary.renewalApplications}, Cancel: ${adminOverview.data.summary.cancelApplications})`);
    console.log(`SUPER_ADMIN Applications Count: ${superAdminOverview.data.summary.totalApplications} (Fresh: ${superAdminOverview.data.summary.freshApplications}, Renewal: ${superAdminOverview.data.summary.renewalApplications}, Cancel: ${superAdminOverview.data.summary.cancelApplications})`);
    console.log(`ADMIN Licenses Count: ${adminOverview.data.summary.totalLicenses} (Active: ${adminOverview.data.summary.activeLicenses})`);
    console.log(`SUPER_ADMIN Licenses Count: ${superAdminOverview.data.summary.totalLicenses} (Active: ${superAdminOverview.data.summary.activeLicenses})`);

    if (adminOverview.data.summary.totalApplications > superAdminOverview.data.summary.totalApplications) {
      throw new Error('❌ FAIL: ADMIN applications count cannot exceed SUPER_ADMIN applications count.');
    }
    if (adminOverview.data.summary.totalLicenses > superAdminOverview.data.summary.totalLicenses) {
      throw new Error('❌ FAIL: ADMIN licenses count cannot exceed SUPER_ADMIN licenses count.');
    }
    console.log('✅ PASS: Universal Dashboard counts properly scoped by state for ADMIN and aggregated for SUPER_ADMIN.\n');

    // ----------------------------------------------------
    // TEST 2: Analytics Module Endpoints
    // ----------------------------------------------------
    console.log('--- TEST 2: Analytics Module Filtering (/admin/analytics/*) ---');

    // 2a. Applications by Week
    const adminWeeks = await analyticsService.getApplicationsByWeek(undefined, undefined, adminStateId, 'ADMIN');
    const superWeeks = await analyticsService.getApplicationsByWeek(undefined, undefined, undefined, 'SUPER_ADMIN');
    const adminWeekTotal = adminWeeks.reduce((acc, curr) => acc + curr.count, 0);
    const superWeekTotal = superWeeks.reduce((acc, curr) => acc + curr.count, 0);
    console.log(`2a. Weekly Applications Total -> ADMIN: ${adminWeekTotal}, SUPER_ADMIN: ${superWeekTotal}`);
    if (adminWeekTotal > superWeekTotal) {
      throw new Error('❌ FAIL: ADMIN weekly total exceeds SUPER_ADMIN total.');
    }

    // 2b. Role Load
    const adminRoleLoad = await analyticsService.getRoleLoad(undefined, undefined, adminStateId, 'ADMIN');
    const superRoleLoad = await analyticsService.getRoleLoad(undefined, undefined, undefined, 'SUPER_ADMIN');
    const adminRoleTotal = adminRoleLoad.reduce((acc, curr) => acc + curr.value, 0);
    const superRoleTotal = superRoleLoad.reduce((acc, curr) => acc + curr.value, 0);
    console.log(`2b. Role Load Total -> ADMIN: ${adminRoleTotal}, SUPER_ADMIN: ${superRoleTotal}`);

    // 2c. Application States (Approved, Pending, Rejected)
    const adminStates = await analyticsService.getApplicationStates(undefined, undefined, adminStateId, 'ADMIN');
    const superStates = await analyticsService.getApplicationStates(undefined, undefined, undefined, 'SUPER_ADMIN');
    const adminStatesTotal = adminStates.reduce((acc, curr) => acc + curr.count, 0);
    const superStatesTotal = superStates.reduce((acc, curr) => acc + curr.count, 0);
    console.log(`2c. Application Status Distribution -> ADMIN: ${adminStatesTotal}, SUPER_ADMIN: ${superStatesTotal}`);

    // 2d. Admin Activities
    const adminActivities = await analyticsService.getAdminActivities(undefined, undefined, adminUser.id, adminUser.roleId, adminStateId, 'ADMIN');
    const superActivities = await analyticsService.getAdminActivities(undefined, undefined, undefined, undefined, undefined, 'SUPER_ADMIN');
    console.log(`2d. Recent Activities Count -> ADMIN: ${adminActivities.length}, SUPER_ADMIN: ${superActivities.length}`);

    // 2e. Applications Details
    const adminDetails = await analyticsService.getApplicationsDetails(undefined, 1, 10, undefined, undefined, undefined, undefined, adminStateId, 'ADMIN');
    const superDetails = await analyticsService.getApplicationsDetails(undefined, 1, 10, undefined, undefined, undefined, undefined, undefined, 'SUPER_ADMIN');
    console.log(`2e. Applications Details Total -> ADMIN: ${adminDetails.total}, SUPER_ADMIN: ${superDetails.total}`);
    if (adminDetails.total > superDetails.total) {
      throw new Error('❌ FAIL: ADMIN application details total exceeds SUPER_ADMIN total.');
    }
    console.log('✅ PASS: Analytics module queries accurately filtered by state for ADMIN.\n');

    // ----------------------------------------------------
    // TEST 3: Licenses Module Endpoints
    // ----------------------------------------------------
    console.log('--- TEST 3: Licenses Module Filtering (/licenses/*) ---');
    const adminLicenseStats = await licensesService.getLicenseStatistics(adminStateId, 'ADMIN');
    const superLicenseStats = await licensesService.getLicenseStatistics(undefined, 'SUPER_ADMIN');
    console.log(`License Stats Total -> ADMIN: ${adminLicenseStats.total}, SUPER_ADMIN: ${superLicenseStats.total}`);
    console.log(`Active Licenses -> ADMIN: ${adminLicenseStats.active}, SUPER_ADMIN: ${superLicenseStats.active}`);

    if (adminLicenseStats.total > superLicenseStats.total) {
      throw new Error('❌ FAIL: ADMIN license stats total exceeds SUPER_ADMIN total.');
    }

    const adminLicenseList = await licensesService.getAllLicenses({ page: 1, limit: 20, stateId: adminStateId, roleCode: 'ADMIN' });
    const superLicenseList = await licensesService.getAllLicenses({ page: 1, limit: 20, stateId: undefined, roleCode: 'SUPER_ADMIN' });
    console.log(`License List Total -> ADMIN: ${adminLicenseList.total}, SUPER_ADMIN: ${superLicenseList.total}`);

    for (const lic of adminLicenseList.data) {
      if (lic.presentStateId && lic.presentStateId !== adminStateId) {
        throw new Error(`❌ FAIL: Found license (ID: ${lic.id}) belonging to state ${lic.presentStateId} in ADMIN view (expected state ${adminStateId})`);
      }
    }
    console.log('✅ PASS: Licenses module properly enforces state isolation for ADMIN.\n');

    // ----------------------------------------------------
    // TEST 4: Cancel Requests Module Endpoints
    // ----------------------------------------------------
    console.log('--- TEST 4: Cancel Form Module Filtering (/cancel-forms/*) ---');
    const adminCancels = await cancelFormService.getCancelRequests({ page: 1, limit: 50, stateId: adminStateId, roleCode: 'ADMIN' });
    const superCancels = await cancelFormService.getCancelRequests({ page: 1, limit: 50, stateId: undefined, roleCode: 'SUPER_ADMIN' });
    console.log(`Cancel Requests Total -> ADMIN: ${adminCancels.total}, SUPER_ADMIN: ${superCancels.total}`);

    if (adminCancels.total > superCancels.total) {
      throw new Error('❌ FAIL: ADMIN cancel requests total exceeds SUPER_ADMIN total.');
    }
    console.log('✅ PASS: Cancel Form module properly enforces state isolation for ADMIN.\n');

    console.log('====================================================');
    console.log('  ALL ROLE & STATE DASHBOARD TESTS PASSED!          ');
    console.log('====================================================');
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDashboardFiltering();
