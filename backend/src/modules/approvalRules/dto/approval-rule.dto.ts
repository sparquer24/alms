import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';

export const RULE_APPLICATION_TYPES = ['ALL', 'FRESH', 'RENEWAL'] as const;
export const RULE_PURPOSES = ['ALL', 'SELF_PROTECTION', 'SPORTS', 'HEIRLOOM_POLICY', 'CROP_PROTECTION'] as const;
export const RULE_AREAS = ['DISTRICT', 'STATE', 'INDIA'] as const;
export const RULE_DECISIONS = ['APPROVE', 'RECOMMEND'] as const;

export class UpsertApprovalRuleDto {
  @ApiProperty({ enum: RULE_APPLICATION_TYPES, default: 'ALL' })
  @IsIn(RULE_APPLICATION_TYPES as unknown as string[])
  applicationType!: (typeof RULE_APPLICATION_TYPES)[number];

  @ApiPropertyOptional({ description: 'Null for the all-states default (Super Admin only)', nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  stateId?: number | null;

  @ApiPropertyOptional({ description: 'Null for a state-wide rule', nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  districtId?: number | null;

  @ApiProperty({ enum: RULE_PURPOSES, description: 'Need for license, or ALL' })
  @IsIn(RULE_PURPOSES as unknown as string[])
  purpose!: (typeof RULE_PURPOSES)[number];

  @ApiProperty({ enum: RULE_AREAS, description: 'Area of validity' })
  @IsIn(RULE_AREAS as unknown as string[])
  area!: (typeof RULE_AREAS)[number];

  @ApiProperty({ description: 'Role that makes the final decision' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  approverRoleId!: number;

  @ApiProperty({ enum: RULE_DECISIONS, description: 'APPROVE = approve/reject locally, RECOMMEND = recommend/not recommend' })
  @IsIn(RULE_DECISIONS as unknown as string[])
  decision!: (typeof RULE_DECISIONS)[number];
}
