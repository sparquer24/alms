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

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid or missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
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
          role: {}, // Include role information
        },
      });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Attach user info to request so controllers can access req.user
      request.user = {
        ...decoded,
        roleCode: user.role?.code,
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
          throw new ForbiddenException('Insufficient role permissions');
        }
      }

      // Check permission-based access
      const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired token');
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
