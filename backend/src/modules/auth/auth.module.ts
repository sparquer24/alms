import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from '../../middleware/auth.middleware';
import { Reflector } from '@nestjs/core';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    Reflector,
    {
      provide: AuthGuard,
      useClass: AuthGuard
    }
  ],
  exports: [AuthService, AuthGuard]
})
export class AuthModule {}
