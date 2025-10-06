import { IsBoolean, IsString, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PatchCriminalHistoryDto {
  // (a) Convicted
  @ApiProperty({ example: false, description: 'Whether the applicant has been convicted' })
  @IsBoolean()
  isConvicted!: boolean;

  @ApiPropertyOptional({ example: 'Theft', description: 'Type of offence (required if convicted)' })
  @IsOptional()
  @IsString()
  offence?: string;

  @ApiPropertyOptional({ example: '2 years imprisonment', description: 'Sentence given (required if convicted)' })
  @IsOptional()
  @IsString()
  sentence?: string;

  @ApiPropertyOptional({ example: '2018-05-15T00:00:00.000Z', description: 'Date of sentence (required if convicted)' })
  @IsOptional()
  @IsDateString()
  dateOfSentence?: string;

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