import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateFlowMappingDto, UpdateFlowMappingDto, ValidateFlowMappingDto } from './dto/flow-mapping.dto';
import { PrismaClient, Roles } from '@prisma/client';

@Injectable()
export class FlowMappingService {
    private prisma = new PrismaClient();

    private buildWhereClause(roleId: number, appTypeId?: number, categoryId?: number, workflowId?: number) {
        return {
            currentRoleId: roleId,
            ...(appTypeId !== undefined ? { applicationTypeId: appTypeId } : { applicationTypeId: null }),
            ...(categoryId !== undefined ? { categoryId: categoryId } : { categoryId: null }),
            ...(workflowId !== undefined ? { workflowId: workflowId } : { workflowId: null }),
        };
    }

    /**
     * Get flow mapping for a specific role with optional filters
     */
    async getFlowMapping(roleId: number, appTypeId?: number, categoryId?: number, workflowId?: number) {
        const role = await this.prisma.roles.findUnique({ where: { id: roleId } });
        if (!role) {
            throw new NotFoundException(`Role with ID ${roleId} not found`);
        }

        const where = this.buildWhereClause(roleId, appTypeId, categoryId, workflowId);
        const flowMapping = await this.prisma.roleFlowMapping.findFirst({
            where,
            include: {
                currentRole: true,
                applicationType: { select: { id: true, name: true, code: true } },
                category: { select: { id: true, name: true, code: true } },
                workflow: { select: { id: true, name: true, code: true } },
                updatedByUser: {
                    select: { id: true, username: true, email: true },
                },
            },
        });

        if (!flowMapping) {
            return {
                id: null,
                currentRoleId: roleId,
                currentRole: role,
                applicationTypeId: appTypeId || null,
                categoryId: categoryId || null,
                workflowId: workflowId || null,
                applicationType: null,
                category: null,
                workflow: null,
                nextRoleIds: [],
                updatedBy: null,
                updatedByUser: null,
                updatedAt: null,
                createdAt: null,
            };
        }

        return flowMapping;
    }

    /**
     * Create or update flow mapping
     */
    async createOrUpdateFlowMapping(
        currentRoleId: number,
        data: CreateFlowMappingDto | UpdateFlowMappingDto,
        updatedBy?: number,
    ) {
        const currentRole = await this.prisma.roles.findUnique({ where: { id: currentRoleId } });
        if (!currentRole) {
            throw new NotFoundException(`Current role with ID ${currentRoleId} not found`);
        }

        const nextRolesCheck = await this.prisma.roles.findMany({
            where: { id: { in: data.nextRoleIds } },
        });
        if (nextRolesCheck.length !== data.nextRoleIds.length) {
            const foundIds = nextRolesCheck.map((r: Roles) => r.id);
            const invalidIds = data.nextRoleIds.filter(id => !foundIds.includes(id));
            throw new BadRequestException(`Invalid role IDs: ${invalidIds.join(', ')}`);
        }

        const appTypeId = 'applicationTypeId' in data ? data.applicationTypeId : undefined;
        const categoryId = 'categoryId' in data ? data.categoryId : undefined;
        const workflowId = 'workflowId' in data ? data.workflowId : undefined;

        const circularity = await this.detectCircularDependency(currentRoleId, data.nextRoleIds);
        if (circularity.hasCircle) {
            throw new BadRequestException(
                `Circular workflow detected: ${circularity.circlePath}. Cannot create mapping that causes circular workflow.`,
            );
        }

        const where = this.buildWhereClause(currentRoleId, appTypeId, categoryId, workflowId);
        const existing = await this.prisma.roleFlowMapping.findFirst({ where });

        if (existing) {
            return this.prisma.roleFlowMapping.update({
                where: { id: existing.id },
                data: {
                    nextRoleIds: data.nextRoleIds,
                    updatedBy: updatedBy || undefined,
                    updatedAt: new Date(),
                },
                include: {
                    currentRole: true,
                    applicationType: { select: { id: true, name: true, code: true } },
                    category: { select: { id: true, name: true, code: true } },
                    workflow: { select: { id: true, name: true, code: true } },
                    updatedByUser: { select: { id: true, username: true, email: true } },
                },
            });
        }

        return this.prisma.roleFlowMapping.create({
            data: {
                currentRoleId,
                nextRoleIds: data.nextRoleIds,
                updatedBy,
                applicationTypeId: appTypeId ?? null,
                categoryId: categoryId ?? null,
                workflowId: workflowId ?? null,
            },
            include: {
                currentRole: true,
                applicationType: { select: { id: true, name: true, code: true } },
                category: { select: { id: true, name: true, code: true } },
                workflow: { select: { id: true, name: true, code: true } },
                updatedByUser: { select: { id: true, username: true, email: true } },
            },
        });
    }

