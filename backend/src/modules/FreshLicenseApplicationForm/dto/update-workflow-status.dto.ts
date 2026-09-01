import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class UpdateWorkflowStatusDto {
  @ApiProperty({
    description: 'Workflow status ID from Statuses table',
    example: 2,
    type: Number
  })
  @IsNotEmpty()
  @IsNumber()
  workflowStatusId!: number;

  @ApiProperty({
    description: 'ID of the user to assign the application to',
    example: 5,
    type: Number
  })
  @IsNotEmpty()
  @IsNumber()
  nextUserId!: number;

  @ApiProperty({
    description: 'Action taken (e.g., "FORWARDED", "APPROVED", "REJECTED")',
    example: 'FORWARDED',
    type: String
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  actionTaken!: string;

  @ApiPropertyOptional({
    description: 'Optional remarks/comments for this workflow transition',
    example: 'Documents verified. Forwarding to next officer for review.',
    type: String
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;

  @ApiPropertyOptional({
    description: 'Action ID from Actiones table (if applicable)',
    example: 1,
    type: Number
  })
  @IsOptional()
  @IsNumber()
  actionId?: number;
}

export class UpdateWorkflowStatusResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Workflow status updated successfully' })
  message!: string;

  @ApiProperty({
    example: {
      applicationId: 123,
      previousUser: { id: 3, username: 'officer1' },
      currentUser: { id: 5, username: 'officer2' },
      workflowStatus: { id: 2, code: 'UNDER_REVIEW', name: 'Under Review' },
      historyId: 15
    }
  })
  data!: any;
}