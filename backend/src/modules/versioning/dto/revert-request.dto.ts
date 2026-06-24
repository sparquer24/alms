import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MinLength, Min } from 'class-validator';
import { ApplicationType } from '@prisma/client';

export class RevertRequestDto {
  @IsEnum(ApplicationType, { message: 'applicationType must be FRESH or RENEWAL' })
  applicationType!: ApplicationType;

  @IsInt()
  @Min(1, { message: 'targetVersionNumber must be at least 1' })
  targetVersionNumber!: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'reason must be at least 10 characters' })
  reason!: string;

  /** Required only when reverting a terminal status (ADMIN / SUPER_ADMIN only) */
  @IsOptional()
  @IsString()
  escalationDocumentUrl?: string;

  /**
   * Optimistic lock guard — the frontend sends the current version it knows about.
   * If it doesn't match the DB value the revert is rejected to prevent lost-update bugs.
   */
  @IsOptional()
  @IsInt()
  expectedCurrentVersion?: number;
}
