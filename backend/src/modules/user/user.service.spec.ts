// Mock prisma before any service import
jest.mock('../../db/prismaClient', () => {
  const mockPrisma = {
    users: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    auditLogs: { create: jest.fn() },
  };
  return { __esModule: true, default: mockPrisma };
});

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
}));

import { UserService } from './user.service';
import { LocationsService } from '../locations/locations.service';
import prisma from '../../db/prismaClient';

describe('UserService', () => {
  let service: UserService;
  let locationsService: jest.Mocked<LocationsService>;

  beforeEach(() => {
    locationsService = {
      validateStateDistrictHierarchy: jest.fn(),
    } as any;
    service = new UserService(locationsService);
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    const validUserData = {
      username: 'test_admin',
      email: 'admin@test.com',
      password: 'password123',
      roleId: 1,
    };

    beforeEach(() => {
      (prisma.users.create as jest.Mock).mockResolvedValue({
        id: 1,
        username: 'test_admin',
        email: 'admin@test.com',
        stateId: 1,
        districtId: 10,
      });
      (prisma.auditLogs.create as jest.Mock).mockResolvedValue({});
    });

    // ──────────────────────────────────────────────────────
    // Test 11: Valid user State + District → allowed
    // ──────────────────────────────────────────────────────
    it('should create user with valid state/district', async () => {
      locationsService.validateStateDistrictHierarchy.mockResolvedValue({
        stateId: 1,
        districtId: 10,
      });

      const result = await service.createUser({
        ...validUserData,
        stateId: 1,
        districtId: 10,
      });

      expect(locationsService.validateStateDistrictHierarchy).toHaveBeenCalledWith(1, 10);
      expect(prisma.users.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            stateId: 1,
            districtId: 10,
          }),
        }),
      );
      expect(result).toBeDefined();
    });

    // ──────────────────────────────────────────────────────
    // Test 12: Invalid State + District → rejected
    // ──────────────────────────────────────────────────────
    it('should reject user creation with invalid state/district', async () => {
      locationsService.validateStateDistrictHierarchy.mockRejectedValue(
        new Error('Selected District (ID 20, belonging to State ID 2) does not belong to the selected State (ID 1).'),
      );

      await expect(
        service.createUser({
          ...validUserData,
          stateId: 1,
          districtId: 20,
        }),
      ).rejects.toThrow();

      // Should NOT have attempted to create user
      expect(prisma.users.create).not.toHaveBeenCalled();
    });

    it('should allow user creation without state/district', async () => {
      locationsService.validateStateDistrictHierarchy.mockResolvedValue({
        stateId: null,
        districtId: null,
      });

      await service.createUser(validUserData);

      expect(locationsService.validateStateDistrictHierarchy).toHaveBeenCalledWith(null, null);
      expect(prisma.users.create).toHaveBeenCalled();
    });

    it('should allow user creation with only stateId', async () => {
      locationsService.validateStateDistrictHierarchy.mockResolvedValue({
        stateId: 1,
        districtId: null,
      });

      await service.createUser({
        ...validUserData,
        stateId: 1,
      });

      expect(locationsService.validateStateDistrictHierarchy).toHaveBeenCalledWith(1, null);
      expect(prisma.users.create).toHaveBeenCalled();
    });

    it('should allow user creation with only districtId', async () => {
      locationsService.validateStateDistrictHierarchy.mockResolvedValue({
        stateId: null,
        districtId: 10,
      });

      await service.createUser({
        ...validUserData,
        districtId: 10,
      });

      expect(locationsService.validateStateDistrictHierarchy).toHaveBeenCalledWith(null, 10);
      expect(prisma.users.create).toHaveBeenCalled();
    });

    it('should reject non-existent state', async () => {
      locationsService.validateStateDistrictHierarchy.mockRejectedValue(
        new Error('State with ID 999 not found'),
      );

      await expect(
        service.createUser({
          ...validUserData,
          stateId: 999,
        }),
      ).rejects.toThrow('State with ID 999 not found');
      expect(prisma.users.create).not.toHaveBeenCalled();
    });

    it('should reject non-existent district', async () => {
      locationsService.validateStateDistrictHierarchy.mockRejectedValue(
        new Error('District with ID 999 not found'),
      );

      await expect(
        service.createUser({
          ...validUserData,
          districtId: 999,
        }),
      ).rejects.toThrow('District with ID 999 not found');
      expect(prisma.users.create).not.toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    beforeEach(() => {
      (prisma.users.update as jest.Mock).mockResolvedValue({
        id: 1,
        username: 'test_admin',
        role: { id: 1, code: 'ADMIN', name: 'Admin' },
      });
    });

    it('should validate state/district when stateId is provided in update', async () => {
      locationsService.validateStateDistrictHierarchy.mockResolvedValue({
        stateId: 2,
        districtId: null,
      });

      await service.updateUser(1, { stateId: 2 });

      expect(locationsService.validateStateDistrictHierarchy).toHaveBeenCalled();
      expect(prisma.users.update).toHaveBeenCalled();
    });

    it('should validate state/district when districtId is provided in update', async () => {
      // When only districtId is provided, the service fetches current user to get stateId
      (prisma.users.findUnique as jest.Mock).mockResolvedValue({
        stateId: 1,
        districtId: 5,
      });

      locationsService.validateStateDistrictHierarchy.mockResolvedValue({
        stateId: 1,
        districtId: 20,
      });

      await service.updateUser(1, { districtId: 20 });

      expect(prisma.users.findUnique).toHaveBeenCalled();
      expect(locationsService.validateStateDistrictHierarchy).toHaveBeenCalledWith(1, 20);
      expect(prisma.users.update).toHaveBeenCalled();
    });

    it('should reject mismatched state/district on update', async () => {
      locationsService.validateStateDistrictHierarchy.mockRejectedValue(
        new Error('District does not belong to state'),
      );

      await expect(
        service.updateUser(1, { stateId: 1, districtId: 20 }),
      ).rejects.toThrow();
      expect(prisma.users.update).not.toHaveBeenCalled();
    });

    it('should not validate locations when no location fields in update', async () => {
      await service.updateUser(1, { username: 'new_name' });

      expect(locationsService.validateStateDistrictHierarchy).not.toHaveBeenCalled();
      expect(prisma.users.update).toHaveBeenCalled();
    });

    it('should validate new state/district pair when both are updated together', async () => {
      locationsService.validateStateDistrictHierarchy.mockResolvedValue({
        stateId: 2,
        districtId: 20,
      });

      await service.updateUser(1, { stateId: 2, districtId: 20 });

      expect(locationsService.validateStateDistrictHierarchy).toHaveBeenCalledWith(2, 20);
      expect(prisma.users.update).toHaveBeenCalled();
    });

    it('should allow setting stateId and districtId to null', async () => {
      locationsService.validateStateDistrictHierarchy.mockResolvedValue({
        stateId: null,
        districtId: null,
      });

      await service.updateUser(1, { stateId: null as any, districtId: null as any });

      expect(locationsService.validateStateDistrictHierarchy).toHaveBeenCalledWith(null, null);
      expect(prisma.users.update).toHaveBeenCalled();
    });
  });
});
