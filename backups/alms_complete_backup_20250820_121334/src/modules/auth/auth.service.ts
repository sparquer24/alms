import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { LoginRequest } from '../../request/auth';
import { LoginResponse } from '../../response/auth';
import { ERROR_MESSAGES } from '../../constants/auth';
// If you have already set up Prisma, import it from the correct path:
import prisma from '../../db/prismaClient';

@Injectable()
export class AuthService {
  private readonly jwtSecret = process.env.JWT_SECRET;
  private readonly saltRounds = 12;

  constructor() {
    if (!this.jwtSecret) {
      throw new Error('JWT_SECRET environment variable is not defined');
    }
  }

  /**
   * Hash a password using bcrypt
   * @param password - Plain text password
   * @returns Hashed password
   */
  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Verify a password against a hash
   * @param password - Plain text password
   * @param hash - Hashed password
   * @returns Whether the password matches
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Authenticate user with username and password
   * @param loginData - Login credentials
   * @returns Authentication result with token
   */
  async authenticateUser(loginData: LoginRequest): Promise<LoginResponse> {
    const { username, password } = loginData;

    try {
      console.log('🔐 AuthService: Starting authentication for username:', username);
      
      // For now, using dummy validation
      const user = await this.validateUser(username, password);
      console.log('🔍 AuthService: User validation result:', user ? 'User found' : 'User not found');
      
      if (!user) {
        console.log('❌ AuthService: Invalid credentials for username:', username);
        throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS);
      }

      // Generate JWT token
      console.log('🔑 AuthService: Generating JWT token for user:', user.id);
      const token = this.generateToken(user);
      
      const response = {
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      };
      
      console.log('✅ AuthService: Authentication successful for user:', user.username);
      return response;
    } catch (error) {
      // Log the real error for debugging
      console.error('❌ AuthService.authenticateUser error:', error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new Error(ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Validate user credentials
   * @param username - Username
   * @param password - Password
   * @returns User data or null
   */
  private async validateUser(username: string, password: string): Promise<any> {
    try {
      console.log('🔍 AuthService: Querying database for username:', username);
      
      // Check user credentials against the database
      const user = await prisma.users.findUnique({
        where: { username },
        select: {
          id: true,
          username: true,
          email: true,
          password: true,
          role: true, // Include role details if needed
        }
      });

      console.log('🔍 AuthService: Database query result:', user ? 'User found' : 'User not found');

      // If user not found, return null
      if (!user) {
        return null;
      }

      console.log('🔐 AuthService: Verifying password for user:', username);
      // Verify password using bcrypt
      const isPasswordValid = await this.verifyPassword(password, user.password);
      console.log('🔐 AuthService: Password verification result:', isPasswordValid ? 'Valid' : 'Invalid');
      
      if (!isPasswordValid) {
        return null;
      }

      // Return user data (excluding password)
      const userData = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      };
      
      console.log('✅ AuthService: User validation successful for:', username);
      return userData;
    } catch (error) {
      console.error('❌ AuthService: Database error during user validation:', error);
      throw error;
    }
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
      email: user.email,
      user_id: user.id,
      role_id: user.role?.id // Add role_id to JWT payload
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
