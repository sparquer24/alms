import { IsNotEmpty, IsString, IsEnum, IsNumber } from 'class-validator';
import { FileType } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class PatchRenewalBiometricDataDto {
  @ApiProperty({ description: 'Biometric data in JSON format (signature, photo, iris, fingerprint)' })
  @IsNotEmpty()
  biometricData!: Record<string, any>;
}

export class UploadRenewalFileDto {
  @ApiProperty({ 
    enum: ['AADHAR_CARD', 'PAN_CARD', 'TRAINING_CERTIFICATE', 'OTHER_STATE_LICENSE', 'EXISTING_LICENSE', 'SAFE_CUSTODY', 'MEDICAL_REPORT', 'REJECTED_LICENSE', 'CLAIM_DOCS', 'SIGNATURE_THUMB', 'PHOTOGRAPH', 'IRIS_SCAN', 'OTHER'],
    description: 'File type' 
  })
  @IsNotEmpty()
  @IsEnum(['AADHAR_CARD', 'PAN_CARD', 'TRAINING_CERTIFICATE', 'OTHER_STATE_LICENSE', 'EXISTING_LICENSE', 'SAFE_CUSTODY', 'MEDICAL_REPORT', 'REJECTED_LICENSE', 'CLAIM_DOCS', 'SIGNATURE_THUMB', 'PHOTOGRAPH', 'IRIS_SCAN', 'OTHER'])
  fileType!: string;

  @ApiProperty({ example: 'https://s3.amazonaws.com/file.pdf', description: 'File URL' })
  @IsNotEmpty()
  @IsString()
  fileUrl!: string;

  @ApiProperty({ example: 'document.pdf', description: 'File name' })
  @IsNotEmpty()
  @IsString()
  fileName!: string;

  @ApiProperty({ example: 5242880, description: 'File size in bytes' })
  @IsNotEmpty()
  @IsNumber()
  fileSize!: number;
}

export class UploadRenewalFileResponseDto {
  id?: number;
  applicationId?: number;
  fileType?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  uploadedAt?: Date;
}
