jest.mock('puppeteer', () => ({ __esModule: true, default: {} }));
jest.mock('qrcode', () => ({ __esModule: true, toDataURL: jest.fn() }));

import { Test, TestingModule } from '@nestjs/testing';
import { LicensesService } from './licenses.service';
import { PrismaService } from '../../services/prisma.service';

describe('LicensesService', () => {
  let service: LicensesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LicensesService,
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<LicensesService>(LicensesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('buildLicenseDetailResponse', () => {
    it('maps license fields onto the fresh application detail shape', () => {
      const license = {
        id: 42,
        licenseNumber: 'LIC-1001',
        almsLicenseId: 'ALMS-9001',
        freshApplicationId: 7,
        renewalApplicationId: null,
        cancelApplicationId: null,
        lastModifiedAppType: 'FRESH',
      };

      const sourceApplication = {
        id: 7,
        acknowledgementNo: 'ACK-001',
        firstName: 'John',
        middleName: 'M',
        lastName: 'Doe',
        presentAddressId: 11,
        workflowStatusId: 20,
        currentUserId: 3,
        workflowHistories: [],
        fileUploads: [],
      };

      const result = service.buildLicenseDetailResponse(license as any, sourceApplication as any);

      expect(result).not.toBeNull();
      const mapped = result as any;
      expect(mapped).toEqual(expect.objectContaining({
        id: 7,
        acknowledgementNo: 'ACK-001',
        firstName: 'John',
        middleName: 'M',
        lastName: 'Doe',
        applicantName: 'John M Doe',
        licenseId: 42,
        licenseNumber: 'LIC-1001',
        almsLicenseId: 'ALMS-9001',
        freshApplicationId: 7,
        renewalApplicationId: null,
        cancelApplicationId: null,
        lastModifiedAppType: 'FRESH',
      }));

      expect(mapped.presentAddressId).toBeUndefined();
      expect(mapped.workflowStatusId).toBeUndefined();
      expect(mapped.currentUserId).toBeUndefined();
    });

    it('returns license metadata when sourceApplication is null (orphaned license)', () => {
      const license = {
        id: 42,
        licenseNumber: 'LIC-1001',
        almsLicenseId: 'ALMS-9001',
        freshApplicationId: 7,
        renewalApplicationId: null,
        cancelApplicationId: null,
        lastModifiedAppType: 'FRESH',
        lastModifiedRenewalId: null,
        renewalIds: [],
      };

      const result = service.buildLicenseDetailResponse(license as any, null);

      expect(result).not.toBeNull();
      const mapped = result as any;
      expect(mapped).toEqual({
        licenseId: 42,
        licenseNumber: 'LIC-1001',
        almsLicenseId: 'ALMS-9001',
        freshApplicationId: 7,
        renewalApplicationId: null,
        cancelApplicationId: null,
        lastModifiedAppType: 'FRESH',
        lastModifiedRenewalId: null,
        renewalIds: [],
        applicantName: null,
      });
    });

    it('returns null when license is null', () => {
      const result = service.buildLicenseDetailResponse(null, { id: 1 } as any);
      expect(result).toBeNull();
    });
  });

  describe('getLicenseById', () => {
    it('loads renewal application details when lastModifiedAppType is renewal', async () => {
      const prismaMock = {
        licenses: {
          findUnique: jest.fn().mockResolvedValue({
            id: 42,
            licenseNumber: 'LIC-1001',
            almsLicenseId: 'ALMS-9001',
            freshApplicationId: null,
            renewalApplicationId: 99,
            cancelApplicationId: null,
            lastModifiedAppType: 'RENEWAL',
            lastModifiedRenewalId: null,
            renewalIds: [],
          }),
        },
        renewalFormPersonalDetails: {
          findFirst: jest.fn().mockResolvedValue(null),
          findUnique: jest.fn().mockResolvedValue({
            id: 99,
            acknowledgementNo: 'REN-001',
            firstName: 'Jane',
            middleName: 'K',
            lastName: 'Doe',
            presentAddressId: 11,
            workflowStatusId: 20,
            currentUserId: 3,
            workflowHistories: [],
            fileUploads: [],
            licenseNumber: 'ACK-001',
          }),
        },
        freshLicenseApplicationPersonalDetails: {
          findFirst: jest.fn().mockResolvedValue({ id: 7 }),
        },
        freshLicenseApplicationsFormWorkflowHistories: {
          findMany: jest.fn().mockResolvedValue([]),
        },
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          LicensesService,
          {
            provide: PrismaService,
            useValue: prismaMock,
          },
        ],
      }).compile();

      const service = module.get<LicensesService>(LicensesService);
      const result = await service.getLicenseById('42');

      // The service first checks for a draft renewal (findFirst with isSubmit: false)
      // When none found, it falls through to the standard license lookup
      expect(prismaMock.licenses.findUnique).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({
        id: 99,
        acknowledgementNo: 'REN-001',
        firstName: 'Jane',
        middleName: 'K',
        lastName: 'Doe',
        applicantName: 'Jane K Doe',
        licenseId: 42,
        licenseNumber: 'LIC-1001',
        almsLicenseId: 'ALMS-9001',
        freshApplicationId: null,
        renewalApplicationId: 99,
        cancelApplicationId: null,
        lastModifiedAppType: 'RENEWAL',
      }));
    });

    it('returns license metadata when related application is missing (orphaned)', async () => {
      const prismaMock = {
        licenses: {
          findUnique: jest.fn().mockResolvedValue({
            id: 38,
            licenseNumber: 'LUAN2026-TEST',
            almsLicenseId: 'ALMS-TEST',
            freshApplicationId: 999,
            renewalApplicationId: null,
            cancelApplicationId: null,
            lastModifiedAppType: 'FRESH',
            lastModifiedRenewalId: null,
            renewalIds: [],
          }),
        },
        renewalFormPersonalDetails: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
        freshLicenseApplicationPersonalDetails: {
          findUnique: jest.fn().mockResolvedValue(null), // app deleted/orphaned
          findFirst: jest.fn().mockResolvedValue(null),
        },
        freshLicenseApplicationsFormWorkflowHistories: {
          findMany: jest.fn().mockResolvedValue([]),
        },
        cancelFormRequests: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          LicensesService,
          {
            provide: PrismaService,
            useValue: prismaMock,
          },
        ],
      }).compile();

      const service = module.get<LicensesService>(LicensesService);
      const result = await service.getLicenseById('38');

      // Should return license metadata, not null
      expect(result).not.toBeNull();
      expect(result).toEqual(expect.objectContaining({
        licenseId: 38,
        licenseNumber: 'LUAN2026-TEST',
        freshApplicationId: 999,
        lastModifiedAppType: 'FRESH',
        applicantName: null,
      }));
    });

    it('returns null when license record does not exist', async () => {
      const prismaMock = {
        licenses: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
        renewalFormPersonalDetails: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          LicensesService,
          {
            provide: PrismaService,
            useValue: prismaMock,
          },
        ],
      }).compile();

      const service = module.get<LicensesService>(LicensesService);
      const result = await service.getLicenseById('999');

      expect(result).toBeNull();
      expect(prismaMock.licenses.findUnique).toHaveBeenCalled();
    });
  });
});
