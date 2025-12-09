import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateFlowMappingDto, UpdateFlowMappingDto, ValidateFlowMappingDto } from './dto/flow-mapping.dto';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class FlowMappingService {
    private prisma = new PrismaClient();

    /**
     * Get flow mapping for a specific role
     */
    async getFlowMapping(roleId: number) {
        // Verify role exists
        const role = await this.prisma.roles.findUnique({
            where: { id: roleId },
        });

        if (!role) {
            throw new NotFoundException(`Role with ID ${roleId} not found`);
        }

        // Get or create flow mapping
        let flowMapping = await this.prisma.roleFlowMapping.findUnique({
            where: { currentRoleId: roleId },
            include: {
                currentRole: true,
                updatedByUser: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                    },
                },
            },
        });

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
     * Create or update flow mapping with circular dependency validation
     */
    async createOrUpdateFlowMapping(
        currentRoleId: number,
        data: CreateFlowMappingDto | UpdateFlowMappingDto,
        updatedBy?: number,
    ) {
        // Verify current role exists
        const currentRole = await this.prisma.roles.findUnique({
            where: { id: currentRoleId },
        });

        if (!currentRole) {
            throw new NotFoundException(`Current role with ID ${currentRoleId} not found`);
        }

        // Verify all next roles exist
        const nextRolesCheck = await this.prisma.roles.findMany({
            where: { id: { in: data.nextRoleIds } },
        });

        if (nextRolesCheck.length !== data.nextRoleIds.length) {
            const foundIds = nextRolesCheck.map(r => r.id);
            const invalidIds = data.nextRoleIds.filter(id => !foundIds.includes(id));
            throw new BadRequestException(`Invalid role IDs: ${invalidIds.join(', ')}`);
        }

        // Validate for circular dependencies
        const circularity = await this.detectCircularDependency(currentRoleId, data.nextRoleIds);
        if (circularity.hasCircle) {
            throw new BadRequestException(
                `Circular workflow detected: ${circularity.circlePath}. Cannot create mapping that causes circular workflow.`,
            );
        }

        // Create or update mapping
        const flowMapping = await this.prisma.roleFlowMapping.upsert({
            where: { currentRoleId },
            create: {
                currentRoleId,
                nextRoleIds: data.nextRoleIds,
                updatedBy,
            },
            update: {
                nextRoleIds: data.nextRoleIds,
                updatedBy: updatedBy || undefined,
                updatedAt: new Date(),
            },
            include: {
                currentRole: true,
                updatedByUser: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                    },
                },
            },
        });

        return flowMapping;
    }

    /**
     * Validate flow mapping for circular dependencies
     */
    async validateFlowMapping(data: ValidateFlowMappingDto) {
        const { currentRoleId, nextRoleIds } = data;

        // Verify current role exists
        const currentRole = await this.prisma.roles.findUnique({
            where: { id: currentRoleId },
        });

        if (!currentRole) {
            throw new NotFoundException(`Current role with ID ${currentRoleId} not found`);
        }

        // Verify all next roles exist
        const nextRolesCheck = await this.prisma.roles.findMany({
            where: { id: { in: nextRoleIds } },
        });

        if (nextRolesCheck.length !== nextRoleIds.length) {
            const foundIds = nextRolesCheck.map(r => r.id);
            const invalidIds = nextRoleIds.filter(id => !foundIds.includes(id));
            throw new BadRequestException(`Invalid role IDs: ${invalidIds.join(', ')}`);
        }

        // Detect circular dependency
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
     * Detect circular dependencies in workflow
     * Algorithm: DFS to find if there's a path from any nextRole back to currentRole
     */
    private async detectCircularDependency(
        currentRoleId: number,
        nextRoleIds: number[],
    ): Promise<{
        hasCircle: boolean;
        circlePath: string | null;
    }> {
        // Get all existing mappings
        const allMappings = await this.prisma.roleFlowMapping.findMany({
            select: { currentRoleId: true, nextRoleIds: true },
        });

        // Create adjacency map
        const adjacencyMap = new Map<number, number[]>();
        allMappings.forEach(mapping => {
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
    async getAllFlowMappings() {
        return this.prisma.roleFlowMapping.findMany({
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
    async deleteFlowMapping(roleId: number) {
        const flowMapping = await this.prisma.roleFlowMapping.findUnique({
            where: { currentRoleId: roleId },
        });

        if (!flowMapping) {
            throw new NotFoundException(`Flow mapping for role ID ${roleId} not found`);
        }

        return this.prisma.roleFlowMapping.delete({
            where: { currentRoleId: roleId },
        });
    }

    /**
     * Get next roles for a given role
     * This is useful for checking what roles can receive applications from a given role
     */
    async getNextRoles(roleId: number) {
        const flowMapping = await this.prisma.roleFlowMapping.findUnique({
            where: { currentRoleId: roleId },
            include: {
                currentRole: true,
            },
        });

        if (!flowMapping) {
            return {
                currentRoleId: roleId,
                nextRoles: [],
            };
        }

        // Get role details for next roles
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
     * Duplicate flow mapping from one role to another
     */
    async duplicateFlowMapping(sourceRoleId: number, targetRoleId: number, updatedBy?: number) {
        // Get source mapping
        const sourceMapping = await this.prisma.roleFlowMapping.findUnique({
            where: { currentRoleId: sourceRoleId },
        });

        if (!sourceMapping) {
            throw new NotFoundException(`Flow mapping for source role ID ${sourceRoleId} not found`);
        }

        // Validate target role exists
        const targetRole = await this.prisma.roles.findUnique({
            where: { id: targetRoleId },
        });

        if (!targetRole) {
            throw new NotFoundException(`Target role with ID ${targetRoleId} not found`);
        }

        // Check for circular dependencies with new mapping
        const circularity = await this.detectCircularDependency(
            targetRoleId,
            sourceMapping.nextRoleIds,
        );
        if (circularity.hasCircle) {
            throw new BadRequestException(
                `Cannot duplicate mapping: circular workflow detected - ${circularity.circlePath}`,
            );
        }

        // Create or update mapping for target role
        return this.prisma.roleFlowMapping.upsert({
            where: { currentRoleId: targetRoleId },
            create: {
                currentRoleId: targetRoleId,
                nextRoleIds: sourceMapping.nextRoleIds,
                updatedBy,
            },
            update: {
                nextRoleIds: sourceMapping.nextRoleIds,
                updatedBy: updatedBy || undefined,
                updatedAt: new Date(),
            },
            include: {
                currentRole: true,
                updatedByUser: {
                    select: { id: true, username: true, email: true },
                },
            },
        });
    }

    /**
     * Reset flow mapping (remove all next role mappings)
     */
    async resetFlowMapping(roleId: number) {
        const flowMapping = await this.prisma.roleFlowMapping.findUnique({
            where: { currentRoleId: roleId },
        });

        if (!flowMapping) {
            throw new NotFoundException(`Flow mapping for role ID ${roleId} not found`);
        }

        return this.prisma.roleFlowMapping.update({
            where: { currentRoleId: roleId },
            data: {
                nextRoleIds: [],
                updatedAt: new Date(),
            },
            include: {
                currentRole: true,
                updatedByUser: {
                    select: { id: true, username: true, email: true },
                },
            },
        });
    }
}
