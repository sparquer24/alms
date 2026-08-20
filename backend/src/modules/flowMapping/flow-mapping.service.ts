import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateFlowMappingDto, UpdateFlowMappingDto, ValidateFlowMappingDto } from './dto/flow-mapping.dto';
import { RoleFlowMapping, RoleFlowApplicationType } from '@prisma/client';
import prisma from '../../db/prismaClient';
import { FlowMappingContext, normalizeApplicationType } from '../../constants/flow-mapping';

@Injectable()
export class FlowMappingService {
    /**
     * Build the shared RoleFlowMapping filter for an application-type + location context.
     * `currentRoleId` is optional so the same filter can be reused for whole-table queries.
     */
    private flowMappingWhere(
        currentRoleId: number | undefined,
        applicationType: RoleFlowApplicationType,
        stateId: number | null,
        districtId: number | null,
    ) {
        return {
            ...(currentRoleId !== undefined ? { currentRoleId } : {}),
            applicationType,
            purpose: 'ALL' as const,
            stateId,
            districtId,
        };
    }

    /** Include shape used when returning a saved/updated mapping with audit info. */
    private mappingInclude() {
        return {
            currentRole: true,
            updatedByUser: {
                select: { id: true, username: true, email: true },
            },
        };
    }

    /**
     * Find the flow mapping for a role within an application-type + location context.
     */
    private async findFlowMapping(
        currentRoleId: number,
        applicationType: RoleFlowApplicationType,
        stateId: number | null,
        districtId: number | null,
        include?: object,
    ) {
        return prisma.roleFlowMapping.findFirst({
            where: this.flowMappingWhere(currentRoleId, applicationType, stateId, districtId),
            ...(include ? { include } : {}),
        });
    }

    /**
     * Create or update the mapping for a role within an application-type + location context.
     */
    private async upsertFlowMapping(
        currentRoleId: number,
        applicationType: RoleFlowApplicationType,
        stateId: number | null,
        districtId: number | null,
        nextRoleIds: number[],
        updatedBy?: number,
    ) {
        const existing = await this.findFlowMapping(currentRoleId, applicationType, stateId, districtId);

        if (existing) {
            return prisma.roleFlowMapping.update({
                where: { id: existing.id },
                data: {
                    nextRoleIds,
                    updatedBy: updatedBy || undefined,
                    updatedAt: new Date(),
                },
                include: this.mappingInclude(),
            });
        }

        return prisma.roleFlowMapping.create({
            data: {
                currentRoleId,
                applicationType,
                purpose: 'ALL',
                stateId,
                districtId,
                nextRoleIds,
                updatedBy,
            },
            include: this.mappingInclude(),
        });
    }

