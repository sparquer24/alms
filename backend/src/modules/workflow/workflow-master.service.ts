import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateWorkflowDto, UpdateWorkflowDto } from './dto/workflow-master.dto';

@Injectable()
export class WorkflowMasterService {
  private prisma = new PrismaClient();

  async findAll(activeOnly = false) {
    const where = activeOnly ? { isActive: true } : {};
    return this.prisma.workflow.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: number) {
    const record = await this.prisma.workflow.findUnique({ where: { id } });
    if (!record) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }
    return record;
  }

  async create(dto: CreateWorkflowDto) {
    const existing = await this.prisma.workflow.findFirst({
      where: {
        OR: [
          { name: dto.name },
          { code: dto.code },
        ],
      },
    });
    if (existing) {
      throw new ConflictException(
        `Workflow with name "${dto.name}" or code "${dto.code}" already exists`,
      );
    }
    return this.prisma.workflow.create({
      data: {
        name: dto.name,
        code: dto.code,
        description: dto.description,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: number, dto: UpdateWorkflowDto) {
    await this.findById(id);
    return this.prisma.workflow.update({
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
    return this.prisma.workflow.delete({ where: { id } });
  }
}
