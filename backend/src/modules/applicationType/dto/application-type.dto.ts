import { IsString, IsOptional, IsBoolean, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateApplicationTypeDto {
  @ApiProperty({ description: 'Application type name', example: 'TA' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiProperty({ description: 'Application type code', example: 'TA' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  code!: string;

  @ApiPropertyOptional({ description: 'Description', example: 'Temporary Application' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'Active status', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Default positive action', example: 'Approve' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  positiveAction?: string;

  @ApiPropertyOptional({ description: 'Default negative action', example: 'Reject' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  negativeAction?: string;

  @ApiPropertyOptional({ description: 'Default third action', example: 'Re-Enquiry' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  thirdAction?: string;
}

export class UpdateApplicationTypeDto {
  @ApiPropertyOptional({ description: 'Application type name' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'Application type code' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'Active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Default positive action' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  positiveAction?: string;

  @ApiPropertyOptional({ description: 'Default negative action' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  negativeAction?: string;

  @ApiPropertyOptional({ description: 'Default third action' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  thirdAction?: string;
}
