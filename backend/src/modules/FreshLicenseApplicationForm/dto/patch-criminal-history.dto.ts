import { IsBoolean, IsString, IsDateString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JsonArray } from '@prisma/client/runtime/library';

export class PatchCriminalHistoryDto {
  // (a) Convicted
  @ApiProperty({ example: false, description: 'Whether the applicant has been convicted' })
  @IsBoolean()
  isConvicted!: boolean;

  @ApiPropertyOptional({
    example: [{ firNumber: '123/2018', underSection: '35', policeStation: 'Central PS', unit: '2/3', District: 'Hyderabad', state: 'Telangana', offence: '', sentence: '', DateOfSentence: '2020-07-10T00:00:00.000Z' }],
    description: 'FIR details (required if convicted)',
    type: 'array',
    items: { type: 'object' }
  })
  @IsOptional()
  @IsArray()
  // `JsonArray` from Prisma represents a JSON array; stored as array of objects in FIR details
  firDetails?: JsonArray;

  // (b) Ordered to execute a bond
  @ApiProperty({ example: false, description: 'Whether ordered to execute a bond' })
  @IsBoolean()
  isBondExecuted!: boolean;

  @ApiPropertyOptional({ example: '2019-03-20T00:00:00.000Z', description: 'Date of bond (required if bond executed)' })
  @IsOptional()
  @IsDateString()
  bondDate?: string;

  @ApiPropertyOptional({ example: '6 months', description: 'Bond period (required if bond executed)' })
  @IsOptional()
  @IsString()
  bondPeriod?: string;

  // (c) Prohibited under Arms Act
  @ApiProperty({ example: false, description: 'Whether prohibited under Arms Act' })
  @IsBoolean()
  isProhibited!: boolean;

  @ApiPropertyOptional({ example: '2020-07-10T00:00:00.000Z', description: 'Date of prohibition (required if prohibited)' })
  @IsOptional()
  @IsDateString()
  prohibitionDate?: string;

  @ApiPropertyOptional({ example: '5 years', description: 'Prohibition period (required if prohibited)' })
  @IsOptional()
  @IsString()
  prohibitionPeriod?: string;
}