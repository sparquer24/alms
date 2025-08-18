import { IsString, IsNotEmpty, IsOptional, IsIn, IsArray, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

class AttachmentDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  type!: string;

  @IsString()
  @IsNotEmpty()
  contentType!: string;

  @IsString()
  @IsNotEmpty()
  url!: string;
}

export class ForwardDto {
  @IsString()
  @IsNotEmpty()
  applicationId!: string;

  // Accept actionId as number
  @IsNotEmpty()
  actionId!: number;

  @IsString()
  @IsOptional()
  nextUserId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  @IsOptional()
  attachments?: AttachmentDto[];

  @IsString()
  @IsNotEmpty()
  remarks!: string;
}
