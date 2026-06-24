// ─── services/revert-audit.service.ts ───────────────────────────────────────
// Reads and writes the RevertAuditLog table.

import { Injectable } from '@nestjs/common';
import { ApplicationType } from '@prisma/client';
import prisma from '../../../db/prismaClient';

export interface CreateRevertAuditParams {
  applicationId: number;
  applicationType: ApplicationType;
  fromVersionNumber: number;
  toVersionNumber: number;
  newVersionNumber: number;
  revertedByUserId: number;
  revertedByRoleId: number;
  originalActionByUserId?: number;
  reason: string;
  fromStatusId: number;
  toStatusId: number;
  isTerminalRevert: boolean;
  escalationDocumentUrl?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class RevertAuditService {
  /** Create a new audit entry for a completed revert */
  async createAuditEntry(params: CreateRevertAuditParams) {
    return prisma.revertAuditLog.create({ data: params });
  }

  /** List revert audit logs (admin use) with optional filters */
  async listAuditLogs(filters: {
    applicationId?: number;
    applicationType?: ApplicationType;
    revertedByUserId?: number;
    isTerminalRevert?: boolean;
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.applicationId) where.applicationId = filters.applicationId;
    if (filters.applicationType) where.applicationType = filters.applicationType;
    if (filters.revertedByUserId) where.revertedByUserId = filters.revertedByUserId;
    if (filters.isTerminalRevert !== undefined) where.isTerminalRevert = filters.isTerminalRevert;
    if (filters.dateFrom || filters.dateTo) {
      where.revertedAt = {};
      if (filters.dateFrom) where.revertedAt.gte = filters.dateFrom;
      if (filters.dateTo) where.revertedAt.lte = filters.dateTo;
    }

    const [logs, totalCount] = await Promise.all([
      prisma.revertAuditLog.findMany({
        where,
        orderBy: { revertedAt: 'desc' },
        skip,
        take: limit,
        include: {
          revertedByUser: { select: { id: true, username: true } },
          revertedByRole: { select: { id: true, name: true, code: true } },
        },
      }),
      prisma.revertAuditLog.count({ where }),
    ]);

    return { logs, totalCount, page, limit };
  }

  /** Get all revert logs for a specific application */
  async getApplicationRevertLogs(applicationId: number, applicationType: ApplicationType) {
    return prisma.revertAuditLog.findMany({
      where: { applicationId, applicationType },
      orderBy: { revertedAt: 'desc' },
      include: {
        revertedByUser: { select: { id: true, username: true } },
        revertedByRole: { select: { id: true, name: true, code: true } },
      },
    });
  }
}
