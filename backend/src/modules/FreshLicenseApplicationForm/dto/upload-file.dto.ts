import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl, IsNumber, Min } from 'class-validator';
import { FileType } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadFileDto {
  @ApiProperty({
    description: 'Type of file being uploaded',
    enum: FileType,
    example: 'AADHAR_CARD'
  })
  @IsNotEmpty()
  @IsEnum(FileType)
  fileType!: FileType;

  @ApiProperty({
    description: 'URL of the uploaded file',
    example: 'https://example.com/files/aadhar_card.pdf'
  })
  @IsNotEmpty()
  @IsString()
  fileUrl!: string;

  @ApiProperty({
    description: 'Original filename',
    example: 'aadhar_card.pdf'
  })
  @IsNotEmpty()
  @IsString()
  fileName!: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 2048576
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  fileSize!: number;

  @ApiPropertyOptional({
    description: 'Additional description or notes for the file',
    example: 'Front side of Aadhar card'
  })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UploadFileResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 123 })
  applicationId!: number;

  @ApiProperty({ enum: FileType, example: 'AADHAR_CARD' })
  fileType!: FileType;

  @ApiProperty({ example: 'aadhar_card.pdf' })
  fileName!: string;

  @ApiProperty({ example: 'uploads/application-123/files/AADHAR_CARD_1696507200000_aadhar_card.pdf' })
  fileUrl!: string;

  @ApiProperty({ example: 2048576 })
  fileSize!: number;

  @ApiProperty({ example: '2023-10-05T12:00:00.000Z' })
  uploadedAt!: Date;
}