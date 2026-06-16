import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  CreateApplicationTypeDto,
  UpdateApplicationTypeDto,
} from './dto/application-type.dto';

@Injectable()
export class ApplicationTypeService {
  private prisma = new PrismaClient();

  async findAll(activeOnly = false) {
    const where = activeOnly ? { isActive: true } : {};
    return this.prisma.applicationType.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: number) {
    const record = await this.prisma.applicationType.findUnique({
      where: { id },
    });
    if (!record) {
      throw new NotFoundException(`Application type with ID ${id} not found`);
    }
    return record;
  }

  async create(dto: CreateApplicationTypeDto) {
    const existing = await this.prisma.applicationType.findFirst({
      where: {
        OR: [
          { name: dto.name },
          { code: dto.code },
        ],
      },
    });
    if (existing) {
      throw new ConflictException(
        `Application type with name "${dto.name}" or code "${dto.code}" already exists`,
      );
    }
    return this.prisma.applicationType.create({
      data: {
        name: dto.name,
        code: dto.code,
        description: dto.description,
        isActive: dto.isActive ?? true,
        positiveAction: dto.positiveAction,
        negativeAction: dto.negativeAction,
        thirdAction: dto.thirdAction,
      },
    });
  }

  async update(id: number, dto: UpdateApplicationTypeDto) {
    await this.findById(id);
    const conflict = await this.prisma.applicationType.findFirst({
      where: {
        OR: [
          dto.name ? { name: dto.name } : {},
          dto.code ? { code: dto.code } : {},
        ].filter(o => Object.keys(o).length > 0),
        NOT: { id },
      },
    });
    if (conflict) {
      throw new ConflictException('Application type with same name or code already exists');
    }
    return this.prisma.applicationType.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.positiveAction !== undefined && { positiveAction: dto.positiveAction }),
        ...(dto.negativeAction !== undefined && { negativeAction: dto.negativeAction }),
        ...(dto.thirdAction !== undefined && { thirdAction: dto.thirdAction }),
      },
    });
  }

  async delete(id: number) {
    await this.findById(id);
    return this.prisma.applicationType.delete({ where: { id } });
  }
}
