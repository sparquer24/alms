import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, Min } from 'class-validator';

export class MergeLicenseDto {
  @ApiProperty({
    description: 'License ID to merge into (was freshLicenseId)',
    type: Number,
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  licenseId!: number;

  @ApiProperty({
    description: 'Renewal License Application ID to merge from',
    type: Number,
    example: 5,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  renewalLicenseId!: number;
}

export class MergeResponseDataDto {
  @ApiProperty({
    description: 'Unique merge identifier',
    type: String,
    example: 'MERGE-1715754373000-12345678',
  })
  mergeId!: string;

  @ApiProperty({
    description: 'License ID that was merged into',
    type: Number,
    example: 1,
  })
  licenseId!: number;

  @ApiProperty({
    description: 'Renewal License ID that was merged from',
    type: Number,
    example: 5,
  })
  renewalLicenseId!: number;

  @ApiProperty({
    description: 'List of fields that were merged',
    type: [String],
    example: ['firstName', 'lastName', 'dateOfBirth', 'aadharNumber'],
  })
  mergedFields!: string[];

  @ApiProperty({
    description: 'Timestamp when merge was performed',
    type: Date,
  })
  mergedAt!: Date;

  @ApiProperty({
    description: 'User ID who performed the merge',
    type: Number,
    example: 2,
  })
  mergedBy!: number;

  @ApiProperty({
    description: 'Updated fresh license details',
    type: Object,
  })
  freshLicenseUpdated!: any;
  @ApiProperty({
    description: 'Created license ID in Licenses table (if created)',
    type: Number,
    example: 123,
  })
  createdLicenseId?: number;
}

export class MergeResponseDto {
  @ApiProperty({
    description: 'Success flag',
    type: Boolean,
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    description: 'Response message',
    type: String,
    example: 'Renewal license successfully merged into fresh license',
  })
  message!: string;

  @ApiProperty({
    description: 'Merge operation data',
    type: MergeResponseDataDto,
  })
  data!: MergeResponseDataDto;
}
