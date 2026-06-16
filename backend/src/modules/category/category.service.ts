import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoryService {
  private prisma = new PrismaClient();

  async findAll(activeOnly = false) {
    const where = activeOnly ? { isActive: true } : {};
    return this.prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: number) {
    const record = await this.prisma.category.findUnique({ where: { id } });
    if (!record) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return record;
  }

  async create(dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findFirst({
      where: {
        OR: [
          { name: dto.name },
          { code: dto.code },
        ],
      },
    });
    if (existing) {
      throw new ConflictException(
        `Category with name "${dto.name}" or code "${dto.code}" already exists`,
      );
    }
    return this.prisma.category.create({
      data: {
        name: dto.name,
        code: dto.code,
        description: dto.description,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: number, dto: UpdateCategoryDto) {
    await this.findById(id);
    return this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async delete(id: number) {
    await this.findById(id);
    return this.prisma.category.delete({ where: { id } });
  }
}