    /**
     * Validate flow mapping
     */
    async validateFlowMapping(data: ValidateFlowMappingDto) {
        const { currentRoleId, nextRoleIds } = data;
        const currentRole = await this.prisma.roles.findUnique({ where: { id: currentRoleId } });
        if (!currentRole) {
            throw new NotFoundException(`Current role with ID ${currentRoleId} not found`);
        }

        const nextRolesCheck = await this.prisma.roles.findMany({
            where: { id: { in: nextRoleIds } },
        });
        if (nextRolesCheck.length !== nextRoleIds.length) {
            throw new NotFoundException(`One or more next roles IDs are invalid`);
        }
        if (nextRoleIds.includes(currentRoleId)) {
            throw new BadRequestException(`A role cannot map to itself as the next role.`);
        }

        const circularity = await this.detectCircularDependency(currentRoleId, nextRoleIds);
        return {
            isValid: !circularity.hasCircle,
            hasCircularDependency: circularity.hasCircle,
            circlePath: circularity.circlePath || null,
            message: circularity.hasCircle
                ? `Circular workflow detected: ${circularity.circlePath}`
                : 'Flow mapping is valid',
        };
    }

    /**
     * Detect circular dependencies
     */
    private async detectCircularDependency(
        currentRoleId: number,
        nextRoleIds: number[],
    ): Promise<{ hasCircle: boolean; circlePath: string | null }> {
        const allMappings = await this.prisma.roleFlowMapping.findMany({
            select: { currentRoleId: true, nextRoleIds: true },
        });

        const adjacencyMap = new Map<number, number[]>();
        allMappings.forEach(mapping => {
            adjacencyMap.set(mapping.currentRoleId, mapping.nextRoleIds);
        });
        adjacencyMap.set(currentRoleId, nextRoleIds);

        const visited = new Set<number>();
        const recursionStack = new Set<number>();

        const hasCycle = (node: number, path: number[]): { has: boolean; path: number[] } => {
            visited.add(node);
            recursionStack.add(node);
            path.push(node);

            const neighbors = adjacencyMap.get(node) || [];
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    const result = hasCycle(neighbor, [...path]);
                    if (result.has) return result;
                } else if (recursionStack.has(neighbor)) {
                    const cycleStart = path.indexOf(neighbor);
                    return { has: true, path: [...path.slice(cycleStart), neighbor] };
                }
            }

