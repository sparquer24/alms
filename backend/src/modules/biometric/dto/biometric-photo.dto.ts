import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ValidateBiometricPhotoDto {
  @ApiProperty({
    description: 'Number of detected faces from client-side vision model (must be 1)',
    example: 1,
    required: false,
  })
  @IsOptional()
  faceCount?: number | string;

  @ApiProperty({
    description: 'Base64 encoded image string (if uploading via JSON)',
    example: 'data:image/jpeg;base64,...',
    required: false,
  })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({
    description: 'Application ID to associate photograph with',
    example: 123,
    required: false,
  })
  @IsOptional()
  applicationId?: number | string;

  @ApiProperty({
    description: 'Application type (Fresh or Renewal)',
    example: 'Fresh',
    required: false,
  })
  @IsOptional()
  @IsString()
  applicationType?: string;

  @ApiProperty({
    description: 'Timestamp when photograph was captured',
    example: '2026-11-20T10:30:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsString()
  capturedAt?: string;
}

export class BiometricPhotoMetadataDto {
  @ApiProperty({ example: 'jpeg' })
  format!: string;

  @ApiProperty({ example: 1280 })
  width!: number;

  @ApiProperty({ example: 720 })
  height!: number;

  @ApiProperty({ example: 184320 })
  size!: number;

  @ApiProperty({ example: 1 })
  faceCount!: number;

  @ApiProperty({ example: '2026-11-20T10:30:00.000Z' })
  capturedAt!: string;

  @ApiProperty({ example: '2026-11-20T10:30:02.000Z' })
  uploadedAt!: string;
}

export class BiometricPhotoResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'BIOMETRIC_ACCEPTED' })
  status!: string;

  @ApiProperty({ example: 'Biometric photograph captured, validated, and saved successfully.' })
  message!: string;

  @ApiProperty({ example: 'uploads/accepted/BIOMETRIC/a8e0f031-158d-4a11-8930-4e5cb406e236.jpg', required: false })
  filePath?: string;

  @ApiProperty({ example: 42, required: false })
  fileId?: number;

  @ApiProperty({ example: 'data:image/jpeg;base64,...', required: false })
  fileUrl?: string;

  @ApiProperty({ type: BiometricPhotoMetadataDto, required: false })
  metadata?: BiometricPhotoMetadataDto;
}
