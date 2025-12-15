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
