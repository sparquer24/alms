import { Module } from '@nestjs/common';
import { FlowMappingModule } from '../flowMapping/flow-mapping.module';
import { ApprovalRulesController } from './approval-rules.controller';
import { ApplicationApprovalRuleController } from './application-approval-rule.controller';
import { ApprovalRulesService } from './approval-rules.service';

@Module({
  imports: [FlowMappingModule],
  controllers: [ApplicationApprovalRuleController, ApprovalRulesController],
  providers: [ApprovalRulesService],
  exports: [ApprovalRulesService],
})
export class ApprovalRulesModule {}
