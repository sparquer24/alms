import { IsOptional, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PatchAddressDetailsDto } from './patch-address-details.dto';
import { PatchOccupationBusinessDto } from './patch-occupation-business.dto';
import { PatchCriminalHistoryDto } from './patch-criminal-history.dto';
import { PatchLicenseHistoryDto } from './patch-license-history.dto';
import { PatchLicenseDetailsDto } from './patch-license-details.dto';

export class PatchApplicationDetailsDto {
  @ApiPropertyOptional({ 
    type: PatchAddressDetailsDto,
    description: 'Present address details with contact information' 
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PatchAddressDetailsDto)
  presentAddress?: PatchAddressDetailsDto;

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
}