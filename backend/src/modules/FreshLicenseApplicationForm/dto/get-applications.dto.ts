import { IsOptional, IsNumber, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class GetApplicationsDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsString()
  searchField?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  orderBy?: string;

  @IsOptional()
  @IsEnum(['ASC', 'DESC'], { message: 'order must be ASC or DESC' })
  order?: 'ASC' | 'DESC';

  @IsOptional()
  @IsString() // e.g. "1,2,3"
  statusId?: string;
}

