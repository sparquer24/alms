import { IsOptional, IsString, IsNumber, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class GetRenewalApplicationsDto {
  @ApiPropertyOptional({ example: 1, description: 'Page number' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, description: 'Limit per page' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({ example: 'Sharma', description: 'Search by name, license number, or acknowledgement number' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'APPROVED', description: 'Filter by status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 1, description: 'Filter by current user ID' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  currentUserId?: number;

  @ApiPropertyOptional({ example: 60, description: 'Filter by license ID' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  licenseId?: number;

  @ApiPropertyOptional({ example: 'ASC', description: 'Sort order', enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  ordering?: 'ASC' | 'DESC' = 'DESC';

  @ApiPropertyOptional({ example: 'createdAt', description: 'Order by field' })
  @IsOptional()
  @IsString()
  orderBy?: string = 'createdAt';
}
