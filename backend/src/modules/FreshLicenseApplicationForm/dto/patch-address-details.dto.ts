import { IsNotEmpty, IsString, IsNumber, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PatchAddressDetailsDto {
  @ApiProperty({ example: '123 Main Street, Block A', description: 'Address line' })
  @IsNotEmpty()
  @IsString()
  addressLine!: string;

  @ApiProperty({ example: 1, description: 'State ID' })
  @IsNotEmpty()
  @IsNumber()
  stateId!: number;

  @ApiProperty({ example: 1, description: 'District ID' })
  @IsNotEmpty()
  @IsNumber()
  districtId!: number;

  @ApiProperty({ example: 1, description: 'Police Station ID' })
  @IsNotEmpty()
  @IsNumber()
  policeStationId!: number;

  @ApiProperty({ example: 1, description: 'Zone ID' })
  @IsNotEmpty()
  @IsNumber()
  zoneId!: number;

  @ApiProperty({ example: 1, description: 'Division ID' })
  @IsNotEmpty()
  @IsNumber()
  divisionId!: number;

  @ApiProperty({ example: '2020-01-15T00:00:00.000Z', description: 'Since when residing at this address' })
  @IsNotEmpty()
  @IsDateString()
  sinceResiding!: string;

  @ApiPropertyOptional({ example: '033-12345678', description: 'Office telephone number' })
  @IsOptional()
  @IsString()
  telephoneOffice?: string;

  @ApiPropertyOptional({ example: '033-87654321', description: 'Residence telephone number' })
  @IsOptional()
  @IsString()
  telephoneResidence?: string;

  @ApiPropertyOptional({ example: '9876543210', description: 'Office mobile number' })
  @IsOptional()
  @IsString()
  officeMobileNumber?: string;

  @ApiPropertyOptional({ example: '9123456789', description: 'Alternative mobile number' })
  @IsOptional()
  @IsString()
  alternativeMobile?: string;
}