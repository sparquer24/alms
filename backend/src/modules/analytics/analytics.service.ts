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
     * Get applications aggregated by ISO week
     * Filters by state for ADMIN users, SUPER_ADMIN sees all states
     */
    async getApplicationsByWeek(
        fromDate?: string,
        toDate?: string,
        stateId?: number,
        roleCode?: string,
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

            // State-based filtering for ADMIN (SUPER_ADMIN bypasses this)
            // Filter by permanent address state since applications don't have direct stateId
            if (stateId && roleCode !== ROLE_CODES.SUPER_ADMIN) {
                where.permanentAddress = {
                    stateId: stateId
                };
            }

            // Fetch all applications within date range
            const applications = await prisma.freshLicenseApplicationPersonalDetails.findMany({
                where,
                select: {
                    id: true,
                    createdAt: true,
                },
            });

            // Group by ISO week
            const weekMap = new Map<string, number>();
            applications.forEach((app) => {
                const date = new Date(app.createdAt);
                const year = getISOWeekYear(date);
                const week = getISOWeek(date);
                const weekKey = `${year}-W${String(week).padStart(2, '0')}`;

                weekMap.set(weekKey, (weekMap.get(weekKey) || 0) + 1);
            });

            // Convert to array and sort
            const result = Array.from(weekMap.entries())
                .map(([week, count]) => ({
                    week,
                    count,
                    date: week,
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
     * Get application load by role
     * Filters by state for ADMIN users, SUPER_ADMIN sees all states
     */
    async getRoleLoad(
        fromDate?: string,
        toDate?: string,
        stateId?: number,
        roleCode?: string,
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

            // State-based filtering for ADMIN (SUPER_ADMIN bypasses this)
            // Filter by permanent address state since applications don't have direct stateId
            if (stateId && roleCode !== ROLE_CODES.SUPER_ADMIN) {
                where.permanentAddress = {
                    stateId: stateId
                };
            }

            // Get applications with their assigned roles
            const applications = await prisma.freshLicenseApplicationPersonalDetails.findMany({
                where,
                select: {
                    id: true,
                    currentUser: {
                        select: {
                            role: {
                                select: {
                                    code: true,
                                    name: true,
                                },
                            },
                        },
                    },
                },
            });

            // Group by role
            const roleMap = new Map<string, number>();
            applications.forEach((app) => {
                if (app.currentUser?.role) {
                    const roleName = app.currentUser.role.name;
                    roleMap.set(roleName, (roleMap.get(roleName) || 0) + 1);
                }
            });

            // Convert to array
            const result = Array.from(roleMap.entries()).map(([name, value]) => ({
                name,
                value,
            }));

            return result;
        } catch (error) {
            console.error('Error fetching role load:', error);
            // Return empty array instead of throwing
            return [];
        }
    }

    /**
     * Get application state distribution
     * Filters by state for ADMIN users, SUPER_ADMIN sees all states
     */
    async getApplicationStates(
        fromDate?: string,
        toDate?: string,
        stateId?: number,
        roleCode?: string,
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

            // State-based filtering for ADMIN (SUPER_ADMIN bypasses this)
            // Filter by permanent address state since applications don't have direct stateId
            if (stateId && roleCode !== ROLE_CODES.SUPER_ADMIN) {
                where.permanentAddress = {
                    stateId: stateId
                };
            }

            // Get all applications with their status
            const applications = await prisma.freshLicenseApplicationPersonalDetails.findMany({
                where,
                select: {
                    id: true,
                    isApproved: true,
                    isRejected: true,
                    isPending: true,
                },
            });

            // Calculate state counts
            const stateMap = {
                approved: 0,
                rejected: 0,
                pending: 0,
            };

            applications.forEach((app) => {
                if (app.isApproved) {
                    stateMap.approved++;
                } else if (app.isRejected) {
                    stateMap.rejected++;
                } else {
                    stateMap.pending++;
                }
            });

            // Convert to array
            const result = Object.entries(stateMap).map(([state, count]) => ({
                state,
                count,
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
     * SUPER_ADMIN sees all activities, ADMIN sees only activities from their assigned state
     */
    async getAdminActivities(
        fromDate?: string,
        toDate?: string,
        userId?: number,
        roleId?: number,
        stateId?: number,
        roleCode?: string,
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

            // State-based filtering for ADMIN (SUPER_ADMIN bypasses this)
            // Filter applications by permanent address state to ensure admin only sees activities from their state
            if (stateId && roleCode !== ROLE_CODES.SUPER_ADMIN) {
                where.application = {
                    permanentAddress: {
                        stateId: stateId
                    }
                };
            } else {
            }

            // Fetch workflow history (admin actions) with application details
            // Also filter by applications assigned to the logged-in user if no direct workflow match
            const workflows = await prisma.freshLicenseApplicationsFormWorkflowHistories.findMany({
                where,
                select: {
                    id: true,
                    createdAt: true,
                    applicationId: true,
                    actionTaken: true,
                    nextRole: {
                        select: {
                            code: true,
                            name: true,
                        },
                    },
                    nextUser: {
                        select: {
                            username: true,
                        },
                    },
                    application: {
                        select: {
                            almsLicenseId: true,
                            firstName: true,
                            middleName: true,
                            lastName: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                take: 100,
            });

            // Group by user and take only the 2 most recent entries for each user
            const userActivitiesMap = new Map<string, any[]>();

            workflows.forEach((workflow) => {
                const user = workflow.nextUser?.username || workflow.nextRole?.code || 'Unknown';
                
                if (!userActivitiesMap.has(user)) {
                    userActivitiesMap.set(user, []);
                }

                const userActivities = userActivitiesMap.get(user);
                
                // Only add if we have less than 2 entries for this user
                if (userActivities && userActivities.length < 2) {
                    userActivities.push(workflow);
                }
            });

            // Flatten the map and format the results
            const result: AdminActivityDto[] = [];
            
            userActivitiesMap.forEach((activities) => {
                activities.forEach((workflow) => {
                    // Construct applicant name
                    const applicantName = [
                        workflow.application?.firstName,
                        workflow.application?.middleName,
                        workflow.application?.lastName,
                    ]
                        .filter(Boolean)
                        .join(' ') || 'N/A';

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
                        almsLicenseId: workflow.application?.almsLicenseId || undefined,
                        applicantName,
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
     * Filters by state for ADMIN users, SUPER_ADMIN sees all states
     */
    async getApplicationsDetails(status?: string, page?: number, limit?: number, q?: string, sort?: string, stateId?: number, roleCode?: string): Promise<{data: ApplicationRecordDto[]; total: number; page?: number; limit?: number}> {
        try {
            const where: any = {};

            // State-based filtering for ADMIN (SUPER_ADMIN bypasses this)
            // Filter by permanent address state since applications don't have direct stateId
            if (stateId && roleCode !== ROLE_CODES.SUPER_ADMIN) {
                where.permanentAddress = {
                    stateId: stateId
                };
            }

            if (status) {
                const s = String(status).toUpperCase();
                if (s === 'APPROVED') {
                    where.isApproved = true;
                } else if (s === 'REJECTED') {
                    where.isRejected = true;
                } else if (s === 'PENDING') {
                    where.isPending = true;
                }
            }

            // Apply text search if provided (search almsLicenseId or currentUser.username)
            if (q) {
                const qStr = String(q);
                // search license id or currentUser.username
                where.OR = [
                    { almsLicenseId: { contains: qStr, mode: 'insensitive' } },
                    { currentUser: { is: { username: { contains: qStr, mode: 'insensitive' } } } },
                ];
            }

            // Total matching records
            const total = await prisma.freshLicenseApplicationPersonalDetails.count({ where });

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

            // Fetch matching applications with related personal fields (name parts) and workflow
            const applications = await prisma.freshLicenseApplicationPersonalDetails.findMany({
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
            });

            const now = Date.now();

            const data: any[] = applications.map((app) => {
                const latest = app.workflowHistories && app.workflowHistories[0];
                const actionDate = latest?.createdAt ? new Date(latest.createdAt) : app.updatedAt ? new Date(app.updatedAt) : new Date(app.createdAt);
                const actionTakenAt = actionDate ? actionDate.toISOString() : null;
                const daysTillToday = actionDate ? Math.floor((now - actionDate.getTime()) / (24 * 60 * 60 * 1000)) : null;

                const statusStr = app.isApproved ? 'APPROVED' : app.isRejected ? 'REJECTED' : 'PENDING';

                const applicantName = [app.firstName, app.middleName, app.lastName].filter(Boolean).join(' ').trim();

                return {
                    applicationId: app.id,
                    licenseId: app.almsLicenseId || null,
                    applicantName: applicantName || null,
                    applicantType: app.filledBy || null,
                    currentUser: app.currentUser ? { id: app.currentUser.id, name: app.currentUser.username } : null,
                    status: statusStr,
                    actionTakenAt,
                    daysTillToday,
                    createdAt: app.createdAt,
                    updatedAt: app.updatedAt,
                };
            });

            return { data, total, page: pageNum, limit: take };
        } catch (error) {
            console.error('Error fetching applications details:', error);
            return { data: [], total: 0 };
        }
    }
}
