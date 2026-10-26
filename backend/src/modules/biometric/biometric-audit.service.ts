import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../services/prisma.service';

/** AuditLogs.entity for biometric operations. */
const BIOMETRIC_ENTITY = 'BIOMETRIC';

/**
 * Biometric Audit Service
 * Logs all biometric operations for compliance and security
 */
@Injectable()
export class BiometricAuditService {
    private readonly logger = new Logger(BiometricAuditService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Log biometric action to the AuditLogs table. Metadata holds only non-sensitive
     * details (quality, match score, reason), never templates or images.
     * @param applicationId - Application ID
     * @param userId - User performing the action
     * @param action - Action type: ENROLL, VERIFY, DELETE, etc.
     * @param target - Target (fingerprint position, ID, etc.)
     * @param metadata - Additional metadata
     */
    async logBiometricAction(
        applicationId: number,
        userId: number,
        action: string,
        target: string,
        metadata?: any,
    ): Promise<void> {
        try {
            await this.prisma.auditLogs.create({
                data: {
                    userId,
                    applicationId,
                    entity: BIOMETRIC_ENTITY,
                    entityId: target != null ? String(target) : null,
                    action,
                    newValue: metadata || {},
                },
            });
        } catch (error: any) {
            this.logger.error(`Failed to log biometric action: ${error.message}`);
            // Don't throw - audit failures shouldn't break main operation
        }
    }

    /**
     * Get audit logs for an application, newest first
     * @param applicationId - Application ID
     * @param limit - Number of logs to return
     * @param offset - Offset for pagination
     * @returns Promise with audit logs
     */
    async getAuditLogs(
        applicationId: number,
        limit: number = 50,
        offset: number = 0,
    ): Promise<any[]> {
        return this.prisma.auditLogs.findMany({
            where: { entity: BIOMETRIC_ENTITY, applicationId },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
            select: {
                id: true,
                action: true,
                entityId: true,
                newValue: true,
                createdAt: true,
                user: { select: { id: true, username: true } },
            },
        });
    }
}
