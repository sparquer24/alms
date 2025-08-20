import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Get, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginRequest } from '../../request/auth';
import { LoginResponse, UserProfileResponse } from '../../response/auth';
import { AuthGuard } from '../../middleware/auth.middleware';

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
  async verifyToken(@Request() req: any): Promise<{ valid: boolean; user: any }> {
    return {
      valid: true,
      user: req.user
    };
  }
}
