import { Module } from '@nestjs/common';
import { WorkflowController } from './workflow.controller';
import { WorkflowController as WorkflowStatusesActionsController } from './workflow.statuses-actions.controller';
import { WorkflowService } from './workflow.service';

@Module({
  controllers: [WorkflowController, WorkflowStatusesActionsController],
  providers: [WorkflowService],
})
export class WorkflowModule {}
