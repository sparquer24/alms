import { Injectable, BadRequestException } from '@nestjs/common';
import prisma from '../../db/prismaClient';
import { Roles } from '@prisma/client';

interface GetRolesParams {
    id?: number;
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class RolesService {
    /**
     * Generate a URL-friendly slug from a string
     */
    private generateSlug(text: string): string {
        return text
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_]+/g, '_')
            .replace(/^-+|-+$/g, '');
    }

    /**
     * Get roles with advanced filtering and pagination
     */
    async getRoles(params: GetRolesParams): Promise<{ data: Roles[]; total: number; page: number; limit: number }> {
        const {
            id,
            search,
            status,
            page = 1,
            limit = 10,
            sortBy = 'created_at',
            sortOrder = 'desc',
        } = params;

        const where: any = {};

        if (id) {
            where.id = Number(id);
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (status === 'active') {
            where.is_active = true;
        } else if (status === 'inactive') {
            where.is_active = false;
        }

        try {
            const skip = (page - 1) * limit;
            const validSortFields = ['name', 'code', 'created_at', 'updated_at', 'is_active'];
            const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
            const sortDir = sortOrder === 'asc' ? 'asc' : 'desc';

            const [roles, total] = await Promise.all([
                prisma.roles.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: {
                        [sortField]: sortDir,
                    },
                }),
                prisma.roles.count({ where }),
            ]);

            return {
                data: roles,
                total,
                page,
                limit,
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get a single role by ID
     */
    async getRoleById(id: number): Promise<Roles | null> {
        try {
            return await prisma.roles.findUnique({
                where: { id },
            });
        } catch (error) {
            throw error;
        }
    }

    /**
     * Create a new role
     */
    async createRole(roleData: any): Promise<Roles> {
        try {
            const { name, code, dashboard_title, description, ...rest } = roleData;

            if (!name || !dashboard_title) {
                throw new BadRequestException('Name and dashboard_title are required');
            }

            // Generate code/slug from name if not provided
            const roleCode = code || this.generateSlug(name);

            // Check if code already exists
            const existingRole = await prisma.roles.findUnique({
                where: { code: roleCode },
            });

            if (existingRole) {
                throw new BadRequestException(`Role with code "${roleCode}" already exists`);
            }

            return await prisma.roles.create({
                data: {
                    name,
                    code: roleCode,
                    dashboard_title,
                    description: description || null,
                    ...rest,
                },
            });
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update an existing role
     */
    async updateRole(id: number, roleData: any): Promise<Roles> {
        try {
            const existing = await prisma.roles.findUnique({
                where: { id },
            });

            if (!existing) {
                throw new BadRequestException('Role not found');
            }

            const { code, name, dashboard_title, ...rest } = roleData;

            // If code is being changed, check for uniqueness
            if (code && code !== existing.code) {
                const duplicate = await prisma.roles.findUnique({
                    where: { code },
                });
                if (duplicate) {
                    throw new BadRequestException(`Role with code "${code}" already exists`);
                }
            }

            // If name is being changed, generate new code if code not explicitly provided
            let finalCode = code;
            if (name && !code && name !== existing.name) {
                finalCode = this.generateSlug(name);
                const duplicate = await prisma.roles.findUnique({
                    where: { code: finalCode },
                });
                if (duplicate && duplicate.id !== id) {
                    throw new BadRequestException(`Role with code "${finalCode}" already exists`);
                }
            }

            return await prisma.roles.update({
                where: { id },
                data: {
                    ...(name && { name }),
                    ...(finalCode && { code: finalCode }),
                    ...(dashboard_title && { dashboard_title }),
                    ...rest,
                },
            });
        } catch (error) {
            throw error;
        }
    }

    /**
     * Soft-delete a role (set is_active to false)
     */
    async deleteRole(id: number): Promise<Roles> {
        try {
            const existing = await prisma.roles.findUnique({
                where: { id },
            });

            if (!existing) {
                throw new BadRequestException('Role not found');
            }

            return await prisma.roles.update({
                where: { id },
                data: { is_active: false },
            });
        } catch (error) {
            throw error;
        }
    }

    /**
     * Deactivate a role
     */
    async deactivateRole(id: number): Promise<Roles> {
        try {
            const existing = await prisma.roles.findUnique({
                where: { id },
            });

            if (!existing) {
                throw new BadRequestException('Role not found');
            }

            return await prisma.roles.update({
                where: { id },
                data: { is_active: false },
            });
        } catch (error) {
            throw error;
        }
    }

    /**
     * Activate a role
     */
    async activateRole(id: number): Promise<Roles> {
        try {
            const existing = await prisma.roles.findUnique({
                where: { id },
            });

            if (!existing) {
                throw new BadRequestException('Role not found');
            }

            return await prisma.roles.update({
                where: { id },
                data: { is_active: true },
            });
        } catch (error) {
            throw error;
        }
    }
}