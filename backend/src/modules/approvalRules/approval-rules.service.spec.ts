jest.mock('../../db/prismaClient', () => ({
  __esModule: true,
  default: {
    approvalRule: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    roles: { findMany: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn() },
    roleFlowMapping: { findMany: jest.fn() },
  },
}));

import { BadRequestException, ForbiddenException } from '@nestjs/common';
import prisma from '../../db/prismaClient';
import { ApprovalRulesService } from './approval-rules.service';

const mockPrisma = prisma as any;

const ROLES = [
  { id: 1, code: 'ADMIN', name: 'System Administrator' },
  { id: 3, code: 'CP', name: 'Commissioner of Police' },
  { id: 7, code: 'JTCP', name: 'Joint Commissioner of Police' },
];

const rule = (overrides: Record<string, unknown>) => ({
  id: 1,
  applicationType: 'ALL',
  stateId: null,
  districtId: null,
  purpose: 'ALL',
  area: 'STATE',
  approverRoleId: 3,
  decision: 'APPROVE',
  isActive: true,
  ...overrides,
});

describe('ApprovalRulesService', () => {
  const flowMappingService = { enforceLocationAuthorization: jest.fn() };
  const service = new ApprovalRulesService(flowMappingService as any);
  const scope = { applicationType: 'ALL' as const, stateId: 24, districtId: 579 };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.roles.findMany.mockResolvedValue(ROLES);
    mockPrisma.roles.findFirst.mockResolvedValue(ROLES[1]);
    mockPrisma.roleFlowMapping.findMany.mockResolvedValue([]);
  });

  describe('getGrid', () => {
    const cell = (data: any, purpose: string, area: string) =>
      data.cells.find((c: any) => c.purpose === purpose && c.area === area);

    it('marks rules set at this scope, inherited rules, and the built-in default', async () => {
      mockPrisma.approvalRule.findMany.mockResolvedValue([
        rule({ id: 10, stateId: 24, districtId: 579, purpose: 'SPORTS', area: 'STATE', approverRoleId: 7, decision: 'RECOMMEND' }),
        rule({ id: 11, stateId: 24, area: 'DISTRICT' }),
      ]);

      const data = await service.getGrid(scope);

      expect(data.cells).toHaveLength(15);
      expect(cell(data, 'SPORTS', 'STATE')).toEqual(expect.objectContaining({
        ruleId: 10, source: 'THIS_SCOPE', decision: 'RECOMMEND', approverRole: ROLES[2],
      }));
      expect(cell(data, 'SPORTS', 'DISTRICT')).toEqual(expect.objectContaining({
        ruleId: null, source: 'STATE', decision: 'APPROVE', approverRole: ROLES[1],
      }));
      expect(cell(data, 'ALL', 'INDIA')).toEqual(expect.objectContaining({
        ruleId: null, source: 'BUILT_IN', decision: 'RECOMMEND', approverRole: ROLES[1],
      }));
      // Admin roles are not offered as decision roles
      expect(data.roles.map((r: any) => r.code)).toEqual(['CP', 'JTCP']);
    });

    it('flags a decision role that Flow Mapping cannot reach', async () => {
      mockPrisma.approvalRule.findMany.mockResolvedValue([
        rule({ stateId: 24, districtId: 579, area: 'STATE', approverRoleId: 7 }),
      ]);
      mockPrisma.roleFlowMapping.findMany.mockResolvedValue([
        // Global mapping says DCP -> JTCP, but this district overrides it to DCP -> CP
        { currentRoleId: 5, applicationType: 'FRESH', stateId: null, districtId: null, nextRoleIds: [7] },
        { currentRoleId: 5, applicationType: 'FRESH', stateId: 24, districtId: 579, nextRoleIds: [3] },
      ]);

      const data = await service.getGrid({ ...scope, applicationType: 'FRESH' });

      expect(cell(data, 'ALL', 'STATE').reachable).toBe(false);
      expect(cell(data, 'ALL', 'DISTRICT').reachable).toBe(true);
    });

    it('reports reachability as unknown when no flow mapping exists', async () => {
      mockPrisma.approvalRule.findMany.mockResolvedValue([]);
      const data = await service.getGrid(scope);
      expect(cell(data, 'ALL', 'STATE').reachable).toBeNull();
    });
  });

  describe('upsertRule', () => {
    const dto = {
      applicationType: 'ALL' as const,
      stateId: 24,
      districtId: 579,
      purpose: 'SPORTS' as const,
      area: 'STATE' as const,
      approverRoleId: 7,
      decision: 'RECOMMEND' as const,
    };

    beforeEach(() => mockPrisma.roles.findUnique.mockResolvedValue({ code: 'JTCP' }));

    it('creates a rule when none exists at this scope', async () => {
      mockPrisma.approvalRule.findFirst.mockResolvedValue(null);
      await service.upsertRule(dto, 42);
      expect(mockPrisma.approvalRule.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ districtId: 579, purpose: 'SPORTS', approverRoleId: 7, updatedBy: 42 }),
      });
    });

    it('updates the rule already set at this scope', async () => {
      mockPrisma.approvalRule.findFirst.mockResolvedValue({ id: 9 });
      await service.upsertRule(dto, 42);
      expect(mockPrisma.approvalRule.update).toHaveBeenCalledWith({
        where: { id: 9 },
        data: expect.objectContaining({ approverRoleId: 7, decision: 'RECOMMEND' }),
      });
      expect(mockPrisma.approvalRule.create).not.toHaveBeenCalled();
    });

    it('rejects an admin role as the decision role', async () => {
      mockPrisma.roles.findUnique.mockResolvedValue({ code: 'ADMIN' });
      await expect(service.upsertRule({ ...dto, approverRoleId: 1 }, 42)).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('authorizeScope', () => {
    it('rejects writes outside the scope an admin is limited to', async () => {
      flowMappingService.enforceLocationAuthorization.mockResolvedValue({ stateId: 24, districtId: null });
      await expect(service.authorizeScope({ roleCode: 'ADMIN' }, null, null, true)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('narrows reads to the admin\'s scope', async () => {
      flowMappingService.enforceLocationAuthorization.mockResolvedValue({ stateId: 24, districtId: null });
      await expect(service.authorizeScope({ roleCode: 'ADMIN' }, null, null, false)).resolves.toEqual({
        stateId: 24,
        districtId: null,
      });
    });
  });
});
