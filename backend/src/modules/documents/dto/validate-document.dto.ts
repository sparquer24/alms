import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export enum DocumentValidationStatus {
  DOCUMENT_ACCEPTED = 'DOCUMENT_ACCEPTED',
  DOCUMENT_MISMATCH = 'DOCUMENT_MISMATCH',
  REVIEW_REQUIRED = 'REVIEW_REQUIRED',
  UNREADABLE = 'UNREADABLE',
  INVALID_FILE = 'INVALID_FILE',
}

export class ValidateDocumentDto {
  @ApiProperty({
    description: 'Declared / expected document type (e.g. AADHAAR, PAN)',
    example: 'AADHAAR',
  })
  @IsNotEmpty()
  @IsString()
  expectedDocumentType!: string;
}

export class DocumentValidationResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({
    enum: DocumentValidationStatus,
    example: DocumentValidationStatus.DOCUMENT_ACCEPTED,
  })
  status!: DocumentValidationStatus;

  @ApiProperty({ example: 'AADHAAR' })
  expectedType!: string;

  @ApiProperty({ example: 'AADHAAR' })
  detectedType!: string;

  @ApiProperty({ example: 0.85 })
  confidence!: number;

  @ApiProperty({ example: 'Document matches expected type AADHAAR with confidence 0.85' })
  message!: string;

  @ApiProperty({ example: 'uploads/accepted/AADHAAR/abc-123.pdf', required: false })
  filePath?: string;
}
