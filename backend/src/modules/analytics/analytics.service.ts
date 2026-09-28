import { Injectable } from '@nestjs/common';
import prisma from '../../db/prismaClient';
import {
    ApplicationsDataDto,
    RoleLoadDataDto,
    StateDataDto,
    AdminActivityDto,
    ApplicationRecordDto,
} from './dto/analytics.dto';
import { getISOWeek, getISOWeekYear, parseISO, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { ROLE_CODES } from '../../constants/auth';
import { STATUS_CODES } from '../../constants/workflow-actions';

@Injectable()
export class AnalyticsService {
    /**
     * Location-hierarchy scope for a request: ZS/DCP scope by zone, JTCP/CP scope
     * by district, other roles (e.g. ADMIN) scope by state, SUPER_ADMIN is unscoped.
     */
    private buildLocationWhere(
        roleCode?: string,
        stateId?: number,
        districtId?: number,
        zoneId?: number,
    ): { zoneId?: number } | { districtId?: number } | { stateId?: number } | undefined {
        if (roleCode === ROLE_CODES.SUPER_ADMIN) {
            return undefined;
        }
        if ((roleCode === ROLE_CODES.ZS || roleCode === ROLE_CODES.DCP) && zoneId) {
            return { zoneId };
        }
        if ((roleCode === ROLE_CODES.JTCP || roleCode === ROLE_CODES.CP) && districtId) {
            return { districtId };
        }
        if (stateId) {
            return { stateId };
        }
        return undefined;
    }

    /**
     * CancelFormRequests has no districtId/zoneId column of its own, so district/zone
     * scoping goes through its Licenses and requester (Users) relations.
     */
    private buildCancelOrConditions(
        roleCode?: string,
        stateId?: number,
        districtId?: number,
        zoneId?: number,
    ): any[] | undefined {
        if (roleCode === ROLE_CODES.SUPER_ADMIN) {
            return undefined;
        }
        if ((roleCode === ROLE_CODES.ZS || roleCode === ROLE_CODES.DCP) && zoneId) {
            return [
                { Licenses: { presentZoneId: zoneId } },
                { requester: { zoneId } },
            ];
        }
        if ((roleCode === ROLE_CODES.JTCP || roleCode === ROLE_CODES.CP) && districtId) {
            return [
                { Licenses: { presentDistrictId: districtId } },
                { requester: { districtId } },
            ];
        }
        if (stateId) {
            return [
                { stateId: stateId },
                { Licenses: { presentStateId: stateId } },
                { requester: { stateId: stateId } },
            ];
        }
        return undefined;
    }

    /**
     * Get applications aggregated by ISO week (Fresh, Renewal, and Cancel)
     * Filters by state for ADMIN users, SUPER_ADMIN sees all states
     */
    async getApplicationsByWeek(
        fromDate?: string,
        toDate?: string,
        stateId?: number,
        roleCode?: string,
        zoneId?: number,
        districtId?: number,
    ): Promise<ApplicationsDataDto[]> {
        try {
            const where: any = {};

            // Add date filtering if provided
            if (fromDate || toDate) {
                where.createdAt = {};
                if (fromDate) {
                    where.createdAt.gte = startOfDay(parseISO(fromDate));
                }
                if (toDate) {
                    where.createdAt.lte = endOfDay(parseISO(toDate));
                }
            }

            // Filtering rules:
            // - SUPER_ADMIN bypasses filters
            // - ZS/DCP scope by zone, JTCP/CP scope by district, others by state
            const locationWhere = this.buildLocationWhere(roleCode, stateId, districtId, zoneId);
            if (locationWhere) {
                where.permanentAddress = locationWhere;
            }

            // Build separate where clauses for the three address types
            const renewalWhere: any = {};
            const cancelWhere: any = {};

            // Copy date filtering to renewal
            if (where.createdAt) {
                renewalWhere.createdAt = { ...where.createdAt };
            }

            // Apply the same location scope to renewal
            if (locationWhere) {
                renewalWhere.permanentAddress = locationWhere;
            }

            // For cancel, filter by createdAt and location scope
            if (where.createdAt) {
                cancelWhere.createdAt = { ...where.createdAt };
            }
            const cancelOrConditions = this.buildCancelOrConditions(roleCode, stateId, districtId, zoneId);
            if (cancelOrConditions) {
                cancelWhere.OR = cancelOrConditions;
            }

            // Fetch all three types of applications within date range
            const [freshApps, renewalApps, cancelApps] = await Promise.all([
                prisma.freshLicenseApplicationPersonalDetails.findMany({
                    where,
                    select: { id: true, createdAt: true },
                }),
                prisma.renewalFormPersonalDetails.findMany({
                    where: renewalWhere,
                    select: { id: true, createdAt: true },
                }),
                prisma.cancelFormRequests.findMany({
                    where: cancelWhere,
                    select: { id: true, createdAt: true },
                }),
            ]);

            // Group by ISO week for all three types
            const weekMap = new Map<string, { count: number; fresh: number; renewal: number; cancel: number }>();
            
            const processApps = (apps: any[], type: 'fresh' | 'renewal' | 'cancel') => {
                apps.forEach((app) => {
                    const date = new Date(app.createdAt);
                    const year = getISOWeekYear(date);
                    const week = getISOWeek(date);
                    const weekKey = `${year}-W${String(week).padStart(2, '0')}`;

                    if (!weekMap.has(weekKey)) {
                        weekMap.set(weekKey, { count: 0, fresh: 0, renewal: 0, cancel: 0 });
                    }
                    const entry = weekMap.get(weekKey)!;
                    entry.count += 1;
                    entry[type] += 1;
                });
            };

            processApps(freshApps, 'fresh');
            processApps(renewalApps, 'renewal');
            processApps(cancelApps, 'cancel');

            // Convert to array and sort
            const result = Array.from(weekMap.entries())
                .map(([week, data]) => ({
                    week,
                    count: data.count,
                    date: week,
                    fresh: data.fresh,
                    renewal: data.renewal,
                    cancel: data.cancel,
                }))
                .sort((a, b) => a.week.localeCompare(b.week));

            return result;
        } catch (error) {
            console.error('Error fetching applications by week:', error);
            // Return empty array instead of throwing to prevent 500 errors
            return [];
        }
    }

    /**
     * Get application load by role (Fresh, Renewal, and Cancel)
     * Filters by state for ADMIN users, SUPER_ADMIN sees all states
     */
    async getRoleLoad(
        fromDate?: string,
        toDate?: string,
        stateId?: number,
        roleCode?: string,
        zoneId?: number,
        districtId?: number,
    ): Promise<RoleLoadDataDto[]> {
        try {
            const where: any = {
                currentUser: {
                    isNot: null,
                },
            };

            // Add date filtering if provided
            if (fromDate || toDate) {
                where.createdAt = {};
                if (fromDate) {
                    where.createdAt.gte = startOfDay(parseISO(fromDate));
                }
                if (toDate) {
                    where.createdAt.lte = endOfDay(parseISO(toDate));
                }
            }

            const locationWhere = this.buildLocationWhere(roleCode, stateId, districtId, zoneId);
            if (locationWhere) {
                where.permanentAddress = locationWhere;
            }

            // Build separate where clauses for renewal
            const renewalWhere: any = { currentUser: { isNot: null } };
            if (where.createdAt) {
                renewalWhere.createdAt = { ...where.createdAt };
            }
            if (locationWhere) {
                renewalWhere.permanentAddress = locationWhere;
            }

            // Get applications with their assigned roles (Fresh & Renewal)
            const [freshApps, renewalApps] = await Promise.all([
                prisma.freshLicenseApplicationPersonalDetails.findMany({
                    where,
                    select: {
                        id: true,
                        currentUser: {
                            select: {
                                role: { select: { code: true, name: true } },
                            },
                        },
                    },
                }),
                prisma.renewalFormPersonalDetails.findMany({
                    where: renewalWhere,
                    select: {
                        id: true,
                        currentUser: {
                            select: {
                                role: { select: { code: true, name: true } },
                            },
                        },
                    },
                }),
            ]);

            // Group by role and type
            const roleMap = new Map<string, { name: string; code: string; count: number; fresh: number; renewal: number }>();

            const processApps = (apps: any[], type: 'fresh' | 'renewal') => {
                apps.forEach((app) => {
                    const role = app.currentUser?.role;
                    if (role) {
                        if (!roleMap.has(role.code)) {
                            roleMap.set(role.code, { name: role.name, code: role.code, count: 0, fresh: 0, renewal: 0 });
                        }
                        const entry = roleMap.get(role.code)!;
                        entry.count += 1;
                        entry[type] += 1;
                    }
                });
            };

            processApps(freshApps, 'fresh');
            processApps(renewalApps, 'renewal');

            // Convert to array - NOTE: cancel doesn't have currentUser assignment
            const result: RoleLoadDataDto[] = Array.from(roleMap.values()).map((role) => ({
                name: role.name,
                value: role.count,
                code: role.code,
                fresh: role.fresh,
                renewal: role.renewal,
            }));

            return result;
        } catch (error) {
            console.error('Error fetching role load:', error);
            // Return empty array instead of throwing
            return [];
        }
    }

    /**
     * Get application state distribution (Fresh, Renewal, and Cancel)
     * Filters by state for ADMIN users, SUPER_ADMIN sees all states
     */
    async getApplicationStates(
        fromDate?: string,
        toDate?: string,
        stateId?: number,
        roleCode?: string,
        zoneId?: number,
        districtId?: number,
    ): Promise<StateDataDto[]> {
        try {
            const where: any = {};

            // Add date filtering if provided
            if (fromDate || toDate) {
                where.createdAt = {};
                if (fromDate) {
                    where.createdAt.gte = startOfDay(parseISO(fromDate));
                }
                if (toDate) {
                    where.createdAt.lte = endOfDay(parseISO(toDate));
                }
            }

            const locationWhere = this.buildLocationWhere(roleCode, stateId, districtId, zoneId);
            if (locationWhere) {
                where.permanentAddress = locationWhere;
            }

            // Build separate where clauses for renewal
            const renewalWhere: any = {};
            if (where.createdAt) {
                renewalWhere.createdAt = { ...where.createdAt };
            }
            if (locationWhere) {
                renewalWhere.permanentAddress = locationWhere;
            }

            // For cancel, filter by date and location scope
            const cancelWhere: any = {};
            if (where.createdAt) {
                cancelWhere.createdAt = { ...where.createdAt };
            }
            const cancelOrConditions = this.buildCancelOrConditions(roleCode, stateId, districtId, zoneId);
            if (cancelOrConditions) {
                cancelWhere.OR = cancelOrConditions;
            }

            // Get all applications with their status
            const [freshApps, renewalApps, cancelApps] = await Promise.all([
                prisma.freshLicenseApplicationPersonalDetails.findMany({
                    where,
                    select: {
                        id: true,
                        isApproved: true,
                        isRejected: true,
                        isPending: true,
                    },
                }),
                prisma.renewalFormPersonalDetails.findMany({
                    where: renewalWhere,
                    select: {
                        id: true,
                        isApproved: true,
                        isRejected: true,
                        isPending: true,
                    },
                }),
                // CancelFormRequests has no isApproved/isRejected/isPending columns — its
                // outcome lives on the linked workflowStatus (code CANCEL = approved/executed,
                // REJECT = rejected, anything else including null = still pending).
                prisma.cancelFormRequests.findMany({
                    where: cancelWhere,
                    select: {
                        id: true,
                        workflowStatus: { select: { code: true } },
                    },
                }),
            ]);

            // Calculate state counts for fresh, renewal and cancel
            const stateMap = {
                approved: 0,
                rejected: 0,
                pending: 0,
            };

            const processFreshRenewal = (apps: any[]) => {
                apps.forEach((app) => {
                    if (app.isApproved) {
                        stateMap.approved++;
                    } else if (app.isRejected) {
                        stateMap.rejected++;
                    } else {
                        stateMap.pending++;
                    }
                });
            };

            const cancelOutcome = (app: { workflowStatus: { code: string } | null }): 'approved' | 'rejected' | 'pending' => {
                const code = app.workflowStatus?.code;
                if (code === STATUS_CODES.CANCEL) return 'approved';
                if (code === STATUS_CODES.REJECT) return 'rejected';
                return 'pending';
            };

            processFreshRenewal(freshApps);
            processFreshRenewal(renewalApps);
            cancelApps.forEach((app) => stateMap[cancelOutcome(app)]++);

            // Convert to array
            const result = Object.entries(stateMap).map(([state, count]) => ({
                state,
                count,
                fresh: state === 'approved' ? freshApps.filter((a) => a.isApproved).length :
                       state === 'rejected' ? freshApps.filter((a) => a.isRejected).length :
                       freshApps.filter((a) => !a.isApproved && !a.isRejected).length,
                renewal: state === 'approved' ? renewalApps.filter((a) => a.isApproved).length :
                        state === 'rejected' ? renewalApps.filter((a) => a.isRejected).length :
                        renewalApps.filter((a) => !a.isApproved && !a.isRejected).length,
                cancel: cancelApps.filter((a) => cancelOutcome(a) === state).length,
            }));

            return result;
        } catch (error) {
            console.error('Error fetching application states:', error);
            // Return empty array instead of throwing
            return [];
        }
    }

    /**
     * Get admin activities - Returns the 2 most recent entries for each user
     * Filters based on logged-in admin's state (only shows activities where they are involved)
     * Includes Fresh, Renewal, and Cancel application activities
     * SUPER_ADMIN sees all activities, ADMIN sees only activities from their assigned state
     */
    async getAdminActivities(
        fromDate?: string,
        toDate?: string,
        userId?: number,
        roleId?: number,
        stateId?: number,
        roleCode?: string,
        zoneId?: number,
        districtId?: number,
    ): Promise<AdminActivityDto[]> {
        try {
            const where: any = {};

            // Add date filtering if provided
            if (fromDate || toDate) {
                where.createdAt = {};
                if (fromDate) {
                    where.createdAt.gte = startOfDay(parseISO(fromDate));
                }
                if (toDate) {
                    where.createdAt.lte = endOfDay(parseISO(toDate));
                }
            }

            const locationWhere = this.buildLocationWhere(roleCode, stateId, districtId, zoneId);
            if (locationWhere) {
                where.application = { permanentAddress: locationWhere };
            }

            // Build similar where clause for renewal
            const renewalWhere: any = {};
            if (where.createdAt) {
                renewalWhere.createdAt = { ...where.createdAt };
            }
            if (locationWhere) {
                renewalWhere.application = { permanentAddress: locationWhere };
            }

            // For cancel, build similar where clause
            const cancelWhere: any = {};
            if (where.createdAt) {
                cancelWhere.createdAt = { ...where.createdAt };
            }
            const cancelOrConditions = this.buildCancelOrConditions(roleCode, stateId, districtId, zoneId);
            if (cancelOrConditions) {
                cancelWhere.application = { OR: cancelOrConditions };
            }

            // Fetch workflow history for all three types
            const [freshWorkflows, renewalWorkflows, cancelWorkflows] = await Promise.all([
                prisma.freshLicenseApplicationsFormWorkflowHistories.findMany({
                    where,
                    select: {
                        id: true,
                        createdAt: true,
                        applicationId: true,
                        actionTaken: true,
                        nextRole: { select: { code: true, name: true } },
                        nextUser: { select: { username: true } },
                        application: {
                            select: {
                                almsLicenseId: true,
                                firstName: true,
                                middleName: true,
                                lastName: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 100,
                }),
                prisma.renewalApplicationsFormWorkflowHistories.findMany({
                    where: renewalWhere,
                    select: {
                        id: true,
                        createdAt: true,
                        applicationId: true,
                        actionTaken: true,
                        nextRole: { select: { code: true, name: true } },
                        nextUser: { select: { username: true } },
                        application: {
                            select: {
                                renewalLicenseId: true,
                                firstName: true,
                                middleName: true,
                                lastName: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 100,
                }),
                prisma.cancelWorkflowHistories.findMany({
                    where: cancelWhere,
                    select: {
                        id: true,
                        createdAt: true,
                        applicationId: true,
                        actionTaken: true,
                        nextRole: { select: { code: true, name: true } },
                        nextUser: { select: { username: true } },
                        application: {
                            select: {
                                id: true,
                                licenseId: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 100,
                }),
            ]);

            // Group by user and take only the 2 most recent entries for each user
            const userActivitiesMap = new Map<string, any[]>();

            // Process fresh workflows
            freshWorkflows.forEach((workflow: any) => {
                const user = workflow.nextUser?.username || workflow.nextRole?.code || 'Unknown';
                if (!userActivitiesMap.has(user)) {
                    userActivitiesMap.set(user, []);
                }
                const userActivities = userActivitiesMap.get(user)!;
                if (userActivities.length < 2) {
                    userActivities.push({ ...workflow, applicationType: 'FRESH' });
                }
            });

            // Process renewal workflows
            renewalWorkflows.forEach((workflow: any) => {
                const user = workflow.nextUser?.username || workflow.nextRole?.code || 'Unknown';
                if (!userActivitiesMap.has(user)) {
                    userActivitiesMap.set(user, []);
                }
                const userActivities = userActivitiesMap.get(user)!;
                if (userActivities.length < 2) {
                    userActivities.push({ ...workflow, applicationType: 'RENEWAL' });
                }
            });

            // Process cancel workflows
            cancelWorkflows.forEach((workflow: any) => {
                const user = workflow.nextUser?.username || workflow.nextRole?.code || 'Unknown';
                if (!userActivitiesMap.has(user)) {
                    userActivitiesMap.set(user, []);
                }
                const userActivities = userActivitiesMap.get(user)!;
                if (userActivities.length < 2) {
                    userActivities.push({ ...workflow, applicationType: 'CANCEL' });
                }
            });

            // Flatten the map and format the results
            const result: AdminActivityDto[] = [];

            userActivitiesMap.forEach((activities) => {
                activities.forEach((workflow) => {
                    // Construct applicant name based on type
                    let applicantName = 'N/A';
                    if (workflow.application?.firstName) {
                        applicantName = [
                            workflow.application.firstName,
                            workflow.application.middleName,
                            workflow.application.lastName,
                        ]
                            .filter(Boolean)
                            .join(' ')
                            .trim() || 'N/A';
                    }

                    // Get license ID based on type
                    const licenseId = workflow.application?.almsLicenseId || 
                                     workflow.application?.renewalLicenseId || 
                                     undefined;

                    result.push({
                        id: workflow.id,
                        user: workflow.nextUser?.username || workflow.nextRole?.code || 'Unknown',
                        action: workflow.actionTaken || 'Updated',
                        time: new Date(workflow.createdAt).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                        }),
                        timestamp: new Date(workflow.createdAt).getTime(),
                        almsLicenseId: licenseId,
                        applicantName,
                        applicationType: workflow.applicationType,
                    });
                });
            });

            // Sort by timestamp descending to maintain chronological order
            result.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

            return result;
        } catch (error) {
            console.error('Error fetching admin activities:', error);
            // Return empty array if workflow history table doesn't exist or is empty
            return [];
        }
    }

    /**
     * Get applications summary and list for admin analytics
     * Supports optional status filter (APPROVED | REJECTED | PENDING)
     * Includes Fresh, Renewal, and Cancel applications
     * Filters by state for ADMIN users, SUPER_ADMIN sees all states
     */
    async getApplicationsDetails(status?: string, page?: number, limit?: number, q?: string, sort?: string, fromDate?: string, toDate?: string, stateId?: number, roleCode?: string, zoneId?: number, type?: string, districtId?: number, actionFilter?: string): Promise<{data: ApplicationRecordDto[]; total: number; page?: number; limit?: number}> {
        try {
            const where: any = {};

            const locationWhere = this.buildLocationWhere(roleCode, stateId, districtId, zoneId);
            if (locationWhere) {
                where.permanentAddress = locationWhere;
            }

            if (status) {
                const s = String(status).toUpperCase();
                if (s === 'APPROVED') {
                    where.isApproved = true;
                } else if (s === 'REJECTED' || s === 'RETURNED') {
                    where.isRejected = true;
                } else if (s === 'PENDING') {
                    where.isPending = true;
                }
            }

            // Restrict to a single application family (fresh/renewal/cancel) when requested.
            const normalizedType = type ? String(type).toLowerCase() : undefined;
            const wantFresh = !normalizedType || normalizedType === 'fresh';
            const wantRenewal = !normalizedType || normalizedType === 'renewal';
            const wantCancel = !normalizedType || normalizedType === 'cancel';

            // Apply text search if provided (search almsLicenseId or currentUser.username)
            if (q) {
                const qStr = String(q);
                // search license id or currentUser.username
                where.OR = [
                    { almsLicenseId: { contains: qStr, mode: 'insensitive' } },
                    { currentUser: { is: { username: { contains: qStr, mode: 'insensitive' } } } },
                ];
            }

            // Add date filtering if provided
            if (fromDate || toDate) {
                where.createdAt = {};
                if (fromDate) {
                    where.createdAt.gte = startOfDay(parseISO(fromDate));
                }
                if (toDate) {
                    where.createdAt.lte = endOfDay(parseISO(toDate));
                }
            }

            // Build similar where clauses for renewal
            const renewalWhere: any = {};
            if (where.OR) renewalWhere.OR = where.OR;
            
            if (status) {
                const s = String(status).toUpperCase();
                if (s === 'APPROVED') {
                    renewalWhere.isApproved = true;
                } else if (s === 'REJECTED' || s === 'RETURNED') {
                    renewalWhere.isRejected = true;
                } else if (s === 'PENDING') {
                    renewalWhere.isPending = true;
                }
            }

            if (locationWhere) {
                renewalWhere.permanentAddress = locationWhere;
            }

            if (where.createdAt) {
                renewalWhere.createdAt = { ...where.createdAt };
            }

            // For cancel, build where clause
            const cancelWhere: any = {};
            if (where.createdAt) {
                cancelWhere.createdAt = { ...where.createdAt };
            }
            const cancelOrConditions = this.buildCancelOrConditions(roleCode, stateId, districtId, zoneId);
            if (cancelOrConditions) {
                cancelWhere.OR = cancelOrConditions;
            }

            // Apply the same criteria the Action Required cards use, so drilling into
            // a card shows exactly the records that were counted for it.
            let includeCancelFamily = wantCancel;
            const normalizedActionFilter = actionFilter ? String(actionFilter).toLowerCase() : undefined;
            if (normalizedActionFilter === 'under_verification') {
                where.isPending = true;
                where.currentUserId = { not: null };
                renewalWhere.isPending = true;
                renewalWhere.currentUserId = { not: null };
                includeCancelFamily = false;
            } else if (normalizedActionFilter === 'pending_over_15') {
                const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
                where.isPending = true;
                where.createdAt = { ...where.createdAt, lte: fifteenDaysAgo };
                renewalWhere.isPending = true;
                renewalWhere.createdAt = { ...renewalWhere.createdAt, lte: fifteenDaysAgo };
                cancelWhere.createdAt = { ...cancelWhere.createdAt, lte: fifteenDaysAgo };
            } else if (normalizedActionFilter === 'awaiting_action') {
                where.isSubmit = true;
                where.isPending = false;
                where.isApproved = false;
                where.isRejected = false;
                where.currentUserId = null;
                renewalWhere.isSubmit = true;
                renewalWhere.isPending = false;
                renewalWhere.isApproved = false;
                renewalWhere.isRejected = false;
                renewalWhere.currentUserId = null;
                includeCancelFamily = false;
            } else if (normalizedActionFilter === 'biometric_pending') {
                // Biometric compliance is only tracked on fresh applications.
                where.isSubmit = true;
                where.isApproved = false;
                where.isRejected = false;
                where.biometricData = null;
                includeCancelFamily = false;
            }

            const wantCancelResolved = normalizedActionFilter === 'biometric_pending' ? false
                : normalizedActionFilter ? includeCancelFamily
                : wantCancel;
            const wantRenewalResolved = normalizedActionFilter === 'biometric_pending' ? false : wantRenewal;

            // Count total matching records from the requested source(s)
            const [freshCount, renewalCount, cancelCount] = await Promise.all([
                wantFresh ? prisma.freshLicenseApplicationPersonalDetails.count({ where }) : Promise.resolve(0),
                wantRenewalResolved ? prisma.renewalFormPersonalDetails.count({ where: renewalWhere }) : Promise.resolve(0),
                wantCancelResolved ? prisma.cancelFormRequests.count({ where: cancelWhere }) : Promise.resolve(0),
            ]);

            const total = freshCount + renewalCount + cancelCount;

            // pagination defaults: default to 5 items per page when no limit provided
            const DEFAULT_LIMIT = 5;
            let take: number | undefined = undefined;
            let skip: number | undefined = undefined;
            let pageNum: number | undefined = undefined;

            if (page !== undefined && page !== null) {
                // page provided; use provided limit or default
                pageNum = Math.max(1, Math.floor(page));
                const lim = (limit !== undefined && limit !== null) ? Math.max(1, Math.floor(limit)) : DEFAULT_LIMIT;
                take = lim;
                skip = (pageNum - 1) * lim;
            } else if (limit !== undefined && limit !== null) {
                // only limit provided
                const lim = Math.max(1, Math.floor(limit));
                take = lim;
                pageNum = 1;
            } else {
                // neither page nor limit provided -> default to first page with DEFAULT_LIMIT
                take = DEFAULT_LIMIT;
                pageNum = 1;
            }

            // sorting
            let orderBy: any = { updatedAt: 'desc' };
            if (sort) {
                const desc = String(sort).startsWith('-');
                const key = desc ? String(sort).slice(1) : String(sort);
                orderBy = { [key]: desc ? 'desc' : 'asc' };
            }

            // Fetch matching applications with related personal fields and workflow
            const [freshApplications, renewalApplications, cancelApplications] = await Promise.all([
                !wantFresh ? Promise.resolve([]) : prisma.freshLicenseApplicationPersonalDetails.findMany({
                    where,
                    select: {
                        id: true,
                        almsLicenseId: true,
                        updatedAt: true,
                        createdAt: true,
                        firstName: true,
                        middleName: true,
                        lastName: true,
                        filledBy: true,
                        currentUser: {
                            select: {
                                id: true,
                                username: true,
                            },
                        },
                        isApproved: true,
                        isRejected: true,
                        isPending: true,
                        workflowHistories: {
                            orderBy: { createdAt: 'desc' },
                            take: 1,
                            select: {
                                createdAt: true,
                            },
                        },
                    },
                    orderBy,
                    skip,
                    take: take ?? 200,
                }),
                !wantRenewalResolved ? Promise.resolve([]) : prisma.renewalFormPersonalDetails.findMany({
                    where: renewalWhere,
                    select: {
                        id: true,
                        renewalLicenseId: true,
                        updatedAt: true,
                        createdAt: true,
                        firstName: true,
                        middleName: true,
                        lastName: true,
                        filledBy: true,
                        currentUser: {
                            select: {
                                id: true,
                                username: true,
                            },
                        },
                        isApproved: true,
                        isRejected: true,
                        isPending: true,
                        workflowHistories: {
                            orderBy: { createdAt: 'desc' },
                            take: 1,
                            select: {
                                createdAt: true,
                            },
                        },
                    },
                    orderBy,
                    skip,
                    take: take ?? 200,
                }),
                !wantCancelResolved ? Promise.resolve([]) : prisma.cancelFormRequests.findMany({
                    where: cancelWhere,
                    select: {
                        id: true,
                        workflowStatus: {
                            select: {
                                code: true,
                            },
                        },
                        updatedAt: true,
                        createdAt: true,
                        licenseId: true,
                        requestedDate: true,
                        requester: {
                            select: {
                                id: true,
                                username: true,
                            },
                        },
                    },
                    orderBy,
                    skip,
                    take: take ?? 200,
                }),
            ]);

            const now = Date.now();

            const data: ApplicationRecordDto[] = [];

            // Map fresh applications
            freshApplications.forEach((app: typeof freshApplications[0]) => {
                const latest = app.workflowHistories && app.workflowHistories[0];
                const actionDate = latest?.createdAt ? new Date(latest.createdAt) : app.updatedAt ? new Date(app.updatedAt) : new Date(app.createdAt);
                const actionTakenAt = actionDate ? actionDate.toISOString() : null;
                const daysTillToday = actionDate ? Math.floor((now - actionDate.getTime()) / (24 * 60 * 60 * 1000)) : null;

                const statusStr = app.isApproved ? 'APPROVED' : app.isRejected ? 'REJECTED' : 'PENDING';
                const applicantName = [app.firstName, app.middleName, app.lastName].filter(Boolean).join(' ').trim();

                data.push({
                    applicationId: app.id,
                    licenseId: app.almsLicenseId || null,
                    applicantName: applicantName || null,
                    applicantType: app.filledBy || null,
                    currentUser: app.currentUser ? { id: app.currentUser.id, name: app.currentUser.username } : null,
                    status: statusStr,
                    actionTakenAt,
                    daysTillToday,
                    applicationType: 'FRESH',
                });
            });

            // Map renewal applications
            renewalApplications.forEach((app: typeof renewalApplications[0]) => {
                const latest = app.workflowHistories && app.workflowHistories[0];
                const actionDate = latest?.createdAt ? new Date(latest.createdAt) : app.updatedAt ? new Date(app.updatedAt) : new Date(app.createdAt);
                const actionTakenAt = actionDate ? actionDate.toISOString() : null;
                const daysTillToday = actionDate ? Math.floor((now - actionDate.getTime()) / (24 * 60 * 60 * 1000)) : null;

                const statusStr = app.isApproved ? 'APPROVED' : app.isRejected ? 'REJECTED' : 'PENDING';
                const applicantName = [app.firstName, app.middleName, app.lastName].filter(Boolean).join(' ').trim();

                data.push({
                    applicationId: app.id,
                    licenseId: app.renewalLicenseId || null,
                    applicantName: applicantName || null,
                    applicantType: app.filledBy || null,
                    currentUser: app.currentUser ? { id: app.currentUser.id, name: app.currentUser.username } : null,
                    status: statusStr,
                    actionTakenAt,
                    daysTillToday,
                    applicationType: 'RENEWAL',
                });
            });

            // Map cancel applications
            cancelApplications.forEach((app: typeof cancelApplications[0]) => {
                const actionDate = app.updatedAt ? new Date(app.updatedAt) : new Date(app.createdAt);
                const actionTakenAt = actionDate ? actionDate.toISOString() : null;
                const daysTillToday = actionDate ? Math.floor((now - actionDate.getTime()) / (24 * 60 * 60 * 1000)) : null;

                const statusStr = app.workflowStatus?.code || 'PENDING';
                const applicantName = app.requester?.username || 'N/A';

                data.push({
                    applicationId: app.id,
                    licenseId: app.licenseId ? `CAN_${app.licenseId}` : null,
                    applicantName,
                    applicantType: null,
                    currentUser: app.requester ? { id: app.requester.id, name: app.requester.username } : null,
                    status: statusStr,
                    actionTakenAt,
                    daysTillToday,
                    applicationType: 'CANCEL',
                });
            });

            // Sort combined data by action date (newest first)
            data.sort((a, b) => {
                const timeA = a.actionTakenAt ? new Date(a.actionTakenAt).getTime() : 0;
                const timeB = b.actionTakenAt ? new Date(b.actionTakenAt).getTime() : 0;
                return timeB - timeA;
            });

            return { data, total, page: pageNum, limit: take };
        } catch (error) {
            console.error('Error fetching applications details:', error);
            return { data: [], total: 0 };
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // NEW: Application Funnel — counts per workflow stage (Fresh + Renewal)
    // ─────────────────────────────────────────────────────────────────────────
    async getApplicationFunnel(
        stateId?: number,
        roleCode?: string,
        zoneId?: number,
        districtId?: number,
    ): Promise<{ stage: string; code: string; count: number; order: number }[]> {
        try {
            const locationWhere = this.buildLocationWhere(roleCode, stateId, districtId, zoneId);
            const freshWhere: any = locationWhere ? { permanentAddress: locationWhere } : {};
            const renewalWhere: any = locationWhere ? { permanentAddress: locationWhere } : {};

            // Count by isSubmit / workflow flags for fresh apps
            const [
                freshDraft, freshSubmitted, freshPending, freshApproved, freshRejected,
                renewalDraft, renewalSubmitted, renewalPending, renewalApproved, renewalRejected,
            ] = await Promise.all([
                prisma.freshLicenseApplicationPersonalDetails.count({ where: { ...freshWhere, isSubmit: false } }),
                prisma.freshLicenseApplicationPersonalDetails.count({ where: { ...freshWhere, isSubmit: true, isPending: false, isApproved: false, isRejected: false } }),
                prisma.freshLicenseApplicationPersonalDetails.count({ where: { ...freshWhere, isPending: true } }),
                prisma.freshLicenseApplicationPersonalDetails.count({ where: { ...freshWhere, isApproved: true } }),
                prisma.freshLicenseApplicationPersonalDetails.count({ where: { ...freshWhere, isRejected: true } }),
                prisma.renewalFormPersonalDetails.count({ where: { ...renewalWhere, isSubmit: false } }),
                prisma.renewalFormPersonalDetails.count({ where: { ...renewalWhere, isSubmit: true, isPending: false, isApproved: false, isRejected: false } }),
                prisma.renewalFormPersonalDetails.count({ where: { ...renewalWhere, isPending: true } }),
                prisma.renewalFormPersonalDetails.count({ where: { ...renewalWhere, isApproved: true } }),
                prisma.renewalFormPersonalDetails.count({ where: { ...renewalWhere, isRejected: true } }),
            ]);

            // Also count how many approved fresh apps generated a license
            const lw = locationWhere as any;
            const licenseIssued = await prisma.licenses.count({
                where: {
                    ...(lw?.stateId ? { presentStateId: lw.stateId } :
                        lw?.districtId ? { presentDistrictId: lw.districtId } :
                        lw?.zoneId ? { presentZoneId: lw.zoneId } : {}),
                },
            });

            const stages = [
                { stage: 'Draft', code: 'DRAFT', count: freshDraft + renewalDraft, order: 1 },
                { stage: 'Submitted', code: 'SUBMITTED', count: freshSubmitted + renewalSubmitted, order: 2 },
                { stage: 'Under Verification', code: 'VERIFICATION', count: freshPending + renewalPending, order: 3 },
                { stage: 'Approved', code: 'APPROVED', count: freshApproved + renewalApproved, order: 4 },
                { stage: 'Rejected', code: 'REJECTED', count: freshRejected + renewalRejected, order: 5 },
                { stage: 'License Issued', code: 'LICENSE_ISSUED', count: licenseIssued, order: 6 },
            ];

            return stages;
        } catch (error) {
            console.error('Error fetching application funnel:', error);
            return [];
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // NEW: Application Aging — pending apps grouped by age buckets
    // ─────────────────────────────────────────────────────────────────────────
    async getAgingBuckets(
        stateId?: number,
        roleCode?: string,
        zoneId?: number,
        districtId?: number,
    ): Promise<{ label: string; minDays: number; maxDays: number; count: number }[]> {
        try {
            const locationWhere = this.buildLocationWhere(roleCode, stateId, districtId, zoneId);
            const baseWhere: any = { isPending: true, ...(locationWhere ? { permanentAddress: locationWhere } : {}) };
            const cancelOrConditions = this.buildCancelOrConditions(roleCode, stateId, districtId, zoneId);
            const cancelBaseWhere: any = cancelOrConditions ? { OR: cancelOrConditions } : {};

            const now = new Date();
            const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

            const buckets = [
                { label: '0–3 days', minDays: 0, maxDays: 3 },
                { label: '4–7 days', minDays: 4, maxDays: 7 },
                { label: '8–15 days', minDays: 8, maxDays: 15 },
                { label: '16–30 days', minDays: 16, maxDays: 30 },
                { label: '30+ days', minDays: 31, maxDays: 9999 },
            ];

            const results = await Promise.all(buckets.map(async (b) => {
                const createdAtFilter = b.maxDays >= 9999
                    ? { lte: daysAgo(b.minDays) }
                    : { gte: daysAgo(b.maxDays), lte: daysAgo(b.minDays) };

                const [freshCount, renewalCount, cancelCount] = await Promise.all([
                    prisma.freshLicenseApplicationPersonalDetails.count({
                        where: { ...baseWhere, createdAt: createdAtFilter },
                    }),
                    prisma.renewalFormPersonalDetails.count({
                        where: { ...baseWhere, createdAt: createdAtFilter },
                    }),
                    prisma.cancelFormRequests.count({
                        where: { ...cancelBaseWhere, createdAt: createdAtFilter },
                    }),
                ]);

                return { ...b, count: freshCount + renewalCount + cancelCount };
            }));

            return results;
        } catch (error) {
            console.error('Error fetching aging buckets:', error);
            return [];
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // NEW: Action Required — 5 actionable item counts
    // ─────────────────────────────────────────────────────────────────────────
    async getActionRequired(
        stateId?: number,
        roleCode?: string,
        zoneId?: number,
        districtId?: number,
    ): Promise<{ key: string; label: string; count: number; severity: 'critical' | 'warning' | 'info' }[]> {
        try {
            const locationWhere = this.buildLocationWhere(roleCode, stateId, districtId, zoneId);
            const freshWhere: any = locationWhere ? { permanentAddress: locationWhere } : {};
            const cancelOrConditions = this.buildCancelOrConditions(roleCode, stateId, districtId, zoneId);
            const cancelBaseWhere: any = cancelOrConditions ? { OR: cancelOrConditions } : {};
            const lw2 = locationWhere as any;
            const licenseWhere: any = lw2?.stateId ? { presentStateId: lw2.stateId } :
                lw2?.districtId ? { presentDistrictId: lw2.districtId } :
                lw2?.zoneId ? { presentZoneId: lw2.zoneId } : {};

            const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
            const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

            const [
                underVerification,
                pendingOver15Fresh,
                pendingOver15Renewal,
                pendingOver15Cancel,
                expiringLicenses,
                freshWithCurrentUser,
                renewalWithCurrentUser,
                biometricPending,
            ] = await Promise.all([
                // Apps in active verification (isPending = true, has currentUserId)
                prisma.freshLicenseApplicationPersonalDetails.count({
                    where: { ...freshWhere, isPending: true, currentUserId: { not: null } },
                }).then(async (f) => {
                    const r = await prisma.renewalFormPersonalDetails.count({
                        where: { ...freshWhere, isPending: true, currentUserId: { not: null } },
                    });
                    return f + r;
                }),
                // Pending fresh > 15 days
                prisma.freshLicenseApplicationPersonalDetails.count({
                    where: { ...freshWhere, isPending: true, createdAt: { lte: fifteenDaysAgo } },
                }),
                // Pending renewal > 15 days
                prisma.renewalFormPersonalDetails.count({
                    where: { ...freshWhere, isPending: true, createdAt: { lte: fifteenDaysAgo } },
                }),
                // Pending cancel > 15 days
                prisma.cancelFormRequests.count({
                    where: { ...cancelBaseWhere, createdAt: { lte: fifteenDaysAgo } },
                }),
                // Licenses expiring within 30 days
                prisma.licenses.count({
                    where: { ...licenseWhere, status: 'ACTIVE', validTill: { lte: thirtyDaysFromNow, gte: new Date() } },
                }),
                // Fresh awaiting action (has no current user = stuck at submission)
                prisma.freshLicenseApplicationPersonalDetails.count({
                    where: { ...freshWhere, isSubmit: true, isPending: false, isApproved: false, isRejected: false, currentUserId: null },
                }),
                // Renewal awaiting action
                prisma.renewalFormPersonalDetails.count({
                    where: { ...freshWhere, isSubmit: true, isPending: false, isApproved: false, isRejected: false, currentUserId: null },
                }),
                // Fresh apps missing biometric data
                prisma.freshLicenseApplicationPersonalDetails.count({
                    where: { ...freshWhere, isSubmit: true, isApproved: false, isRejected: false, biometricData: null },
                }),
            ]);

            return [
                { key: 'under_verification', label: 'Applications under verification', count: underVerification, severity: 'info' },
                { key: 'pending_over_15', label: 'Applications pending > 15 days', count: pendingOver15Fresh + pendingOver15Renewal + pendingOver15Cancel, severity: 'warning' },
                { key: 'expiring_licenses', label: 'Licenses expiring within 30 days', count: expiringLicenses, severity: 'warning' },
                { key: 'awaiting_action', label: 'Applications awaiting admin action', count: freshWithCurrentUser + renewalWithCurrentUser, severity: 'critical' },
                { key: 'biometric_pending', label: 'Applications with missing biometric', count: biometricPending, severity: 'info' },
            ];
        } catch (error) {
            console.error('Error fetching action required:', error);
            return [];
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // NEW: License Expiry Buckets — 30/60/90 days + expired
    // ─────────────────────────────────────────────────────────────────────────
    async getLicenseExpiryBuckets(
        stateId?: number,
        roleCode?: string,
        zoneId?: number,
        districtId?: number,
    ): Promise<{ label: string; days: number; count: number }[]> {
        try {
            const locationWhere = this.buildLocationWhere(roleCode, stateId, districtId, zoneId);
            const lw3 = locationWhere as any;
            const licenseWhere: any = lw3?.stateId ? { presentStateId: lw3.stateId } :
                lw3?.districtId ? { presentDistrictId: lw3.districtId } :
                lw3?.zoneId ? { presentZoneId: lw3.zoneId } : {};

            const now = new Date();
            const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            const in60 = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
            const in90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

            const [exp30, exp60, exp90, expired] = await Promise.all([
                prisma.licenses.count({ where: { ...licenseWhere, status: 'ACTIVE', validTill: { gte: now, lte: in30 } } }),
                prisma.licenses.count({ where: { ...licenseWhere, status: 'ACTIVE', validTill: { gt: in30, lte: in60 } } }),
                prisma.licenses.count({ where: { ...licenseWhere, status: 'ACTIVE', validTill: { gt: in60, lte: in90 } } }),
                prisma.licenses.count({ where: { ...licenseWhere, status: { in: ['EXPIRED', 'CANCELLED', 'REVOKED'] } } }),
            ]);

            return [
                { label: 'Expiring in 30 days', days: 30, count: exp30 },
                { label: 'Expiring in 31–60 days', days: 60, count: exp60 },
                { label: 'Expiring in 61–90 days', days: 90, count: exp90 },
                { label: 'Expired / Cancelled', days: 0, count: expired },
            ];
        } catch (error) {
            console.error('Error fetching license expiry buckets:', error);
            return [];
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // NEW: Monthly Comparison — this month vs last month
    // ─────────────────────────────────────────────────────────────────────────
    async getMonthlyComparison(
        stateId?: number,
        roleCode?: string,
        zoneId?: number,
        districtId?: number,
    ): Promise<{
        thisMonth: { submitted: number; approved: number; rejected: number };
        lastMonth: { submitted: number; approved: number; rejected: number };
    }> {
        try {
            const locationWhere = this.buildLocationWhere(roleCode, stateId, districtId, zoneId);
            const freshWhere: any = locationWhere ? { permanentAddress: locationWhere } : {};
            const cancelOrConditions = this.buildCancelOrConditions(roleCode, stateId, districtId, zoneId);
            const cancelBaseWhere: any = cancelOrConditions ? { OR: cancelOrConditions } : {};

            const now = new Date();
            const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

            const [
                thisMonthFresh, thisMonthRenewal, thisMonthCancel,
                lastMonthFresh, lastMonthRenewal, lastMonthCancel,
                thisApprovedFresh, thisApprovedRenewal,
                lastApprovedFresh, lastApprovedRenewal,
                thisRejectedFresh, thisRejectedRenewal,
                lastRejectedFresh, lastRejectedRenewal,
            ] = await Promise.all([
                // Submitted this month
                prisma.freshLicenseApplicationPersonalDetails.count({ where: { ...freshWhere, isSubmit: true, createdAt: { gte: startOfThisMonth } } }),
                prisma.renewalFormPersonalDetails.count({ where: { ...freshWhere, isSubmit: true, createdAt: { gte: startOfThisMonth } } }),
                prisma.cancelFormRequests.count({ where: { ...cancelBaseWhere, createdAt: { gte: startOfThisMonth } } }),
                // Submitted last month
                prisma.freshLicenseApplicationPersonalDetails.count({ where: { ...freshWhere, isSubmit: true, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
                prisma.renewalFormPersonalDetails.count({ where: { ...freshWhere, isSubmit: true, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
                prisma.cancelFormRequests.count({ where: { ...cancelBaseWhere, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
                // Approved this month
                prisma.freshLicenseApplicationPersonalDetails.count({ where: { ...freshWhere, isApproved: true, updatedAt: { gte: startOfThisMonth } } }),
                prisma.renewalFormPersonalDetails.count({ where: { ...freshWhere, isApproved: true, updatedAt: { gte: startOfThisMonth } } }),
                // Approved last month
                prisma.freshLicenseApplicationPersonalDetails.count({ where: { ...freshWhere, isApproved: true, updatedAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
                prisma.renewalFormPersonalDetails.count({ where: { ...freshWhere, isApproved: true, updatedAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
                // Rejected this month
                prisma.freshLicenseApplicationPersonalDetails.count({ where: { ...freshWhere, isRejected: true, updatedAt: { gte: startOfThisMonth } } }),
                prisma.renewalFormPersonalDetails.count({ where: { ...freshWhere, isRejected: true, updatedAt: { gte: startOfThisMonth } } }),
                // Rejected last month
                prisma.freshLicenseApplicationPersonalDetails.count({ where: { ...freshWhere, isRejected: true, updatedAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
                prisma.renewalFormPersonalDetails.count({ where: { ...freshWhere, isRejected: true, updatedAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
            ]);

            return {
                thisMonth: {
                    submitted: thisMonthFresh + thisMonthRenewal + thisMonthCancel,
                    approved: thisApprovedFresh + thisApprovedRenewal,
                    rejected: thisRejectedFresh + thisRejectedRenewal,
                },
                lastMonth: {
                    submitted: lastMonthFresh + lastMonthRenewal + lastMonthCancel,
                    approved: lastApprovedFresh + lastApprovedRenewal,
                    rejected: lastRejectedFresh + lastRejectedRenewal,
                },
            };
        } catch (error) {
            console.error('Error fetching monthly comparison:', error);
            return {
                thisMonth: { submitted: 0, approved: 0, rejected: 0 },
                lastMonth: { submitted: 0, approved: 0, rejected: 0 },
            };
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // NEW: Processing Performance — avg days, SLA %, delayed count
    // ─────────────────────────────────────────────────────────────────────────
    async getProcessingPerformance(
        stateId?: number,
        roleCode?: string,
        zoneId?: number,
        districtId?: number,
    ): Promise<{
        avgDays: number;
        medianDays: number;
        slaPercent: number;
        delayedCount: number;
        totalProcessed: number;
    }> {
        try {
            const locationWhere = this.buildLocationWhere(roleCode, stateId, districtId, zoneId);
            const freshWhere: any = { isApproved: true, ...(locationWhere ? { permanentAddress: locationWhere } : {}) };
            const renewalWhere: any = { isApproved: true, ...(locationWhere ? { permanentAddress: locationWhere } : {}) };

            const SLA_DAYS = 30; // SLA target

            const [freshApps, renewalApps] = await Promise.all([
                prisma.freshLicenseApplicationPersonalDetails.findMany({
                    where: freshWhere,
                    select: { createdAt: true, updatedAt: true },
                    take: 1000,
                    orderBy: { updatedAt: 'desc' },
                }),
                prisma.renewalFormPersonalDetails.findMany({
                    where: renewalWhere,
                    select: { createdAt: true, updatedAt: true },
                    take: 1000,
                    orderBy: { updatedAt: 'desc' },
                }),
            ]);

            const allApps = [...freshApps, ...renewalApps];

            if (allApps.length === 0) {
                return { avgDays: 0, medianDays: 0, slaPercent: 0, delayedCount: 0, totalProcessed: 0 };
            }

            const dayDiffs = allApps.map((a) => {
                const created = new Date(a.createdAt).getTime();
                const updated = new Date(a.updatedAt).getTime();
                return Math.max(0, Math.floor((updated - created) / (24 * 60 * 60 * 1000)));
            });

            dayDiffs.sort((a, b) => a - b);

            const avgDays = Math.round(dayDiffs.reduce((s, d) => s + d, 0) / dayDiffs.length);
            const medianDays = dayDiffs[Math.floor(dayDiffs.length / 2)];
            const withinSla = dayDiffs.filter((d) => d <= SLA_DAYS).length;
            const slaPercent = Math.round((withinSla / dayDiffs.length) * 100);
            const delayedCount = dayDiffs.filter((d) => d > SLA_DAYS).length;

            return { avgDays, medianDays, slaPercent, delayedCount, totalProcessed: allApps.length };
        } catch (error) {
            console.error('Error fetching processing performance:', error);
            return { avgDays: 0, medianDays: 0, slaPercent: 0, delayedCount: 0, totalProcessed: 0 };
        }
    }
}

