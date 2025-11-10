import { IsOptional, ValidateNested, IsArray, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PatchAddressDetailsDto } from './patch-address-details.dto';
import { PatchOccupationBusinessDto } from './patch-occupation-business.dto';
import { PatchCriminalHistoryDto } from './patch-criminal-history.dto';
import { PatchLicenseHistoryDto } from './patch-license-history.dto';
import { PatchLicenseDetailsDto } from './patch-license-details.dto';
import { PatchPersonalDetailsDto } from './patch-personal-details.dto';
import { PatchBiometricDataDto } from './patch-biometric-data.dto';

export class PatchApplicationDetailsDto {
  @ApiPropertyOptional({
    description: 'Workflow status ID to update the application status',
    example: 2,
    type: Number
  })
  @IsOptional()
  @IsNumber()
  workflowStatusId?: number;

  @ApiPropertyOptional({ description: 'Whether the declaration is accepted', example: true })
  @IsOptional()
  isDeclarationAccepted?: boolean;

  @ApiPropertyOptional({ description: 'Whether applicant is aware of legal consequences', example: true })
  @IsOptional()
  isAwareOfLegalConsequences?: boolean;

  @ApiPropertyOptional({ description: 'Whether terms are accepted', example: true })
  @IsOptional()
  isTermsAccepted?: boolean;

  @ApiPropertyOptional({ 
    type: PatchAddressDetailsDto,
    description: 'Present address details with contact information' 
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PatchAddressDetailsDto)
  presentAddress?: PatchAddressDetailsDto;

  @ApiPropertyOptional({
    type: PatchPersonalDetailsDto,
    description: 'Personal details (first name, last name, aadhar, etc.) to update'
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PatchPersonalDetailsDto)
  personalDetails?: PatchPersonalDetailsDto;

  @ApiPropertyOptional({ 
    type: PatchAddressDetailsDto,
    description: 'Permanent address details with contact information' 
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PatchAddressDetailsDto)
  permanentAddress?: PatchAddressDetailsDto;

  @ApiPropertyOptional({ 
    type: PatchOccupationBusinessDto,
    description: 'Occupation and business information' 
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PatchOccupationBusinessDto)
  occupationAndBusiness?: PatchOccupationBusinessDto;

  @ApiPropertyOptional({ 
    type: [PatchCriminalHistoryDto],
    description: 'Criminal history records (replaces all existing records)' 
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PatchCriminalHistoryDto)
  criminalHistories?: PatchCriminalHistoryDto[];

  @ApiPropertyOptional({ 
    type: [PatchLicenseHistoryDto],
    description: 'License history records (replaces all existing records)' 
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PatchLicenseHistoryDto)
  licenseHistories?: PatchLicenseHistoryDto[];

  @ApiPropertyOptional({ 
    type: [PatchLicenseDetailsDto],
    description: 'License details records (replaces all existing records)' 
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PatchLicenseDetailsDto)
  licenseDetails?: PatchLicenseDetailsDto[];

  @ApiPropertyOptional({ 
    type: PatchBiometricDataDto,
    description: 'Biometric data (signature, iris scan, photo, fingerprints)' 
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PatchBiometricDataDto)
  biometricData?: PatchBiometricDataDto;
}