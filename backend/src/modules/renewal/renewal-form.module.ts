import { Module } from '@nestjs/common';
import { RenewalFormController } from './renewal-form.controller';
import { RenewalFormService } from './renewal-form.service';

@Module({
  controllers: [RenewalFormController],
  providers: [RenewalFormService],
  exports: [RenewalFormService],
})
export class RenewalFormModule {}
