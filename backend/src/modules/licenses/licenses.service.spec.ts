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

  it('maps license fields onto the fresh application detail shape', () => {
    const license = {
      id: 42,
      licenseNumber: 'LIC-1001',
      almsLicenseId: 'ALMS-9001',
      sourceApplicationId: 7,
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
      sourceApplicationId: 7,
      lastModifiedAppType: 'FRESH',
    }));

    expect(mapped.presentAddressId).toBeUndefined();
    expect(mapped.workflowStatusId).toBeUndefined();
    expect(mapped.currentUserId).toBeUndefined();
  });

  it('loads renewal application details when lastModifiedAppType is renewal', async () => {
    const prismaMock = {
      licenses: {
        findUnique: jest.fn().mockResolvedValue({
          id: 42,
          licenseNumber: 'LIC-1001',
          almsLicenseId: 'ALMS-9001',
          sourceApplicationId: 99,
          lastModifiedAppType: 'RENEWAL',
        }),
      },
      renewalFormPersonalDetails: {
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
    const result = await service.getLicenseById(42);

    expect(prismaMock.renewalFormPersonalDetails.findUnique).toHaveBeenCalled();
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
      sourceApplicationId: 99,
      lastModifiedAppType: 'RENEWAL',
      freshApplicationId: 7,
    }));
  });
});
