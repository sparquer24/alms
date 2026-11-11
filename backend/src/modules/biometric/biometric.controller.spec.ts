import { Test, TestingModule } from '@nestjs/testing';
import { BiometricController } from './biometric.controller';
import { BiometricService } from './biometric.service';
import { BiometricAuditService } from './biometric-audit.service';
import { AuthGuard } from '../../middleware/auth.middleware';

describe('BiometricController', () => {
    let controller: BiometricController;
    let mockBiometricService: any;
    let mockAuditService: any;

    beforeEach(async () => {
        mockBiometricService = {
            storeFingerprint: jest.fn().mockResolvedValue({
                success: true,
                fingerprintId: 'hash123',
                enrolledAt: '2026-01-01T00:00:00Z',
                message: 'Fingerprint enrolled successfully',
            }),
            getEnrolledFingerprints: jest.fn().mockResolvedValue([
                { id: 'hash123', position: 'RIGHT_THUMB', quality: 90 },
            ]),
            verifyFingerprint: jest.fn().mockResolvedValue({
                success: true,
                isMatch: true,
                matchScore: 92,
                matchedFingerPosition: 'RIGHT_THUMB',
                message: 'Matched',
            }),
            deleteEnrolledFingerprint: jest.fn().mockResolvedValue({
                success: true,
                message: 'Fingerprint deleted successfully',
            }),
        };

        mockAuditService = {
            getAuditLogs: jest.fn().mockResolvedValue([]),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [BiometricController],
            providers: [
                { provide: BiometricService, useValue: mockBiometricService },
                { provide: BiometricAuditService, useValue: mockAuditService },
            ],
        })
            .overrideGuard(AuthGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<BiometricController>(BiometricController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('storeFingerprint delegates to service with parsed id and applicationType', async () => {
        const body = {
            fingerPosition: 'LEFT_THUMB',
            fingerTemplate: { template: 'tmpl', quality: 80, captureTime: 'time' },
            description: 'Custom desc',
            applicationType: 'RENEWAL',
        };
        const req = { user: { sub: '42' } };

        const res = await controller.storeFingerprint('323', body, undefined, req);

        expect(res.success).toBe(true);
        expect(mockBiometricService.storeFingerprint).toHaveBeenCalledWith(
            323,
            'LEFT_THUMB',
            body.fingerTemplate,
            'Custom desc',
            42,
            'RENEWAL',
        );
    });

    it('storeFingerprint prefers query applicationType if provided', async () => {
        const body = {
            fingerPosition: 'RIGHT_THUMB',
            fingerTemplate: { template: 'tmpl', quality: 80, captureTime: 'time' },
        };
        const req = { user: { sub: '42' } };

        await controller.storeFingerprint('15', body, 'FRESH', req);

        expect(mockBiometricService.storeFingerprint).toHaveBeenCalledWith(
            15,
            'RIGHT_THUMB',
            body.fingerTemplate,
            'Fingerprint - RIGHT_THUMB',
            42,
            'FRESH',
        );
    });

    it('getEnrolledFingerprints forwards applicationType query param', async () => {
        const res = await controller.getEnrolledFingerprints('323', 'RENEWAL');

        expect(res.success).toBe(true);
        expect(mockBiometricService.getEnrolledFingerprints).toHaveBeenCalledWith('323', 'RENEWAL');
    });

    it('verifyFingerprint forwards applicationType query param', async () => {
        const body = {
            fingerTemplate: { template: 'tmpl', quality: 80, captureTime: 'time' },
            matchThreshold: 65,
        };
        const req = { user: { sub: '42' } };

        await controller.verifyFingerprint('323', body, 'RENEWAL', req);

        expect(mockBiometricService.verifyFingerprint).toHaveBeenCalledWith('323', body, 42, 'RENEWAL');
    });

    it('deleteEnrolledFingerprint forwards applicationType query param', async () => {
        const req = { user: { sub: '42' } };

        await controller.deleteEnrolledFingerprint('323', 'fp123', 'RENEWAL', req);

        expect(mockBiometricService.deleteEnrolledFingerprint).toHaveBeenCalledWith('323', 'fp123', 42, 'RENEWAL');
    });
});

