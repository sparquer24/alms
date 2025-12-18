import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { LoginRequest } from '../../request/auth';
import { LoginResponse } from '../../response/auth';
import { ERROR_MESSAGES } from '../../constants/auth';
// If you have already set up Prisma, import it from the correct path:
import prisma from '../../db/prismaClient';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
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
      // For now, using dummy validation
      const user = await this.validateUser(username, password);

      if (!user) {
        throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS);
      }

      // If the user's role exists but is not active, reject login
      if (user.role && typeof user.role.is_active !== 'undefined' && !user.role.is_active) {
        // Build a helpful identifier for the inactive role (prefer code, then name, then id)
        const roleIdent = user.role.code ?? user.role.name ?? (user.role.id ? String(user.role.id) : 'unknown');
        throw new UnauthorizedException(`${ERROR_MESSAGES.ROLE_INACTIVE}: ${roleIdent}`);
      }

      // Generate JWT token
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

      return response;
    } catch (error: any) {
      // Log the real error for debugging
      this.logger.error(`Authentication failed for user: ${username}`, error?.stack || error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new Error(error?.message || ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
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
      // Check user credentials against the database
      // cast prisma to any to allow selecting newly added role configuration fields
      const user = await (prisma as any).users.findFirst({
        where: { username },
        select: {
          id: true,
          username: true,
          email: true,
          password: true,
          role: {
            select: {
              id: true,
              code: true,
              name: true,
              is_active: true,
              created_at: true,
              updated_at: true,
              dashboard_title: true,
              menu_items: true,
              permissions: true,
              can_access_settings: true,
              can_forward: true,
              can_re_enquiry: true,
              can_generate_ground_report: true,
              can_FLAF: true,
              can_create_freshLicence: true,
            }
          },
        }
      } as any);

      // If user not found, return null
      if (!user) {
        return null;
      }

      // Verify password using bcrypt
      const isPasswordValid = await this.verifyPassword(password, user.password);

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

      return userData;
    } catch (error) {
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

  /**
   * Get user by id including role and location hierarchy
   * @param userId - numeric user id
   * @returns user with role, state, district, division, zone and policeStation
   */
  async getUserWithLocation(userId: number) {
    return await (prisma as any).users.findUnique({
      where: { id: Number(userId) },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: {
            id: true,
            code: true,
            name: true,
            is_active: true,
            created_at: true,
            updated_at: true,
            dashboard_title: true,
            menu_items: true,
            permissions: true,
            can_access_settings: true,
            can_forward: true,
            can_re_enquiry: true,
            can_generate_ground_report: true,
            can_FLAF: true,
            can_create_freshLicence: true,
          }
        },
        state: { select: { id: true, name: true } },
        district: { select: { id: true, name: true } },
        division: { select: { id: true, name: true } },
        zone: { select: { id: true, name: true } },
        policeStation: { select: { id: true, name: true } },
      },
    } as any);
  }
}
