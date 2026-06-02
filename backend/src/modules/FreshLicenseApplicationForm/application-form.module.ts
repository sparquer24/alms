import { Module } from '@nestjs/common';
import { ApplicationHierarchyController } from './application-hierarchy.controller';
import { ApplicationFormController } from './application-form.controller';
import { ApplicationFormService } from './application-form.service';

@Module({
  controllers: [ApplicationFormController, ApplicationHierarchyController],
  providers: [ApplicationFormService],
  exports: [ApplicationFormService],
})
export class ApplicationFormModule {}
