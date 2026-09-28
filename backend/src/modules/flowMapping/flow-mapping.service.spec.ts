import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';

// Mock prisma before any service import
jest.mock('../../db/prismaClient', () => {
  const mockPrisma = {
    roles: { findUnique: jest.fn(), findMany: jest.fn() },
    roleFlowMapping: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
  return { __esModule: true, default: mockPrisma };
});

import { FlowMappingService } from './flow-mapping.service';
import { LocationsService } from '../locations/locations.service';
import prisma from '../../db/prismaClient';

describe('FlowMappingService', () => {
  let service: FlowMappingService;
  let locationsService: jest.Mocked<LocationsService>;

  beforeEach(() => {
    locationsService = {
      validateStateDistrictHierarchy: jest.fn(),
    } as any;
    service = new FlowMappingService(locationsService);

    // Reset all prisma mocks
    jest.clearAllMocks();
  });

  describe('enforceLocationAuthorization', () => {
    // ──────────────────────────────────────────────────────
    // Test 1: Valid State + District → success
    // ──────────────────────────────────────────────────────
    it('should return validated stateId/districtId for valid combination', async () => {
      locationsService.validateStateDistrictHierarchy.mockResolvedValue({
        stateId: 1,
        districtId: 10,
      });

      const result = await service.enforceLocationAuthorization(
        'SUPER_ADMIN',
        null,
        null,
        1,
        10,
      );

      expect(result).toEqual({ stateId: 1, districtId: 10 });
      expect(locationsService.validateStateDistrictHierarchy).toHaveBeenCalledWith(1, 10);
    });

    // ──────────────────────────────────────────────────────
    // Test 2: Invalid State + District → error
    // ──────────────────────────────────────────────────────
    it('should throw BadRequestException when district does not belong to state', async () => {
      locationsService.validateStateDistrictHierarchy.mockRejectedValue(
        new BadRequestException(
          'Selected District (ID 20, belonging to State ID 2) does not belong to the selected State (ID 1).',
        ),
      );

      await expect(
        service.enforceLocationAuthorization('SUPER_ADMIN', null, null, 1, 20),
      ).rejects.toThrow(BadRequestException);
    });

    // ──────────────────────────────────────────────────────
    // Test 3: Non-existent State → NotFoundException
    // ──────────────────────────────────────────────────────
    it('should throw NotFoundException for non-existent state', async () => {
      locationsService.validateStateDistrictHierarchy.mockRejectedValue(
        new NotFoundException('State with ID 999 not found'),
      );

      await expect(
        service.enforceLocationAuthorization('SUPER_ADMIN', null, null, 999, null),
      ).rejects.toThrow(NotFoundException);
    });

    // ──────────────────────────────────────────────────────
    // Test 4: Non-existent District → NotFoundException
    // ──────────────────────────────────────────────────────
    it('should throw NotFoundException for non-existent district', async () => {
      locationsService.validateStateDistrictHierarchy.mockRejectedValue(
        new NotFoundException('District with ID 999 not found'),
      );

      await expect(
        service.enforceLocationAuthorization('SUPER_ADMIN', null, null, 1, 999),
      ).rejects.toThrow(NotFoundException);
    });

    // ──────────────────────────────────────────────────────
    // Test 5: SUPER_ADMIN + valid State/District → allowed
    // ──────────────────────────────────────────────────────
    it('should allow SUPER_ADMIN to operate on any valid state/district', async () => {
      locationsService.validateStateDistrictHierarchy.mockResolvedValue({
        stateId: 5,
        districtId: 50,
      });

      const result = await service.enforceLocationAuthorization(
        'SUPER_ADMIN',
        null, // SUPER_ADMIN has no assigned state
        null,
        5,
        50,
      );

      expect(result).toEqual({ stateId: 5, districtId: 50 });
    });

    // ──────────────────────────────────────────────────────
    // Test 6: Admin + assigned State + valid District → allowed
    // ──────────────────────────────────────────────────────
    it('should allow ADMIN to operate within their assigned state', async () => {
      locationsService.validateStateDistrictHierarchy.mockResolvedValue({
        stateId: 1,
        districtId: 10,
      });

      const result = await service.enforceLocationAuthorization(
        'ADMIN',
        1, // assigned state
        5, // assigned district
        1, // requesting same state
        10,
      );

      expect(result).toEqual({ stateId: 1, districtId: 10 });
      expect(locationsService.validateStateDistrictHierarchy).toHaveBeenCalledWith(1, 10);
    });

    // ──────────────────────────────────────────────────────
    // Test 7: Admin + different State → 403 Forbidden
    // ──────────────────────────────────────────────────────
    it('should throw ForbiddenException when ADMIN sends a different stateId', async () => {
      await expect(
        service.enforceLocationAuthorization(
          'ADMIN',
          1, // assigned state is 1
          null,
          2, // trying to operate on state 2
          null,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should include descriptive error message for state mismatch', async () => {
      try {
        await service.enforceLocationAuthorization('ADMIN', 1, null, 2, null);
        fail('Should have thrown ForbiddenException');
      } catch (error: any) {
        expect(error).toBeInstanceOf(ForbiddenException);
        expect(error.message).toContain('State ID 2');
        expect(error.message).toContain('ID 1');
      }
    });

    // ──────────────────────────────────────────────────────
    // Test 8: Admin + District from another State → rejected
    // ──────────────────────────────────────────────────────
    it('should reject when ADMIN provides a districtId from another state', async () => {
      // The district belongs to state 2, but ADMIN is assigned to state 1
      locationsService.validateStateDistrictHierarchy.mockRejectedValue(
        new BadRequestException(
          'Selected District (ID 20, belonging to State ID 2) does not belong to the selected State (ID 1).',
        ),
      );

      await expect(
        service.enforceLocationAuthorization(
          'ADMIN',
          1, // assigned state is 1
          null,
          1, // correct state
          20, // district from state 2
        ),
      ).rejects.toThrow(BadRequestException);
    });

    // ──────────────────────────────────────────────────────
    // Test 9: Admin without assigned state → 403
    // ──────────────────────────────────────────────────────
    it('should throw ForbiddenException when ADMIN has no assigned state', async () => {
      await expect(
        service.enforceLocationAuthorization(
          'ADMIN',
          null, // no assigned state
          null,
          1,
          null,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    // ──────────────────────────────────────────────────────
    // Test 10: Admin omits stateId → falls back to assigned state
    // ──────────────────────────────────────────────────────
    it('should use ADMIN assigned state when no stateId is provided', async () => {
      locationsService.validateStateDistrictHierarchy.mockResolvedValue({
        stateId: 1,
        districtId: null,
      });

      const result = await service.enforceLocationAuthorization(
        'ADMIN',
        1, // assigned state
        5, // assigned district
        null, // no stateId in request
        null, // no districtId in request
      );

      expect(result).toEqual({ stateId: 1, districtId: null });
      expect(locationsService.validateStateDistrictHierarchy).toHaveBeenCalledWith(1, 5);
    });

    // ──────────────────────────────────────────────────────
    // Test 11: Admin omits districtId → falls back to assigned district
    // ──────────────────────────────────────────────────────
    it('should use ADMIN assigned district when no districtId is provided', async () => {
      locationsService.validateStateDistrictHierarchy.mockResolvedValue({
        stateId: 1,
        districtId: 5,
      });

      const result = await service.enforceLocationAuthorization(
        'ADMIN',
        1, // assigned state
        5, // assigned district
        1, // same state
        null, // no district in request
      );

      expect(result).toEqual({ stateId: 1, districtId: 5 });
      expect(locationsService.validateStateDistrictHierarchy).toHaveBeenCalledWith(1, 5);
    });

    // ──────────────────────────────────────────────────────
    // Test 12: Both null → global context
    // ──────────────────────────────────────────────────────
    it('should pass null/null to hierarchy validation when no locations provided', async () => {
      locationsService.validateStateDistrictHierarchy.mockResolvedValue({
        stateId: null,
        districtId: null,
      });

      const result = await service.enforceLocationAuthorization(
        'SUPER_ADMIN',
        null,
        null,
        null,
        null,
      );

      expect(result).toEqual({ stateId: null, districtId: null });
      expect(locationsService.validateStateDistrictHierarchy).toHaveBeenCalledWith(null, null);
    });

    // ──────────────────────────────────────────────────────
    // Test 13: Unknown role treated as non-super-admin
    // ──────────────────────────────────────────────────────
    it('should restrict unknown roles like ADMIN restrictions', async () => {
      locationsService.validateStateDistrictHierarchy.mockResolvedValue({
        stateId: 3,
        districtId: null,
      });

      const result = await service.enforceLocationAuthorization(
        'ZS', // not SUPER_ADMIN
        3, // assigned state
        null,
        3, // same state
        null,
      );

      expect(result).toEqual({ stateId: 3, districtId: null });
    });
  });

  describe('createOrUpdateFlowMapping - location integration', () => {
    beforeEach(() => {
      // Mock role lookups — filter by id { in: [...] } to match Prisma behaviour
      (prisma.roles.findUnique as jest.Mock).mockResolvedValue({ id: 1, name: 'DCP', code: 'DCP' });
      (prisma.roles.findMany as jest.Mock).mockImplementation((args: any) => {
        const ids: number[] = args?.where?.id?.in ?? [];
        const allRoles = [
          { id: 2, name: 'ACP', code: 'ACP' },
          { id: 3, name: 'SHO', code: 'SHO' },
        ];
        return Promise.resolve(allRoles.filter(r => ids.includes(r.id)));
      });
      // Mock upsert
      (prisma.roleFlowMapping.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.roleFlowMapping.create as jest.Mock).mockResolvedValue({
        id: 1,
        currentRoleId: 1,
        applicationType: 'FRESH',
        purpose: 'ALL',
        stateId: 1,
        districtId: 10,
        nextRoleIds: [2],
        updatedBy: null,
        currentRole: { id: 1, name: 'DCP', code: 'DCP' },
        updatedByUser: null,
      });
    });

    it('should validate hierarchy before persisting a mapping', async () => {
      locationsService.validateStateDistrictHierarchy.mockResolvedValue({
        stateId: 1,
        districtId: 10,
      });

      await service.createOrUpdateFlowMapping(
        1,
        {
          nextRoleIds: [2],
          applicationType: 'FRESH',
          stateId: 1,
          districtId: 10,
        } as any,
        5,
      );

      expect(locationsService.validateStateDistrictHierarchy).toHaveBeenCalledWith(1, 10);
      expect(prisma.roleFlowMapping.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            stateId: 1,
            districtId: 10,
          }),
        }),
      );
    });

    it('should reject invalid hierarchy before persisting', async () => {
      locationsService.validateStateDistrictHierarchy.mockRejectedValue(
        new BadRequestException('District does not belong to state'),
      );

      await expect(
        service.createOrUpdateFlowMapping(
          1,
          {
            nextRoleIds: [2],
            applicationType: 'FRESH',
            stateId: 1,
            districtId: 20,
          } as any,
          5,
        ),
      ).rejects.toThrow(BadRequestException);

      // Should NOT have attempted to persist
      expect(prisma.roleFlowMapping.create).not.toHaveBeenCalled();
    });
  });
});
