import { IsOptional, IsString, IsNotEmpty, IsEnum, IsDateString } from 'class-validator';
import { Sex } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRenewalPersonalDetailsDto {
  @ApiProperty({ example: 'ALMS-LIC-2023-001', description: 'Existing license number' })
  @IsNotEmpty()
  @IsString()
  licenseNumber!: string;

  @ApiPropertyOptional({ example: 'RENEWAL-2024-001', description: 'Acknowledgement number (optional, unique)' })
  @IsOptional()
  @IsString()
  acknowledgementNo?: string;

  @ApiProperty({ example: 'XYZ', description: 'Applicant first name' })
  @IsNotEmpty()
  @IsString()
  firstName!: string;

  @ApiPropertyOptional({ example: 'K', description: 'Applicant middle name' })
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiProperty({ example: 'Sharma', description: 'Applicant last name' })
  @IsNotEmpty()
  @IsString()
  lastName!: string;

  @ApiProperty({ example: 'Ramesh Sharma', description: "Parent or spouse's name" })
  @IsNotEmpty()
  @IsString()
  parentOrSpouseName!: string;

  @ApiProperty({ enum: ['MALE', 'FEMALE', 'OTHER'], description: 'Applicant sex' })
  @IsNotEmpty()
  @IsEnum(['MALE', 'FEMALE', 'OTHER'])
  sex!: 'MALE' | 'FEMALE' | 'OTHER';

  @ApiPropertyOptional({ example: '1985-05-15', description: 'Date of birth' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'Fifteenth May Nineteen Eighty Five', description: 'DOB in words' })
  @IsOptional()
  @IsString()
  dobInWords?: string;

  @ApiPropertyOptional({ example: 'ABCPD1234F', description: 'PAN number' })
  @IsOptional()
  @IsString()
  panNumber?: string;

  @ApiPropertyOptional({ example: '123456789012', description: 'Aadhar number (12 digits)' })
  @IsOptional()
  @IsString()
  aadharNumber?: string;

  @ApiPropertyOptional({ description: 'User ID who is filling the form' })
  @IsOptional()
  filledBy?: string;
}
