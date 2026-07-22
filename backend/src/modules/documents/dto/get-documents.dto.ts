import { IsOptional, IsNotEmpty, IsNumber, IsEnum, IsString, Min, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ApplicationType {
  Fresh = 'Fresh',
  Renewal = 'Renewal',
  Cancellation = 'Cancellation',
}

export class GetDocumentsDto {
  @ApiPropertyOptional({
    description: 'Application ID (numeric)',
    example: 123,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Application ID must be a number' })
  @Min(1, { message: 'Application ID must be a positive integer' })
  id?: number;

  @ApiPropertyOptional({
    description: 'Application acknowledgement number (e.g. FALS..., RAF..., CAF...)',
    example: 'FALS1696050000000',
  })
  @IsOptional()
  @IsString({ message: 'Application number must be a string' })
  @IsNotEmpty({ message: 'Application number must not be empty' })
  applicationNumber?: string;

  @ApiProperty({
    description: 'Application type: Fresh, Renewal, or Cancellation',
    example: 'Fresh',
    required: true,
    enum: ApplicationType,
  })
  @IsNotEmpty({ message: 'Application type is required' })
  @IsEnum(ApplicationType, {
    message: 'Invalid application type. Must be one of: Fresh, Renewal, Cancellation',
  })
  type!: ApplicationType;

  /**
   * Custom validation: at least one of `id` or `applicationNumber` must be provided.
   */
  @ValidateIf((o) => !o.id && !o.applicationNumber)
  @IsNotEmpty({ message: 'Either application ID or application number is required' })
  private readonly _atLeastOne!: string;
}
