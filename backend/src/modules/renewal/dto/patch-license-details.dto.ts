import { IsOptional, IsString, IsEnum, IsArray, IsNumber } from 'class-validator';
import { LicensePurpose, ArmsCategory } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PatchRenewalLicenseDetailsDto {
  @ApiPropertyOptional({ enum: ['SELF_PROTECTION', 'SPORTS', 'HEIRLOOM_POLICY'], description: 'Need for license' })
  @IsOptional()
  @IsEnum(['SELF_PROTECTION', 'SPORTS', 'HEIRLOOM_POLICY'])
  needForLicense?: string;

  @ApiPropertyOptional({ enum: ['RESTRICTED', 'PERMISSIBLE'], description: 'Arms category' })
  @IsOptional()
  @IsEnum(['RESTRICTED', 'PERMISSIBLE'])
  armsCategory?: string;

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

  @ApiPropertyOptional({ example: [1, 2, 3], description: 'Requested weapon type IDs' })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  requestedWeaponIds?: number[];
}
