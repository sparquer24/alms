import {Injectable } from '@nestjs/common';
import prisma from '../../db/prismaClient';
import { WeaponTypeMaster } from '@prisma/client';

@Injectable()
export class WeaponsService{
  async getWeapons(id?: number ): Promise<WeaponTypeMaster[]> {
    const where: any = {};
    if (id) {
        where.id = Number(id);
    }
    return await prisma.weaponTypeMaster.findMany({
        where,
    });
 }
}