            recursionStack.delete(node);
            return { has: false, path: [] };
        };

        const result = hasCycle(currentRoleId, []);
        if (result.has) {
            return { hasCircle: true, circlePath: result.path.slice(1).join(' → ') };
        }
        return { hasCircle: false, circlePath: null };
    }

    /**
     * Get all flow mappings
     */
    async getAllFlowMappings() {
        return this.prisma.roleFlowMapping.findMany({
            include: {
                currentRole: { select: { id: true, name: true, code: true } },
                applicationType: { select: { id: true, name: true, code: true } },
                category: { select: { id: true, name: true, code: true } },
                workflow: { select: { id: true, name: true, code: true } },
                updatedByUser: { select: { id: true, username: true, email: true } },
            },
            orderBy: { currentRoleId: 'asc' },
        });
    }

    /**
     * Delete flow mapping
     */
    async deleteFlowMapping(roleId: number, appTypeId?: number, categoryId?: number, workflowId?: number) {
        const where = this.buildWhereClause(roleId, appTypeId, categoryId, workflowId);
        const flowMapping = await this.prisma.roleFlowMapping.findFirst({ where });
        if (!flowMapping) {
            throw new NotFoundException(`Flow mapping for role ID ${roleId} not found`);
        }
        return this.prisma.roleFlowMapping.delete({ where: { id: flowMapping.id } });
    }

    /**
     * Get next roles for a given role (with optional filters)
     */
    async getNextRoles(roleId: number, appTypeId?: number, categoryId?: number, workflowId?: number) {
        const where = this.buildWhereClause(roleId, appTypeId, categoryId, workflowId);
        const flowMapping = await this.prisma.roleFlowMapping.findFirst({
            where,
            include: { currentRole: true },
        });

        if (!flowMapping) {
            return { currentRoleId: roleId, nextRoles: [] };
        }

        const nextRoles = await this.prisma.roles.findMany({
            where: { id: { in: flowMapping.nextRoleIds } },
            select: { id: true, name: true, code: true },
        });

        return {
            currentRoleId: roleId,
            currentRoleName: flowMapping.currentRole.name,
            nextRoles,
        };
    }

    /**
     * Duplicate flow mapping
     */
    async duplicateFlowMapping(sourceRoleId: number, targetRoleId: number, updatedBy?: number,
        appTypeId?: number, categoryId?: number, workflowId?: number) {
        const sourceWhere = this.buildWhereClause(sourceRoleId, appTypeId, categoryId, workflowId);
        const sourceMapping = await this.prisma.roleFlowMapping.findFirst({ where: sourceWhere });
        if (!sourceMapping) {
            throw new NotFoundException(`Flow mapping for source role ID ${sourceRoleId} not found`);
        }

        const targetRole = await this.prisma.roles.findUnique({ where: { id: targetRoleId } });
        if (!targetRole) {
            throw new NotFoundException(`Target role with ID ${targetRoleId} not found`);
        }

        const circularity = await this.detectCircularDependency(targetRoleId, sourceMapping.nextRoleIds);
        if (circularity.hasCircle) {
            throw new BadRequestException(`Cannot duplicate mapping: circular workflow detected - ${circularity.circlePath}`);
        }

        const targetWhere = this.buildWhereClause(targetRoleId, appTypeId, categoryId, workflowId);
        const existing = await this.prisma.roleFlowMapping.findFirst({ where: targetWhere });

        if (existing) {
            return this.prisma.roleFlowMapping.update({
                where: { id: existing.id },
                data: {
                    nextRoleIds: sourceMapping.nextRoleIds,
                    updatedBy: updatedBy || undefined,
                    updatedAt: new Date(),
                },
                include: {
                    currentRole: true,
                    applicationType: { select: { id: true, name: true, code: true } },
                    category: { select: { id: true, name: true, code: true } },
                    workflow: { select: { id: true, name: true, code: true } },
                    updatedByUser: { select: { id: true, username: true, email: true } },
                },
            });
        }

        return this.prisma.roleFlowMapping.create({
            data: {
                currentRoleId: targetRoleId,
                nextRoleIds: sourceMapping.nextRoleIds,
                updatedBy,
                applicationTypeId: appTypeId ?? null,
                categoryId: categoryId ?? null,
                workflowId: workflowId ?? null,
            },
            include: {
                currentRole: true,
                applicationType: { select: { id: true, name: true, code: true } },
                category: { select: { id: true, name: true, code: true } },
                workflow: { select: { id: true, name: true, code: true } },
                updatedByUser: { select: { id: true, username: true, email: true } },
            },
        });
    }

    /**
     * Reset flow mapping
     */
    async resetFlowMapping(roleId: number, appTypeId?: number, categoryId?: number, workflowId?: number) {
        const where = this.buildWhereClause(roleId, appTypeId, categoryId, workflowId);
        const flowMapping = await this.prisma.roleFlowMapping.findFirst({ where });
        if (!flowMapping) {
            throw new NotFoundException(`Flow mapping for role ID ${roleId} not found`);
        }
        return this.prisma.roleFlowMapping.update({
            where: { id: flowMapping.id },
            data: { nextRoleIds: [], updatedAt: new Date() },
            include: {
                currentRole: true,
                applicationType: { select: { id: true, name: true, code: true } },
                category: { select: { id: true, name: true, code: true } },
                workflow: { select: { id: true, name: true, code: true } },
                updatedByUser: { select: { id: true, username: true, email: true } },
            },
        });
    }
}
