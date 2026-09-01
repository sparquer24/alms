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

@Injectable()
export class AnalyticsService {
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
            // - ZS users see applications for their Zone (when zoneId provided)
            // - ADMIN (and others) can be filtered by stateId
            if (roleCode !== ROLE_CODES.SUPER_ADMIN) {
                if (roleCode === ROLE_CODES.ZS && zoneId) {
                    where.permanentAddress = { zoneId };
                } else if (stateId) {
                    where.permanentAddress = { stateId };
                }
            }

            // Build separate where clauses for the three address types
            const renewalWhere: any = {};
            const cancelWhere: any = {};
            
            // Copy date filtering to renewal
            if (where.createdAt) {
                renewalWhere.createdAt = { ...where.createdAt };
            }

            // Apply state/zone filters to renewal
            if (roleCode !== ROLE_CODES.SUPER_ADMIN) {
                if (roleCode === ROLE_CODES.ZS && zoneId) {
                    renewalWhere.permanentAddress = { zoneId };
                } else if (stateId) {
                    renewalWhere.permanentAddress = { stateId };
                }
            }

            // For cancel, filter by createdAt and state
            if (where.createdAt) {
                cancelWhere.createdAt = { ...where.createdAt };
            }
            if (roleCode !== ROLE_CODES.SUPER_ADMIN && stateId) {
                cancelWhere.OR = [
                    { stateId: stateId },
                    { Licenses: { presentStateId: stateId } },
                    { requester: { stateId: stateId } },
                ];
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

            if (roleCode !== ROLE_CODES.SUPER_ADMIN) {
                if (roleCode === ROLE_CODES.ZS && zoneId) {
                    where.permanentAddress = { zoneId };
                } else if (stateId) {
                    where.permanentAddress = { stateId };
                }
            }

            // Build separate where clauses for renewal
            const renewalWhere: any = { currentUser: { isNot: null } };
            if (where.createdAt) {
                renewalWhere.createdAt = { ...where.createdAt };
            }
            if (roleCode !== ROLE_CODES.SUPER_ADMIN) {
                if (roleCode === ROLE_CODES.ZS && zoneId) {
                    renewalWhere.permanentAddress = { zoneId };
                } else if (stateId) {
                    renewalWhere.permanentAddress = { stateId };
                }
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

            if (roleCode !== ROLE_CODES.SUPER_ADMIN) {
                if (roleCode === ROLE_CODES.ZS && zoneId) {
                    where.permanentAddress = { zoneId };
                } else if (stateId) {
                    where.permanentAddress = { stateId };
                }
            }

            // Build separate where clauses for renewal
            const renewalWhere: any = {};
            if (where.createdAt) {
                renewalWhere.createdAt = { ...where.createdAt };
            }
            if (roleCode !== ROLE_CODES.SUPER_ADMIN) {
                if (roleCode === ROLE_CODES.ZS && zoneId) {
                    renewalWhere.permanentAddress = { zoneId };
                } else if (stateId) {
                    renewalWhere.permanentAddress = { stateId };
                }
            }

            // For cancel, filter by date and state
            const cancelWhere: any = {};
            if (where.createdAt) {
                cancelWhere.createdAt = { ...where.createdAt };
            }
            if (roleCode !== ROLE_CODES.SUPER_ADMIN && stateId) {
                cancelWhere.OR = [
                    { stateId: stateId },
                    { Licenses: { presentStateId: stateId } },
                    { requester: { stateId: stateId } },
                ];
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
                prisma.cancelFormRequests.findMany({
                    where: cancelWhere,
                    select: {
                        id: true,
                    },
                }),
            ]);

            // Calculate state counts for fresh and renewal
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

            processFreshRenewal(freshApps);
            processFreshRenewal(renewalApps);

            // Count cancel statuses as pending (not yet approved/rejected)
            cancelApps.forEach((app) => {
                stateMap.pending++;
            });

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
                cancel: state === 'pending' ? cancelApps.length : 0,
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

            if (roleCode !== ROLE_CODES.SUPER_ADMIN) {
                if (roleCode === ROLE_CODES.ZS && zoneId) {
                    where.application = { permanentAddress: { zoneId } };
                } else if (stateId) {
                    where.application = { permanentAddress: { stateId } };
                }
            }

            // Build similar where clause for renewal
            const renewalWhere: any = {};
            if (where.createdAt) {
                renewalWhere.createdAt = { ...where.createdAt };
            }
            if (roleCode !== ROLE_CODES.SUPER_ADMIN) {
                if (roleCode === ROLE_CODES.ZS && zoneId) {
                    renewalWhere.application = { permanentAddress: { zoneId } };
                } else if (stateId) {
                    renewalWhere.application = { permanentAddress: { stateId } };
                }
            }

            // For cancel, build similar where clause
            const cancelWhere: any = {};
            if (where.createdAt) {
                cancelWhere.createdAt = { ...where.createdAt };
            }
            if (roleCode !== ROLE_CODES.SUPER_ADMIN && stateId) {
                cancelWhere.application = {
                    OR: [
                        { stateId: stateId },
                        { Licenses: { presentStateId: stateId } },
                        { requester: { stateId: stateId } },
                    ],
                };
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
    async getApplicationsDetails(status?: string, page?: number, limit?: number, q?: string, sort?: string, fromDate?: string, toDate?: string, stateId?: number, roleCode?: string, zoneId?: number, type?: string): Promise<{data: ApplicationRecordDto[]; total: number; page?: number; limit?: number}> {
        try {
            const where: any = {};

            if (roleCode !== ROLE_CODES.SUPER_ADMIN) {
                if (roleCode === ROLE_CODES.ZS && zoneId) {
                    where.permanentAddress = { zoneId };
                } else if (stateId) {
                    where.permanentAddress = { stateId };
                }
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

            if (roleCode !== ROLE_CODES.SUPER_ADMIN) {
                if (roleCode === ROLE_CODES.ZS && zoneId) {
                    renewalWhere.permanentAddress = { zoneId };
                } else if (stateId) {
                    renewalWhere.permanentAddress = { stateId };
                }
            }

            if (where.createdAt) {
                renewalWhere.createdAt = { ...where.createdAt };
            }

            // For cancel, build where clause
            const cancelWhere: any = {};
            if (where.createdAt) {
                cancelWhere.createdAt = { ...where.createdAt };
            }
            if (roleCode !== ROLE_CODES.SUPER_ADMIN && stateId) {
                cancelWhere.OR = [
                    { stateId: stateId },
                    { Licenses: { presentStateId: stateId } },
                    { requester: { stateId: stateId } },
                ];
            }

            // Count total matching records from the requested source(s)
            const [freshCount, renewalCount, cancelCount] = await Promise.all([
                wantFresh ? prisma.freshLicenseApplicationPersonalDetails.count({ where }) : Promise.resolve(0),
                wantRenewal ? prisma.renewalFormPersonalDetails.count({ where: renewalWhere }) : Promise.resolve(0),
                wantCancel ? prisma.cancelFormRequests.count({ where: cancelWhere }) : Promise.resolve(0),
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
                !wantRenewal ? Promise.resolve([]) : prisma.renewalFormPersonalDetails.findMany({
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
                !wantCancel ? Promise.resolve([]) : prisma.cancelFormRequests.findMany({
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
}
