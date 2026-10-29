import { Body, Controller, Delete, Get, Param, ParseIntPipe, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../middleware/auth.middleware';
import { Roles } from '../../decorators/roles.decorator';
import { ApprovalRulesService } from './approval-rules.service';
import { RULE_APPLICATION_TYPES, UpsertApprovalRuleDto } from './dto/approval-rule.dto';

const parseId = (value?: string) => (value != null && value !== '' ? Number(value) : null);

@ApiTags('Approval Rules')
@ApiBearerAuth('JWT-auth')
@Controller('approval-rules')
@UseGuards(AuthGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class ApprovalRulesController {
  constructor(private readonly approvalRulesService: ApprovalRulesService) {}

  @Get()
  @ApiOperation({
    summary: 'Effective approval rules for a location',
    description:
      'For every need-for-license × area of validity: the decision role, whether it approves or only recommends, ' +
      'whether it is set at this scope or inherited, and whether Flow Mapping can reach the decision role.',
  })
  @ApiQuery({ name: 'applicationType', required: false, enum: RULE_APPLICATION_TYPES })
  @ApiQuery({ name: 'stateId', required: false, type: Number })
  @ApiQuery({ name: 'districtId', required: false, type: Number })
  async getGrid(
    @Req() req: any,
    @Query('applicationType') applicationType?: string,
    @Query('stateId') stateId?: string,
    @Query('districtId') districtId?: string,
  ) {
    const type = String(applicationType || 'ALL').toUpperCase();
    const viewType = (RULE_APPLICATION_TYPES as readonly string[]).includes(type) ? type : 'ALL';
    const location = await this.approvalRulesService.authorizeScope(
      req.user,
      parseId(stateId),
      parseId(districtId),
      false,
    );
    const data = await this.approvalRulesService.getGrid({
      applicationType: viewType as 'ALL' | 'FRESH' | 'RENEWAL',
      ...location,
    });
    return { success: true, data };
  }

  @Put()
  @ApiOperation({ summary: 'Set the approval rule at exactly this scope' })
  async upsertRule(@Req() req: any, @Body() dto: UpsertApprovalRuleDto) {
    await this.approvalRulesService.authorizeScope(req.user, dto.stateId ?? null, dto.districtId ?? null, true);
    const userId = Number(req.user?.sub);
    const data = await this.approvalRulesService.upsertRule(dto, Number.isFinite(userId) ? userId : null);
    return { success: true, data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove an approval rule so the scope inherits again' })
  async deleteRule(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const rule = await this.approvalRulesService.getRule(id);
    await this.approvalRulesService.authorizeScope(req.user, rule.stateId, rule.districtId, true);
    await this.approvalRulesService.deleteRule(id);
    return { success: true };
  }
}
