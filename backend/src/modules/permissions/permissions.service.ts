import { Injectable, BadRequestException } from '@nestjs/common';
import prisma from '../../db/prismaClient';
import { Permissions } from '@prisma/client';

interface GetPermissionsParams {
  search?: string;
  category?: string;
}

export interface PermissionWithRoles extends Permissions {
  assignedRoles: string[];
}

@Injectable()
export class PermissionsService {
  /**
   * A permission's "assigned roles" isn't a relation — Roles.permissions is a
   * free-form JSON flag map (see roles.controller.ts) — so we compute it by
   * scanning every role's permissions blob for `key: true`.
   */
  private async attachAssignedRoles(permissions: Permissions[]): Promise<PermissionWithRoles[]> {
    if (permissions.length === 0) return [];

    const roles = await prisma.roles.findMany({ select: { code: true, permissions: true } });

    return permissions.map((permission) => {
      const assignedRoles = roles
        .filter((role: { code: string; permissions: any }) => {
          const flags = role.permissions;
          return flags && typeof flags === 'object' && flags[permission.key] === true;
        })
        .map((role: { code: string }) => role.code);

      return { ...permission, assignedRoles };
    });
  }

  async getPermissions(params: GetPermissionsParams): Promise<PermissionWithRoles[]> {
    const { search, category } = params;

    const where: any = {};
    if (search) {
      where.OR = [
        { key: { contains: search, mode: 'insensitive' } },
        { label: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (category) {
      where.category = category;
    }

    const permissions = await prisma.permissions.findMany({
      where,
      orderBy: [{ category: 'asc' }, { label: 'asc' }],
    });

    return this.attachAssignedRoles(permissions);
  }

  async getPermissionById(id: number): Promise<PermissionWithRoles | null> {
    const permission = await prisma.permissions.findUnique({ where: { id } });
    if (!permission) return null;
    const [withRoles] = await this.attachAssignedRoles([permission]);
    return withRoles;
  }

  async createPermission(data: { key: string; label: string; category: string; description?: string }): Promise<Permissions> {
    const { key, label, category, description } = data;

    if (!key || !label || !category) {
      throw new BadRequestException('key, label, and category are required');
    }

    const existing = await prisma.permissions.findUnique({ where: { key } });
    if (existing) {
      throw new BadRequestException(`Permission with key "${key}" already exists`);
    }

    return prisma.permissions.create({
      data: { key, label, category, description },
    });
  }

  async updatePermission(id: number, data: { key?: string; label?: string; category?: string; description?: string; isActive?: boolean }): Promise<Permissions> {
    const existing = await prisma.permissions.findUnique({ where: { id } });
    if (!existing) {
      throw new BadRequestException('Permission not found');
    }

    if (data.key && data.key !== existing.key) {
      const duplicate = await prisma.permissions.findUnique({ where: { key: data.key } });
      if (duplicate) {
        throw new BadRequestException(`Permission with key "${data.key}" already exists`);
      }
    }

    return prisma.permissions.update({
      where: { id },
      data,
    });
  }

  async deletePermission(id: number): Promise<Permissions> {
    const existing = await prisma.permissions.findUnique({ where: { id } });
    if (!existing) {
      throw new BadRequestException('Permission not found');
    }

    return prisma.permissions.delete({ where: { id } });
  }
}
