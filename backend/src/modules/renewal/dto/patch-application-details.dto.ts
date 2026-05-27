import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, ValidateNested } from 'class-validator';
import { PatchRenewalPersonalDetailsDto } from './patch-personal-details.dto';
import { PatchRenewalAddressDetailsDto } from './patch-address-details.dto';
import { PatchRenewalOccupationBusinessDto } from './patch-occupation-business.dto';
import { PatchRenewalLicenseDetailsDto } from './patch-license-details.dto';

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
