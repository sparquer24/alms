import { IsString, IsNumber, IsOptional, Min, Max, IsISO8601, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Biometric template captured from Mantra SDK
 */
export class BiometricTemplateDto {
    @IsString()
    template!: string; // Base64 or binary-safe template

    @IsNumber()
    @Min(0)
    @Max(100)
    quality!: number; // Quality score 0-100

    @IsOptional()
    @IsString()
    isoTemplate?: string;

    @IsISO8601()
    captureTime!: string; // ISO timestamp
}

/**
 * Request to enroll a fingerprint
 */
export class BiometricEnrollmentDto {
    @IsString()
    fingerPosition!: string; // e.g., 'RIGHT_THUMB', 'LEFT_INDEX'

    @Type(() => BiometricTemplateDto)
    @ValidateNested()
    fingerTemplate!: BiometricTemplateDto; // Nested template

    @IsOptional()
    @IsString()
    description?: string;
}

/**
 * Request to verify a fingerprint
 */
export class BiometricVerificationDto {
    @Type(() => BiometricTemplateDto)
    @ValidateNested()
    fingerTemplate!: BiometricTemplateDto;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    matchThreshold?: number; // Default 65
}

/**
 * Request to validate fingerprint uniqueness before enrollment
 * If unique, stores the fingerprint automatically
 */
export class FingerprintValidationDto {
    @Type(() => BiometricTemplateDto)
    @ValidateNested()
    fingerTemplate!: BiometricTemplateDto;

    @IsString()
    fingerPosition!: string; // e.g., 'RIGHT_THUMB', 'LEFT_INDEX' - required for storage

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    matchThreshold?: number; // Default 65 - threshold for considering fingerprints as matching

    @IsOptional()
    @IsString()
    description?: string;
}

/**
 * Response for fingerprint validation
 */
export interface FingerprintValidationResponse {
    exists: boolean;
    message: string;
    fingerprintId?: string; // Returned when fingerprint is stored
    enrolledAt?: string; // Returned when fingerprint is stored
    existingApplication?: {
        applicationId: number;
        almsLicenseId?: string;
        applicantName?: string;
        fingerPosition?: string;
        enrolledAt?: string;
    };
}
