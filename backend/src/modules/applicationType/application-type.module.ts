import { Module } from '@nestjs/common';
import { ApplicationTypeController } from './application-type.controller';
import { ApplicationTypeService } from './application-type.service';

@Module({
  controllers: [ApplicationTypeController],
  providers: [ApplicationTypeService],
  exports: [ApplicationTypeService],
})
export class ApplicationTypeModule {}
