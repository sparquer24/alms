import { Injectable } from '@nestjs/common';
import prisma from '../../db/prismaClient';
import { ApplicationsDataDto, RoleLoadDataDto, StateDataDto, AdminActivityDto } from './dto/analytics.dto';
import { getISOWeek, getISOWeekYear, parseISO, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';

@Injectable()
export class AnalyticsService {
    /**
     * Get applications aggregated by ISO week
     */
    async getApplicationsByWeek(
        fromDate?: string,
        toDate?: string,
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
     */
    async getRoleLoad(
        fromDate?: string,
        toDate?: string,
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
     */
    async getApplicationStates(
        fromDate?: string,
        toDate?: string,
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
     */
    async getAdminActivities(
        fromDate?: string,
        toDate?: string,
        userId?: number,
        roleId?: number,
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

            // Filter by logged-in admin's state
            // Show activities where the admin is either the previous user, next user, or has the same role
            if (userId || roleId) {
                where.OR = [];
                if (userId) {
                    where.OR.push(
                        { nextUserId: userId },
                        { previousUserId: userId }
                    );
                }
                if (roleId) {
                    where.OR.push(
                        { nextRoleId: roleId },
                        { previousRoleId: roleId }
                    );
                }
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
}
