import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';
import prisma from '../db/prismaClient';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';


@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    // Get token from Authorization header
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authorization header is missing. Please include "Authorization: Bearer <token>" in your request headers.');
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token || token.trim() === '') {
      throw new UnauthorizedException('Authorization token is empty. Please provide a valid JWT token.');
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not defined');
    }

    try {
      const decoded = jwt.verify(token, secret) as any;
      // Fetch user with role and permissions
      const user = await prisma.users.findUnique({
        where: { id: decoded.sub },
        include: {
          role: true, // Include role information
        },
      });
      if (!user) {
        throw new UnauthorizedException('User account not found. The user associated with this token may have been deleted.');
      }

      // Attach user info to request so controllers can access req.user
      request.user = {
        ...decoded,
        roleCode: user.role?.code,
        stateId: user.stateId,
        districtId: user.districtId,
        zoneId: user.zoneId,
        divisionId: user.divisionId,
        policeStationId: user.policeStationId,
        // Add more user info if needed
      };

      // Check role-based access
      const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

      if (requiredRoles && requiredRoles.length > 0) {
        const hasRole = requiredRoles.includes(user.role?.code || '');
        if (!hasRole) {
          throw new ForbiddenException(`Access denied. Required role(s): ${requiredRoles.join(', ')}. Your role: ${user.role?.code || 'none'}`);
        }
      }

      // Check permission-based access
      const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

      return true;
    } catch (error: any) {
      if (error instanceof ForbiddenException || error instanceof UnauthorizedException) {
        throw error;
      }
      
      // Handle specific JWT errors with descriptive messages
      if (error?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Your session has expired. Please login again to get a new token.');
      }
      
      if (error?.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token format. The token may be malformed or corrupted. Please login again.');
      }
      
      if (error?.name === 'NotBeforeError') {
        throw new UnauthorizedException('Token is not yet valid. Please check your system time or wait a moment.');
      }
      
      // Generic fallback for other errors
      throw new UnauthorizedException(`Authentication failed: ${error?.message || 'Invalid or expired token'}`);
    }
  }
}

export function authenticate(request: any): any {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not defined');
  }

  try {
    return jwt.verify(token, secret);
  } catch {
    return null;
  }
}
