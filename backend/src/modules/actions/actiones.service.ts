import { Injectable, NotFoundException} from '@nestjs/common';
import prisma from '../../db/prismaClient';
import { Actiones, RolesActionsMapping, RoleFlowApplicationType } from '@prisma/client';
import { ACTION_CODES } from '../../constants/workflow-actions';
import { normalizeApplicationType } from '../../constants/flow-mapping';

@Injectable()
export class ActionesService {
  /**
   * Get actions.
   * - If userId is provided: fetch the user's roleId and return only actions allowed for that role,
   *   scoped by applicationType when provided.
   * - If no userId: return all active actions.
   * - If applicationId is provided: filter out APPROVED action if already approved, REJECT action if already rejected.
   */
  async getActiones(userId?: number, applicationId?: number, applicationType?: string): Promise<Actiones[]> {
    try {
      // No userId → return all active actions
      if (userId === undefined || userId === null) {
        return prisma.actiones.findMany({ where: { isActive: true } });
      }

      // Find user and their role
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: { id: true, roleId: true },
      });

      if (!user) {
        return [];
      }

      if (!user.roleId) {
        return [];
      }

      // Normalize applicationType for role-action mapping lookup.
      // Defaults to 'ALL' when absent, matching the default column value.
      const appType: RoleFlowApplicationType = normalizeApplicationType(applicationType ?? 'ALL');

      // Fetch actions directly via the relation to RolesActionsMapping.
      // Filter by roleId + applicationType so only actions permitted for the
      // given application type are returned.
      let actions = await prisma.actiones.findMany({
        where: {
          isActive: true,
          rolesActionsMapping: {
            some: {
              roleId: user.roleId,
              applicationType: appType,
              isActive: true,
            },
          },
        },
      });

          // If applicationId is provided, filter based on application status
      if (applicationId) {

        let application;
        if (applicationType?.toLocaleLowerCase() === 'fresh license' || applicationType?.toLocaleLowerCase() === 'freshlicenseapplicationform' || applicationType?.toLocaleLowerCase() === 'flawupdate') {
          application = await prisma.freshLicenseApplicationPersonalDetails.findUnique({
            where: { id: applicationId },
            select: { isApproved: true, isRejected: true }
          });
        }
        else if (!application && applicationType?.toLocaleLowerCase() && ['renewal application', 'renewalapplicationform', 'renewalupdate', 'renewalform', 'renewalapplicationform'].includes(applicationType)) {
          application = await prisma.renewalFormPersonalDetails.findUnique({
            where: { id: applicationId },
            select: { isApproved: true, isRejected: true }
          });
        }
        if (application) {
          // If application is approved, filter out APPROVED action
          if (application.isApproved) {
            actions = actions.filter((action: Actiones) => action.code.toUpperCase() !== ACTION_CODES.APPROVED);
          }

          // If application is rejected, filter out REJECT action
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

  /**
   * Get all available actions in the system.
   */
  async getAllActions(): Promise<Actiones[]> {
    try {
      return await prisma.actiones.findMany({
        orderBy: { code: 'asc' }
      });
    } catch (error) {
      console.error('Error fetching all actions:', error);
      throw error;
    }
  }

  /**
   * Get all Roles to Actions mappings.
   * Optionally filtered by roleId and/or applicationType.
   */
  async getAllActionMappings(roleId?: number, applicationType?: string): Promise<RolesActionsMapping[]> {
    try {
      const where: any = {};
      if (roleId) where.roleId = roleId;
      if (applicationType) {
        where.applicationType = normalizeApplicationType(applicationType);
      }

      return await prisma.rolesActionsMapping.findMany({
        where,
        include: {
          action: true,
          role: true,
          allowedBy: { select: { id: true, username: true } },
        }
      });
    } catch (error) {
      console.error('Error fetching action mappings:', error);
      throw error;
    }
  }
  /**
   * Create a new role-action mapping.
   * Uniqueness is enforced on (roleId, actionId, applicationType).
   */
  async createAction(data: RolesActionsMapping, allowedById?: number): Promise<RolesActionsMapping | { error: boolean; message: string }> {
    try {
      const appType: RoleFlowApplicationType = normalizeApplicationType(data.applicationType ?? 'ALL');

      // Check for existing mapping with the same (roleId, actionId, applicationType)
      const existing = await prisma.rolesActionsMapping.findFirst({
        where: {
          roleId: data.roleId,
          actionId: data.actionId,
          applicationType: appType,
        }
      });

      if (existing) {
        return {
          error: true,
          message: `Mapping with this roleId, actionId, and applicationType (${appType}) already exists`
        };
      }

      return await prisma.rolesActionsMapping.create({
        data: {
          roleId: data.roleId,
          actionId: data.actionId,
          applicationType: appType,
          isActive: data.isActive,
          allowedById: allowedById ?? null,
          createdAt: data.createdAt,
        }
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a new Action in the Actiones table
   */
  async createNewAction(data: { code: string; name: string; description?: string; isActive?: boolean }): Promise<Actiones> {
    try {
      return await prisma.actiones.create({
        data: {
          code: data.code,
          name: data.name,
          description: data.description,
          isActive: data.isActive !== undefined ? data.isActive : true,
        }
      });
    } catch (error) {
      console.error('Error creating new action:', error);
      throw error;
    }
  }
  /**
   * Update an existing role-action mapping.
   * Duplicate check includes applicationType.
   */
  async updateAction(id: number, data: Partial<RolesActionsMapping>, allowedById?: number): Promise<RolesActionsMapping | { error: boolean; message: string }> {
    // Resolve applicationType: use the incoming value or fetch the existing record's value
    let appType: RoleFlowApplicationType;
    if (data.applicationType) {
      appType = normalizeApplicationType(data.applicationType);
    } else {
      const existing = await prisma.rolesActionsMapping.findUnique({ where: { id } });
      appType = existing?.applicationType ?? 'ALL';
    }

    if (data.roleId && data.actionId) {
      const duplicate = await prisma.rolesActionsMapping.findFirst({
        where: {
          roleId: data.roleId,
          actionId: data.actionId,
          applicationType: appType,
          NOT: { id: id }, // Exclude current record
        }
      });
      if (duplicate) {
        return {
          error: true,
          message: `Mapping with this roleId, actionId, and applicationType (${appType}) already exists`
        };
      }
    }

    return await prisma.rolesActionsMapping.update({
      where: { id },
      data: {
        roleId: data.roleId,
        actionId: data.actionId,
        applicationType: appType,
        isActive: data.isActive,
        allowedById: allowedById ?? null,
        updatedAt: new Date(),
      }
    });
  }
  async deleteActionMapping(id: number): Promise<RolesActionsMapping> {
    const mapping = await prisma.rolesActionsMapping.findUnique({
      where: { id },
    });

    if (!mapping) {
      throw new NotFoundException(`Mapping with ID ${id} not found`);
    }
    return await prisma.rolesActionsMapping.update({
      where: { id },
      data: { isActive: false, updatedAt: new Date() },
    });
  }
}