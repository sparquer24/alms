import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../services/prisma.service';

/**
 * Biometric Audit Service
 * Logs all biometric operations for compliance and security
 */
@Injectable()
export class BiometricAuditService {
    private readonly logger = new Logger(BiometricAuditService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Log biometric action
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
            // Store audit log
            // For now, we'll store in a JSON field if table doesn't exist
            // In production, create a dedicated BiometricAuditLog table

            const auditEntry = {
                applicationId,
                userId,
                action,
                target,
                timestamp: new Date().toISOString(),
                metadata: metadata || {},
                ipAddress: process.env.CLIENT_IP || 'unknown',
                userAgent: process.env.USER_AGENT || 'api',
            };

            // Log to console for now (in production, write to audit table or external service)
            this.logger.log(`BIOMETRIC_AUDIT: ${JSON.stringify(auditEntry)}`);

            // In production, store in database:
            // await this.prisma.biometricAuditLog.create({
            //   data: auditEntry,
            // });
        } catch (error: any) {
            this.logger.error(`Failed to log biometric action: ${error.message}`);
            // Don't throw - audit failures shouldn't break main operation
        }
    }

    /**
     * Get audit logs for an application
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
        try {
            // In production, query from audit table:
            // return await this.prisma.biometricAuditLog.findMany({
            //   where: { applicationId },
            //   take: limit,
            //   skip: offset,
            //   orderBy: { timestamp: 'desc' },
            // });

            this.logger.log(`Audit logs requested for application ${applicationId}`);
            return [];
        } catch (error: any) {
            this.logger.error(`Failed to fetch audit logs: ${error.message}`);
            return [];
        }
    }

    /**
     * Log security event
     * @param eventType - Type of security event
     * @param applicationId - Related application ID
     * @param userId - User ID
     * @param severity - Event severity: INFO, WARN, ERROR
     * @param message - Event message
     */
    async logSecurityEvent(
        eventType: string,
        applicationId: number,
        userId: number,
        severity: 'INFO' | 'WARN' | 'ERROR',
        message: string,
    ): Promise<void> {
        try {
            const securityEvent = {
                eventType,
                applicationId,
                userId,
                severity,
                message,
                timestamp: new Date().toISOString(),
            };

            this.logger.log(`SECURITY_EVENT [${severity}]: ${JSON.stringify(securityEvent)}`);

            // In production, store in security event table for alerting
        } catch (error: any) {
            this.logger.error(`Failed to log security event: ${error.message}`);
        }
    }
}
