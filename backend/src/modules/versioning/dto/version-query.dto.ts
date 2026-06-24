// ─── dto/version-query.dto.ts ───────────────────────────────────────────────

import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApplicationType } from '@prisma/client';

export class VersionQueryDto {
  @IsEnum(ApplicationType, { message: 'applicationType must be FRESH or RENEWAL' })
  applicationType!: ApplicationType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
