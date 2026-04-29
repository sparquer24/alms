import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PatchRenewalPersonalDetailsDto } from './patch-personal-details.dto';
import { PatchRenewalAddressDetailsDto } from './patch-address-details.dto';
import { PatchRenewalOccupationBusinessDto } from './patch-occupation-business.dto';
import { PatchRenewalLicenseDetailsDto } from './patch-license-details.dto';

export class PatchRenewalApplicationDetailsDto {
  @ApiPropertyOptional({ description: 'Personal details to update' })
  personalDetails?: PatchRenewalPersonalDetailsDto;

  @ApiPropertyOptional({ description: 'Address details to update' })
  addressDetails?: PatchRenewalAddressDetailsDto;

  @ApiPropertyOptional({ description: 'Occupation and business details to update' })
  occupationAndBusiness?: PatchRenewalOccupationBusinessDto;

  @ApiPropertyOptional({ description: 'License details to update' })
  licenseDetails?: PatchRenewalLicenseDetailsDto;

  @ApiPropertyOptional({ description: 'Acceptance flags' })
  acceptanceFlags?: {
    isDeclarationAccepted?: boolean;
    isAwareOfLegalConsequences?: boolean;
    isTermsAccepted?: boolean;
  };

  @ApiPropertyOptional({ example: true, description: 'Whether to submit the application' })
  isSubmit?: boolean;
}
