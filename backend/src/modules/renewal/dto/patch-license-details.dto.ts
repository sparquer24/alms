import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsArray, IsNumber, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { LicensePurpose, ArmsCategory } from '@prisma/client';

const normalizeLicensePurpose = (value: any) => {
  if (typeof value !== 'string') return value;
  const normalized = value.trim().toUpperCase().replace(/\s+/g, '_');

  switch (normalized) {
    case 'SELF_PROTECTION':
    case 'SELF_DEFENSE':
    case 'SELF-DEFENSE':
      return 'SELF_PROTECTION';
    case 'SPORTS':
      return 'SPORTS';
    case 'CROP_PROTECTION':
      return 'CROP_PROTECTION';
    case 'HEIRLOOM_POLICY':
    case 'BUSINESS_SECURITY':
    case 'BUSINESS-SECURITY':
      return 'HEIRLOOM_POLICY';
    default:
      return normalized;
  }
};

export class PatchRenewalLicenseDetailsDto {
  @ApiPropertyOptional({ enum: LicensePurpose, description: 'Need for license' })
  @IsOptional()
  @Transform(({ value }) => normalizeLicensePurpose(value))
  @IsEnum(LicensePurpose)
  needForLicense?: LicensePurpose;

  @ApiPropertyOptional({ enum: ArmsCategory, description: 'Arms category' })
  @IsOptional()
  @IsEnum(ArmsCategory)
  armsCategory?: ArmsCategory;

  @ApiPropertyOptional({ example: 'DISTRICT', description: 'Area of validity' })
  @IsOptional()
  @IsString()
  areaOfValidity?: string;

  @ApiPropertyOptional({ example: '10 rounds per month', description: 'Ammunition description' })
  @IsOptional()
  @IsString()
  ammunitionDescription?: string;

  @ApiPropertyOptional({ example: 'High crime area', description: 'Special consideration reason' })
  @IsOptional()
  @IsString()
  specialConsiderationReason?: string;

  @ApiPropertyOptional({ example: 'Residence', description: 'License place area' })
  @IsOptional()
  @IsString()
  licencePlaceArea?: string;

  @ApiPropertyOptional({ example: 'Tigers', description: 'Wild beasts specification' })
  @IsOptional()
  @IsString()
  wildBeastsSpecification?: string;

  @ApiPropertyOptional({ example: [1, 2, 3], description: 'Requested weapon type IDs' })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  requestedWeaponIds?: number[];
}
