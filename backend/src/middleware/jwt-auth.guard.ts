import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
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
      
      // Attach decoded JWT payload with mapped fields for easier access
      request.user = {
        ...decoded,
        // Map JWT payload fields to controller-friendly names
        userId: decoded.user_id,
        roleId: decoded.role_id,
        stateId: decoded.state_id,
        districtId: decoded.district_id,
        zoneId: decoded.zone_id,
        roleCode: decoded.role_code,
      };
      
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
