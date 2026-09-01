import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../services/prisma.service';

export interface AuditLogDto {
  userId: number;
  applicationId?: number;
  entity: string;
  entityId?: string;
  action: string;
  oldValue?: any;
  newValue?: any;
  ip?: string;
  browser?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async logAction(data: AuditLogDto) {
    return this.prisma.auditLogs.create({
      data: {
        userId: data.userId,
        applicationId: data.applicationId,
        entity: data.entity,
        entityId: data.entityId,
        action: data.action,
        oldValue: data.oldValue ?? undefined,
        newValue: data.newValue ?? undefined,
        ip: data.ip,
        browser: data.browser,
      },
    });
  }

  async getLogsByApplication(applicationId: number) {
    return this.prisma.auditLogs.findMany({
      where: { applicationId },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, username: true, role: true } } },
    });
  }
}
