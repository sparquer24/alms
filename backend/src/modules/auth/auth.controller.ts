import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Get, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginRequest } from '../../request/auth';
import { LoginResponse, UserProfileResponse } from '../../response/auth';
import { AuthGuard } from '../../middleware/auth.middleware';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Login endpoint
   * @param loginData - Login credentials
   * @returns Authentication response with token
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'User Login', 
    description: 'Authenticate user with username and password to get JWT token' 
  })
  @ApiBody({ 
    type: LoginRequest,
    description: 'User login credentials',
    examples: {
      'DCP User': {
        value: { username: 'dcp_user', password: '1234' }
      },
      'ACP User': {
        value: { username: 'acp_user', password: '1234' }
      },
      'SHO User': {
        value: { username: 'sho_user', password: '1234' }
      },
      'Applicant': {
        value: { username: 'applicant_user', password: '1234' }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful',
    type: LoginResponse,
    example: {
      success: true,
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      user: {
        id: '1',
        username: 'dcp_user',
        email: 'dcp@example.com',
        role: 'DCP'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async login(@Body() loginData: LoginRequest): Promise<LoginResponse> {
    console.log('🚀 AuthController: Login request received for username:', loginData.username);
    try {
      const result = await this.authService.authenticateUser(loginData);
      console.log('✅ AuthController: Login successful for username:', loginData.username);
      return result;
    } catch (error) {
      console.error('❌ AuthController: Login failed for username:', loginData.username, error);
      throw error;
    }
  }

  /**
   * Get user profile (protected route)
   * @param req - Request object with user data
   * @returns User profile information
   */
  @Get('getMe')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Get Current User Profile', 
    description: 'Get the profile information of the currently authenticated user' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User profile retrieved successfully',
    type: UserProfileResponse,
    example: {
      id: '1',
      username: 'dcp_user',
      email: 'dcp@example.com',
      createdAt: '2025-08-20T12:00:00.000Z',
      updatedAt: '2025-08-20T12:00:00.000Z'
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token' })
  async getProfile(@Request() req: any): Promise<UserProfileResponse> {
    const user = req.user;
    
    return {
      id: user.sub,
      username: user.username,
      email: user.email,
      createdAt: new Date(), // TODO: Get from database
      updatedAt: new Date()  // TODO: Get from database
    };
  }

  /**
   * Verify token endpoint
   * @param req - Request object with user data
   * @returns Token verification status
   */
  @Get('verify')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Verify JWT Token', 
    description: 'Verify if the provided JWT token is valid and return user information' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Token is valid',
    example: {
      valid: true,
      user: {
        sub: '1',
        username: 'dcp_user',
        email: 'dcp@example.com',
        role: 'DCP'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token' })
  async verifyToken(@Request() req: any): Promise<{ valid: boolean; user: any }> {
    return {
      valid: true,
      user: req.user
    };
  }
}
