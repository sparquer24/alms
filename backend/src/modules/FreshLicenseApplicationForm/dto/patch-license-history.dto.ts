import { IsBoolean, IsString, IsDateString, IsOptional, IsEnum, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LicenseResult } from '@prisma/client';

export class PatchLicenseHistoryDto {
  // (a) Whether the applicant applied for a licence before
  @ApiProperty({ example: false, description: 'Whether the applicant applied for a licence before' })
  @IsBoolean()
  hasAppliedBefore!: boolean;

  @ApiPropertyOptional({ example: '2019-06-15T00:00:00.000Z', description: 'Date when applied for licence before (required if hasAppliedBefore is true)' })
  @IsOptional()
  @IsDateString()
  dateAppliedFor?: string;

  @ApiPropertyOptional({ example: 'District Magistrate, Kolkata', description: 'Previous authority name (required if hasAppliedBefore is true)' })
  @IsOptional()
  @IsString()
  previousAuthorityName?: string;

  @ApiPropertyOptional({ enum: LicenseResult, example: LicenseResult.APPROVED, description: 'Previous application result (required if hasAppliedBefore is true)' })
  @IsOptional()
  @IsEnum(LicenseResult)
  previousResult?: LicenseResult;

  // (b) Whether applicant's licence was ever suspended/cancelled/revoked
  @ApiProperty({ example: false, description: 'Whether applicants licence was ever suspended/cancelled/revoked' })
  @IsBoolean()
  hasLicenceSuspended!: boolean;

  @ApiPropertyOptional({ example: 'District Magistrate, Mumbai', description: 'Authority that suspended the licence (required if hasLicenceSuspended is true)' })
  @IsOptional()
  @IsString()
  suspensionAuthorityName?: string;

  @ApiPropertyOptional({ example: 'Violation of terms and conditions', description: 'Reason for suspension (required if hasLicenceSuspended is true)' })
  @IsOptional()
  @IsString()
  suspensionReason?: string;

  // (c) Any family member in possession of an arms licence
  @ApiProperty({ example: false, description: 'Whether any family member has an arms licence' })
  @IsBoolean()
  hasFamilyLicence!: boolean;

  @ApiPropertyOptional({ example: 'John Doe (Father)', description: 'Family member name (required if hasFamilyLicence is true)' })
  @IsOptional()
  @IsString()
  familyMemberName?: string;

  @ApiPropertyOptional({ example: 'LIC123456789', description: 'Family member licence number (required if hasFamilyLicence is true)' })
  @IsOptional()
  @IsString()
  familyLicenceNumber?: string;

  @ApiPropertyOptional({ example: ['Pistol .32', 'Rifle .22'], description: 'Weapons endorsed in family licence (required if hasFamilyLicence is true)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  familyWeaponsEndorsed?: string[];

  // (d) Whether the applicant has a safe place for arms/ammunition
  @ApiProperty({ example: true, description: 'Whether the applicant has a safe place for arms/ammunition' })
  @IsBoolean()
  hasSafePlace!: boolean;

  @ApiPropertyOptional({ example: 'Steel almirah with double lock in bedroom', description: 'Safe place details (required if hasSafePlace is true)' })
  @IsOptional()
  @IsString()
  safePlaceDetails?: string;

  // (e) Whether the applicant has undergone arms training
  @ApiProperty({ example: false, description: 'Whether the applicant has undergone arms training' })
  @IsBoolean()
  hasTraining!: boolean;

  @ApiPropertyOptional({ example: 'Basic firearms training from XYZ Academy, Certificate No: ABC123', description: 'Training details (required if hasTraining is true)' })
  @IsOptional()
  @IsString()
  trainingDetails?: string;
}