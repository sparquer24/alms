import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CancelFormService } from './cancel-form.service';
import { CreateCancelRequestDto } from './dto/create-cancel-request.dto';
import { validate } from 'class-validator';

// ---------------------------------------------------------------------------
// Mock the Prisma client module — use `var` to avoid hoisting TDZ issues
// with jest.mock (which is hoisted above all imports).
// ---------------------------------------------------------------------------
var mockPrisma: any;

jest.mock('../../db/prismaClient', () => ({
  __esModule: true,
  default: mockPrisma,
}));

// ---------------------------------------------------------------------------
// Helper: build a valid DTO
// ---------------------------------------------------------------------------
function validDto(overrides: Partial<CreateCancelRequestDto> = {}): CreateCancelRequestDto {
  const dto = new CreateCancelRequestDto();
  dto.freshLicenseId = overrides.freshLicenseId ?? 1;
  dto.applicationType = overrides.applicationType ?? 'FreshLicenseApplicationForm';
  dto.cancellationReason = overrides.cancellationReason ?? 'Applicant no longer requires the license';
  dto.remarks = overrides.remarks ?? 'Applicant has moved to another state';
  return dto;
}

// ---------------------------------------------------------------------------
// Helpers: common mock application states
// ---------------------------------------------------------------------------
function mockApprovedApplication() {
  return {
    id: 1,
    isApproved: true,
    isRejected: false,
    currentUserId: 10,
    workflowStatus: { code: 'APPROVED' },
  };
}

function mockRejectedApplication() {
  return {
    id: 1,
    isApproved: false,
    isRejected: true,
    currentUserId: 10,
    workflowStatus: { code: 'REJECT' },
  };
}

function mockCancelledApplication() {
  return {
    id: 1,
    isApproved: false,
    isRejected: false,
    currentUserId: 10,
    workflowStatus: { code: 'CANCEL' },
  };
}

function mockInitiateStatus() {
  return { id: 5, code: 'INITIATE', name: 'Initiate', isActive: true };
}

