import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

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
}
