import {Injectable } from '@nestjs/common';
import prisma from '../../db/prismaClient';
import { Actiones } from '@prisma/client';
import { contains } from 'class-validator';

@Injectable()
export class ActionesService {
  async getActiones(id: number): Promise<Actiones[]> {
    const where: any = {};
    if(id) {
      where.id =  Number(id);
    }
    try {
      return prisma.actiones.findMany({
        where,
      });  
    } catch (error) {
        throw error;
    }
    
  }
}
