import { Module } from '@nestjs/common';
import { WorkflowMasterController } from './workflow-master.controller';
import { WorkflowMasterService } from './workflow-master.service';

@Module({
  controllers: [WorkflowMasterController],
  providers: [WorkflowMasterService],
  exports: [WorkflowMasterService],
})
export class WorkflowMasterModule {}
