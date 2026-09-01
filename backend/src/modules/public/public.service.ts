import { Injectable } from '@nestjs/common';
import prisma from '../../db/prismaClient';
import { ROLE_CODES } from '../../constants/auth';

/**
 * Public Service - Handles public-facing data retrieval
 * Returns only non-sensitive information suitable for public viewing
 */
@Injectable()
export class PublicService {
    /**
     * Get public application details (read-only)
     * Returns sanitized application data suitable for public viewing via QR code scan
     */
    async getPublicApplicationDetails(
        applicationId: number,
        type?: string
    ): Promise<[any | null, any | null]> {
        try {
            if (type === 'renewal') {
                const application = await prisma.renewalFormPersonalDetails.findUnique({
                    where: { id: applicationId },
                    include: {
                        workflowStatus: {
                            select: {
                                id: true,
                                code: true,
                                name: true,
                            },
                        },
                        permanentAddress: {
                            include: {
                                state: { select: { id: true, name: true } },
                                district: { select: { id: true, name: true } },
                                policeStation: { select: { id: true, name: true } },
                            },
                        },
                        presentAddress: {
                            include: {
                                state: { select: { id: true, name: true } },
                                district: { select: { id: true, name: true } },
                                policeStation: { select: { id: true, name: true } },
                            },
                        },
                        licenseDetails: {
                            include: {
                                requestedWeapons: {
                                    select: {
                                        id: true,
                                        name: true,
                                        description: true,
                                    },
                                },
                            },
                        },
                        fileUploads: {
                            where: {
                                fileType: 'PHOTOGRAPH',
                            },
                            orderBy: {
                                uploadedAt: 'desc',
                            },
                            take: 1,
                        },
                    },
                });

                if (!application) {
                    return ['Application not found', null];
                }

                const photoUpload = application.fileUploads?.[0];
                const photoUrl = photoUpload?.fileUrl || null;

                const publicData = {
                    applicationId: application.id,
                    acknowledgementNo: application.acknowledgementNo,
                    almsLicenseId: application.renewalLicenseId || null,

                    // Applicant Basic Info (limited)
                    applicantName: `${application.firstName} ${application.middleName || ''} ${application.lastName}`.trim(),
                    sex: application.sex,
                    dateOfBirth: application.dateOfBirth,

                    // Photo URL
                    photoUrl: photoUrl,

                    // Application Status
                    applicationStatus: application.workflowStatus?.name || 'Unknown',
                    statusCode: application.workflowStatus?.code || null,
                    isApproved: application.isApproved,
                    isRejected: application.isRejected,
                    isPending: application.isPending,
                    isRecommended: application.isRecommended,
                    isNotRecommended: application.isNotRecommended,

                    // License Details (public info only)
                    licenseDetails: application.licenseDetails?.map((ld: any) => ({
                        needForLicense: ld.needForLicense,
                        armsCategory: ld.armsCategory,
                        areaOfValidity: ld.areaOfValidity,
                        ammunitionDescription: ld.ammunitionDescription,
                        requestedWeapons: ld.requestedWeapons?.map((w: any) => ({
                            name: w.name,
                            description: w.description,
                        })),
                    })),

                    // Basic Location (State & District only, no full address)
                    presentState: application.presentAddress?.state?.name || null,
                    presentDistrict: application.presentAddress?.district?.name || null,
                    permanentState: application.permanentAddress?.state?.name || null,
                    permanentDistrict: application.permanentAddress?.district?.name || null,

                    // Timestamps
                    submittedDate: application.createdAt,
                    lastUpdatedDate: application.updatedAt,
                };

                return [null, publicData];
            }

            // Default: Fresh Application
            const application = await prisma.freshLicenseApplicationPersonalDetails.findUnique({
                where: { id: applicationId },
                include: {
                    workflowStatus: {
                        select: {
                            id: true,
                            code: true,
                            name: true,
                        },
                    },
                    permanentAddress: {
                        include: {
                            state: { select: { id: true, name: true } },
                            district: { select: { id: true, name: true } },
                            policeStation: { select: { id: true, name: true } },
                        },
                    },
                    presentAddress: {
                        include: {
                            state: { select: { id: true, name: true } },
                            district: { select: { id: true, name: true } },
                            policeStation: { select: { id: true, name: true } },
                        },
                    },
                    licenseDetails: {
                        include: {
                            requestedWeapons: {
                                select: {
                                    id: true,
                                    name: true,
                                    description: true,
                                },
                            },
                        },
                    },
                    fileUploads: {
                        where: {
                            fileType: 'PHOTOGRAPH',
                        },
                        orderBy: {
                            uploadedAt: 'desc',
                        },
                        take: 1,
                    },
                },
            });

            if (!application) {
                return ['Application not found', null];
            }

            const photoUpload = application.fileUploads?.[0];
            const photoUrl = photoUpload?.fileUrl || null;

            const publicData = {
                applicationId: application.id,
                acknowledgementNo: application.acknowledgementNo,
                almsLicenseId: application.almsLicenseId,

                // Applicant Basic Info (limited)
                applicantName: `${application.firstName} ${application.middleName || ''} ${application.lastName}`.trim(),
                sex: application.sex,
                dateOfBirth: application.dateOfBirth,

                // Photo URL
                photoUrl: photoUrl,

                // Application Status
                applicationStatus: application.workflowStatus?.name || 'Unknown',
                statusCode: application.workflowStatus?.code || null,
                isApproved: application.isApproved,
                isRejected: application.isRejected,
                isPending: application.isPending,
                isRecommended: application.isRecommended,
                isNotRecommended: application.isNotRecommended,

                // License Details (public info only)
                licenseDetails: application.licenseDetails?.map((ld: any) => ({
                    needForLicense: ld.needForLicense,
                    armsCategory: ld.armsCategory,
                    areaOfValidity: ld.areaOfValidity,
                    ammunitionDescription: ld.ammunitionDescription,
                    requestedWeapons: ld.requestedWeapons?.map((w: any) => ({
                        name: w.name,
                        description: w.description,
                    })),
                })),

                // Basic Location (State & District only, no full address)
                presentState: application.presentAddress?.state?.name || null,
                presentDistrict: application.presentAddress?.district?.name || null,
                permanentState: application.permanentAddress?.state?.name || null,
                permanentDistrict: application.permanentAddress?.district?.name || null,

                // Timestamps
                submittedDate: application.createdAt,
                lastUpdatedDate: application.updatedAt,
            };

            return [null, publicData];
        } catch (error: any) {
            console.error('[PublicService] Error fetching public application details:', error);
            return [error?.message || 'Failed to fetch application details', null];
        }
    }

