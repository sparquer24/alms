import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class ForwardDto {
  @IsString()
  @IsNotEmpty()
  applicationId!: string;

  @IsString()
  @IsNotEmpty()
  actionType!: 'forward' | 'reject' | 'ground_report';

  @IsString()
  @IsOptional()
  nextUserId?: string;

  @IsString()
  @IsNotEmpty()
  remarks!: string;
}