    /**
     * Get flow mapping for a specific role
     */
    async getFlowMapping(roleId: number, context: FlowMappingContext = {}) {
        const appType = normalizeApplicationType(context.applicationType);
        const stateId = context.stateId ?? null;
        const districtId = context.districtId ?? null;

        // Verify role exists
        const role = await prisma.roles.findUnique({
            where: { id: roleId },
        });

        if (!role) {
            throw new NotFoundException(`Role with ID ${roleId} not found`);
        }

        const flowMapping = await this.findFlowMapping(roleId, appType, stateId, districtId, this.mappingInclude());

        // If no mapping exists, return empty response with role info
        if (!flowMapping) {
            return {
                id: null,
                currentRoleId: roleId,
                currentRole: role,
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
     * Create or update flow mapping.
     * Circular dependencies are allowed and do not block saving.
     */
    async createOrUpdateFlowMapping(
        currentRoleId: number,
        data: CreateFlowMappingDto | UpdateFlowMappingDto,
        updatedBy?: number,
    ) {
        const appType = normalizeApplicationType(data.applicationType);
        const stateId = data.stateId ?? null;
        const districtId = data.districtId ?? null;

        // Verify current role exists
        const currentRole = await prisma.roles.findUnique({
            where: { id: currentRoleId },
        });

        if (!currentRole) {
            throw new NotFoundException(`Current role with ID ${currentRoleId} not found`);
        }

        // Verify all next roles exist
        const nextRolesCheck = await prisma.roles.findMany({
            where: { id: { in: data.nextRoleIds } },
        });

        if (nextRolesCheck.length !== data.nextRoleIds.length) {
            const foundIds = nextRolesCheck.map((r) => r.id);
            const invalidIds = data.nextRoleIds.filter(id => !foundIds.includes(id));
            throw new BadRequestException(`Invalid role IDs: ${invalidIds.join(', ')}`);
        }

        // Reject direct self-reference (e.g. DCP → DCP). This is a plain
        // membership check — NOT detectCircularDependency() — so circular
        // paths between DIFFERENT roles remain allowed.
        if (data.nextRoleIds.includes(currentRoleId)) {
            throw new BadRequestException(
                `A role cannot map to itself as a next role (roleId ${currentRoleId}). Direct self-reference is not allowed.`,
            );
        }

        // NOTE: Circular workflows are intentionally ALLOWED to save.
        // detectCircularDependency() is still available via validateFlowMapping()
        // as an advisory check; it no longer blocks the upsert here.

        return this.upsertFlowMapping(currentRoleId, appType, stateId, districtId, data.nextRoleIds, updatedBy);
    }

    /**
     * Validate flow mapping for circular dependencies
     */
    async validateFlowMapping(data: ValidateFlowMappingDto) {
        const { currentRoleId, nextRoleIds } = data;
        const appType = normalizeApplicationType(data.applicationType);
        const stateId = data.stateId ?? null;
        const districtId = data.districtId ?? null;

        // Verify current role exists
        const currentRole = await prisma.roles.findUnique({
            where: { id: currentRoleId },
        });

        if (!currentRole) {
            throw new NotFoundException(`Current role with ID ${currentRoleId} not found`);
        }

        // Verify all next roles exist
        const nextRolesCheck = await prisma.roles.findMany({
            where: { id: { in: nextRoleIds } },
        });

        if (nextRolesCheck.length !== nextRoleIds.length) {
            throw new NotFoundException(`One or more next roles IDs are invalid`);
        }

        if (nextRoleIds.includes(currentRoleId)) {
            throw new BadRequestException(`A roleIds cannot map to itself as the next role.`);
        }

        // Only detect circular dependency — DO NOT save anything here
        const circularity = await this.detectCircularDependency(
            currentRoleId,
            nextRoleIds,
            appType,
            stateId,
            districtId,
        );

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
     * Detect circular dependencies in workflow
     * Algorithm: DFS to find if there's a path from any nextRole back to currentRole
     */
    private async detectCircularDependency(
        currentRoleId: number,
        nextRoleIds: number[],
        applicationType: RoleFlowApplicationType = 'ALL',
        stateId: number | null = null,
        districtId: number | null = null,
    ): Promise<{
        hasCircle: boolean;
        circlePath: string | null;
    }> {
        // Get all existing mappings
        const allMappings = await prisma.roleFlowMapping.findMany({
            where: this.flowMappingWhere(undefined, applicationType, stateId, districtId),
            select: { currentRoleId: true, nextRoleIds: true },
        });

        // Create adjacency map
        const adjacencyMap = new Map<number, number[]>();
        allMappings.forEach((mapping: Pick<RoleFlowMapping, 'currentRoleId' | 'nextRoleIds'>) => {
            adjacencyMap.set(mapping.currentRoleId, mapping.nextRoleIds);
        });

        // Temporarily add the new mapping to check
        adjacencyMap.set(currentRoleId, nextRoleIds);

        // DFS to detect cycle
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
                    if (result.has) {
                        return result;
                    }
                } else if (recursionStack.has(neighbor)) {
                    // Cycle detected
                    const cycleStart = path.indexOf(neighbor);
                    const cycleEnd = path.length;
                    const circlePath = [...path.slice(cycleStart), neighbor].join(' → ');
                    return { has: true, path: [...path.slice(cycleStart), neighbor] };
                }
            }

            recursionStack.delete(node);
            return { has: false, path: [] };
        };

        // Check for cycles from current role
        const result = hasCycle(currentRoleId, []);

        if (result.has) {
            const circlePath = result.path.slice(1).join(' → ');
            return {
                hasCircle: true,
                circlePath,
            };
        }

        return {
            hasCircle: false,
            circlePath: null,
        };
    }

    /**
     * Get all flow mappings
     */
    async getAllFlowMappings(context: FlowMappingContext = {}) {
        const appType = normalizeApplicationType(context.applicationType);
        const stateId = context.stateId ?? null;
        const districtId = context.districtId ?? null;

        return prisma.roleFlowMapping.findMany({
            where: this.flowMappingWhere(undefined, appType, stateId, districtId),
            include: {
                currentRole: {
                    select: { id: true, name: true, code: true },
                },
                updatedByUser: {
                    select: { id: true, username: true, email: true },
                },
            },
            orderBy: { currentRoleId: 'asc' },
        });
    }

    /**
     * Delete flow mapping
     */
    async deleteFlowMapping(roleId: number, context: FlowMappingContext = {}) {
        const appType = normalizeApplicationType(context.applicationType);
        const stateId = context.stateId ?? null;
        const districtId = context.districtId ?? null;

        const flowMapping = await this.findFlowMapping(roleId, appType, stateId, districtId);

        if (!flowMapping) {
            throw new NotFoundException(`Flow mapping for role ID ${roleId} not found`);
        }

        return prisma.roleFlowMapping.delete({
            where: { id: flowMapping.id },
        });
    }

    /**
     * Get next roles for a given role
     * This is useful for checking what roles can receive applications from a given role
     */
    async getNextRoles(roleId: number, context: FlowMappingContext = {}) {
        const appType = normalizeApplicationType(context.applicationType);
        const stateId = context.stateId ?? null;
        const districtId = context.districtId ?? null;

        const flowMapping = await prisma.roleFlowMapping.findFirst({
            where: this.flowMappingWhere(roleId, appType, stateId, districtId),
            include: { currentRole: true },
        });

        if (!flowMapping) {
            return {
                currentRoleId: roleId,
                nextRoles: [],
            };
        }

        // Get role details for next roles
        const nextRoles = await prisma.roles.findMany({
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
     * Duplicate flow mapping from one role to another
     */
    async duplicateFlowMapping(
        sourceRoleId: number,
        targetRoleId: number,
        context: FlowMappingContext = {},
        updatedBy?: number,
    ) {
        const appType = normalizeApplicationType(context.applicationType);
        const stateId = context.stateId ?? null;
        const districtId = context.districtId ?? null;

        // Get source mapping
        const sourceMapping = await this.findFlowMapping(sourceRoleId, appType, stateId, districtId);

        if (!sourceMapping) {
            throw new NotFoundException(`Flow mapping for source role ID ${sourceRoleId} not found`);
        }

        // Validate target role exists
        const targetRole = await prisma.roles.findUnique({
            where: { id: targetRoleId },
        });

        if (!targetRole) {
            throw new NotFoundException(`Target role with ID ${targetRoleId} not found`);
        }

        // Reject direct self-reference (duplicating a mapping onto itself,
        // e.g. the source already maps to the target role → target → target).
        // Plain membership check — NOT detectCircularDependency() — so circular
        // paths between DIFFERENT roles remain allowed through duplication.
        if (sourceMapping.nextRoleIds.includes(targetRoleId)) {
            throw new BadRequestException(
                `Cannot duplicate mapping: target role ${targetRoleId} cannot be a next role of itself. Direct self-reference is not allowed.`,
            );
        }

        // NOTE: Circular workflows are intentionally ALLOWED through duplication.
        // detectCircularDependency() is still available via validateFlowMapping()
        // as an advisory check; it no longer blocks the upsert here.

        return this.upsertFlowMapping(targetRoleId, appType, stateId, districtId, sourceMapping.nextRoleIds, updatedBy);
    }

    /**
     * Reset flow mapping (remove all next role mappings)
     */
    async resetFlowMapping(roleId: number, context: FlowMappingContext = {}) {
        const appType = normalizeApplicationType(context.applicationType);
        const stateId = context.stateId ?? null;
        const districtId = context.districtId ?? null;

        const flowMapping = await this.findFlowMapping(roleId, appType, stateId, districtId);

        if (!flowMapping) {
            throw new NotFoundException(`Flow mapping for role ID ${roleId} not found`);
        }

        return prisma.roleFlowMapping.update({
            where: { id: flowMapping.id },
            data: {
                nextRoleIds: [],
                updatedAt: new Date(),
            },
            include: this.mappingInclude(),
        });
    }
}
