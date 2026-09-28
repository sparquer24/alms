jest.mock('puppeteer', () => ({ __esModule: true, default: {} }));
jest.mock('qrcode', () => ({ __esModule: true, toDataURL: jest.fn() }));

import { Test, TestingModule } from '@nestjs/testing';
import { LicensesController } from './licenses.controller';
import { LicensesService } from './licenses.service';

describe('LicensesController', () => {
  let controller: LicensesController;
  let service: {
    previewLicenseImport: jest.Mock;
    commitLicenseImport: jest.Mock;
    rollbackLicenseImportBatch: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      previewLicenseImport: jest.fn().mockResolvedValue({ success: true }),
      commitLicenseImport: jest.fn().mockResolvedValue({ success: true }),
      rollbackLicenseImportBatch: jest.fn().mockResolvedValue({ success: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LicensesController],
      providers: [{ provide: LicensesService, useValue: service }],
    }).compile();

    controller = module.get<LicensesController>(LicensesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('bulk import', () => {
    // Shaped like the object AuthGuard attaches to the request.
    const authenticatedRequest = {
      user: { sub: 12, user_id: 12, stateId: 24, roleCode: 'ADMIN' },
    };

    it('validates the uploaded rows against the caller identity and jurisdiction', async () => {
      const rows = [{ licenseNumber: 'LUAN2026-1' }] as any;

      await controller.previewLicenseImport({ rows, strict: true } as any, authenticatedRequest as any);

      expect(service.previewLicenseImport).toHaveBeenCalledWith(
        rows,
        { userId: 12, stateId: 24, roleCode: 'ADMIN' },
        { strict: true },
      );
    });

    it('passes the import options and file name through on commit', async () => {
      const rows = [{ licenseNumber: 'LUAN2026-1' }] as any;

      await controller.importLicenses(
        { rows, strict: false, onDuplicate: 'skip', fileName: 'register.xlsx' } as any,
        authenticatedRequest as any,
      );

      expect(service.commitLicenseImport).toHaveBeenCalledWith(
        rows,
        { userId: 12, stateId: 24, roleCode: 'ADMIN' },
        { strict: false, onDuplicate: 'skip', fileName: 'register.xlsx' },
      );
    });

    it('rolls back the requested batch within the caller jurisdiction', async () => {
      await controller.rollbackLicenseImport('IMP-123', authenticatedRequest as any);

      expect(service.rollbackLicenseImportBatch).toHaveBeenCalledWith('IMP-123', {
        userId: 12,
        stateId: 24,
        roleCode: 'ADMIN',
      });
    });

    it('still resolves the caller when the guard only exposes the jwt claims', async () => {
      await controller.rollbackLicenseImport('IMP-123', {
        headers: { authorization: 'Bearer not-a-real-token' },
      } as any);

      // No verifiable identity, so the scope is empty rather than guessed at.
      expect(service.rollbackLicenseImportBatch).toHaveBeenCalledWith('IMP-123', {
        userId: undefined,
        stateId: undefined,
        roleCode: undefined,
      });
    });
  });
});
