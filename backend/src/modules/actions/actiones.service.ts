import { Injectable } from '@nestjs/common';
import prisma from '../../db/prismaClient';
import { Actiones } from '@prisma/client';

@Injectable()
export class ActionesService {
  /**
   * Get actions.
   * - If userId is provided: fetch the user's roleId and return only actions allowed for that role.
   * - If no userId: return all active actions.
   */
  async getActiones(userId?: number): Promise<Actiones[]> {
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
      const actions = await prisma.actiones.findMany({
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

      return actions;
    } catch (error) {
      console.error('Error fetching actions:', error);
      throw error;
    }
  }
}
