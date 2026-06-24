// ─── dto/compare-versions.dto.ts ────────────────────────────────────────────

import { IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApplicationType } from '@prisma/client';

export class CompareVersionsDto {
  @IsEnum(ApplicationType, { message: 'applicationType must be FRESH or RENEWAL' })
  applicationType!: ApplicationType;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  fromVersion!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  toVersion!: number;
}
