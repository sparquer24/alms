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
        lastModifiedAppId: null,
        lastModifiedRenewalId: null,
        previousModifiedAppType: null,
        previousModifiedAppId: null,
        renewalIds: [],
        applicantName: null,
      });
    });

    it('returns null when license is null', () => {
      const result = service.buildLicenseDetailResponse(null, { id: 1 } as any);
      expect(result).toBeNull();
    });

    it('builds the response from the license row itself for bulk-imported licenses (no source application)', () => {
      const license = {
        id: 42,
        licenseNumber: 'LUAN-IMPORTED-1',
        almsLicenseId: 'ALMS-IMPORTED-1',
        freshApplicationId: null,
        renewalApplicationId: null,
        cancelApplicationId: null,
        lastModifiedAppType: 'IMPORT',
        lastModifiedRenewalId: null,
        renewalIds: [],
        status: 'ACTIVE',
        firstName: 'Imported',
        middleName: '',
        lastName: 'Applicant',
        parentOrSpouseName: 'Parent Name',
        sex: 'MALE',
        aadharNumber: '123456789012',
        panNumber: 'ABCDE1234F',
        presentAddressLine: '123 Main St',
        presentStateId: 1,
        presentDistrictId: 2,
        armsCategory: 'RESTRICTED',
        areaOfValidity: 'State-wide',
        occupation: 'Farmer',
        officeAddress: 'Office Rd',
        endorsedWeapons: [{ id: 5, name: 'Pistol' }],
      };

      const result = service.buildLicenseDetailResponse(license as any, null);

      expect(result).not.toBeNull();
      const mapped = result as any;
      // The renewal form treats isSubmit as the gate for "can this license be renewed";
      // an imported license is already a valid, active license, so it must pass.
      expect(mapped.isSubmit).toBe(true);
      expect(mapped.applicantName).toBe('Imported Applicant');
      expect(mapped.presentAddress).toEqual(expect.objectContaining({
        addressLine: '123 Main St',
        stateId: 1,
        districtId: 2,
      }));
      expect(mapped.occupationAndBusiness).toEqual({ occupation: 'Farmer', officeAddress: 'Office Rd' });
      expect(mapped.licenseDetails[0]).toEqual(expect.objectContaining({
        armsCategory: 'RESTRICTED',
        areaOfValidity: 'State-wide',
        requestedWeapons: [{ id: 5, name: 'Pistol' }],
      }));
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

  describe('bulk license import', () => {
    // Location masters shaped so Hyderabad(579) belongs to Telangana(24), and the
    // range office / zone / division / station chain hangs off that district.
    const createPrismaMock = (overrides: { existingLicenses?: any[]; aadharLicenses?: any[] } = {}) => {
      // Each row is written inside $transaction, so the transactional client is
      // mocked alongside the top-level one.
      const tx = {
        licenses: {
          create: jest.fn(async ({ data }: any) => ({
            id: 501,
            licenseNumber: data.licenseNumber,
            status: data.status,
          })),
        },
        licenseWorkflowHistory: { create: jest.fn(async (_data: any) => ({})) },
      };

      return {
        states: {
          findMany: jest.fn().mockResolvedValue([
            { id: 24, name: 'Telangana' },
            { id: 1, name: 'West Bengal' },
          ]),
        },
        districts: {
          findMany: jest.fn().mockResolvedValue([
            { id: 579, name: 'Hyderabad', stateId: 24 },
            { id: 11, name: 'Kolkata', stateId: 1 },
          ]),
        },
        rangeOffices: {
          findMany: jest.fn().mockResolvedValue([{ id: 1, name: 'Hyderabad Range', districtId: 579 }]),
        },
        zones: {
          findMany: jest.fn().mockResolvedValue([{ id: 1, name: 'Zone 1', rangeOfficeId: 1 }]),
        },
        divisions: {
          findMany: jest.fn().mockResolvedValue([{ id: 3, name: 'Division 3', zoneId: 1 }]),
        },
        policeStations: {
          findMany: jest.fn().mockResolvedValue([{ id: 8, name: 'Jubilee Hills', divisionId: 3 }]),
        },
        weaponTypeMaster: {
          findMany: jest.fn().mockResolvedValue([{ id: 5, name: 'DBSL Gun' }]),
        },
        licenses: {
          findMany: jest.fn().mockResolvedValue([
            ...(overrides.existingLicenses ?? []),
            ...(overrides.aadharLicenses ?? []),
          ]),
          create: tx.licenses.create,
        },
        licenseWorkflowHistory: tx.licenseWorkflowHistory,
        auditLogs: { create: jest.fn(async (_data: any) => ({})) },
        $transaction: jest.fn(async (callback: any) => callback(tx)),
      };
    };

    const baseRow = {
      licenseNumber: 'LUAN2026-IMPORT1',
      firstName: 'Ramesh',
      lastName: 'Kumar',
      parentOrSpouseName: 'Suresh Kumar',
      sex: 'MALE',
      issueDate: '2021-06-01',
      validTill: '31/05/2026',
      presentAddressLine: 'Jubilee Hills Main Road\nYousufguda',
      presentDistrict: 'Hyderabad',
      presentPoliceStation: 'Jubilee Hills',
      presentDivision: 'Division 3',
      presentZone: 'Zone 1',
      presentRangeOffice: 'Hyderabad Range',
    };

    const importScope = { userId: 7, stateId: 24, roleCode: 'ADMIN' };

    it('accepts a row that supplies raw hierarchy ids, as exported from the register', async () => {
      const service = new LicensesService(createPrismaMock() as any);

      const preview = await service.previewLicenseImport(
        [{
          ...baseRow,
          presentDistrict: undefined,
          presentPoliceStation: undefined,
          presentDivision: undefined,
          presentZone: undefined,
          presentRangeOffice: undefined,
          presentStateId: 24,
          presentDistrictId: 579,
          presentPoliceStationId: 8,
          presentZoneId: 1,
          presentDivisionId: 3,
          presentRangeOfficeId: 1,
        }],
        importScope,
      );

      expect(preview.summary.errors).toBe(0);
      expect(preview.summary.importable).toBe(1);
    });

    it('resolves readable location names and pins a blank state to the caller jurisdiction', async () => {
      const service = new LicensesService(createPrismaMock() as any);

      const plan: any = await (service as any).buildImportPlan([baseRow], importScope, {});
      const row = plan.rows[0];

      expect(row.status).toBe('warning');
      expect(row.warnings.join(' ')).toContain('defaulted to your state');
      expect(row.data).toEqual(
        expect.objectContaining({
          presentStateId: 24,
          presentDistrictId: 579,
          presentRangeOfficeId: 1,
          presentZoneId: 1,
          presentDivisionId: 3,
          presentPoliceStationId: 8,
          // permanent address is copied from present when it is not supplied
          permanentDistrictId: 579,
          lastModifiedAppType: 'IMPORT',
          issuedBy: 7,
        }),
      );
      expect(row.data.issueDate).toBeInstanceOf(Date);
      expect(row.data.validTill).toBeInstanceOf(Date);
    });

    it('rejects a row from another state for a non super-admin caller', async () => {
      const service = new LicensesService(createPrismaMock() as any);

      const plan: any = await (service as any).buildImportPlan(
        [{ ...baseRow, presentState: 'West Bengal', presentDistrict: 'Kolkata', presentPoliceStation: undefined, presentDivision: undefined, presentZone: undefined, presentRangeOffice: undefined }],
        importScope,
        {},
      );

      expect(plan.rows[0].status).toBe('error');
      expect(plan.rows[0].errors.join(' ')).toContain('outside your jurisdiction');
    });

    it('rejects a district that does not belong to the named state', async () => {
      const service = new LicensesService(createPrismaMock() as any);

      const plan: any = await (service as any).buildImportPlan(
        [{ ...baseRow, presentState: 'Telangana', presentDistrict: 'Kolkata' }],
        { ...importScope, roleCode: 'SUPER_ADMIN' },
        {},
      );

      expect(plan.rows[0].status).toBe('error');
      expect(plan.rows[0].errors.join(' ')).toContain('does not belong to the selected present state');
    });

    it('flags an unknown location name instead of silently dropping it', async () => {
      const service = new LicensesService(createPrismaMock() as any);

      const plan: any = await (service as any).buildImportPlan(
        [{ ...baseRow, presentDistrict: 'Nowhere' }],
        importScope,
        {},
      );

      expect(plan.rows[0].status).toBe('error');
      expect(plan.rows[0].errors.join(' ')).toContain('was not found in the location master');
    });

    it('reports missing required fields, bad enums and unparseable dates', async () => {
      const service = new LicensesService(createPrismaMock() as any);

      const plan: any = await (service as any).buildImportPlan(
        [{ licenseNumber: 'BAD-1', sex: 'UNKNOWN', issueDate: 'not-a-date', status: 'WHATEVER' }],
        importScope,
        {},
      );

      const errors = plan.rows[0].errors.join(' | ');
      expect(plan.rows[0].status).toBe('error');
      expect(errors).toContain('First name is required');
      expect(errors).toContain('Last name is required');
      expect(errors).toContain('Father/guardian/spouse name is required');
      expect(errors).toContain('Gender "UNKNOWN" is not recognised');
      expect(errors).toContain('Status "WHATEVER" is not valid');
      expect(errors).toContain('could not be parsed as a date');
    });

    it('treats an existing license number as an error, or skips it when asked', async () => {
      const existing = [{ id: 91, licenseNumber: 'LUAN2026-IMPORT1', status: 'ACTIVE' }];

      const failService = new LicensesService(createPrismaMock({ existingLicenses: existing }) as any);
      const failPlan: any = await (failService as any).buildImportPlan([baseRow], importScope, {});
      expect(failPlan.rows[0].status).toBe('error');
      expect(failPlan.rows[0].errors.join(' ')).toContain('already exists (license #91)');

      const skipService = new LicensesService(createPrismaMock({ existingLicenses: existing }) as any);
      const skipPlan: any = await (skipService as any).buildImportPlan([baseRow], importScope, {
        onDuplicate: 'skip',
      });
      expect(skipPlan.rows[0].status).toBe('skipped');
      expect(skipPlan.summary.skipped).toBe(1);
      expect(skipPlan.summary.importable).toBe(0);
    });

    it('catches a license number duplicated inside the uploaded file', async () => {
      const service = new LicensesService(createPrismaMock() as any);

      const plan: any = await (service as any).buildImportPlan([baseRow, { ...baseRow }], importScope, {});

      expect(plan.rows[0].status).not.toBe('error');
      expect(plan.rows[1].status).toBe('error');
      expect(plan.rows[1].errors.join(' ')).toContain('Duplicate license number in the file — first seen on row 2');
    });

    it('warns about a probable duplicate person without blocking the row', async () => {
      const service = new LicensesService(
        createPrismaMock({
          aadharLicenses: [
            { id: 44, licenseNumber: 'LUAN2020-OLD', aadharNumber: '123456789012', armsCategory: null },
          ],
        }) as any,
      );

      const plan: any = await (service as any).buildImportPlan(
        [{ ...baseRow, licenseNumber: 'LUAN2026-IMPORT2', aadharNumber: '123456789012' }],
        importScope,
        {},
      );

      expect(plan.rows[0].status).toBe('warning');
      expect(plan.rows[0].warnings.join(' ')).toContain('Possible duplicate');
      expect(plan.summary.importable).toBe(1);
    });

    it('blocks warning rows when strict mode is on', async () => {
      const service = new LicensesService(createPrismaMock() as any);

      const preview = await service.previewLicenseImport([baseRow], importScope, { strict: true });

      expect(preview.summary.warnings).toBe(1);
      expect(preview.summary.importable).toBe(0);
    });

    it('refuses to guess a state for a super-admin import', async () => {
      const service = new LicensesService(createPrismaMock() as any);

      const plan: any = await (service as any).buildImportPlan(
        [{ ...baseRow, presentState: undefined }],
        { userId: 1, roleCode: 'SUPER_ADMIN' },
        {},
      );

      expect(plan.rows[0].status).toBe('error');
      expect(plan.rows[0].errors.join(' ')).toContain('Present state is required');
    });

    it('persists the importable rows, tags each with the batch id and audits the batch', async () => {
      const prisma = createPrismaMock();
      const service = new LicensesService(prisma as any);

      const result = await service.commitLicenseImport(
        [baseRow, { licenseNumber: 'BROKEN-ROW' }],
        importScope,
        { fileName: 'register-2026.xlsx' },
      );

      expect(result.summary.imported).toBe(1);
      expect(result.summary.failed).toBe(1);
      expect(result.summary.total).toBe(2);
      expect(result.batchId).toMatch(/^IMP-/);
      expect(result.fileName).toBe('register-2026.xlsx');

      // One transaction per importable row
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);

      // The history entry carries the batch id, which is what rollback looks up
      const history: any = prisma.licenseWorkflowHistory.create.mock.calls[0]?.[0];
      expect(history.data.action).toBe('IMPORTED');
      expect(history.data.changedBy).toBe(7);
      expect(history.data.remarks).toContain(result.batchId);

      // The batch is recorded on the audit trail
      const audit: any = prisma.auditLogs.create.mock.calls[0]?.[0];
      expect(audit.data.entity).toBe('Licenses');
      expect(audit.data.action).toBe('BULK_IMPORT');
      expect(audit.data.entityId).toBe(result.batchId);
      expect(audit.data.newValue.licenseIds).toEqual([501]);
      expect(audit.data.newValue.stateId).toBe(24);

      // The failing row is reported against its real spreadsheet row number
      const failedRow = result.results.find((row) => row.status === 'failed');
      expect(failedRow?.rowNumber).toBe(3);
      expect(failedRow?.errors.length).toBeGreaterThan(0);
    });

    it('reads headers straight out of the generated template, required markers included', async () => {
      const service = new LicensesService(createPrismaMock() as any);

      // Exactly how the template ships the required columns (" *" suffix).
      const plan: any = await (service as any).buildImportPlan(
        [
          {
            'licenseNumber *': 'LUAN2026-IMPORT4',
            'firstName *': 'Ravi',
            'lastName *': 'Verma',
            'parentOrSpouseName *': 'Shyam Verma',
            'sex *': 'MALE',
            'issueDate *': '2023-02-01',
            presentDistrict: 'Hyderabad',
            status: 'ACTIVE',
          },
        ],
        importScope,
        {},
      );

      expect(plan.rows[0].errors).toEqual([]);
      expect(plan.rows[0].data.firstName).toBe('Ravi');
      expect(plan.rows[0].data.parentOrSpouseName).toBe('Shyam Verma');
      expect(plan.rows[0].data.status).toBe('ACTIVE');
      expect(plan.rows[0].data.presentDistrictId).toBe(579);
    });

    it('maps flexible header spellings onto the same fields', async () => {
      const service = new LicensesService(createPrismaMock() as any);

      const plan: any = await (service as any).buildImportPlan(
        [
          {
            'License Number': 'LUAN2026-IMPORT3',
            'First Name': 'Anita',
            'Last Name': 'Sharma',
            Father: 'Mohan Sharma',
            Gender: 'F',
            'Issue Date': '2022-01-15',
            District: 'Hyderabad',
            'Weapon Details': 'DBSL Gun, Unknown Rifle',
          },
        ],
        importScope,
        {},
      );

      const row = plan.rows[0];
      expect(row.status).toBe('warning');
      expect(row.data.firstName).toBe('Anita');
      expect(row.data.parentOrSpouseName).toBe('Mohan Sharma');
      expect(row.data.sex).toBe('FEMALE');
      expect(row.errors).toHaveLength(0);
      // Unknown weapon names are reported, the recognised one is connected
      expect(row.warnings.join(' ')).toContain('Unknown Rifle');
      expect(row.data.endorsedWeapons).toEqual({ connect: [{ id: 5 }] });
    });
  });
});
