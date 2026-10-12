import { IsNotEmpty, IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FileType } from '@prisma/client';

export class UploadCancelFileDto {
  @ApiPropertyOptional({ enum: FileType, default: 'OTHER', description: 'File type' })
  @IsOptional()
  @IsEnum(FileType)
  fileType?: FileType;

  @ApiProperty({ example: 'data:application/pdf;base64,JVBERi0xLjQK...', description: 'File content as a data URL' })
  @IsNotEmpty()
  @IsString()
  fileUrl!: string;

  @ApiProperty({ example: 'surrender-letter.pdf', description: 'File name' })
  @IsNotEmpty()
  @IsString()
  fileName!: string;

  @ApiProperty({ example: 524288, description: 'File size in bytes' })
  @IsNotEmpty()
  @IsNumber()
  fileSize!: number;
}
