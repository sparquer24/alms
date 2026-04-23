import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateRenewalWorkflowStatusDto {
  @ApiProperty({ example: 1, description: 'Workflow status ID' })
  @IsNotEmpty()
  @IsNumber()
  workflowStatusId!: number;

  @ApiPropertyOptional({ example: 'Approved for further processing', description: 'Remarks' })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional({ example: 2, description: 'Next user ID' })
  @IsOptional()
  @IsNumber()
  nextUserId?: number;

  @ApiPropertyOptional({ example: 3, description: 'Next role ID' })
  @IsOptional()
  @IsNumber()
  nextRoleId?: number;

  @ApiPropertyOptional({ example: 'FORWARD', description: 'Action taken' })
  @IsOptional()
  @IsString()
  actionTaken?: string;
}
