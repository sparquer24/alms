import {Injectable } from '@nestjs/common';
import prisma from '../../db/prismaClient';
import { Roles } from '@prisma/client';

@Injectable()
export class RolesService{
  async getRoles(id?: number ): Promise<Roles[]> {
    const where: any = {};
    if (id) {
        where.id = Number(id);
    }
    try{
        return await prisma.roles.findMany({
            where,
        });
    } catch(error){
        throw error;
    }
    }
}