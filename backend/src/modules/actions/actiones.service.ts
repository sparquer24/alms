import { Injectable, NotFoundException } from '@nestjs/common';
import prisma from '../../db/prismaClient';
import { Actiones } from '@prisma/client';
import { RolesActionsMapping } from '@prisma/client';
import { ACTION_CODES } from '../../constants/workflow-actions';

@Injectable()
export class ActionesService {
  /**
   * Get actions.
   * - If userId is provided: fetch the user's roleId and return only actions allowed for that role.
   * - If no userId: return all active actions.
   * - If applicationId is provided: filter out APPROVED action if already approved, REJECT action if already rejected.
   */
  async getActiones(userId?: number, applicationId?: number): Promise<Actiones[]> {
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
        console.warn(`getActiones: no user found with id=${userId}`);
        return [];
      }

      if (!user.roleId) {
        console.warn(`getActiones: user id=${userId} has no roleId`);
        return [];
      }

      // Fetch actions directly via the relation to RolesActionsMapping.
      // This performs the join in the database and avoids a client-side loop/dedup.
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

      // If applicationId is provided, filter based on application status
      if (applicationId) {
        const application = await prisma.freshLicenseApplicationPersonalDetails.findUnique({
          where: { id: applicationId },
          select: { isApproved: true, isRejected: true }
        });

        if (application) {
          // If application is approved, filter out APPROVED action
          if (application.isApproved) {
            actions = actions.filter(action => action.code.toUpperCase() !== ACTION_CODES.APPROVED);
          }
          
          // If application is rejected, filter out REJECT action
          if (application.isRejected) {
            actions = actions.filter(action => action.code.toUpperCase() !== ACTION_CODES.REJECT);
          }
        }
      }

      return actions;
    } catch (error) {
      console.error('Error fetching actions:', error);
      throw error;
    }
  }
   async createAction(data: RolesActionsMapping): Promise<RolesActionsMapping | { error: boolean; message: string }> {  
    try{
    const mappingData = await prisma.rolesActionsMapping.findMany({
      where: {
        roleId: data.roleId,
        actionId: data.actionId 
      }
    });
  if (mappingData.length > 0) {
    return {
      error: true,
      message: 'Mapping with this roleId and actionId already exists'
    };
  
  }
    return await prisma.rolesActionsMapping.create({
      data: {
        roleId: data.roleId,
        actionId: data.actionId,
        isActive: data.isActive,
        createdAt: data.createdAt,
   }
  });
   } catch(error){
    throw error;
   }
  }
    async updateAction(id: number, data:  Partial<RolesActionsMapping>): Promise<RolesActionsMapping | { error: boolean; message: string }> {

       if(data.roleId && data.actionId){
        const duplicate = await prisma.rolesActionsMapping.findFirst({
          where: {
            roleId: data.roleId,
            actionId: data.actionId,
            NOT: { id: id}, // Exclude current record
          }
        });

        if (duplicate) {
          return {
            error: true,
            message: 'Mapping with this roleId and actionId already exists'
          };
        }
        }

     return await prisma.rolesActionsMapping.update({
      where: {id},
      data: {
        roleId: data.roleId,
        actionId: data.actionId,
        isActive: data.isActive,
        updatedAt: new Date(),
      }
    });
  }
async deleteActionMapping(id: number): Promise<RolesActionsMapping> {
    const mapping = await prisma.rolesActionsMapping.findUnique({
      where: { id },
    });

    if (!mapping) {
      throw new NotFoundException('Mapping with ID${id} not found');
    }
   return await prisma.rolesActionsMapping.update({
      where: { id },
      data: { isActive: false, updatedAt: new Date() },
    });

}
}      

