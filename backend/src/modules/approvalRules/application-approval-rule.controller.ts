import { BadRequestException, Controller, Get, ParseIntPipe, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../middleware/auth.middleware';
import { normalizeApplicationType } from '../../constants/flow-mapping';
import { DECISION_ACTIONS, resolveApprovalRuleForApplication } from './approval-rules.resolver';

/**
 * Read-only view of the approval rule for one application, for the officers
 * processing it (not admin-only like the rule management API).
 */
@ApiTags('Approval Rules')
@ApiBearerAuth('JWT-auth')
@Controller('approval-rules/application')
@UseGuards(AuthGuard)
export class ApplicationApprovalRuleController {
  @Get()
  @ApiOperation({ summary: 'Who makes the final decision on an application, and whether they approve or recommend' })
  @ApiQuery({ name: 'applicationType', required: true, description: 'FRESH or RENEWAL (aliases accepted)' })
  @ApiQuery({ name: 'applicationId', required: true, type: Number })
  async getForApplication(
    @Req() req: any,
    @Query('applicationType') applicationType: string,
    @Query('applicationId', ParseIntPipe) applicationId: number,
  ) {
    const type = normalizeApplicationType(applicationType);
    if (type !== 'FRESH' && type !== 'RENEWAL') {
      throw new BadRequestException('Approval rules apply to fresh and renewal applications only.');
    }

    const resolved = await resolveApprovalRuleForApplication(type, applicationId);
    if (!resolved) return { success: true, data: null };

    return {
      success: true,
      data: {
        ...resolved,
        decisionActions: DECISION_ACTIONS[resolved.decision],
        isCurrentUserDecisionRole: resolved.approverRoleCode === req.user?.roleCode,
      },
    };
  }
}
