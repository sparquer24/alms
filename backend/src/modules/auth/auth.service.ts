import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { LoginRequest } from '../../request/auth';
import { LoginResponse } from '../../response/auth';
import { ERROR_MESSAGES } from '../../constants/auth';
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

  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.saltRounds);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  async authenticateUser(loginData: LoginRequest): Promise<LoginResponse> {
    const { username, password } = loginData;

    try {
      const user = await this.validateUser(username, password);

      if (!user) {
        throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS);
      }

      if (user.role && typeof user.role.is_active !== 'undefined' && !user.role.is_active) {
        const roleIdent = user.role.code ?? user.role.name ?? (user.role.id ? String(user.role.id) : 'unknown');
        throw new UnauthorizedException(`${ERROR_MESSAGES.ROLE_INACTIVE}: ${roleIdent}`);
      }

      const token = this.generateToken(user);

      const response = {
        success: true,
        token,
        user: {
          id: String(user.id),
          username: user.username,
          email: user.email,
          name: user.name ?? user.username,
          role: user.role
        }
      };

      return response;
    } catch (error: any) {
      this.logger.error(`Authentication failed for user: ${username}`, error?.stack || error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new Error(error?.message || ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
    }
  }

  private async validateUser(username: string, password: string): Promise<any> {
    try {
      const user = await (prisma as any).users.findFirst({
        where: { username },
        select: {
          id: true,
          username: true,
          email: true,
          password: true,
          stateId: true,
          districtId: true,
          zoneId: true,
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
          zone: { select: { id: true, name: true } },
          RangeOffices: { select: { id: true, name: true } }
        }
      } as any);

      if (!user) {
        return null;
      }

      const isPasswordValid = await this.verifyPassword(password, user.password);

      if (!isPasswordValid) {
        return null;
      }

      const stateId = user.state?.id || user.stateId;
      const districtId = user.district?.id || user.districtId;
      const zoneId = user.zone?.id || user.zoneId;
      const rangeOfficeId = user.RangeOffices?.id || user.rangeOfficeId;

      const userData = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        stateId: stateId ? Number(stateId) : undefined,
        districtId: districtId ? Number(districtId) : undefined,
        zoneId: zoneId ? Number(zoneId) : undefined,
        rangeOfficeId: rangeOfficeId ? Number(rangeOfficeId) : undefined
      };

      return userData;
    } catch (error) {
      throw error;
    }
  }

  private generateToken(user: any): string {
    const roleCode = typeof user.role === 'string' ? user.role : user.role?.code;
    const roleId = typeof user.role === 'object' ? user.role?.id : undefined;
    const payload = {
      sub: String(user.id),
      username: user.username,
      email: user.email,
      user_id: user.id,
      role_code: roleCode,
      role_id: roleId,
      role: roleCode,
      state_id: user.stateId,
      district_id: user.districtId,
      zone_id: user.zoneId,
      range_office_id: user.rangeOfficeId,
      name: user.name ?? user.username,
    };

    return jwt.sign(payload, this.jwtSecret!, {
      expiresIn: '24h'
    });
  }

  verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.jwtSecret!);
    } catch (error) {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_TOKEN);
    }
  }

  async refreshToken(oldToken: string): Promise<string> {
    try {
      // Verify the old token is still valid
      const decoded = jwt.verify(oldToken, this.jwtSecret!) as any;

      // Fetch fresh user data from the database
      const user = await (prisma as any).users.findUnique({
        where: { id: Number(decoded.sub) },
        select: {
          id: true,
          username: true,
          email: true,
          role: {
            select: {
              id: true,
              code: true,
              name: true,
              is_active: true,
            },
          },
          stateId: true,
          districtId: true,
          zoneId: true,
          rangeOfficeId: true,
        },
      } as any);

      if (!user) {
        throw new UnauthorizedException('User not found. The account may have been deleted.');
      }

      if (user.role && typeof user.role.is_active !== 'undefined' && !user.role.is_active) {
        throw new UnauthorizedException('User role is inactive. Please contact an administrator.');
      }

      // Generate a new token with fresh data
      const userData = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        stateId: user.stateId,
        districtId: user.districtId,
        zoneId: user.zoneId,
        rangeOfficeId: user.rangeOfficeId,
      };

      return this.generateToken(userData);
    } catch (error: any) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      if (error?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token has expired. Please login again to get a new token.');
      }
      if (error?.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token format. Token may be malformed or corrupted.');
      }
      throw new UnauthorizedException('Failed to refresh token. Please login again.');
    }
  }

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
        RangeOffices: { select: { id: true, name: true } },
      },
    } as any);
  }
}
