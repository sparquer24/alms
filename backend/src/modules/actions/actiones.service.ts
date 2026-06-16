import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import prisma from '../../db/prismaClient';
import { Actiones, RolesActionsMapping } from '@prisma/client';
import { ACTION_CODES } from '../../constants/workflow-actions';

@Injectable()
export class ActionesService {
  async getActiones(userId?: number, applicationId?: number): Promise<Actiones[]> {
    try {
      if (userId === undefined || userId === null) {
        return prisma.actiones.findMany({ where: { isActive: true } });
      }
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: { id: true, roleId: true },
      });
      if (!user || !user.roleId) {
        return [];
      }
      let actions = await prisma.actiones.findMany({
        where: {
          isActive: true,
          rolesActionsMapping: {
            some: {
              roleId: user.roleId,
              isActive: true,
            },
          },
        },
      });
      if (applicationId) {
        const application = await prisma.freshLicenseApplicationPersonalDetails.findUnique({
          where: { id: applicationId },
          select: { isApproved: true, isRejected: true }
        });
        if (application) {
          if (application.isApproved) {
            actions = actions.filter((action: Actiones) => action.code.toUpperCase() !== ACTION_CODES.APPROVED);
          }
          if (application.isRejected) {
            actions = actions.filter((action: Actiones) => action.code.toUpperCase() !== ACTION_CODES.REJECT);
          }
        }
      }
      return actions;
    } catch (error) {
      console.error('Error fetching actions:', error);
      throw error;
    }
  }

  async getAllActions(params: {
    search?: string;
    status?: 'active' | 'inactive' | 'all';
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ data: Actiones[]; total: number; page: number; limit: number }> {
    const { search, status, page, limit, sortBy = 'createdAt', sortOrder = 'desc' } = params;
    const where: any = {};
    if (status && status !== 'all') {
      where.isActive = status === 'active';
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;
    const [data, total] = await Promise.all([
      prisma.actiones.findMany({ where, orderBy, skip: (page - 1) * limit, take: limit }),
      prisma.actiones.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async getActionById(id: number): Promise<Actiones> {
    const action = await prisma.actiones.findUnique({ where: { id } });
    if (!action) {
      throw new NotFoundException('Action with ID ' + id + ' not found');
    }
    return action;
  }

  async createActionEntity(data: {
    name: string;
    code: string;
    description?: string;
    isActive?: boolean;
  }): Promise<Actiones> {
    const existing = await prisma.actiones.findUnique({ where: { code: data.code } });
    if (existing) {
      throw new ConflictException('Action with code "' + data.code + '" already exists');
    }
    return prisma.actiones.create({
      data: {
        name: data.name,
        code: data.code.toUpperCase(),
        description: data.description || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });
  }

  async updateActionEntity(
    id: number,
    data: { name?: string; code?: string; description?: string; isActive?: boolean }
  ): Promise<Actiones> {
    const action = await prisma.actiones.findUnique({ where: { id } });
    if (!action) {
      throw new NotFoundException('Action with ID ' + id + ' not found');
    }
    if (data.code && data.code !== action.code) {
      const existing = await prisma.actiones.findUnique({ where: { code: data.code } });
      if (existing) {
        throw new ConflictException('Action with code "' + data.code + '" already exists');
      }
    }
    return prisma.actiones.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.code !== undefined && { code: data.code.toUpperCase() }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }

  async toggleActionStatus(id: number): Promise<Actiones> {
    const action = await prisma.actiones.findUnique({ where: { id } });
    if (!action) {
      throw new NotFoundException('Action with ID ' + id + ' not found');
    }
    return prisma.actiones.update({
      where: { id },
      data: { isActive: !action.isActive },
    });
  }

  async deleteAction(id: number): Promise<Actiones> {
    const action = await prisma.actiones.findUnique({ where: { id } });
    if (!action) {
      throw new NotFoundException('Action with ID ' + id + ' not found');
    }
    return prisma.actiones.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getRoleActionMappings(
    roleId: number,
    applicationTypeId?: number,
    categoryId?: number,
  ): Promise<{
    role: any;
    mappings: (RolesActionsMapping & { action: Actiones })[];
  }> {
    const role = await prisma.roles.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException('Role with ID ' + roleId + ' not found');
    }
    const where: any = { roleId };
    if (applicationTypeId !== undefined) {
      where.applicationTypeId = applicationTypeId;
    }
    if (categoryId !== undefined) {
      where.categoryId = categoryId;
    }
    const mappings = await prisma.rolesActionsMapping.findMany({
      where,
      include: { action: true },
      orderBy: { createdAt: 'desc' },
    });
    return { role, mappings };
  }

  async getAvailableActionsForRole(
    roleId: number,
    applicationTypeId?: number,
    categoryId?: number,
  ): Promise<Actiones[]> {
    const whereMapping: any = { roleId, isActive: true };
    if (applicationTypeId !== undefined) {
      whereMapping.applicationTypeId = applicationTypeId;
    }
    if (categoryId !== undefined) {
      whereMapping.categoryId = categoryId;
    }
    const mappedActionIds = await prisma.rolesActionsMapping.findMany({
      where: whereMapping,
      select: { actionId: true },
    });
    const excludedIds = mappedActionIds.map(m => m.actionId);
    return prisma.actiones.findMany({
      where: {
        isActive: true,
        id: { notIn: excludedIds },
      },
      orderBy: { name: 'asc' },
    });
  }

  async bulkAssignActionsToRole(
    roleId: number,
    actionIds: number[],
    applicationTypeId?: number,
    categoryId?: number,
  ): Promise<{ created: number; skipped: number; errors: string[] }> {
    const role = await prisma.roles.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException('Role with ID ' + roleId + ' not found');
    }
    const existingActions = await prisma.actiones.findMany({
      where: { id: { in: actionIds } },
      select: { id: true, name: true },
    });
    const existingIds = new Set(existingActions.map(a => a.id));
    const errors: string[] = [];
    for (const id of actionIds) {
      if (!existingIds.has(id)) {
        errors.push('Action ID ' + id + ' does not exist');
      }
    }
    const mappingWhere: any = { roleId, actionId: { in: actionIds }, isActive: true };
    if (applicationTypeId !== undefined) mappingWhere.applicationTypeId = applicationTypeId;
    if (categoryId !== undefined) mappingWhere.categoryId = categoryId;
    const existingMappings = await prisma.rolesActionsMapping.findMany({
      where: mappingWhere,
      select: { actionId: true },
    });
    const alreadyMappedIds = new Set(existingMappings.map(m => m.actionId));
    let created = 0;
    let skipped = 0;
    for (const actionId of actionIds) {
      if (!existingIds.has(actionId)) continue;
      if (alreadyMappedIds.has(actionId)) {
        skipped++;
        continue;
      }
      const softDeletedWhere: any = { roleId, actionId, isActive: false };
      if (applicationTypeId !== undefined) softDeletedWhere.applicationTypeId = applicationTypeId;
      if (categoryId !== undefined) softDeletedWhere.categoryId = categoryId;
      const softDeleted = await prisma.rolesActionsMapping.findFirst({
        where: softDeletedWhere,
      });
      if (softDeleted) {
        await prisma.rolesActionsMapping.update({
          where: { id: softDeleted.id },
          data: { isActive: true, updatedAt: new Date() },
        });
        created++;
      } else {
        await prisma.rolesActionsMapping.create({
          data: { roleId, actionId, isActive: true, applicationTypeId: applicationTypeId ?? null, categoryId: categoryId ?? null },
        });
        created++;
      }
    }
    return { created, skipped, errors };
  }

  async removeActionFromRole(
    roleId: number,
    actionId: number,
    applicationTypeId?: number,
    categoryId?: number,
  ): Promise<void> {
    const where: any = { roleId, actionId, isActive: true };
    if (applicationTypeId !== undefined) where.applicationTypeId = applicationTypeId;
    if (categoryId !== undefined) where.categoryId = categoryId;
    const mapping = await prisma.rolesActionsMapping.findFirst({ where });
    if (!mapping) {
      throw new NotFoundException('Active mapping not found for role ' + roleId + ' and action ' + actionId);
    }
    await prisma.rolesActionsMapping.update({
      where: { id: mapping.id },
      data: { isActive: false, updatedAt: new Date() },
    });
  }

  async getRolesWithActionCounts(params: {
    search?: string;
    page: number;
    limit: number;
  }): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    const { search, page, limit } = params;
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [roles, total] = await Promise.all([
      prisma.roles.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: {
              rolesActionsMapping: { where: { isActive: true } },
              users: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.roles.count({ where }),
    ]);
    return { data: roles, total, page, limit };
  }

  async createAction(data: RolesActionsMapping): Promise<RolesActionsMapping | { error: boolean; message: string }> {
    try {
      const mappingData = await prisma.rolesActionsMapping.findMany({
        where: { roleId: data.roleId, actionId: data.actionId }
      });
      if (mappingData.length > 0) {
        return { error: true, message: 'Mapping with this roleId and actionId already exists' };
      }
      return await prisma.rolesActionsMapping.create({
        data: { roleId: data.roleId, actionId: data.actionId, isActive: data.isActive, createdAt: data.createdAt }
      });
    } catch (error) {
      throw error;
    }
  }

  async updateAction(id: number, data: Partial<RolesActionsMapping>): Promise<RolesActionsMapping | { error: boolean; message: string }> {
    if (data.roleId && data.actionId) {
      const duplicate = await prisma.rolesActionsMapping.findFirst({
        where: { roleId: data.roleId, actionId: data.actionId, NOT: { id: id } }
      });
      if (duplicate) {
        return { error: true, message: 'Mapping with this roleId and actionId already exists' };
      }
    }
    return await prisma.rolesActionsMapping.update({
      where: { id },
      data: { roleId: data.roleId, actionId: data.actionId, isActive: data.isActive, updatedAt: new Date() }
    });
  }

  async deleteActionMapping(id: number): Promise<RolesActionsMapping> {
    const mapping = await prisma.rolesActionsMapping.findUnique({ where: { id } });
    if (!mapping) {
      throw new NotFoundException('Mapping with ID ' + id + ' not found');
    }
    return await prisma.rolesActionsMapping.update({
      where: { id },
      data: { isActive: false, updatedAt: new Date() },
    });
  }
}
