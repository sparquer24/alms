
import { Module } from '@nestjs/common';
import { UserModule } from '../modules/user/user.module';
import { AuthModule } from '../modules/auth/auth.module';
import { ApplicationFormModule } from '../modules/FreshLicenseApplicationForm/application-form.module';
import { LocationsModule } from '../modules/locations/locations.module';
import { WorkflowModule } from '../modules/FLAWorkflow/workflow.module';
import { StatusModule } from '../modules/status/status.module';
import { ActionesModule } from './actions/actiones.module';
import { WeaponsModule } from './weapons/weapons.module'
import { RolesModule } from './roles/roles.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { FlowMappingModule } from './flowMapping/flow-mapping.module';

@Module({
  imports: [UserModule, WeaponsModule, RolesModule, StatusModule, ActionesModule, AuthModule, ApplicationFormModule, LocationsModule, WorkflowModule, AnalyticsModule, FlowMappingModule],
})
export class AppModule { }
