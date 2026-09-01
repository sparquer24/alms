import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCancelRequestDto {
  @ApiPropertyOptional({
    description: 'Updated cancellation reason',
    example: 'Updated: Applicant has submitted a withdrawal request',
    type: String,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  cancellationReason?: string;

  @ApiPropertyOptional({
    description: 'Updated remarks',
    example: 'Supporting documents attached',
    type: String,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  remarks?: string;
}
