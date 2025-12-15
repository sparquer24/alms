import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Get, Request, Res, UnauthorizedException } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginRequest } from '../../request/auth';
import { LoginResponse, UserProfileResponse } from '../../response/auth';
import { AuthGuard } from '../../middleware/auth.middleware';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

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
  async login(@Body() loginData: LoginRequest, @Res({ passthrough: true }) res: Response): Promise<any> {
    try {
      const result = await this.authService.authenticateUser(loginData);

      // If the authenticated user payload includes a role, set an HttpOnly
      // role cookie on the response so server-side middleware receives it
      // immediately on subsequent requests. We use passthrough so we can
      // still return the standard LoginResponse object.
      try {
        const roleObj = result?.user?.role;
        const candidate = roleObj?.code ?? roleObj ?? (result?.user as any)?.roleCode ?? (roleObj && roleObj.id ? String(roleObj.id) : null);
        if (candidate) {
          const normalized = String(candidate).toUpperCase();
          // 24 hours
          res.cookie('role', normalized, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000, path: '/', sameSite: 'lax' });
        }
      } catch (cookieErr) {
        // Best-effort: don't fail login if cookie setting fails
        console.warn('Failed to set server-side role cookie:', cookieErr);
      }

      return result;
    } catch (error) {
      // If login failed due to Unauthorized (bad creds or role inactive),
      // return a clean JSON response without Nest's default path/method fields.
      if (error instanceof UnauthorizedException) {
        return res.status(HttpStatus.UNAUTHORIZED).json({ success: false, message: error.message });
      }
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
    const tokenUser = req.user;

    // Fetch full user via AuthService (includes role and location relations)
    const user = await this.authService.getUserWithLocation(Number(tokenUser.sub));

    if (!user) {
      // Fallback to token data if DB lookup fails
      return {
        id: tokenUser.sub,
        username: tokenUser.username,
        email: tokenUser.email,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    return {
      id: String(user.id),
      username: user.username,
      email: user.email ?? undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      role: user.role,
      location: {
        state: user.state ? { id: String(user.state.id), name: user.state.name } : undefined,
        district: user.district ? { id: String(user.district.id), name: user.district.name } : undefined,
        division: user.division ? { id: String(user.division.id), name: user.division.name } : undefined,
        zone: user.zone ? { id: String(user.zone.id), name: user.zone.name } : undefined,
        policeStation: user.policeStation ? { id: String(user.policeStation.id), name: user.policeStation.name } : undefined,
      },
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
