import {Injectable } from '@nestjs/common';
import prisma from '../../db/prismaClient';
import { WeaponTypeMaster } from '@prisma/client';
import { contains } from 'class-validator';

@Injectable()
export class WeaponsService{
  async getWeapons(id?: number ): Promise<WeaponTypeMaster[]> {
    const where: any = {};
    if (id) {
        where.id = Number(id);
    }
    try{
      return await prisma.weaponTypeMaster.findMany({
          where,
      });
    } catch(error){
      throw error;
     }
 }
}