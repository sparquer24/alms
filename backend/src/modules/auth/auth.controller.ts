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
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful',
    type: LoginResponse,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async login(@Body() loginData: LoginRequest): Promise<LoginResponse> {
    try {
      const result = await this.authService.authenticateUser(loginData);
      return result;
    } catch (error) {
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
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token' })
  async verifyToken(@Request() req: any): Promise<{ valid: boolean; user: any }> {
    return {
      valid: true,
      user: req.user
    };
  }
}
