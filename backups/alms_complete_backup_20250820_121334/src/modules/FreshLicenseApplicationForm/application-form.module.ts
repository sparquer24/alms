import { Module } from '@nestjs/common';
import { ApplicationFormController } from './application-form.controller';
import { ApplicationFormService } from './application-form.service';

@Module({
  controllers: [ApplicationFormController],
  providers: [ApplicationFormService],
  exports: [ApplicationFormService],
})
export class ApplicationFormModule {}
