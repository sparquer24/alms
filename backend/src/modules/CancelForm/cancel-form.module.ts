import { Module } from '@nestjs/common';
import { CancelFormController } from './cancel-form.controller';
import { CancelFormService } from './cancel-form.service';

@Module({
  controllers: [CancelFormController],
  providers: [CancelFormService],
  exports: [CancelFormService],
})
export class CancelFormModule {}
