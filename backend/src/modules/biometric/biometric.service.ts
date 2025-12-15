import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '../../services/prisma.service';
import { BiometricEnrollmentDto, BiometricVerificationDto } from './dto/biometric.dto';
import { BiometricEncryptionService } from './biometric-encryption.service';
import { BiometricAuditService } from './biometric-audit.service';
import * as crypto from 'crypto';

// Prisma model name helper
declare global {
    namespace PrismaNamespace {
        interface PrismaClient {
            fLAFBiometricDatas: any;
        }
    }
}

@Injectable()
export class BiometricService {
    private readonly logger = new Logger(BiometricService.name);

    constructor(
        private prisma: PrismaService,
        private encryptionService: BiometricEncryptionService,
        private auditService: BiometricAuditService,
    ) { }

    /**
     * Enroll a fingerprint for an applicant
     * @param applicantId - Application ID
     * @param enrollmentData - Enrollment request with template
     * @param userId - User ID performing the enrollment (for audit)
     * @returns Promise with enrollment result
     */
    async enrollFingerprint(
        applicantId: string,
        enrollmentData: BiometricEnrollmentDto,
        userId: number,
    ): Promise<{
        success: boolean;
        fingerprintId?: string;
        message: string;
        enrolledAt?: string;
    }> {
        try {
            const appId = parseInt(applicantId);

            // Validate application exists
            const application = await this.prisma.freshLicenseApplicationPersonalDetails.findUnique({
                where: { id: appId },
            });

            if (!application) {
                throw new HttpException(
                    { success: false, message: 'Application not found' },
                    HttpStatus.NOT_FOUND,
                );
            }

            // Encrypt the fingerprint template
            const encryptedTemplate = await this.encryptionService.encryptTemplate(
                enrollmentData.fingerTemplate.template,
            );

            // Generate fingerprint ID (hash of template for identification)
            const fingerprintHash = crypto
                .createHash('sha256')
                .update(enrollmentData.fingerTemplate.template)
                .digest('hex');

            // Get or create biometric data record from FLAFBiometricDatas table
            let biometricRecord = await (this.prisma as any).fLAFBiometricDatas.findUnique({
                where: { applicationId: appId },
            });

            const existingData = biometricRecord?.biometricData as any || {};

            const biometricPayload = {
                ...existingData,
                fingerprints: [
                    ...(existingData.fingerprints || []),
                    {
                        id: fingerprintHash,
                        position: enrollmentData.fingerPosition,
                        template: encryptedTemplate,
                        templateHash: fingerprintHash,
                        quality: enrollmentData.fingerTemplate.quality,
                        isoTemplate: enrollmentData.fingerTemplate.isoTemplate,
                        captureTime: enrollmentData.fingerTemplate.captureTime,
                        enrolledAt: new Date().toISOString(),
                        description: enrollmentData.description || `Fingerprint - ${enrollmentData.fingerPosition}`,
                    },
                ],
            };

            // Create or update biometric data record
            if (biometricRecord) {
                biometricRecord = await (this.prisma as any).fLAFBiometricDatas.update({
                    where: { applicationId: appId },
                    data: { biometricData: biometricPayload },
                });
            } else {
                biometricRecord = await (this.prisma as any).fLAFBiometricDatas.create({
                    data: {
                        applicationId: appId,
                        biometricData: biometricPayload,
                    },
                });
            }

            // Log to audit trail
            await this.auditService.logBiometricAction(
                parseInt(applicantId),
                userId,
                'ENROLL',
                enrollmentData.fingerPosition,
                {
                    quality: enrollmentData.fingerTemplate.quality,
                    description: enrollmentData.description,
                },
            );

            this.logger.log(
                `Fingerprint enrolled successfully for application ${applicantId}, position: ${enrollmentData.fingerPosition}`,
            );

            return {
                success: true,
                fingerprintId: fingerprintHash,
                message: `Fingerprint enrolled successfully at position ${enrollmentData.fingerPosition}`,
                enrolledAt: new Date().toISOString(),
            };
        } catch (error: any) {
            this.logger.error(`Fingerprint enrollment failed: ${error.message}`, error.stack);

            if (error instanceof HttpException) {
                throw error;
            }

            throw new HttpException(
                { success: false, message: error.message || 'Fingerprint enrollment failed' },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    /**
     * Verify a captured fingerprint against stored templates
     * @param applicantId - Application ID
     * @param verificationData - Verification request with template
     * @param userId - User ID performing verification
     * @returns Promise with verification result
     */
    async verifyFingerprint(
        applicantId: string,
        verificationData: BiometricVerificationDto,
        userId: number,
    ): Promise<{
        success: boolean;
        isMatch: boolean;
        matchScore: number;
        matchedFingerPosition?: string;
        message: string;
    }> {
        try {
            const appId = parseInt(applicantId);

            // Validate application exists
            const application = await this.prisma.freshLicenseApplicationPersonalDetails.findUnique({
                where: { id: appId },
            });

            if (!application) {
                throw new HttpException(
                    { success: false, message: 'Application not found' },
                    HttpStatus.NOT_FOUND,
                );
            }

            // Get biometric record from FLAFBiometricDatas table
            const biometricRecord = await (this.prisma as any).fLAFBiometricDatas.findUnique({
                where: { applicationId: appId },
            });

            const biometricData = biometricRecord?.biometricData as any || {};
            const storedFingerprints = biometricData.fingerprints || [];

            if (storedFingerprints.length === 0) {
                throw new HttpException(
                    { success: false, message: 'No enrolled fingerprints found' },
                    HttpStatus.BAD_REQUEST,
                );
            }

            const matchThreshold = verificationData.matchThreshold || 65;
            const liveTemplate = verificationData.fingerTemplate.template;

            let bestMatch = { isMatch: false, score: 0, fingerPosition: '' };

            // Compare against each enrolled fingerprint
            for (const storedFingerprint of storedFingerprints) {
                try {
                    // Decrypt stored template
                    const decryptedTemplate = await this.encryptionService.decryptTemplate(
                        storedFingerprint.template,
                    );

                    // Perform matching (simple string comparison for now)
                    // In production, use actual biometric matching algorithm
                    const matchScore = this.calculateTemplateMatch(decryptedTemplate, liveTemplate);

                    if (matchScore >= matchThreshold && matchScore > bestMatch.score) {
                        bestMatch = {
                            isMatch: true,
                            score: matchScore,
                            fingerPosition: storedFingerprint.position,
                        };
                    }
                } catch (decryptError) {
                    this.logger.warn(`Failed to decrypt template for comparison: ${decryptError}`);
                }
            }

            // Log verification attempt
            await this.auditService.logBiometricAction(
                parseInt(applicantId),
                userId,
                'VERIFY',
                bestMatch.fingerPosition || 'UNKNOWN',
                {
                    isMatch: bestMatch.isMatch,
                    matchScore: bestMatch.score,
                    threshold: matchThreshold,
                },
            );

            this.logger.log(
                `Fingerprint verification for application ${applicantId}: ${bestMatch.isMatch ? 'MATCHED' : 'NO_MATCH'}`,
            );

            return {
                success: true,
                isMatch: bestMatch.isMatch,
                matchScore: bestMatch.score,
                matchedFingerPosition: bestMatch.isMatch ? bestMatch.fingerPosition : undefined,
                message: bestMatch.isMatch
                    ? `Fingerprint matched at position: ${bestMatch.fingerPosition}`
                    : 'Fingerprint did not match stored templates',
            };
        } catch (error: any) {
            this.logger.error(`Fingerprint verification failed: ${error.message}`, error.stack);

            if (error instanceof HttpException) {
                throw error;
            }

            throw new HttpException(
                { success: false, message: error.message || 'Fingerprint verification failed' },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    /**
     * Get enrolled fingerprints for an application
     * @param applicantId - Application ID
     * @returns Promise with list of enrolled fingerprints (without sensitive data)
     */
    async getEnrolledFingerprints(applicantId: string): Promise<any[]> {
        try {
            const appId = parseInt(applicantId);

            const biometricRecord = await (this.prisma as any).fLAFBiometricDatas.findUnique({
                where: { applicationId: appId },
            });

            if (!biometricRecord) {
                return [];
            }

            const biometricData = biometricRecord.biometricData as any || {};
            const fingerprints = biometricData.fingerprints || [];

            // Return fingerprints without sensitive template data
            return fingerprints.map((fp: any) => ({
                id: fp.id,
                position: fp.position,
                quality: fp.quality,
                enrolledAt: fp.enrolledAt,
                description: fp.description,
                // Do NOT return: template, templateHash, isoTemplate
            }));
        } catch (error: any) {
            this.logger.error(`Failed to fetch enrolled fingerprints: ${error.message}`);
            return [];
        }
    }

    /**
     * Delete an enrolled fingerprint
     * @param applicantId - Application ID
     * @param fingerprintId - Fingerprint ID to delete
     * @param userId - User ID performing deletion
     * @returns Promise with deletion result
     */
    async deleteEnrolledFingerprint(
        applicantId: string,
        fingerprintId: string,
        userId: number,
    ): Promise<{ success: boolean; message: string }> {
        try {
            const appId = parseInt(applicantId);

            const biometricRecord = await (this.prisma as any).fLAFBiometricDatas.findUnique({
                where: { applicationId: appId },
            });

            if (!biometricRecord) {
                throw new HttpException(
                    { success: false, message: 'No biometric data found' },
                    HttpStatus.NOT_FOUND,
                );
            }

            const biometricData = biometricRecord.biometricData as any || {};
            const fingerprints = biometricData.fingerprints || [];

            const originalCount = fingerprints.length;
            const updatedFingerprints = fingerprints.filter((fp: any) => fp.id !== fingerprintId);

            if (updatedFingerprints.length === originalCount) {
                throw new HttpException(
                    { success: false, message: 'Fingerprint not found' },
                    HttpStatus.NOT_FOUND,
                );
            }

            const updatedBiometricData = {
                ...biometricData,
                fingerprints: updatedFingerprints,
            };

            await (this.prisma as any).fLAFBiometricDatas.update({
                where: { applicationId: appId },
                data: { biometricData: updatedBiometricData },
            });

            // Log deletion
            await this.auditService.logBiometricAction(
                appId,
                userId,
                'DELETE',
                fingerprintId,
                { reason: 'Fingerprint deleted by user' },
            );

            this.logger.log(`Fingerprint ${fingerprintId} deleted for application ${applicantId}`);

            return {
                success: true,
                message: 'Fingerprint deleted successfully',
            };
        } catch (error: any) {
            this.logger.error(`Failed to delete fingerprint: ${error.message}`);

            if (error instanceof HttpException) {
                throw error;
            }

            throw new HttpException(
                { success: false, message: 'Failed to delete fingerprint' },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    /**
     * Simple template matching algorithm
     * In production, replace with actual biometric matching library
     * @param template1 - First template (encrypted/decrypted)
     * @param template2 - Second template
     * @returns Match score 0-100
     */
    private calculateTemplateMatch(template1: string, template2: string): number {
        // This is a placeholder implementation
        // In production, use proper biometric matching algorithms
        // such as NIST MINEX or proprietary Mantra matching

        // For now, we'll do a simple hash-based comparison
        const hash1 = crypto.createHash('sha256').update(template1).digest('hex');
        const hash2 = crypto.createHash('sha256').update(template2).digest('hex');

        if (hash1 === hash2) {
            return 100;
        }

        // Calculate Hamming distance between templates (simplified)
        let matchingBits = 0;
        const minLength = Math.min(template1.length, template2.length);

        for (let i = 0; i < minLength; i++) {
            if (template1[i] === template2[i]) {
                matchingBits++;
            }
        }

        const score = Math.round((matchingBits / minLength) * 100);
        return Math.min(score, 99); // Return 0-99 unless exact match
    }
}
