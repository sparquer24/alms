import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CaptchaService } from './captcha.service';
import { AuthGuard } from '../../middleware/auth.middleware';
import { Reflector } from '@nestjs/core';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    CaptchaService,
    Reflector,
    {
      provide: AuthGuard,
      useClass: AuthGuard
    }
  ],
  exports: [AuthService, CaptchaService, AuthGuard]
})
export class AuthModule {}
