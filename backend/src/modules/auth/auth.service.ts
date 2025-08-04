import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { LoginRequest } from '../../request/auth';
import { LoginResponse } from '../../response/auth';
import { ERROR_MESSAGES } from '../../constants/auth';
// If you have already set up Prisma, import it from the correct path:
import prisma from '../../db/prismaClient';

@Injectable()
export class AuthService {
  private readonly jwtSecret = process.env.JWT_SECRET;

  constructor() {
    if (!this.jwtSecret) {
      throw new Error('JWT_SECRET environment variable is not defined');
    }
  }

  /**
   * Authenticate user with username and password
   * @param loginData - Login credentials
   * @returns Authentication result with token
   */
  async authenticateUser(loginData: LoginRequest): Promise<LoginResponse> {
    const { username, password } = loginData;

    try {
      // For now, using dummy validation
      const user = await this.validateUser(username, password);
      
      if (!user) {
        throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS);
      }

      // Generate JWT token
      const token = this.generateToken(user);

      return {
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      };
    } catch (error) {
      // Log the real error for debugging
      // eslint-disable-next-line no-console
      console.error('AuthService.authenticateUser error:', error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new Error(ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Validate user credentials
   * TODO: Implement actual database validation
   * @param username - Username
   * @param password - Password
   * @returns User data or null
   */
  private async validateUser(username: string, password: string): Promise<any> {
    // Check user credentials against the database
    const user = await prisma.users.findUnique({
      where: { username },
    });

    // If user not found or password does not match, return null
    if (!user || user.password !== password) {
      return null;
    }

    // Return user data
    return {
      id: user.id,
      username: user.username,
      email: user.email
    };
  }

  /**
   * Generate JWT token for user
   * @param user - User data
   * @returns JWT token
   */
  private generateToken(user: any): string {
    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email
    };

    return jwt.sign(payload, this.jwtSecret!, { 
      expiresIn: '24h' 
    });
  }

  /**
   * Verify JWT token
   * @param token - JWT token
   * @returns Decoded token payload
   */
  verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.jwtSecret!);
    } catch (error) {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_TOKEN);
    }
  }
}
