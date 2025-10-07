import { IsOptional, IsEnum, IsString, IsArray, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { LicensePurpose, ArmsCategory } from '@prisma/client';

export class PatchLicenseDetailsDto {
  @ApiPropertyOptional({ enum: LicensePurpose, example: LicensePurpose.SELF_PROTECTION, description: 'Need for license' })
  @IsOptional()
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