const mockUser = { id: 42, roleId: 3 };

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------
describe('CancelFormService', () => {
  let service: CancelFormService;

  beforeAll(async () => {
    // Assign the mock object BEFORE compiling the module so that jest.mock
    // resolves to an already-initialized object.
    mockPrisma = {
      freshLicenseApplicationPersonalDetails: { findUnique: jest.fn() },
      cancelFormRequests: { findFirst: jest.fn(), create: jest.fn() },
      users: { findUnique: jest.fn() },
      statuses: { findFirst: jest.fn() },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [CancelFormService],
    }).compile();

    service = module.get<CancelFormService>(CancelFormService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock for $transaction — calls the callback with tx that delegates
    // to the top-level mockPrisma methods.
    mockPrisma.$transaction.mockImplementation((cb: Function) =>
      cb({
        cancelFormRequests: mockPrisma.cancelFormRequests,
        users: mockPrisma.users,
        freshLicenseApplicationsFormWorkflowHistories: { create: jest.fn() },
      }),
    );
  });

  // -----------------------------------------------------------------------
  // 1. Service definition
  // -----------------------------------------------------------------------
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // -----------------------------------------------------------------------
  // 2. createCancelRequest — happy path
  // -----------------------------------------------------------------------
  describe('createCancelRequest', () => {
    it('should create a cancel request successfully with valid DTO', async () => {
      mockPrisma.freshLicenseApplicationPersonalDetails.findUnique.mockResolvedValue(
        mockApprovedApplication(),
      );
      mockPrisma.cancelFormRequests.findFirst.mockResolvedValue(null);
      mockPrisma.users.findUnique.mockResolvedValue(mockUser);
      mockPrisma.statuses.findFirst.mockResolvedValue(mockInitiateStatus());
      const createdRecord = {
        id: 1,
        freshLicenseId: 1,
        applicationType: 'FreshLicenseApplicationForm',
        cancellationReason: 'Applicant no longer requires the license',
        remarks: 'Applicant has moved to another state',
        status: 'PENDING',
        requestedBy: 42,
        currentUserId: 42,
        requestedDate: new Date(),
        workFlowStatusId: 5,
        requester: { id: 42, username: 'testuser', email: 'test@example.com' },
      };
      mockPrisma.cancelFormRequests.create.mockResolvedValue(createdRecord);

      const dto = validDto();
      const result = await service.createCancelRequest(dto, 42);

      expect(result).toBeDefined();
      expect(result.status).toBe('PENDING');
      expect(result.freshLicenseId).toBe(1);
      expect(result.cancellationReason).toBe('Applicant no longer requires the license');

      expect(mockPrisma.freshLicenseApplicationPersonalDetails.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: expect.objectContaining({ id: true, isApproved: true, isRejected: true }),
      });
      expect(mockPrisma.cancelFormRequests.findFirst).toHaveBeenCalledWith({
        where: { freshLicenseId: 1, status: 'PENDING' },
      });
      expect(mockPrisma.users.findUnique).toHaveBeenCalledWith({
        where: { id: 42 },
        select: { id: true },
      });
      expect(mockPrisma.cancelFormRequests.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            freshLicenseId: 1,
            applicationType: 'FreshLicenseApplicationForm',
            cancellationReason: 'Applicant no longer requires the license',
            status: 'PENDING',
            requestedBy: 42,
          }),
        }),
      );
    });

    // -----------------------------------------------------------------------
    // 3. DTO validation — class-validator decorators
    // -----------------------------------------------------------------------
    describe('DTO validation', () => {
      it('should pass validation for a valid DTO', async () => {
        const dto = validDto();
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('should fail validation when freshLicenseId is missing', async () => {
        const dto = validDto({ freshLicenseId: undefined as any });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('freshLicenseId');
      });

      it('should fail validation when freshLicenseId is not a number', async () => {
        const dto = validDto({ freshLicenseId: 'abc' as any });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('freshLicenseId');
      });

      it('should fail validation when applicationType is missing', async () => {
        const dto = validDto({ applicationType: undefined as any });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some((e) => e.property === 'applicationType')).toBe(true);
      });

      it('should fail validation when cancellationReason is missing', async () => {
        const dto = validDto({ cancellationReason: undefined as any });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some((e) => e.property === 'cancellationReason')).toBe(true);
      });

      it('should fail validation when cancellationReason is too short (< 5 chars)', async () => {
        const dto = validDto({ cancellationReason: 'abc' });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some((e) => e.property === 'cancellationReason')).toBe(true);
      });

      it('should pass validation when remarks is optional and omitted', async () => {
        const dto = validDto({ remarks: undefined });
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('should fail validation when remarks exceeds 1000 characters', async () => {
        const dto = validDto({ remarks: 'x'.repeat(1001) });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some((e) => e.property === 'remarks')).toBe(true);
      });
    });

    // -----------------------------------------------------------------------
    // 4. Business-rule validation failures
    // -----------------------------------------------------------------------
    it('should throw NotFoundException when the application does not exist', async () => {
      mockPrisma.freshLicenseApplicationPersonalDetails.findUnique.mockResolvedValue(null);

      await expect(service.createCancelRequest(validDto(), 42)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.createCancelRequest(validDto(), 42)).rejects.toThrow(
        'Application not found',
      );
    });

    it('should throw BadRequestException when the application is rejected', async () => {
      mockPrisma.freshLicenseApplicationPersonalDetails.findUnique.mockResolvedValue(
        mockRejectedApplication(),
      );

      await expect(service.createCancelRequest(validDto(), 42)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createCancelRequest(validDto(), 42)).rejects.toThrow(
        'Cannot cancel a rejected application',
      );
    });

    it('should throw BadRequestException when the application is already cancelled', async () => {
      mockPrisma.freshLicenseApplicationPersonalDetails.findUnique.mockResolvedValue(
        mockCancelledApplication(),
      );

      await expect(service.createCancelRequest(validDto(), 42)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createCancelRequest(validDto(), 42)).rejects.toThrow(
        'Application is already cancelled',
      );
    });

    it('should throw BadRequestException when a pending cancel request already exists', async () => {
      mockPrisma.freshLicenseApplicationPersonalDetails.findUnique.mockResolvedValue(
        mockApprovedApplication(),
      );
      mockPrisma.cancelFormRequests.findFirst.mockResolvedValue({ id: 99, status: 'PENDING' });

      await expect(service.createCancelRequest(validDto(), 42)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createCancelRequest(validDto(), 42)).rejects.toThrow(
        'A pending cancel request already exists',
      );
    });

    it('should throw BadRequestException when the authenticated user does not exist in the DB', async () => {
      mockPrisma.freshLicenseApplicationPersonalDetails.findUnique.mockResolvedValue(
        mockApprovedApplication(),
      );
      mockPrisma.cancelFormRequests.findFirst.mockResolvedValue(null);
      mockPrisma.users.findUnique.mockResolvedValue(null);

      await expect(service.createCancelRequest(validDto(), 999)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createCancelRequest(validDto(), 999)).rejects.toThrow(
        'not found in the system',
      );
    });

    it('should throw BadRequestException on Prisma P2003 foreign key violation', async () => {
      mockPrisma.freshLicenseApplicationPersonalDetails.findUnique.mockResolvedValue(
        mockApprovedApplication(),
      );
      mockPrisma.cancelFormRequests.findFirst.mockResolvedValue(null);
      mockPrisma.users.findUnique.mockResolvedValue(mockUser);
      const p2003Error = new Error('Foreign key constraint failed');
      (p2003Error as any).code = 'P2003';
      (p2003Error as any).meta = {
        field_name: 'cancelFormRequests_freshLicenseId_fkey',
        modelName: 'CancelFormRequests',
      };
      mockPrisma.cancelFormRequests.create.mockRejectedValue(p2003Error);

      await expect(service.createCancelRequest(validDto(), 42)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createCancelRequest(validDto(), 42)).rejects.toThrow(
        'foreign key constraint failed',
      );
    });

    it('should re-throw known NestJS exceptions without wrapping', async () => {
      mockPrisma.freshLicenseApplicationPersonalDetails.findUnique.mockRejectedValue(
        new NotFoundException('Custom not found'),
      );

      await expect(service.createCancelRequest(validDto(), 42)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should wrap unknown errors in InternalServerErrorException', async () => {
      mockPrisma.freshLicenseApplicationPersonalDetails.findUnique.mockResolvedValue(
        mockApprovedApplication(),
      );
      mockPrisma.cancelFormRequests.findFirst.mockResolvedValue(null);
      mockPrisma.users.findUnique.mockResolvedValue(mockUser);
      mockPrisma.statuses.findFirst.mockResolvedValue(mockInitiateStatus());
      mockPrisma.cancelFormRequests.create.mockRejectedValue(new Error('Unexpected DB error'));

      await expect(service.createCancelRequest(validDto(), 42)).rejects.toThrow(
        'Failed to create cancel request',
      );
    });
  });
});
