import { ApprovalDecision, ApprovalRuleArea, RoleFlowPurpose } from '@prisma/client';
import prisma from '../../db/prismaClient';
import { AREA_OF_VALIDITY, normalizeAreaOfValidity } from '../../constants/area-of-validity';

/**
 * Approval rules decide, per application type / state / district / purpose /
 * area of validity, which role makes the final decision and whether it may
 * approve locally or only recommend. They are the single source for the four
 * decision actions; every other action still comes from role-action mapping.
 */

export const DECISION_ACTION_CODES = ['APPROVED', 'REJECT', 'RECOMMEND', 'NOT_RECOMMEND'] as const;

/** Decision actions the decision role gets for each decision type. */
export const DECISION_ACTIONS: Record<ApprovalDecision, string[]> = {
  APPROVE: ['APPROVED', 'REJECT'],
  RECOMMEND: ['RECOMMEND', 'NOT_RECOMMEND'],
};

/**
 * Behaviour when no rule is configured: CP approves District/State licenses
 * and only recommends Throughout-India ones.
 */
export const BUILT_IN_DEFAULT: Record<ApprovalRuleArea, { approverRoleCode: string; decision: ApprovalDecision }> = {
  DISTRICT: { approverRoleCode: 'CP', decision: 'APPROVE' },
  STATE: { approverRoleCode: 'CP', decision: 'APPROVE' },
  INDIA: { approverRoleCode: 'CP', decision: 'RECOMMEND' },
};

export type RuleApplicationType = 'FRESH' | 'RENEWAL';

export interface ApprovalRuleContext {
  /** 'ALL' only when viewing rules that apply to every application type */
  applicationType: RuleApplicationType | 'ALL';
  stateId: number | null;
  districtId: number | null;
  purpose: RoleFlowPurpose;
  area: ApprovalRuleArea;
}

export interface ApprovalRuleCandidate {
  id: number;
  applicationType: string;
  stateId: number | null;
  districtId: number | null;
  purpose: string;
  area: ApprovalRuleArea;
  approverRoleId: number;
  decision: ApprovalDecision;
  isActive: boolean;
}

export type ApprovalRuleSource = 'DISTRICT' | 'STATE' | 'DEFAULT' | 'BUILT_IN';

export interface ResolvedApprovalRule {
  approverRoleId: number;
  approverRoleCode: string;
  approverRoleName: string;
  decision: ApprovalDecision;
  source: ApprovalRuleSource;
  ruleId: number | null;
  area: ApprovalRuleArea;
  purpose: RoleFlowPurpose;
}

export function toRuleArea(rawArea?: string | null): ApprovalRuleArea | null {
  switch (normalizeAreaOfValidity(rawArea)) {
    case AREA_OF_VALIDITY.DISTRICT:
      return 'DISTRICT';
    case AREA_OF_VALIDITY.STATE:
      return 'STATE';
    case AREA_OF_VALIDITY.INDIA:
      return 'INDIA';
    default:
      return null;
  }
}

const PURPOSES = new Set<string>(['SELF_PROTECTION', 'SPORTS', 'HEIRLOOM_POLICY', 'CROP_PROTECTION']);

export function toRulePurpose(needForLicense?: string | null): RoleFlowPurpose {
  const value = String(needForLicense ?? '').trim().toUpperCase();
  return (PURPOSES.has(value) ? value : 'ALL') as RoleFlowPurpose;
}

export function ruleMatches(rule: ApprovalRuleCandidate, ctx: ApprovalRuleContext): boolean {
  return (
    rule.isActive &&
    rule.area === ctx.area &&
    (rule.applicationType === 'ALL' || rule.applicationType === ctx.applicationType) &&
    (rule.purpose === 'ALL' || rule.purpose === ctx.purpose) &&
    (rule.districtId === null || rule.districtId === ctx.districtId) &&
    (rule.stateId === null || rule.stateId === ctx.stateId)
  );
}

/** Location outranks purpose, which outranks application type. */
export function ruleSpecificity(rule: ApprovalRuleCandidate): number {
  return (
    (rule.districtId !== null ? 100 : 0) +
    (rule.stateId !== null ? 10 : 0) +
    (rule.purpose !== 'ALL' ? 2 : 0) +
    (rule.applicationType !== 'ALL' ? 1 : 0)
  );
}

export function pickMostSpecificRule(
  candidates: ApprovalRuleCandidate[],
  ctx: ApprovalRuleContext,
): ApprovalRuleCandidate | null {
  let best: ApprovalRuleCandidate | null = null;
  for (const rule of candidates) {
    if (!ruleMatches(rule, ctx)) continue;
    if (!best || ruleSpecificity(rule) > ruleSpecificity(best)) best = rule;
  }
  return best;
}

