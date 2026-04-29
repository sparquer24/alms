import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { Sex } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PatchRenewalPersonalDetailsDto {
  @ApiPropertyOptional({ example: 'XYZ', description: 'Applicant first name' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'K', description: 'Applicant middle name' })
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiPropertyOptional({ example: 'Sharma', description: 'Applicant last name' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: 'Ramesh Sharma', description: "Parent or spouse's name" })
  @IsOptional()
  @IsString()
  parentOrSpouseName?: string;

  @ApiPropertyOptional({ enum: ['MALE', 'FEMALE', 'OTHER'], description: 'Applicant sex' })
  @IsOptional()
  @IsEnum(['MALE', 'FEMALE', 'OTHER'])
  sex?: 'MALE' | 'FEMALE' | 'OTHER';

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

  @ApiPropertyOptional({ example: '123456789012', description: 'Aadhar number' })
  @IsOptional()
  @IsString()
  aadharNumber?: string;
}
