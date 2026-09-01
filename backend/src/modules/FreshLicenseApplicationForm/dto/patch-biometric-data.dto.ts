import { IsOptional, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PatchBiometricDataDto {
  @ApiPropertyOptional({
    description: 'Biometric data object with biometric types as keys (signature, photo, irisScan, fingerprint) containing file metadata',
    example: {
      signature: {
        fileType: 'signature',
        fileName: 'signature.png',
        url: 'https://example.com/uploads/signature.png',
        uploadedAt: '2024-01-15T10:30:00.000Z'
      },
      photo: {
        fileType: 'photo',
        fileName: 'photo.jpg',
        url: 'https://example.com/uploads/photo.jpg',
        uploadedAt: '2024-01-15T10:31:00.000Z'
      },
      irisScan: {
        fileType: 'irisScan',
        fileName: 'iris.png',
        url: 'https://example.com/uploads/iris.png',
        uploadedAt: '2024-01-15T10:32:00.000Z'
      },
      fingerprint: {
        fileType: 'fingerprint',
        fileName: 'fingerprint.png',
        url: 'https://example.com/uploads/fingerprint.png',
        uploadedAt: '2024-01-15T10:33:00.000Z'
      }
    }
  })
  @IsOptional()
  @IsObject()
  biometricData?: any;
}

