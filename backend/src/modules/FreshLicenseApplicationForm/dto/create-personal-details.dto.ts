import { IsOptional, IsString, IsNotEmpty, IsEnum, IsDateString, IsNumberString } from 'class-validator';
import { Sex } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePersonalDetailsDto {
  @ApiPropertyOptional({ example: 'ALMS1696050000000', description: 'Acknowledgement number (optional, unique)' })
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

  @ApiPropertyOptional({ example: 'Ramesh Sharma', description: "Parent or spouse's name" })
  @IsOptional()
  @IsString()
  parentOrSpouseName?: string;

  // Who filed the application (preferred/correct spelling)
  @ApiPropertyOptional({ example: 'Self', description: 'Who filled the application' })
  @IsOptional()
  @IsString()
  filledBy?: string;

  @ApiPropertyOptional({ enum: Sex, example: Sex.MALE })
  @IsOptional()
  @IsEnum(Sex)
  sex?: Sex;

  @ApiPropertyOptional({ example: 'Kolkata' })
  @IsOptional()
  @IsString()
  placeOfBirth?: string;

  @ApiPropertyOptional({ example: '1990-05-10T00:00:00.000Z', description: 'ISO date string' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'Tenth May Nineteen Ninety' })
  @IsOptional()
  @IsString()
  dobInWords?: string;

  // Keep aadhar and pan as numeric-strings in the DTO so callers can send them as strings.
  @ApiPropertyOptional({ example: '123456789012', description: 'Aadhar number as 12-digit numeric string' })
  @IsOptional()
  @IsString()
  aadharNumber?: string;

  @ApiPropertyOptional({ example: '123456789', description: 'PAN as numeric string (if stored as number); adjust if alphanumeric' })
  @IsOptional()
  @IsString()
  panNumber?: string;
}