export function ruleSource(rule: Pick<ApprovalRuleCandidate, 'stateId' | 'districtId'>): ApprovalRuleSource {
  if (rule.districtId !== null) return 'DISTRICT';
  if (rule.stateId !== null) return 'STATE';
  return 'DEFAULT';
}

/** Decision actions the given role may take; empty when it is not the decision role. */
export function decisionCodesForRole(resolved: ResolvedApprovalRule, roleId: number): string[] {
  return resolved.approverRoleId === roleId ? DECISION_ACTIONS[resolved.decision] : [];
}

export function isDecisionAction(actionCode?: string | null): boolean {
  return (DECISION_ACTION_CODES as readonly string[]).includes(String(actionCode ?? '').toUpperCase());
}

/**
 * All active rules that could apply to applications of this type at this
 * location (purpose and area are matched by pickMostSpecificRule). If the
 * ApprovalRule table does not exist yet (code deployed before its migration),
 * behave as if no rules are configured so the built-in default applies.
 */
export async function findRulesForLocation(
  location: Pick<ApprovalRuleContext, 'applicationType' | 'stateId' | 'districtId'>,
): Promise<ApprovalRuleCandidate[]> {
  try {
    return (await prisma.approvalRule.findMany({
      where: {
        isActive: true,
        applicationType: { in: Array.from(new Set([location.applicationType, 'ALL' as const])) },
        AND: [
          { OR: [{ districtId: null }, { districtId: location.districtId ?? -1 }] },
          { OR: [{ stateId: null }, { stateId: location.stateId ?? -1 }] },
        ],
      },
    })) as ApprovalRuleCandidate[];
  } catch (error: any) {
    if (error?.code === 'P2021') return [];
    throw error;
  }
}

/** Resolve the rule for a context, falling back to the built-in default. */
export async function resolveApprovalRule(ctx: ApprovalRuleContext): Promise<ResolvedApprovalRule | null> {
  const candidates = await findRulesForLocation(ctx);
  const best = pickMostSpecificRule(candidates, ctx);
  const base = { area: ctx.area, purpose: ctx.purpose };

  if (best) {
    const role = await prisma.roles.findUnique({
      where: { id: best.approverRoleId },
      select: { id: true, code: true, name: true },
    });
    if (role) {
      return {
        ...base,
        approverRoleId: role.id,
        approverRoleCode: role.code,
        approverRoleName: role.name,
        decision: best.decision,
        source: ruleSource(best),
        ruleId: best.id,
      };
    }
  }

  const fallback = BUILT_IN_DEFAULT[ctx.area];
  const role = await prisma.roles.findFirst({
    where: { code: fallback.approverRoleCode },
    select: { id: true, code: true, name: true },
  });
  if (!role) return null;
  return {
    ...base,
    approverRoleId: role.id,
    approverRoleCode: role.code,
    approverRoleName: role.name,
    decision: fallback.decision,
    source: 'BUILT_IN',
    ruleId: null,
  };
}

/**
 * Resolve the rule for a fresh or renewal application from its present-address
 * location, need for license and area of validity. Returns null when the
 * application or its area is missing (legacy data keeps role-mapped actions).
 */
export async function resolveApprovalRuleForApplication(
  applicationType: RuleApplicationType,
  applicationId: number,
): Promise<ResolvedApprovalRule | null> {
  const select = {
    presentAddress: { select: { stateId: true, districtId: true } },
    licenseDetails: { select: { needForLicense: true, areaOfValidity: true }, take: 1 },
  } as const;

  const application =
    applicationType === 'FRESH'
      ? await prisma.freshLicenseApplicationPersonalDetails.findUnique({ where: { id: applicationId }, select })
      : await prisma.renewalFormPersonalDetails.findUnique({ where: { id: applicationId }, select });
  if (!application) return null;

  const detail = application.licenseDetails?.[0];
  const area = toRuleArea(detail?.areaOfValidity);
  if (!area) return null;

  return resolveApprovalRule({
    applicationType,
    stateId: application.presentAddress?.stateId ?? null,
    districtId: application.presentAddress?.districtId ?? null,
    purpose: toRulePurpose(detail?.needForLicense),
    area,
  });
}

const DECISION_LABELS: Record<ApprovalDecision, string> = {
  APPROVE: 'approve or reject',
  RECOMMEND: 'recommend or not recommend',
};

/** Why a decision action is not available to the current role. */
export function approvalRuleRestrictionMessage(resolved: ResolvedApprovalRule, roleId: number): string {
  if (resolved.approverRoleId !== roleId) {
    return `The final decision on this application is made by ${resolved.approverRoleName} (${resolved.approverRoleCode}).`;
  }
  return `For this application ${resolved.approverRoleCode} can only ${DECISION_LABELS[resolved.decision]}.`;
}
