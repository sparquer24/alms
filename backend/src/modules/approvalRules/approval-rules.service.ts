import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import prisma from '../../db/prismaClient';
import { FlowMappingService } from '../flowMapping/flow-mapping.service';
import {
  ApprovalRuleCandidate,
  ApprovalRuleContext,
  BUILT_IN_DEFAULT,
  findRulesForLocation,
  pickMostSpecificRule,
  ruleSource,
} from './approval-rules.resolver';
import { RULE_AREAS, RULE_PURPOSES, UpsertApprovalRuleDto } from './dto/approval-rule.dto';

type ViewApplicationType = 'ALL' | 'FRESH' | 'RENEWAL';

export interface ApprovalRuleScope {
  applicationType: ViewApplicationType;
  stateId: number | null;
  districtId: number | null;
}

interface RequestUser {
  roleCode?: string;
  stateId?: number | null;
  districtId?: number | null;
  sub?: number | string;
}

/** Roles that administer the system rather than process applications. */
const NON_DECISION_ROLES = new Set(['ADMIN', 'SUPER_ADMIN', 'APPLICANT']);

@Injectable()
export class ApprovalRulesService {
  constructor(private readonly flowMappingService: FlowMappingService) {}

  /**
   * Resolve the (stateId, districtId) the user may act on. Admins are limited
   * to their assigned state (and district, when they have one); only Super
   * Admin may manage the all-states default. `strict` rejects a request whose
   * scope would otherwise be silently narrowed.
   */
  async authorizeScope(
    user: RequestUser,
    stateId: number | null,
    districtId: number | null,
    strict: boolean,
  ): Promise<{ stateId: number | null; districtId: number | null }> {
    const authorized = await this.flowMappingService.enforceLocationAuthorization(
      user?.roleCode,
      user?.stateId ?? null,
      user?.districtId ?? null,
      stateId,
      districtId,
    );
    if (strict && (authorized.stateId !== stateId || authorized.districtId !== districtId)) {
      throw new ForbiddenException('You can only manage approval rules within your assigned state/district.');
    }
    return authorized;
  }

  /** Roles that can be chosen as the decision role. */
  async listDecisionRoles() {
    const roles = await prisma.roles.findMany({
      select: { id: true, code: true, name: true },
      orderBy: { id: 'asc' },
    });
    return roles.filter((role: { code: string }) => !NON_DECISION_ROLES.has(role.code));
  }

  /**
   * The effective rule for every need-for-license × area combination at a
   * scope, marking which ones are set at this scope and which are inherited,
   * and whether the decision role can be reached through Flow Mapping.
   */
  async getGrid(scope: ApprovalRuleScope) {
    const [rules, roles, reachableRoleIds, builtInRole] = await Promise.all([
      findRulesForLocation(scope),
      this.listDecisionRoles(),
      this.reachableRoleIds(scope),
      prisma.roles.findFirst({
        where: { code: BUILT_IN_DEFAULT.DISTRICT.approverRoleCode },
        select: { id: true, code: true, name: true },
      }),
    ]);
    const roleById = new Map<number, { id: number; code: string; name: string }>(
      roles.map((role: { id: number; code: string; name: string }) => [role.id, role]),
    );
    if (builtInRole) roleById.set(builtInRole.id, builtInRole);

    const cells = [];
    for (const purpose of RULE_PURPOSES) {
      for (const area of RULE_AREAS) {
        const ctx: ApprovalRuleContext = { ...scope, purpose, area };
        const best = pickMostSpecificRule(rules, ctx);
        const setHere = best && this.isExactScope(best, scope, purpose, area) ? best : null;

        const approverRoleId = best ? best.approverRoleId : builtInRole?.id ?? null;
        const decision = best ? best.decision : BUILT_IN_DEFAULT[area].decision;
        cells.push({
          purpose,
          area,
          ruleId: setHere?.id ?? null,
          source: setHere ? 'THIS_SCOPE' : best ? ruleSource(best) : 'BUILT_IN',
          inheritedFrom: best && !setHere
            ? { purpose: best.purpose, applicationType: best.applicationType, stateId: best.stateId, districtId: best.districtId }
            : null,
          approverRole: approverRoleId !== null ? roleById.get(approverRoleId) ?? null : null,
          decision,
          reachable: reachableRoleIds && approverRoleId !== null ? reachableRoleIds.has(approverRoleId) : null,
        });
      }
    }

    return { scope, roles, cells };
  }

