

import { Module } from '@nestjs/common';
import { UserModule } from '../modules/user/user.module';
import { AuthModule } from '../modules/auth/auth.module';
import { ApplicationFormModule } from '../modules/FreshLicenseApplicationForm/application-form.module';

@Module({
  imports: [UserModule, AuthModule, ApplicationFormModule],
})
export class AppModule {}
