import { Injectable } from "@nestjs/common"; 
import * as bcrypt from 'bcrypt';
import prisma from '../../db/prismaClient';
import { Statuses } from "@prisma/client"; 


@Injectable()
export class StatusService {


  private readonly saltRounds = 12;

  hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

async getStatus(code?: string, id?: number): Promise<any[]> {
  const where: any = {};
  if (code) {
    where.code = { contains: code, mode: 'insensitive' };
  }
  if (id) {
    where.id = id;
  }
  return await prisma.statuses.findMany({
    where,
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
    },
  });
}
async createStatus(data: Statuses): Promise<Statuses | { error: boolean; message: string }> {
  try {
    const status = await this.getStatus(data.code); 
    if (Array.isArray(status) && status.length > 0) {
      return {
        error: true,
        message: 'Status with this code already exists'
      };
    }
    return await prisma.statuses.create({
      data: {
        name: data.name,
        description: data.description,
        code: data.code,
        isActive: data.isActive
      }
    });
  } catch (error) {
    throw error;
  }
  }

  async updateStatus(id: number, data: Partial<Statuses>): Promise<Statuses> {
    
    return await prisma.statuses.update({
      where: { id },
      data:data,
    });
  }
}
