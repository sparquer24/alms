import { ApiProperty } from '@nestjs/swagger';

export class LoginResponse {
  @ApiProperty({ description: 'Login success status', example: true })
  success!: boolean;

  @ApiProperty({ 
    description: 'JWT token for authentication', 
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' 
  })
  token!: string;

  @ApiProperty({
    description: 'User information',
    example: {
      id: '1',
      username: 'dcp_user',
      email: 'dcp@example.com',
      role: 'DCP'
    }
  })
  user!: {
    id: string;
    username: string;
    email?: string;
    role?: string;
  };
}

export class UserProfileResponse {
  @ApiProperty({ description: 'User ID', example: '1' })
  id!: string;

  @ApiProperty({ description: 'Username', example: 'dcp_user' })
  username!: string;

  @ApiProperty({ description: 'User email', example: 'dcp@example.com', required: false })
  email?: string;

  @ApiProperty({ description: 'Account creation date', example: '2025-08-20T12:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ description: 'Account last update date', example: '2025-08-20T12:00:00.000Z' })
  updatedAt!: Date;
}

export class ErrorResponse {
  @ApiProperty({ description: 'Error status', example: false })
  success!: false;

  @ApiProperty({ description: 'Error message', example: 'Invalid credentials' })
  message!: string;

  @ApiProperty({ description: 'Detailed error information', required: false })
  error?: string;
}
