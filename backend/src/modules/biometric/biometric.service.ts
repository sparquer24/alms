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
            renewalBiometricDatas: any;
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
     * @param applicationType - Optional application type hint ('FRESH' | 'RENEWAL')
     * @returns Promise with validation result
     */
    async validateFingerprintUniqueness(
        validationData: FingerprintValidationDto,
        applicationId: number,
        userId: number,
        applicationType?: string,
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

            // Validate application exists and resolve type
            const resolved = await this.resolveApplication(applicationId, applicationType, userId);
            const targetAppId = resolved.applicationId;
            const isRenewal = resolved.type === 'RENEWAL';

            // Generate fingerprint ID (hash of template for identification)
            const fingerprintHash = crypto
                .createHash('sha256')
                .update(validationData.fingerTemplate.template)
                .digest('hex');

            // Get or create biometric data record
            let biometricRecord = isRenewal
                ? await (this.prisma as any).renewalBiometricDatas.findUnique({
                    where: { applicationId: targetAppId },
                })
                : await (this.prisma as any).fLAFBiometricDatas.findUnique({
                    where: { applicationId: targetAppId },
                });

            const existingData = (biometricRecord?.biometricData as any) || {};
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
            if (isRenewal) {
                if (biometricRecord) {
                    biometricRecord = await (this.prisma as any).renewalBiometricDatas.update({
                        where: { applicationId: targetAppId },
                        data: { biometricData: biometricPayload },
                    });
                } else {
                    biometricRecord = await (this.prisma as any).renewalBiometricDatas.create({
                        data: {
                            applicationId: targetAppId,
                            biometricData: biometricPayload,
                        },
                    });
                }
            } else {
                if (biometricRecord) {
                    biometricRecord = await (this.prisma as any).fLAFBiometricDatas.update({
                        where: { applicationId: targetAppId },
                        data: { biometricData: biometricPayload },
                    });
                } else {
                    biometricRecord = await (this.prisma as any).fLAFBiometricDatas.create({
                        data: {
                            applicationId: targetAppId,
                            biometricData: biometricPayload,
                        },
                    });
                }
            }

            // Log to audit trail
            await this.auditService.logBiometricAction(
                targetAppId,
                userId,
                'ENROLL',
                validationData.fingerPosition,
                {
                    quality: validationData.fingerTemplate.quality,
                    description: validationData.description,
                    applicationType: resolved.type,
                },
            );

            this.logger.log(
                `Fingerprint enrolled successfully for ${resolved.type} application ${targetAppId}, position: ${validationData.fingerPosition}`,
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
     * @param applicationType - Optional application type hint ('FRESH' | 'RENEWAL')
     * @returns Promise with enrollment result
     */
    async enrollFingerprint(
        applicantId: string,
        enrollmentData: BiometricEnrollmentDto,
        userId: number,
        applicationType?: string,
    ): Promise<{
        success: boolean;
        fingerprintId?: string;
        message: string;
        enrolledAt?: string;
    }> {
        try {
            const appId = parseInt(applicantId);
            if (isNaN(appId)) {
                throw new HttpException({ success: false, message: 'Invalid application ID' }, HttpStatus.BAD_REQUEST);
            }

            const resolved = await this.resolveApplication(appId, applicationType, userId);

            // *** CRITICAL: Validate fingerprint uniqueness BEFORE storing ***
            // Note: This method now also stores the fingerprint if unique
            const validationResult = await this.validateFingerprintUniqueness(
                {
                    fingerTemplate: enrollmentData.fingerTemplate,
                    fingerPosition: enrollmentData.fingerPosition,
                    matchThreshold: 65,
                    description: enrollmentData.description,
                },
                resolved.applicationId,
                userId,
                resolved.type,
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
     * @param applicationType - Optional application type hint ('FRESH' | 'RENEWAL')
     * @returns Promise with verification result
     */
    async verifyFingerprint(
        applicantId: string,
        verificationData: BiometricVerificationDto,
        userId: number,
        applicationType?: string,
    ): Promise<{
        success: boolean;
        isMatch: boolean;
        matchScore: number;
        matchedFingerPosition?: string;
        message: string;
    }> {
        try {
            const appId = parseInt(applicantId);
            if (isNaN(appId)) {
                throw new HttpException({ success: false, message: 'Invalid application ID' }, HttpStatus.BAD_REQUEST);
            }

            const resolved = await this.resolveApplication(appId, applicationType, userId);
            const targetAppId = resolved.applicationId;
            const isRenewal = resolved.type === 'RENEWAL';

            // Get biometric record
            let biometricRecord = isRenewal
                ? await (this.prisma as any).renewalBiometricDatas.findUnique({
                    where: { applicationId: targetAppId },
                })
                : await (this.prisma as any).fLAFBiometricDatas.findUnique({
                    where: { applicationId: targetAppId },
                });

            // For renewal, if no biometric record exists on renewalBiometricDatas yet,
            // fall back to linked fresh application's biometrics
            if (isRenewal && !biometricRecord) {
                const freshAppId = resolved.application?.licenses?.freshApplicationId;
                if (freshAppId) {
                    biometricRecord = await (this.prisma as any).fLAFBiometricDatas.findUnique({
                        where: { applicationId: freshAppId },
                    });
                }
            }

            if (!biometricRecord) {
                throw new HttpException(
                    { success: false, message: 'No enrolled fingerprints found' },
                    HttpStatus.BAD_REQUEST,
                );
            }

            const biometricData = (biometricRecord?.biometricData as any) || {};
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
                targetAppId,
                userId,
                'VERIFY',
                bestMatch.fingerPosition || 'UNKNOWN',
                {
                    isMatch: bestMatch.isMatch,
                    matchScore: bestMatch.score,
                    threshold: matchThreshold,
                    applicationType: resolved.type,
                },
            );

            this.logger.log(
                `Fingerprint verification for ${resolved.type} application ${targetAppId}: ${bestMatch.isMatch ? 'MATCHED' : 'NO_MATCH'}`,
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
     * @param applicationType - Optional application type hint ('FRESH' | 'RENEWAL')
     * @returns Promise with list of enrolled fingerprints (without sensitive data)
     */
    async getEnrolledFingerprints(applicantId: string, applicationType?: string): Promise<any[]> {
        try {
            const appId = parseInt(applicantId);
            if (isNaN(appId)) return [];

            const resolved = await this.resolveApplication(appId, applicationType).catch(() => null);
            if (!resolved) {
                return [];
            }

            const targetAppId = resolved.applicationId;
            let biometricRecord = resolved.type === 'RENEWAL'
                ? await (this.prisma as any).renewalBiometricDatas.findUnique({
                    where: { applicationId: targetAppId },
                })
                : await (this.prisma as any).fLAFBiometricDatas.findUnique({
                    where: { applicationId: targetAppId },
                });

            // For renewal, if no renewal biometric record exists yet, fall back to linked fresh application
            if (resolved.type === 'RENEWAL' && !biometricRecord) {
                const freshAppId = resolved.application?.licenses?.freshApplicationId;
                if (freshAppId) {
                    biometricRecord = await (this.prisma as any).fLAFBiometricDatas.findUnique({
                        where: { applicationId: freshAppId },
                    });
                }
            }

            if (!biometricRecord) {
                return [];
            }

            const biometricData = (biometricRecord.biometricData as any) || {};
            const fingerprints = biometricData.fingerprints || [];

            // Return fingerprints without sensitive template data
            return fingerprints.map((fp: any) => ({
                id: fp.id,
                position: fp.position,
                quality: fp.quality,
                enrolledAt: fp.enrolledAt,
                description: fp.description,
                bitmapData: fp.bitmapData,
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
     * @param applicationType - Optional application type hint ('FRESH' | 'RENEWAL')
     * @returns Promise with deletion result
     */
    async deleteEnrolledFingerprint(
        applicantId: string,
        fingerprintId: string,
        userId: number,
        applicationType?: string,
    ): Promise<{ success: boolean; message: string }> {
        try {
            const appId = parseInt(applicantId);
            if (isNaN(appId)) {
                throw new HttpException({ success: false, message: 'Invalid application ID' }, HttpStatus.BAD_REQUEST);
            }

            const resolved = await this.resolveApplication(appId, applicationType, userId);
            const targetAppId = resolved.applicationId;
            const isRenewal = resolved.type === 'RENEWAL';

            const biometricRecord = isRenewal
                ? await (this.prisma as any).renewalBiometricDatas.findUnique({
                    where: { applicationId: targetAppId },
                })
                : await (this.prisma as any).fLAFBiometricDatas.findUnique({
                    where: { applicationId: targetAppId },
                });

            if (!biometricRecord) {
                throw new HttpException(
                    { success: false, message: 'No biometric data found' },
                    HttpStatus.NOT_FOUND,
                );
            }

            const biometricData = (biometricRecord.biometricData as any) || {};
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

            if (isRenewal) {
                await (this.prisma as any).renewalBiometricDatas.update({
                    where: { applicationId: targetAppId },
                    data: { biometricData: updatedBiometricData },
                });
            } else {
                await (this.prisma as any).fLAFBiometricDatas.update({
                    where: { applicationId: targetAppId },
                    data: { biometricData: updatedBiometricData },
                });
            }

            // Log deletion
            await this.auditService.logBiometricAction(
                targetAppId,
                userId,
                'DELETE',
                fingerprintId,
                { reason: 'Fingerprint deleted by user', applicationType: resolved.type },
            );

            this.logger.log(`Fingerprint ${fingerprintId} deleted for ${resolved.type} application ${targetAppId}`);

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
                { success: false, message: error.message || 'Failed to delete fingerprint' },
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
            // Fetch biometric records from both Fresh and Renewal tables
            const [allFreshRecords, allRenewalRecords] = await Promise.all([
                (this.prisma as any).fLAFBiometricDatas.findMany({
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
                }),
                (this.prisma as any).renewalBiometricDatas.findMany({
                    include: {
                        application: {
                            select: {
                                id: true,
                                licenseNumber: true,
                                renewalLicenseId: true,
                                firstName: true,
                                middleName: true,
                                lastName: true,
                            },
                        },
                    },
                }),
            ]);

            const totalRecords = allFreshRecords.length + allRenewalRecords.length;
            this.logger.log(`Fetching templates from ${totalRecords} biometric records (${allFreshRecords.length} fresh, ${allRenewalRecords.length} renewal)`);

            const templates: Array<{
                applicationId: number;
                almsLicenseId?: string;
                applicantName?: string;
                fingerPosition: string;
                template: string;
                enrolledAt?: string;
            }> = [];

            const seenTemplateHashes = new Set<string>();

            // Process Fresh records
            for (const record of allFreshRecords) {
                if (excludeApplicationId && record.applicationId === excludeApplicationId) {
                    continue;
                }

                const biometricData = (record.biometricData as any) || {};
                const storedFingerprints = biometricData.fingerprints || [];

                for (const storedFingerprint of storedFingerprints) {
                    try {
                        const hashKey = storedFingerprint.templateHash || storedFingerprint.template;
                        if (hashKey) {
                            seenTemplateHashes.add(hashKey);
                        }

                        const applicantName = [
                            record.application?.firstName,
                            record.application?.middleName,
                            record.application?.lastName,
                        ].filter(Boolean).join(' ');

                        templates.push({
                            applicationId: record.applicationId,
                            almsLicenseId: record.application?.almsLicenseId || undefined,
                            applicantName: applicantName || 'Unknown',
                            fingerPosition: storedFingerprint.position,
                            template: storedFingerprint.template,
                            enrolledAt: storedFingerprint.enrolledAt,
                        });
                    } catch (decryptError) {
                        this.logger.warn(`Failed to process template for app ${record.applicationId}: ${decryptError}`);
                    }
                }
            }

            // Process Renewal records (excluding duplicates already registered in fresh)
            for (const record of allRenewalRecords) {
                if (excludeApplicationId && record.applicationId === excludeApplicationId) {
                    continue;
                }

                const biometricData = (record.biometricData as any) || {};
                const storedFingerprints = biometricData.fingerprints || [];

                for (const storedFingerprint of storedFingerprints) {
                    try {
                        const hashKey = storedFingerprint.templateHash || storedFingerprint.template;
                        if (hashKey && seenTemplateHashes.has(hashKey)) {
                            // Already present in fresh records, skip duplicate template
                            continue;
                        }
                        if (hashKey) {
                            seenTemplateHashes.add(hashKey);
                        }

                        const applicantName = [
                            record.application?.firstName,
                            record.application?.middleName,
                            record.application?.lastName,
                        ].filter(Boolean).join(' ');

                        templates.push({
                            applicationId: record.applicationId,
                            almsLicenseId: record.application?.renewalLicenseId || record.application?.licenseNumber || undefined,
                            applicantName: applicantName || 'Unknown',
                            fingerPosition: storedFingerprint.position,
                            template: storedFingerprint.template,
                            enrolledAt: storedFingerprint.enrolledAt,
                        });
                    } catch (decryptError) {
                        this.logger.warn(`Failed to process template for renewal app ${record.applicationId}: ${decryptError}`);
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
     * Resolve whether an applicationId refers to a FRESH or RENEWAL application.
     * Supports:
     * - Explicit type hints (FRESH / RENEWAL)
     * - Automatic resolution across FreshLicenseApplicationPersonalDetails and RenewalFormPersonalDetails
     * - Fallback resolution if a License ID is passed
     * - Disambiguation if the same numeric ID exists in both tables
     */
    async resolveApplication(
        applicationId: number,
        applicationTypeHint?: string,
        userId?: number,
    ): Promise<{
        type: 'FRESH' | 'RENEWAL';
        applicationId: number;
        application: any;
    }> {
        if (!applicationId || isNaN(applicationId)) {
            throw new HttpException(
                { success: false, message: 'Invalid application ID' },
                HttpStatus.BAD_REQUEST,
            );
        }

        const normalizedHint = applicationTypeHint?.trim().toUpperCase();

        // 1. Explicit RENEWAL hint
        if (normalizedHint === 'RENEWAL') {
            const renewalApp = await this.prisma.renewalFormPersonalDetails.findUnique({
                where: { id: applicationId },
                include: { licenses: true },
            });
            if (renewalApp) {
                return { type: 'RENEWAL', applicationId: renewalApp.id, application: renewalApp };
            }
            // Check if applicationId was a license ID
            const license = await this.prisma.licenses.findUnique({
                where: { id: applicationId },
                select: { renewalApplicationId: true, lastModifiedRenewalId: true },
            });
            const linkedRenewalId = license?.lastModifiedRenewalId ?? license?.renewalApplicationId;
            if (linkedRenewalId) {
                const linkedApp = await this.prisma.renewalFormPersonalDetails.findUnique({
                    where: { id: linkedRenewalId },
                    include: { licenses: true },
                });
                if (linkedApp) {
                    return { type: 'RENEWAL', applicationId: linkedApp.id, application: linkedApp };
                }
            }
            throw new HttpException(
                { success: false, message: 'Application not found' },
                HttpStatus.NOT_FOUND,
            );
        }

        // 2. Explicit FRESH hint
        if (normalizedHint === 'FRESH') {
            const freshApp = await this.prisma.freshLicenseApplicationPersonalDetails.findUnique({
                where: { id: applicationId },
            });
            if (freshApp) {
                return { type: 'FRESH', applicationId: freshApp.id, application: freshApp };
            }
            // Check if applicationId was a license ID
            const license = await this.prisma.licenses.findUnique({
                where: { id: applicationId },
                select: { freshApplicationId: true },
            });
            if (license?.freshApplicationId) {
                const linkedApp = await this.prisma.freshLicenseApplicationPersonalDetails.findUnique({
                    where: { id: license.freshApplicationId },
                });
                if (linkedApp) {
                    return { type: 'FRESH', applicationId: linkedApp.id, application: linkedApp };
                }
            }
            throw new HttpException(
                { success: false, message: 'Application not found' },
                HttpStatus.NOT_FOUND,
            );
        }

        // 3. No hint: Probe both tables
        const [freshApp, renewalApp] = await Promise.all([
            this.prisma.freshLicenseApplicationPersonalDetails.findUnique({
                where: { id: applicationId },
            }),
            this.prisma.renewalFormPersonalDetails.findUnique({
                where: { id: applicationId },
                include: { licenses: true },
            }),
        ]);

        // Only renewal application exists
        if (!freshApp && renewalApp) {
            return { type: 'RENEWAL', applicationId: renewalApp.id, application: renewalApp };
        }

        // Only fresh application exists
        if (freshApp && !renewalApp) {
            return { type: 'FRESH', applicationId: freshApp.id, application: freshApp };
        }

        // Both exist: Disambiguate
        if (freshApp && renewalApp) {
            if (userId) {
                const renewalMatchesUser = renewalApp.currentUserId === userId || renewalApp.previousUserId === userId;
                const freshMatchesUser = freshApp.currentUserId === userId || freshApp.previousUserId === userId;
                if (renewalMatchesUser && !freshMatchesUser) {
                    return { type: 'RENEWAL', applicationId: renewalApp.id, application: renewalApp };
                }
                if (freshMatchesUser && !renewalMatchesUser) {
                    return { type: 'FRESH', applicationId: freshApp.id, application: freshApp };
                }
            }
            if (renewalApp.isSubmit === false && freshApp.isSubmit === true) {
                return { type: 'RENEWAL', applicationId: renewalApp.id, application: renewalApp };
            }
            if (freshApp.isSubmit === false && renewalApp.isSubmit === true) {
                return { type: 'FRESH', applicationId: freshApp.id, application: freshApp };
            }
            // Default to FRESH for backwards compatibility
            return { type: 'FRESH', applicationId: freshApp.id, application: freshApp };
        }

        // Neither exists directly: check if applicationId is a License ID
        const license = await this.prisma.licenses.findUnique({
            where: { id: applicationId },
            select: { freshApplicationId: true, renewalApplicationId: true, lastModifiedRenewalId: true },
        });
        if (license) {
            const renewalId = license.lastModifiedRenewalId ?? license.renewalApplicationId;
            if (renewalId) {
                const app = await this.prisma.renewalFormPersonalDetails.findUnique({
                    where: { id: renewalId },
                    include: { licenses: true },
                });
                if (app) return { type: 'RENEWAL', applicationId: app.id, application: app };
            }
            if (license.freshApplicationId) {
                const app = await this.prisma.freshLicenseApplicationPersonalDetails.findUnique({
                    where: { id: license.freshApplicationId },
                });
                if (app) return { type: 'FRESH', applicationId: app.id, application: app };
            }
        }

        throw new HttpException(
            { success: false, message: 'Application not found' },
            HttpStatus.NOT_FOUND,
        );
    }

    /**
     * Store a fingerprint directly (called after client-side validation passes)
     * @param applicationId - Application ID
     * @param fingerPosition - Finger position
     * @param template - Template data
     * @param description - Optional description
     * @param userId - User ID for audit
     * @param applicationType - Optional application type hint ('FRESH' | 'RENEWAL')
     * @returns Promise with storage result
     */
    async storeFingerprint(
        applicationId: number,
        fingerPosition: string,
        template: { template: string; quality: number; captureTime: string; bitmapData?: string },
        description: string,
        userId: number,
        applicationType?: string,
    ): Promise<{
        success: boolean;
        fingerprintId: string;
        enrolledAt: string;
        message: string;
    }> {
        try {
            // Validate application exists and resolve type
            const resolved = await this.resolveApplication(applicationId, applicationType, userId);
            const targetAppId = resolved.applicationId;
            const isRenewal = resolved.type === 'RENEWAL';

            // Generate fingerprint ID (hash of template for identification)
            const fingerprintHash = crypto
                .createHash('sha256')
                .update(template.template)
                .digest('hex');

            // Get or create biometric data record
            let biometricRecord = isRenewal
                ? await (this.prisma as any).renewalBiometricDatas.findUnique({
                    where: { applicationId: targetAppId },
                })
                : await (this.prisma as any).fLAFBiometricDatas.findUnique({
                    where: { applicationId: targetAppId },
                });

            let existingData = (biometricRecord?.biometricData as any) || {};

            // If renewal and no biometric record exists yet on renewalBiometricDatas,
            // inherit non-fingerprint biometric data (photo, signature) from linked fresh application
            if (isRenewal && !biometricRecord) {
                const freshAppId = resolved.application?.licenses?.freshApplicationId;
                if (freshAppId) {
                    const freshBio = await (this.prisma as any).fLAFBiometricDatas.findUnique({
                        where: { applicationId: freshAppId },
                    });
                    if (freshBio?.biometricData) {
                        existingData = { ...(freshBio.biometricData as any) };
                    }
                }
            }

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
            if (isRenewal) {
                if (biometricRecord) {
                    await (this.prisma as any).renewalBiometricDatas.update({
                        where: { applicationId: targetAppId },
                        data: { biometricData: biometricPayload },
                    });
                } else {
                    await (this.prisma as any).renewalBiometricDatas.create({
                        data: {
                            applicationId: targetAppId,
                            biometricData: biometricPayload,
                        },
                    });
                }
            } else {
                if (biometricRecord) {
                    await (this.prisma as any).fLAFBiometricDatas.update({
                        where: { applicationId: targetAppId },
                        data: { biometricData: biometricPayload },
                    });
                } else {
                    await (this.prisma as any).fLAFBiometricDatas.create({
                        data: {
                            applicationId: targetAppId,
                            biometricData: biometricPayload,
                        },
                    });
                }
            }

            // Audit log
            await this.auditService.logBiometricAction(
                targetAppId,
                userId,
                'FINGERPRINT_ENROLLED',
                fingerPosition,
                { quality: template.quality, applicationType: resolved.type }
            );

            this.logger.log(`Fingerprint stored for ${resolved.type} application ${targetAppId} at position ${fingerPosition}`);

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
