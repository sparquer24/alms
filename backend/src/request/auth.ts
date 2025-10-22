import { ApiProperty } from '@nestjs/swagger';

export class LoginRequest {
  @ApiProperty({
    description: 'Username for authentication',
    example: 'dcp_user',
    type: String
  })
  username!: string;

  @ApiProperty({
    description: 'Password for authentication',
    example: '1234',
    type: String
  })
  password!: string;
}
