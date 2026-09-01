import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional,  ValidateNested, IsArray, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PatchRenewalPersonalDetailsDto } from './patch-personal-details.dto';
import { PatchRenewalAddressDetailsDto } from './patch-address-details.dto';
import { PatchRenewalOccupationBusinessDto } from './patch-occupation-business.dto';
import { PatchRenewalLicenseDetailsDto } from './patch-license-details.dto';
import { PatchRenewalCriminalHistoryDto } from './patch-renewal-criminal-history.dto';
import { PatchRenewalLicenseHistoryDto } from './patch-renewal-license-history.dto';
import { PatchRenewalBiometricDataDto } from './patch-renewal-biometric-data.dto';

class RenewalAcceptanceFlagsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDeclarationAccepted?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isAwareOfLegalConsequences?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isTermsAccepted?: boolean;
}

export class PatchRenewalApplicationDetailsDto {
  @ApiPropertyOptional({ example: 123, description: 'ID of the license record this renewal is linked to' })
  @IsOptional()
  @IsNumber()
  licenseId?: number;

  @ApiPropertyOptional({ example: 'ALMS-LIC-2023-001', description: 'License number for the renewal' })
  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @ApiPropertyOptional({ description: 'Personal details to update' })
  @IsOptional()
  @ValidateNested()
  @Type(() => PatchRenewalPersonalDetailsDto)
  personalDetails?: PatchRenewalPersonalDetailsDto;

  @ApiPropertyOptional({ description: 'Address details to update' })
  @IsOptional()
  @ValidateNested()
  @Type(() => PatchRenewalAddressDetailsDto)
  addressDetails?: PatchRenewalAddressDetailsDto;

  @ApiPropertyOptional({ description: 'Occupation and business details to update' })
  @IsOptional()
  @ValidateNested()
  @Type(() => PatchRenewalOccupationBusinessDto)
  occupationAndBusiness?: PatchRenewalOccupationBusinessDto;

  @ApiPropertyOptional({ description: 'License details to update' })
  @IsOptional()
  @ValidateNested()
  @Type(() => PatchRenewalLicenseDetailsDto)
  licenseDetails?: PatchRenewalLicenseDetailsDto;

  @ApiPropertyOptional({
    type: [PatchRenewalCriminalHistoryDto],
    description: 'Criminal history records (replaces all existing records)'
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PatchRenewalCriminalHistoryDto)
  criminalHistories?: PatchRenewalCriminalHistoryDto[];

  @ApiPropertyOptional({
    type: [PatchRenewalLicenseHistoryDto],
    description: 'License history records (replaces all existing records)'
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PatchRenewalLicenseHistoryDto)
  licenseHistories?: PatchRenewalLicenseHistoryDto[];

  @ApiPropertyOptional({ 
    type: PatchRenewalBiometricDataDto,
    description: 'Biometric data (signature, photo, iris scan, fingerprints)' 
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PatchRenewalBiometricDataDto)
  biometricData?: PatchRenewalBiometricDataDto;

  @ApiPropertyOptional({ description: 'Acceptance flags' })
  @IsOptional()
  @ValidateNested()
  @Type(() => RenewalAcceptanceFlagsDto)
  acceptanceFlags?: RenewalAcceptanceFlagsDto;

  @ApiPropertyOptional({ example: true, description: 'Whether to submit the application' })
  @IsOptional()
  @IsBoolean()
  isSubmit?: boolean;
}
