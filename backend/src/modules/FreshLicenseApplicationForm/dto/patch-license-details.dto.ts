import { Transform } from 'class-transformer';
import { IsOptional, IsEnum, IsString, IsArray, IsNumber } from 'class-validator';
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

export class PatchLicenseDetailsDto {
  @ApiPropertyOptional({ enum: LicensePurpose, example: LicensePurpose.SELF_PROTECTION, description: 'Need for license' })
  @IsOptional()
  @Transform(({ value }) => normalizeLicensePurpose(value))
  @IsEnum(LicensePurpose)
  needForLicense?: LicensePurpose;

  @ApiPropertyOptional({ enum: ArmsCategory, example: ArmsCategory.RESTRICTED, description: 'Arms category' })
  @IsOptional()
  @IsEnum(ArmsCategory)
  armsCategory?: ArmsCategory;

  @ApiPropertyOptional({ example: [1, 2, 3], description: 'Array of requested weapon type master IDs' })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  requestedWeaponIds?: number[];

  @ApiPropertyOptional({ example: 'District-wide', description: 'Area of validity for the license' })
  @IsOptional()
  @IsString()
  areaOfValidity?: string;

  @ApiPropertyOptional({ example: '50 rounds of .32 ammunition', description: 'Description of ammunition required' })
  @IsOptional()
  @IsString()
  ammunitionDescription?: string;

  @ApiPropertyOptional({ example: 'Required for personal protection due to threats', description: 'Special consideration reason' })
  @IsOptional()
  @IsString()
  specialConsiderationReason?: string;

  @ApiPropertyOptional({ example: 'Urban areas of Kolkata district', description: 'Place/area for which licence is sought (Form IV)' })
  @IsOptional()
  @IsString()
  licencePlaceArea?: string;

  @ApiPropertyOptional({ example: 'Wild boars, leopards as per Wildlife Protection Act Schedule', description: 'Specification of wild beasts permitted to be destroyed' })
  @IsOptional()
  @IsString()
  wildBeastsSpecification?: string;
}