  /** Set the rule at exactly this scope (replacing one already set there). */
  async upsertRule(dto: UpsertApprovalRuleDto, updatedBy: number | null) {
    const role = await prisma.roles.findUnique({ where: { id: dto.approverRoleId }, select: { code: true } });
    if (!role) throw new BadRequestException(`Role ${dto.approverRoleId} not found.`);
    if (NON_DECISION_ROLES.has(role.code)) {
      throw new BadRequestException(`${role.code} cannot be the decision role for applications.`);
    }

    const key = {
      applicationType: dto.applicationType,
      stateId: dto.stateId ?? null,
      districtId: dto.districtId ?? null,
      purpose: dto.purpose,
      area: dto.area,
    };
    const data = { approverRoleId: dto.approverRoleId, decision: dto.decision, isActive: true, updatedBy };

    // findFirst + update/create rather than upsert: the unique index treats
    // NULL state/district as distinct, so it cannot guard the default rows.
    const existing = await prisma.approvalRule.findFirst({ where: key, select: { id: true } });
    return existing
      ? prisma.approvalRule.update({ where: { id: existing.id }, data })
      : prisma.approvalRule.create({ data: { ...key, ...data } });
  }

  async getRule(id: number) {
    const rule = await prisma.approvalRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException(`Approval rule ${id} not found.`);
    return rule;
  }

  /** Remove a rule so the cell inherits from the wider scope again. */
  async deleteRule(id: number) {
    await prisma.approvalRule.delete({ where: { id } });
  }

  private isExactScope(
    rule: ApprovalRuleCandidate,
    scope: ApprovalRuleScope,
    purpose: string,
    area: string,
  ): boolean {
    return (
      rule.applicationType === scope.applicationType &&
      rule.stateId === scope.stateId &&
      rule.districtId === scope.districtId &&
      rule.purpose === purpose &&
      rule.area === area
    );
  }

  /**
   * Roles an application at this location can be forwarded to, per the most
   * specific Flow Mapping of each role. Null when no flow mapping exists at all
   * (reachability unknown).
   */
  private async reachableRoleIds(scope: ApprovalRuleScope): Promise<Set<number> | null> {
    const applicationTypes = scope.applicationType === 'ALL' ? ['FRESH', 'RENEWAL'] : [scope.applicationType];
    const mappings = await prisma.roleFlowMapping.findMany({
      where: {
        applicationType: { in: applicationTypes as any },
        purpose: 'ALL',
        OR: [
          { stateId: scope.stateId, districtId: scope.districtId },
          { stateId: scope.stateId, districtId: null },
          { stateId: null, districtId: null },
        ],
      },
      select: { currentRoleId: true, applicationType: true, stateId: true, districtId: true, nextRoleIds: true },
    });
    if (mappings.length === 0) return null;

    const specificity = (m: { stateId: number | null; districtId: number | null }) =>
      (m.districtId !== null ? 2 : 0) + (m.stateId !== null ? 1 : 0);
    const effective = new Map<string, (typeof mappings)[number]>();
    for (const mapping of mappings) {
      const key = `${mapping.applicationType}:${mapping.currentRoleId}`;
      const current = effective.get(key);
      if (!current || specificity(mapping) > specificity(current)) effective.set(key, mapping);
    }

    const reachable = new Set<number>();
    for (const mapping of effective.values()) mapping.nextRoleIds.forEach((id: number) => reachable.add(id));
    return reachable;
  }
}
