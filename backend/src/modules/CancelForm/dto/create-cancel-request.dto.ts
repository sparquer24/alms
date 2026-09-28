import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateCancelRequestDto {
  @ApiPropertyOptional({
    description: 'ID of the License application to cancel',
    example: 1,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  licenseId?: number;

  @ApiPropertyOptional({
    description: 'License number of the License application to cancel',
    example: 'LUAN2026...',
    type: String,
  })
  @IsOptional()
  @IsString()
  licenseNumber?: string;
  
  @IsNotEmpty()
  @IsString()
  applicantName!: string;

  @ApiProperty({
    description: 'Type of the application (FreshLicenseApplicationForm or RenewalApplicationForm)',
    example: 'FreshLicenseApplicationForm',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  applicationType!: string;

  @ApiProperty({
    description: 'Reason for cancellation',
    example: 'Applicant no longer requires the license',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  cancellationReason!: string;

  @ApiPropertyOptional({
    description: 'Additional remarks or comments',
    example: 'Applicant has moved to another state',
    type: String,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  remarks?: string;
}

export class CreateCancelRequestResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Cancel request submitted successfully' })
  message!: string;

  @ApiProperty({
    example: {
      id: 1,
      licenseId: 123,
      applicationType: 'FreshLicenseApplicationForm',
      cancellationReason: 'Applicant no longer requires the license',
      remarks: 'Applicant has moved to another state',
      status: 'PENDING',
      requestedBy: 1,
      requestedDate: '2025-08-20T12:00:00.000Z',
    },
  })
  data!: any;
}
