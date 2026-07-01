import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsIn, IsOptional, MaxLength, MinLength } from 'class-validator';

export class CancelRequestActionDto {
  @ApiProperty({
    description: 'Action to perform on the cancel request',
    example: 'APPROVED',
    enum: ['APPROVED', 'REJECTED'],
  })
  @IsNotEmpty()
  @IsString()
  @IsIn(['APPROVED', 'REJECTED'])
  action!: string;

  @ApiPropertyOptional({
    description: 'Remarks for the action (required when rejecting)',
    example: 'Cancellation approved. Application will be marked as cancelled.',
    type: String,
  })
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  remarks?: string;
}

export class CancelRequestActionResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Cancel request approved. Application has been cancelled.' })
  message!: string;

  @ApiProperty({
    example: {
      id: 1,
      freshLicenseId: 123,
      applicationType: 'FreshLicenseApplicationForm',
      status: 'APPROVED',
      actionedBy: 2,
      actionedDate: '2025-08-20T12:00:00.000Z',
      cancelActionResponse: {
        success: true,
        message: 'cancel performed successfully.',
      },
    },
  })
  data!: any;
}
