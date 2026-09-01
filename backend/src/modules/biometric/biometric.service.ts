import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '../../services/prisma.service';
import { BiometricEnrollmentDto, BiometricVerificationDto, FingerprintValidationDto, FingerprintValidationResponse } from './dto/biometric.dto';
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
     * Validate fingerprint uniqueness across ALL applications
     * If fingerprint is unique, it will be stored automatically
     * @param validationData - Fingerprint template to validate
     * @param applicationId - Application ID for storage
     * @param userId - User ID performing the action (for audit)
     * @returns Promise with validation result
     */
    async validateFingerprintUniqueness(
        validationData: FingerprintValidationDto,
        applicationId: number,
        userId: number,
    ): Promise<FingerprintValidationResponse> {
        try {
            // Validate input data
            if (!validationData) {
                throw new HttpException(
                    { success: false, message: 'Validation data is required' },
                    HttpStatus.BAD_REQUEST,
                );
            }

            if (!validationData.fingerTemplate) {
                this.logger.error('fingerTemplate is missing from validationData');
                throw new HttpException(
                    { success: false, message: 'Fingerprint template is required' },
                    HttpStatus.BAD_REQUEST,
                );
            }

            if (!validationData.fingerTemplate.template) {
                this.logger.error('template is missing from fingerTemplate');
                throw new HttpException(
                    { success: false, message: 'Template data is required in fingerTemplate' },
                    HttpStatus.BAD_REQUEST,
                );
            }

            if (!validationData.fingerPosition) {
                throw new HttpException(
                    { success: false, message: 'Finger position is required' },
                    HttpStatus.BAD_REQUEST,
                );
            }

            const matchThreshold = validationData.matchThreshold || 65;
            const liveTemplate = validationData.fingerTemplate.template;

            this.logger.log(`Starting fingerprint uniqueness validation - Position: ${validationData.fingerPosition}, Template length: ${liveTemplate.length}`);

            // Fetch ALL biometric records from the database
            const allBiometricRecords = await (this.prisma as any).fLAFBiometricDatas.findMany({
                include: {
                    application: {
                        select: {
                            id: true,
                            almsLicenseId: true,
                            firstName: true,
                            middleName: true,
                            lastName: true,
                        },
                    },
                },
            });

            this.logger.log(`Checking against ${allBiometricRecords.length} existing biometric records`);

            // Calculate hash of incoming template for quick comparison
            const incomingTemplateHash = crypto
                .createHash('sha256')
                .update(liveTemplate)
                .digest('hex');

            this.logger.log(`Incoming template hash: ${incomingTemplateHash.substring(0, 16)}...`);

            // Check against each stored fingerprint
            for (const record of allBiometricRecords) {
                // Skip the current application (for re-enrollment scenarios)
                if (applicationId && record.applicationId === applicationId) {
                    this.logger.debug(`Skipping current application ${applicationId}`);
                    continue;
                }

                const biometricData = record.biometricData as any || {};
                const storedFingerprints = biometricData.fingerprints || [];

                this.logger.debug(`Application ${record.applicationId} has ${storedFingerprints.length} fingerprints`);

                for (const storedFingerprint of storedFingerprints) {
                    try {
                        // FIRST: Quick hash comparison for exact duplicates
                        if (storedFingerprint.templateHash && storedFingerprint.templateHash === incomingTemplateHash) {
                            const applicantName = [
                                record.application?.firstName,
                                record.application?.middleName,
                                record.application?.lastName,
                            ].filter(Boolean).join(' ');

                            this.logger.warn(
                                `EXACT DUPLICATE detected via hash match! ` +
                                `Existing application ID: ${record.applicationId}`
                            );

                            return {
                                exists: true,
                                message: 'This fingerprint is already enrolled in another application (exact match)',
                                existingApplication: {
                                    applicationId: record.applicationId,
                                    almsLicenseId: record.application?.almsLicenseId || undefined,
                                    applicantName: applicantName || 'Unknown',
                                    fingerPosition: storedFingerprint.position,
                                    enrolledAt: storedFingerprint.enrolledAt,
                                },
                            };
                        }

                        // SECOND: Decrypt and compare templates for similarity matching
                        const decryptedTemplate = await this.encryptionService.decryptTemplate(
                            storedFingerprint.template,
                        );

                        // Calculate match score
                        const matchScore = this.calculateTemplateMatch(decryptedTemplate, liveTemplate);

                        this.logger.debug(
                            `Match score with app ${record.applicationId}, finger ${storedFingerprint.position}: ${matchScore}%`
                        );

                        if (matchScore >= matchThreshold) {
                            // Fingerprint already exists!
                            const applicantName = [
                                record.application?.firstName,
                                record.application?.middleName,
                                record.application?.lastName,
                            ].filter(Boolean).join(' ');

                            this.logger.warn(
                                `Duplicate fingerprint detected! Match score: ${matchScore}%, ` +
                                `Existing application ID: ${record.applicationId}`
                            );

                            return {
                                exists: true,
                                message: 'This fingerprint is already enrolled in another application',
                                existingApplication: {
                                    applicationId: record.applicationId,
                                    almsLicenseId: record.application?.almsLicenseId || undefined,
                                    applicantName: applicantName || 'Unknown',
                                    fingerPosition: storedFingerprint.position,
                                    enrolledAt: storedFingerprint.enrolledAt,
                                },
                            };
                        }
                    } catch (decryptError) {
                        this.logger.warn(`Failed to decrypt template for comparison: ${decryptError}`);
                        // Continue checking other fingerprints
                    }
                }
            }

            this.logger.log('Fingerprint validation passed - no duplicates found. Storing fingerprint...');

            // *** FINGERPRINT IS UNIQUE - STORE IT IN DATABASE ***

            // Validate application exists
            const application = await this.prisma.freshLicenseApplicationPersonalDetails.findUnique({
                where: { id: applicationId },
            });

            if (!application) {
                throw new HttpException(
                    { success: false, message: 'Application not found' },
                    HttpStatus.NOT_FOUND,
                );
            }


            // Generate fingerprint ID (hash of template for identification)
            const fingerprintHash = crypto
                .createHash('sha256')
                .update(validationData.fingerTemplate.template)
                .digest('hex');

            // Get or create biometric data record from FLAFBiometricDatas table
            let biometricRecord = await (this.prisma as any).fLAFBiometricDatas.findUnique({
                where: { applicationId: applicationId },
            });

            const existingData = biometricRecord?.biometricData as any || {};
            const enrolledAt = new Date().toISOString();

            const biometricPayload = {
                ...existingData,
                fingerprints: [
                    ...(existingData.fingerprints || []),
                    {
                        id: fingerprintHash,
                        position: validationData.fingerPosition,
                        template: validationData.fingerTemplate.template,
                        templateHash: fingerprintHash,
                        quality: validationData.fingerTemplate.quality,
                        captureTime: validationData.fingerTemplate.captureTime,
                        enrolledAt: enrolledAt,
                        description: validationData.description || `Fingerprint - ${validationData.fingerPosition}`,
                    },
                ],
            };

            // Create or update biometric data record
            if (biometricRecord) {
                biometricRecord = await (this.prisma as any).fLAFBiometricDatas.update({
                    where: { applicationId: applicationId },
                    data: { biometricData: biometricPayload },
                });
            } else {
                biometricRecord = await (this.prisma as any).fLAFBiometricDatas.create({
                    data: {
                        applicationId: applicationId,
                        biometricData: biometricPayload,
                    },
                });
            }

            // Log to audit trail
            await this.auditService.logBiometricAction(
                applicationId,
                userId,
                'ENROLL',
                validationData.fingerPosition,
                {
                    quality: validationData.fingerTemplate.quality,
                    description: validationData.description,
                },
            );

            this.logger.log(
                `Fingerprint enrolled successfully for application ${applicationId}, position: ${validationData.fingerPosition}`,
            );

            return {
                exists: false,
                message: `Fingerprint enrolled successfully at position ${validationData.fingerPosition}`,
                fingerprintId: fingerprintHash,
                enrolledAt: enrolledAt,
            };
        } catch (error: any) {
            this.logger.error(`Fingerprint validation failed: ${error.message}`, error.stack);
            throw new HttpException(
                { success: false, message: error.message || 'Fingerprint validation failed' },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

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

            // *** CRITICAL: Validate fingerprint uniqueness BEFORE storing ***
            // Note: This method now also stores the fingerprint if unique
            const validationResult = await this.validateFingerprintUniqueness(
                {
                    fingerTemplate: enrollmentData.fingerTemplate,
                    fingerPosition: enrollmentData.fingerPosition,
                    matchThreshold: 65,
                    description: enrollmentData.description,
                },
                appId,
                userId,
            );

            if (validationResult.exists) {
                this.logger.warn(
                    `Enrollment blocked: Fingerprint already exists in application ${validationResult.existingApplication?.applicationId}`
                );

                throw new HttpException(
                    {
                        success: false,
                        exists: true,
                        message: validationResult.message,
                        existingApplication: validationResult.existingApplication,
                    },
                    HttpStatus.CONFLICT,
                );
            }

            // Fingerprint was stored by validateFingerprintUniqueness, return success
            return {
                success: true,
                fingerprintId: validationResult.fingerprintId,
                message: validationResult.message,
                enrolledAt: validationResult.enrolledAt,
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
                // Do NOT return: template, templateHash
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
     * Template matching algorithm
     * NOTE: This is a simplified implementation for development/testing.
     * In production, you should use:
     * - Mantra SDK's built-in matching API (MatchFinger)
     * - NIST MINEX compliant matcher
     * - Or other certified biometric matching library
     * 
     * @param template1 - First template (decrypted stored template)
     * @param template2 - Second template (incoming live template)
     * @returns Match score 0-100
     */
    private calculateTemplateMatch(template1: string, template2: string): number {
        // Normalize templates (trim whitespace, handle encoding differences)
        const norm1 = template1?.trim() || '';
        const norm2 = template2?.trim() || '';

        if (!norm1 || !norm2) {
            this.logger.warn('Empty template provided for matching');
            return 0;
        }

        // Hash-based exact match check
        const hash1 = crypto.createHash('sha256').update(norm1).digest('hex');
        const hash2 = crypto.createHash('sha256').update(norm2).digest('hex');

        if (hash1 === hash2) {
            this.logger.log('Templates match exactly (100% hash match)');
            return 100;
        }

        // For biometric templates, character-by-character comparison is not ideal
        // but works for detecting similar/near-duplicate templates

        // Length similarity check first
        const lengthDiff = Math.abs(norm1.length - norm2.length);
        const maxLength = Math.max(norm1.length, norm2.length);
        const lengthSimilarity = 1 - (lengthDiff / maxLength);

        // If lengths are very different, templates are likely different
        if (lengthSimilarity < 0.9) {
            this.logger.debug(`Templates have different lengths: ${norm1.length} vs ${norm2.length}`);
            return Math.round(lengthSimilarity * 50); // Max 50% if lengths differ significantly
        }

        // Character-by-character comparison
        let matchingChars = 0;
        const minLength = Math.min(norm1.length, norm2.length);

        for (let i = 0; i < minLength; i++) {
            if (norm1[i] === norm2[i]) {
                matchingChars++;
            }
        }

        const charSimilarity = matchingChars / minLength;
        const score = Math.round(charSimilarity * 100);

        this.logger.debug(
            `Template comparison: ${matchingChars}/${minLength} chars match = ${score}%`
        );

        // Return 0-99 for non-exact matches (100 only for hash match)
        return Math.min(score, 99);
    }

    /**
     * Get all stored fingerprint templates for client-side matching
     * Returns decrypted templates so frontend can use Mantra SDK's verify endpoint
     * @param excludeApplicationId - Optional application ID to exclude (for re-enrollment)
     * @returns Promise with array of stored templates
     */
    async getAllStoredTemplatesForMatching(
        excludeApplicationId?: number,
    ): Promise<{
        success: boolean;
        templates: Array<{
            applicationId: number;
            almsLicenseId?: string;
            applicantName?: string;
            fingerPosition: string;
            template: string; // Decrypted template for matching
            enrolledAt?: string;
        }>;
        message: string;
    }> {
        try {
            // Fetch ALL biometric records from the database
            const allBiometricRecords = await (this.prisma as any).fLAFBiometricDatas.findMany({
                include: {
                    application: {
                        select: {
                            id: true,
                            almsLicenseId: true,
                            firstName: true,
                            middleName: true,
                            lastName: true,
                        },
                    },
                },
            });

            this.logger.log(`Fetching templates from ${allBiometricRecords.length} biometric records`);

            const templates: Array<{
                applicationId: number;
                almsLicenseId?: string;
                applicantName?: string;
                fingerPosition: string;
                template: string;
                enrolledAt?: string;
            }> = [];

            for (const record of allBiometricRecords) {
                const biometricData = record.biometricData as any || {};
                const storedFingerprints = biometricData.fingerprints || [];

                for (const storedFingerprint of storedFingerprints) {
                    try {

                        const applicantName = [
                            record.application?.firstName,
                            record.application?.middleName,
                            record.application?.lastName,
                        ].filter(Boolean).join(' ');

                        // Debug log - check template format
                        this.logger.debug(`Template for app ${record.applicationId}: length=${storedFingerprint.template?.length}, preview=${storedFingerprint.template?.substring(0, 30)}...`);

                        templates.push({
                            applicationId: record.applicationId,
                            almsLicenseId: record.application?.almsLicenseId || undefined,
                            applicantName: applicantName || 'Unknown',
                            fingerPosition: storedFingerprint.position,
                            template: storedFingerprint.template,
                            enrolledAt: storedFingerprint.enrolledAt,
                        });
                    } catch (decryptError) {
                        this.logger.warn(`Failed to decrypt template for app ${record.applicationId}: ${decryptError}`);
                        // Continue with other fingerprints
                    }
                }
            }

            this.logger.log(`Returning ${templates.length} templates for matching`);

            return {
                success: true,
                templates,
                message: `Found ${templates.length} stored templates`,
            };
        } catch (error: any) {
            this.logger.error(`Failed to get templates for matching: ${error.message}`);
            throw new HttpException(
                { success: false, message: 'Failed to retrieve templates for matching' },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    /**
     * Store a fingerprint directly (called after client-side validation passes)
     * @param applicationId - Application ID
     * @param fingerPosition - Finger position
     * @param template - Template data
     * @param description - Optional description
     * @param userId - User ID for audit
     * @returns Promise with storage result
     */
    async storeFingerprint(
        applicationId: number,
        fingerPosition: string,
        template: { template: string; quality: number; captureTime: string; bitmapData?: string },
        description: string,
        userId: number,
    ): Promise<{
        success: boolean;
        fingerprintId: string;
        enrolledAt: string;
        message: string;
    }> {
        try {
            // Validate application exists
            const application = await this.prisma.freshLicenseApplicationPersonalDetails.findUnique({
                where: { id: applicationId },
            });

            if (!application) {
                throw new HttpException(
                    { success: false, message: 'Application not found' },
                    HttpStatus.NOT_FOUND,
                );
            }

            // Generate fingerprint ID (hash of template for identification)
            const fingerprintHash = crypto
                .createHash('sha256')
                .update(template.template)
                .digest('hex');

            // Get or create biometric data record
            let biometricRecord = await (this.prisma as any).fLAFBiometricDatas.findUnique({
                where: { applicationId: applicationId },
            });

            const existingData = biometricRecord?.biometricData as any || {};
            const enrolledAt = new Date().toISOString();

            // Store ONLY the latest fingerprint (replace existing fingerprints array)
            const biometricPayload = {
                ...existingData,
                fingerprints: [
                    {
                        id: fingerprintHash,
                        position: fingerPosition,
                        template: template.template,
                        templateHash: fingerprintHash,
                        quality: template.quality,
                        bitmapData: template.bitmapData,
                        captureTime: template.captureTime,
                        enrolledAt: enrolledAt,
                        description: description || `Fingerprint - ${fingerPosition}`,
                    },
                ],
            };

            // Create or update biometric data record
            if (biometricRecord) {
                await (this.prisma as any).fLAFBiometricDatas.update({
                    where: { applicationId: applicationId },
                    data: { biometricData: biometricPayload },
                });
            } else {
                await (this.prisma as any).fLAFBiometricDatas.create({
                    data: {
                        applicationId: applicationId,
                        biometricData: biometricPayload,
                    },
                });
            }

            // Audit log
            await this.auditService.logBiometricAction(
                applicationId,
                userId,
                'FINGERPRINT_ENROLLED',
                fingerPosition,
                { quality: template.quality }
            );

            this.logger.log(`Fingerprint stored for application ${applicationId} at position ${fingerPosition}`);

            return {
                success: true,
                fingerprintId: fingerprintHash,
                enrolledAt: enrolledAt,
                message: `Fingerprint enrolled successfully at position ${fingerPosition}`,
            };
        } catch (error: any) {
            this.logger.error(`Failed to store fingerprint: ${error.message}`);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                { success: false, message: error.message || 'Failed to store fingerprint' },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
