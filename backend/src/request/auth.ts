import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class LoginRequest {
  @ApiProperty({
    description: 'Username for authentication',
    example: 'dcp_user',
    type: String
  })
  @IsString()
  @IsNotEmpty()
  username!: string;

  @ApiProperty({
    description: 'Password for authentication',
    example: '1234',
    type: String
  })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiProperty({
    description: 'CAPTCHA token ID',
    required: false,
    type: String
  })
  @IsString()
  @IsOptional()
  captchaId?: string;

  @ApiProperty({
    description: 'CAPTCHA code entered by user',
    required: false,
    type: String
  })
  @IsString()
  @IsOptional()
  captchaCode?: string;
}
