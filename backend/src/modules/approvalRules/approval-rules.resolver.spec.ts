jest.mock('../../db/prismaClient', () => ({
  __esModule: true,
  default: {
    approvalRule: { findMany: jest.fn() },
    roles: { findUnique: jest.fn(), findFirst: jest.fn() },
  },
}));

import prisma from '../../db/prismaClient';
import {
  ApprovalRuleCandidate,
  ApprovalRuleContext,
  ResolvedApprovalRule,
  approvalRuleRestrictionMessage,
  decisionCodesForRole,
  isDecisionAction,
  pickMostSpecificRule,
  resolveApprovalRule,
  toRuleArea,
  toRulePurpose,
} from './approval-rules.resolver';

const mockPrisma = prisma as any;

const ctx: ApprovalRuleContext = {
  applicationType: 'FRESH',
  stateId: 24,
  districtId: 579,
  purpose: 'SPORTS',
  area: 'STATE',
};

let nextId = 1;
const rule = (overrides: Partial<ApprovalRuleCandidate>): ApprovalRuleCandidate => ({
  id: nextId++,
  applicationType: 'ALL',
  stateId: null,
  districtId: null,
  purpose: 'ALL',
  area: 'STATE',
  approverRoleId: 1,
  decision: 'APPROVE',
  isActive: true,
  ...overrides,
});

describe('approval rules resolver', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('pickMostSpecificRule', () => {
    it('prefers district over state over default', () => {
      const def = rule({});
      const state = rule({ stateId: 24 });
      const district = rule({ stateId: 24, districtId: 579 });
      expect(pickMostSpecificRule([def, state, district], ctx)).toBe(district);
      expect(pickMostSpecificRule([def, state], ctx)).toBe(state);
      expect(pickMostSpecificRule([def], ctx)).toBe(def);
    });

    it('prefers location over purpose: a district rule for ALL beats a default rule for SPORTS', () => {
      const defaultSports = rule({ purpose: 'SPORTS' });
      const districtAll = rule({ stateId: 24, districtId: 579 });
      expect(pickMostSpecificRule([defaultSports, districtAll], ctx)).toBe(districtAll);
    });

    it('prefers a specific purpose, then a specific application type, at the same location', () => {
      const all = rule({ districtId: 579 });
      const sports = rule({ districtId: 579, purpose: 'SPORTS' });
      const sportsFresh = rule({ districtId: 579, purpose: 'SPORTS', applicationType: 'FRESH' });
      expect(pickMostSpecificRule([all, sports], ctx)).toBe(sports);
      expect(pickMostSpecificRule([all, sports, sportsFresh], ctx)).toBe(sportsFresh);
    });

    it('ignores rules for another district, state, area, purpose, type or inactive rules', () => {
      const candidates = [
        rule({ districtId: 580 }),
        rule({ stateId: 25 }),
        rule({ area: 'INDIA' }),
        rule({ purpose: 'CROP_PROTECTION' }),
        rule({ applicationType: 'RENEWAL' }),
        rule({ isActive: false }),
      ];
      expect(pickMostSpecificRule(candidates, ctx)).toBeNull();
    });
  });

  describe('decisionCodesForRole', () => {
    const resolved = (decision: 'APPROVE' | 'RECOMMEND'): ResolvedApprovalRule => ({
      approverRoleId: 7,
      approverRoleCode: 'JTCP',
      approverRoleName: 'Joint Commissioner of Police',
      decision,
      source: 'DISTRICT',
      ruleId: 1,
      area: 'STATE',
      purpose: 'SPORTS',
    });

    it('gives the decision role approve/reject or recommend/not recommend', () => {
      expect(decisionCodesForRole(resolved('APPROVE'), 7)).toEqual(['APPROVED', 'REJECT']);
      expect(decisionCodesForRole(resolved('RECOMMEND'), 7)).toEqual(['RECOMMEND', 'NOT_RECOMMEND']);
    });

    it('gives other roles no decision actions', () => {
      expect(decisionCodesForRole(resolved('APPROVE'), 9)).toEqual([]);
    });

    it('explains the restriction', () => {
      expect(approvalRuleRestrictionMessage(resolved('APPROVE'), 9)).toContain('made by Joint Commissioner of Police (JTCP)');
      expect(approvalRuleRestrictionMessage(resolved('RECOMMEND'), 7)).toContain('can only recommend or not recommend');
    });
  });

  describe('input mapping', () => {
    it.each([
      ['District-wide', 'DISTRICT'],
      ['State-wide', 'STATE'],
      ['Throughout India', 'INDIA'],
      ['DISTRICT, STATE', 'STATE'],
      [null, null],
    ])('area %p -> %p', (raw, expected) => {
      expect(toRuleArea(raw as any)).toBe(expected);
    });

    it('maps need for license to a purpose, unknown to ALL', () => {
      expect(toRulePurpose('SPORTS')).toBe('SPORTS');
      expect(toRulePurpose('sports')).toBe('SPORTS');
      expect(toRulePurpose(undefined)).toBe('ALL');
      expect(toRulePurpose('SOMETHING_ELSE')).toBe('ALL');
    });

    it('recognises the four decision actions only', () => {
      expect(isDecisionAction('approved')).toBe(true);
      expect(isDecisionAction('NOT_RECOMMEND')).toBe(true);
      expect(isDecisionAction('FORWARD')).toBe(false);
    });
  });

  describe('resolveApprovalRule', () => {
    it('uses the built-in default when the ApprovalRule table does not exist yet', async () => {
      mockPrisma.approvalRule.findMany.mockRejectedValue(Object.assign(new Error('missing table'), { code: 'P2021' }));
      mockPrisma.roles.findFirst.mockResolvedValue({ id: 3, code: 'CP', name: 'Commissioner of Police' });

      const resolved = await resolveApprovalRule(ctx);

      expect(resolved).toEqual(expect.objectContaining({ approverRoleCode: 'CP', source: 'BUILT_IN' }));
    });

    it('uses the most specific configured rule', async () => {
      mockPrisma.approvalRule.findMany.mockResolvedValue([
        rule({ id: 10 }),
        rule({ id: 11, stateId: 24, districtId: 579, approverRoleId: 7, decision: 'RECOMMEND' }),
      ]);
      mockPrisma.roles.findUnique.mockResolvedValue({ id: 7, code: 'JTCP', name: 'Joint Commissioner of Police' });

      const resolved = await resolveApprovalRule(ctx);

      expect(resolved).toEqual(expect.objectContaining({
        approverRoleId: 7,
        approverRoleCode: 'JTCP',
        decision: 'RECOMMEND',
        source: 'DISTRICT',
        ruleId: 11,
      }));
    });

    it.each([
      ['DISTRICT', 'APPROVE'],
      ['STATE', 'APPROVE'],
      ['INDIA', 'RECOMMEND'],
    ])('falls back to CP for %s with %s when nothing is configured', async (area, decision) => {
      mockPrisma.approvalRule.findMany.mockResolvedValue([]);
      mockPrisma.roles.findFirst.mockResolvedValue({ id: 3, code: 'CP', name: 'Commissioner of Police' });

      const resolved = await resolveApprovalRule({ ...ctx, area: area as any });

      expect(mockPrisma.roles.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { code: 'CP' } }));
      expect(resolved).toEqual(expect.objectContaining({
        approverRoleCode: 'CP',
        decision,
        source: 'BUILT_IN',
        ruleId: null,
      }));
    });
  });
});
