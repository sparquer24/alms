
import { Module } from '@nestjs/common';
import { UserModule } from '../modules/user/user.module';
import { AuthModule } from '../modules/auth/auth.module';
import { ApplicationFormModule } from '../modules/FreshLicenseApplicationForm/application-form.module';
import { LocationsModule } from '../modules/locations/locations.module';
import { WorkflowModule } from '../modules/FLAWorkflow/workflow.module';

@Module({
  imports: [UserModule, AuthModule, ApplicationFormModule, LocationsModule, WorkflowModule],
})
export class AppModule {}