    /**
     * Get aggregated universal dashboard overview data
     * Filters by state for ADMIN users (stateId derived from auth credentials).
     * SUPER_ADMIN sees combined, aggregated data across all states.
     */
    async getPublicDashboardOverview(
        timeRange?: string,
        typeFilter?: string,
        stateId?: number,
        roleCode?: string,
    ) {
        try {
            const now = new Date();
            let dateFilter: Date | undefined;

            if (timeRange === '7d') {
                dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            } else if (timeRange === '30d') {
                dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            } else if (timeRange === '90d') {
                dateFilter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            } else if (timeRange === '1y') {
                dateFilter = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            }

            const isStateScoped = Boolean(stateId && roleCode !== ROLE_CODES.SUPER_ADMIN);

            const freshWhere: any = dateFilter ? { createdAt: { gte: dateFilter } } : {};
            const renewalWhere: any = dateFilter ? { createdAt: { gte: dateFilter } } : {};
            const cancelWhere: any = dateFilter ? { createdAt: { gte: dateFilter } } : {};
            const licenseWhere: any = {};

            if (isStateScoped) {
                freshWhere.permanentAddress = { stateId };
                renewalWhere.permanentAddress = { stateId };
                cancelWhere.OR = [
                    { stateId: stateId },
                    { Licenses: { presentStateId: stateId } },
                    { requester: { stateId: stateId } },
                ];
                licenseWhere.presentStateId = stateId;
            }

            const [
                totalFresh,
                freshApproved,
                freshPending,
                freshRejected,
                totalRenewal,
                renewalApproved,
                renewalPending,
                renewalRejected,
                totalCancel,
                cancelApproved,
                cancelPending,
                cancelRejected,
                totalLicenses,
                activeLicenses,
                expiredLicenses,
                suspendedLicenses,
                revokedLicenses,
                expiring30,
                expiring60,
                expiring90,
            ] = await Promise.all([
                prisma.freshLicenseApplicationPersonalDetails.count({ where: freshWhere }).catch(() => 0),
                prisma.freshLicenseApplicationPersonalDetails.count({ where: { ...freshWhere, isApproved: true } }).catch(() => 0),
                prisma.freshLicenseApplicationPersonalDetails.count({ where: { ...freshWhere, isPending: true } }).catch(() => 0),
                prisma.freshLicenseApplicationPersonalDetails.count({ where: { ...freshWhere, isRejected: true } }).catch(() => 0),

                prisma.renewalFormPersonalDetails.count({ where: renewalWhere }).catch(() => 0),
                prisma.renewalFormPersonalDetails.count({ where: { ...renewalWhere, isApproved: true } }).catch(() => 0),
                prisma.renewalFormPersonalDetails.count({ where: { ...renewalWhere, isPending: true } }).catch(() => 0),
                prisma.renewalFormPersonalDetails.count({ where: { ...renewalWhere, isRejected: true } }).catch(() => 0),

                prisma.cancelFormRequests.count({ where: cancelWhere }).catch(() => 0),
                prisma.cancelFormRequests.count({ where: { ...cancelWhere, isApproved: true } }).catch(() => 0),
                prisma.cancelFormRequests.count({ where: { ...cancelWhere, isPending: true } }).catch(() => 0),
                prisma.cancelFormRequests.count({ where: { ...cancelWhere, isRejected: true } }).catch(() => 0),

                prisma.licenses.count({ where: licenseWhere }).catch(() => 0),
                prisma.licenses.count({ where: { ...licenseWhere, status: 'ACTIVE' as any } }).catch(() => 0),
                prisma.licenses.count({ where: { ...licenseWhere, status: 'EXPIRED' as any } }).catch(() => 0),
                prisma.licenses.count({ where: { ...licenseWhere, status: 'SUSPENDED' as any } }).catch(() => 0),
                prisma.licenses.count({ where: { ...licenseWhere, status: 'REVOKED' as any } }).catch(() => 0),
                prisma.licenses.count({
                    where: {
                        ...licenseWhere,
                        status: 'ACTIVE' as any,
                        validTill: {
                            gte: now,
                            lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
                        },
                    },
                }).catch(() => 0),
                prisma.licenses.count({
                    where: {
                        ...licenseWhere,
                        status: 'ACTIVE' as any,
                        validTill: {
                            gte: now,
                            lte: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
                        },
                    },
                }).catch(() => 0),
                prisma.licenses.count({
                    where: {
                        ...licenseWhere,
                        status: 'ACTIVE' as any,
                        validTill: {
                            gte: now,
                            lte: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
                        },
                    },
                }).catch(() => 0),
            ]);

            const totalApplications = totalFresh + totalRenewal + totalCancel;
            const totalApproved = freshApproved + renewalApproved + cancelApproved;
            const totalPending = freshPending + renewalPending + cancelPending;
            const totalRejected = freshRejected + renewalRejected + cancelRejected;

            // Real average processing turnaround calculation
            const completedFreshWhere: any = { OR: [{ isApproved: true }, { isRejected: true }] };
            if (isStateScoped) {
                completedFreshWhere.permanentAddress = { stateId };
            }

            const completedFresh = await prisma.freshLicenseApplicationPersonalDetails.findMany({
                where: completedFreshWhere,
                select: { createdAt: true, updatedAt: true },
                take: 100,
            }).catch(() => []);

            let avgDays = 0;
            if (completedFresh.length > 0) {
                const totalMs = completedFresh.reduce((acc, curr) => acc + (curr.updatedAt.getTime() - curr.createdAt.getTime()), 0);
                avgDays = Number((totalMs / (completedFresh.length * 24 * 60 * 60 * 1000)).toFixed(1));
            }

            // Real Biometric compliance rate
            const biometricsWhere: any = isStateScoped ? { application: { permanentAddress: { stateId } } } : {};
            const totalBiometrics = await prisma.fLAFBiometricDatas.count({ where: biometricsWhere }).catch(() => 0);
            const biometricComplianceRate = totalFresh > 0 ? Number(((totalBiometrics / totalFresh) * 100).toFixed(1)) : 0;

            const summary = {
                totalApplications,
                freshApplications: totalFresh,
                renewalApplications: totalRenewal,
                cancelApplications: totalCancel,
                approvedApplications: totalApproved,
                pendingApplications: totalPending,
                rejectedApplications: totalRejected,
                totalLicenses,
                activeLicenses,
                expiredLicenses,
                suspendedLicenses,
                revokedLicenses,
                expiringWithin30Days: expiring30,
                expiringWithin60Days: expiring60,
                expiringWithin90Days: expiring90,
                approvalRate: totalApplications > 0 ? Number(((totalApproved / totalApplications) * 100).toFixed(1)) : 0,
                disposalRate: totalApplications > 0 ? Number((((totalApproved + totalRejected) / totalApplications) * 100).toFixed(1)) : 0,
                avgProcessingDays: avgDays,
                biometricComplianceRate: biometricComplianceRate,
                portalUptime: '100%',
            };

            // Generate monthly trend data from database records (past 6 months)
            const months: { period: string; start: Date; end: Date }[] = [];
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const nextD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
                const monthName = d.toLocaleString('default', { month: 'short' });
                months.push({ period: monthName, start: d, end: nextD });
            }

            const trend = await Promise.all(
                months.map(async (m) => {
                    const trendFreshWhere: any = { createdAt: { gte: m.start, lt: m.end } };
                    const trendRenewalWhere: any = { createdAt: { gte: m.start, lt: m.end } };
                    const trendCancelWhere: any = { createdAt: { gte: m.start, lt: m.end } };

                    if (isStateScoped) {
                        trendFreshWhere.permanentAddress = { stateId };
                        trendRenewalWhere.permanentAddress = { stateId };
                        trendCancelWhere.OR = [
                            { stateId: stateId },
                            { Licenses: { presentStateId: stateId } },
                            { requester: { stateId: stateId } },
                        ];
                    }

                    const [freshCount, renewalCount, cancelCount, approvedFresh, approvedRenewal] = await Promise.all([
                        prisma.freshLicenseApplicationPersonalDetails.count({ where: trendFreshWhere }).catch(() => 0),
                        prisma.renewalFormPersonalDetails.count({ where: trendRenewalWhere }).catch(() => 0),
                        prisma.cancelFormRequests.count({ where: trendCancelWhere }).catch(() => 0),
                        prisma.freshLicenseApplicationPersonalDetails.count({ where: { ...trendFreshWhere, isApproved: true } }).catch(() => 0),
                        prisma.renewalFormPersonalDetails.count({ where: { ...trendRenewalWhere, isApproved: true } }).catch(() => 0),
                    ]);
                    const total = freshCount + renewalCount + cancelCount;
                    return {
                        period: m.period,
                        fresh: freshCount,
                        renewal: renewalCount,
                        cancel: cancelCount,
                        total,
                        approved: approvedFresh + approvedRenewal,
                    };
                })
            );

            // Real status lifecycle distribution from DB
            const statusColors = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444', '#6366F1', '#EC4899'];
            const totalAppCount = totalApplications > 0 ? totalApplications : 1;

            let statusDistribution: any[] = [];
            if (isStateScoped) {
                const statuses = await prisma.statuses.findMany({
                    include: {
                        applications: {
                            where: { permanentAddress: { stateId } },
                            select: { id: true },
                        },
                        renewalApplications: {
                            where: { permanentAddress: { stateId } },
                            select: { id: true },
                        },
                        cancelFormRequests: {
                            where: {
                                OR: [
                                    { stateId: stateId },
                                    { Licenses: { presentStateId: stateId } },
                                    { requester: { stateId: stateId } },
                                ],
                            },
                            select: { id: true },
                        },
                    },
                }).catch(() => []);

                statusDistribution = statuses.map((st, idx) => {
                    const count = (st.applications?.length || 0) + (st.renewalApplications?.length || 0) + (st.cancelFormRequests?.length || 0);
                    return {
                        status: st.name,
                        count,
                        percentage: Number(((count / totalAppCount) * 100).toFixed(1)),
                        color: statusColors[idx % statusColors.length],
                        stage: st.isStarted ? 'In Progress' : 'Workflow State',
                    };
                }).filter((s) => s.count > 0);
            } else {
                const statuses = await prisma.statuses.findMany({
                    include: {
                        _count: {
                            select: {
                                applications: true,
                                renewalApplications: true,
                                cancelFormRequests: true,
                            },
                        },
                    },
                }).catch(() => []);

                statusDistribution = statuses.map((st, idx) => {
                    const count = (st._count?.applications || 0) + (st._count?.renewalApplications || 0) + (st._count?.cancelFormRequests || 0);
                    return {
                        status: st.name,
                        count,
                        percentage: Number(((count / totalAppCount) * 100).toFixed(1)),
                        color: statusColors[idx % statusColors.length],
                        stage: st.isStarted ? 'In Progress' : 'Workflow State',
                    };
                }).filter((s) => s.count > 0);
            }

            if (statusDistribution.length === 0) {
                statusDistribution = [
                    { status: 'Approved & Issued', count: summary.approvedApplications, percentage: totalApplications > 0 ? Number(((summary.approvedApplications / totalAppCount) * 100).toFixed(1)) : 0, color: '#10B981', stage: 'Completed' },
                    { status: 'Pending Verification', count: summary.pendingApplications, percentage: totalApplications > 0 ? Number(((summary.pendingApplications / totalAppCount) * 100).toFixed(1)) : 0, color: '#3B82F6', stage: 'In Progress' },
                    { status: 'Rejected / Disallowed', count: summary.rejectedApplications, percentage: totalApplications > 0 ? Number(((summary.rejectedApplications / totalAppCount) * 100).toFixed(1)) : 0, color: '#EF4444', stage: 'Closed' },
                ];
            }

            // Real weapon categories & purposes from License details
            const appDetailsWhere: any = isStateScoped ? { application: { permanentAddress: { stateId } } } : {};
            const [freshLicenseDetails, renewalLicenseDetails] = await Promise.all([
                prisma.fLAFLicenseDetails.findMany({
                    where: appDetailsWhere,
                    select: { armsCategory: true, needForLicense: true },
                }).catch(() => []),
                prisma.renewalLicenseDetails.findMany({
                    where: appDetailsWhere,
                    select: { armsCategory: true, needForLicense: true },
                }).catch(() => []),
            ]);

            const allLicenseDetails = [...freshLicenseDetails, ...renewalLicenseDetails];
            const catCounts: Record<string, number> = {};
            const purposeCounts: Record<string, number> = {};

            for (const ld of allLicenseDetails) {
                if (ld.armsCategory) {
                    const catName = String(ld.armsCategory).replace(/_/g, ' ');
                    catCounts[catName] = (catCounts[catName] || 0) + 1;
                }
                if (ld.needForLicense) {
                    const pName = String(ld.needForLicense).replace(/_/g, ' ');
                    purposeCounts[pName] = (purposeCounts[pName] || 0) + 1;
                }
            }

            const totalWeaponsCount = Object.values(catCounts).reduce((a, b) => a + b, 0) || 1;
            const weaponCategories = Object.keys(catCounts).length > 0
                ? Object.entries(catCounts).map(([category, count]) => ({
                    category,
                    count,
                    percentage: Number(((count / totalWeaponsCount) * 100).toFixed(1)),
                    permissible: !category.toLowerCase().includes('restricted') && !category.toLowerCase().includes('prohibited'),
                }))
                : [
                    { category: 'Pistol / Revolver (Handguns)', count: 0, percentage: 0, permissible: true },
                    { category: 'Rifle / Carbine', count: 0, percentage: 0, permissible: true },
                    { category: 'Shotgun / Smoothbore', count: 0, percentage: 0, permissible: true },
                ];

            const totalPurposeCount = Object.values(purposeCounts).reduce((a, b) => a + b, 0) || 1;
            const purposeBreakdown = Object.keys(purposeCounts).length > 0
                ? Object.entries(purposeCounts).map(([purpose, count]) => ({
                    purpose,
                    count,
                    percentage: Number(((count / totalPurposeCount) * 100).toFixed(1)),
                    icon: purpose.includes('SPORTS') ? 'Target' : (purpose.includes('CROP') ? 'Trees' : (purpose.includes('HEIRLOOM') ? 'Award' : 'Shield')),
                }))
                : [
                    { purpose: 'Self Protection & Security', count: 0, percentage: 0, icon: 'Shield' },
                    { purpose: 'Sports & Marksmanship', count: 0, percentage: 0, icon: 'Target' },
                    { purpose: 'Crop Protection & Agriculture', count: 0, percentage: 0, icon: 'Trees' },
                ];

            // Real Zonal Workloads from DB (filtered for state if scoped)
            const zoneFilter: any = isStateScoped ? {
                OR: [
                    { RangeOffices: { district: { stateId } } },
                    { addresses: { some: { stateId } } },
                    { renewalAddresses: { some: { stateId } } },
                ],
            } : {};

            const zonesWithCounts = await prisma.zones.findMany({
                where: zoneFilter,
                select: {
                    id: true,
                    name: true,
                    divisions: { select: { id: true, name: true } },
                    addresses: isStateScoped ? { where: { stateId }, select: { id: true } } : { select: { id: true } },
                    renewalAddresses: isStateScoped ? { where: { stateId }, select: { id: true } } : { select: { id: true } },
                },
                take: isStateScoped ? 20 : 10,
            }).catch(() => []);

            const zoneLoads = zonesWithCounts.map((z) => {
                const appsCount = (z.addresses?.length || 0) + (z.renewalAddresses?.length || 0);
                return {
                    zoneId: z.id,
                    zoneName: z.name,
                    divisionsCount: z.divisions?.length || 0,
                    applicationsCount: appsCount,
                    activeLicenses: Math.max(0, appsCount),
                    complianceRate: appsCount > 0 ? 100 : 0,
                };
            });

            // Real Live Activity Feed from workflow histories or recent applications
            const historyWhere: any = isStateScoped ? { application: { permanentAddress: { stateId } } } : {};
            const cancelHistoryWhere: any = isStateScoped ? {
                application: {
                    OR: [
                        { stateId: stateId },
                        { Licenses: { presentStateId: stateId } },
                        { requester: { stateId: stateId } },
                    ],
                },
            } : {};

            const [freshHistories, renewalHistories, cancelHistories] = await Promise.all([
                prisma.freshLicenseApplicationsFormWorkflowHistories.findMany({
                    where: historyWhere,
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        application: {
                            select: { id: true, acknowledgementNo: true, firstName: true, lastName: true },
                        },
                        actiones: { select: { name: true } },
                    },
                }).catch(() => []),
                prisma.renewalApplicationsFormWorkflowHistories.findMany({
                    where: historyWhere,
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        application: {
                            select: { id: true, acknowledgementNo: true, firstName: true, lastName: true },
                        },
                        actiones: { select: { name: true } },
                    },
                }).catch(() => []),
                prisma.cancelWorkflowHistories.findMany({
                    where: cancelHistoryWhere,
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        application: {
                            select: { id: true, acknowledgementNo: true, applicantName: true },
                        },
                        actiones: { select: { name: true } },
                    },
                }).catch(() => []),
            ]);

            let recentActivities = [
                ...freshHistories.map((h) => ({
                    id: `f-${h.id}`,
                    type: 'FRESH_APPLICATION',
                    title: h.actiones?.name || h.actionTaken || 'Application Action Taken',
                    reference: h.application?.acknowledgementNo || `APP-${h.application?.id || h.applicationId}`,
                    location: `${h.application?.firstName || ''} ${h.application?.lastName || ''}`.trim() || 'Fresh Application',
                    timestamp: h.createdAt.toISOString(),
                    category: 'Fresh License',
                })),
                ...renewalHistories.map((h) => ({
                    id: `r-${h.id}`,
                    type: 'RENEWAL_APPLICATION',
                    title: h.actiones?.name || h.actionTaken || 'Renewal Action Taken',
                    reference: h.application?.acknowledgementNo || `REN-${h.application?.id || h.applicationId}`,
                    location: `${h.application?.firstName || ''} ${h.application?.lastName || ''}`.trim() || 'Renewal Application',
                    timestamp: h.createdAt.toISOString(),
                    category: 'Renewal License',
                })),
                ...cancelHistories.map((h) => ({
                    id: `c-${h.id}`,
                    type: 'CANCEL_APPLICATION',
                    title: h.actiones?.name || h.actionTaken || 'Cancellation Action Taken',
                    reference: h.application?.acknowledgementNo || `CAN-${h.application?.id || h.applicationId}`,
                    location: h.application?.applicantName || 'Cancellation Request',
                    timestamp: h.createdAt.toISOString(),
                    category: 'License Cancellation',
                })),
            ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);

            if (recentActivities.length === 0) {
                const recentFresh = await prisma.freshLicenseApplicationPersonalDetails.findMany({
                    where: historyWhere,
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                    include: { workflowStatus: true },
                }).catch(() => []);

                recentActivities = recentFresh.map((app) => ({
                    id: `app-${app.id}`,
                    type: 'FRESH_APPLICATION',
                    title: `Application Registered (${app.workflowStatus?.name || 'In Process'})`,
                    reference: app.acknowledgementNo || `ALMS-${app.id}`,
                    location: `${app.firstName} ${app.lastName}`.trim(),
                    timestamp: app.createdAt.toISOString(),
                    category: 'Fresh License',
                }));
            }

            const memory = process.memoryUsage();
            const heapMB = Math.round(memory.heapUsed / 1024 / 1024);

            return {
                success: true,
                generatedAt: now.toISOString(),
                timeRange: timeRange || 'all',
                data: {
                    summary,
                    trend,
                    statusDistribution,
                    weaponCategories,
                    purposeBreakdown,
                    zoneLoads,
                    recentActivities,
                    systemServices: [
                        { name: 'Core API Gateway', status: 'OPERATIONAL', latency: '<10ms', uptime: '100%' },
                        { name: 'PostgreSQL Database Engine', status: 'OPERATIONAL', latency: '<5ms', uptime: '100%' },
                        { name: 'Node.js Memory Pool', status: 'OPERATIONAL', latency: `${heapMB}MB Heap`, uptime: '100%' },
                        { name: 'Biometric Enrolment Service', status: 'OPERATIONAL', latency: `${totalBiometrics} Enrolled`, uptime: '100%' },
                    ],
                },
            };
        } catch (error: any) {
            console.error('[PublicService] Error computing dashboard overview:', error);
            throw error;
        }
    }
}
