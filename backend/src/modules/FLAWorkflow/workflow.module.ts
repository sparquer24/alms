import { Module, forwardRef } from '@nestjs/common';
import { WorkflowController } from './workflow.controller';
import { WorkflowController as WorkflowStatusesActionsController } from './workflow.statuses-actions.controller';
import { WorkflowService } from './workflow.service';
import { CancelWorkflowHandler } from './handlers/cancel-workflow.handler';
import { LicensesModule } from '../licenses/licenses.module';
import { PrismaService } from '../../services/prisma.service';

@Module({
  imports: [LicensesModule],
  controllers: [WorkflowController, WorkflowStatusesActionsController],
  providers: [WorkflowService, CancelWorkflowHandler, PrismaService],
})
export class WorkflowModule {}
