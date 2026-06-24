import { Module } from '@nestjs/common';
import { WorkflowController } from './workflow.controller';
import { WorkflowController as WorkflowStatusesActionsController } from './workflow.statuses-actions.controller';
import { WorkflowService } from './workflow.service';
import { VersioningModule } from '../versioning/versioning.module';

@Module({
  imports: [VersioningModule],
  controllers: [WorkflowController, WorkflowStatusesActionsController],
  providers: [WorkflowService],
})
export class WorkflowModule {}
