import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { BiometricService } from './biometric.service';
import { PrismaService } from '../../services/prisma.service';
import { BiometricEncryptionService } from './biometric-encryption.service';
import { BiometricAuditService } from './biometric-audit.service';

describe('BiometricService', () => {
    let service: BiometricService;
    let mockPrisma: any;
    let mockEncryption: any;
    let mockAudit: any;

    beforeEach(async () => {
        mockPrisma = {
            freshLicenseApplicationPersonalDetails: {
                findUnique: jest.fn(),
            },
            renewalFormPersonalDetails: {
                findUnique: jest.fn(),
            },
            licenses: {
                findUnique: jest.fn(),
            },
            fLAFBiometricDatas: {
                findUnique: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
                findMany: jest.fn().mockResolvedValue([]),
            },
            renewalBiometricDatas: {
                findUnique: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
                findMany: jest.fn().mockResolvedValue([]),
            },
        };

        mockEncryption = {
            encryptTemplate: jest.fn((t: string) => Promise.resolve(t)),
            decryptTemplate: jest.fn((t: string) => Promise.resolve(t)),
        };

        mockAudit = {
            logBiometricAction: jest.fn().mockResolvedValue(undefined),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BiometricService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: BiometricEncryptionService, useValue: mockEncryption },
                { provide: BiometricAuditService, useValue: mockAudit },
            ],
        }).compile();

        service = module.get<BiometricService>(BiometricService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('resolveApplication', () => {
        it('resolves explicit FRESH application', async () => {
            mockPrisma.freshLicenseApplicationPersonalDetails.findUnique.mockResolvedValue({ id: 10, isSubmit: false });

            const resolved = await service.resolveApplication(10, 'FRESH');
            expect(resolved.type).toBe('FRESH');
            expect(resolved.applicationId).toBe(10);
        });

        it('resolves explicit RENEWAL application', async () => {
            mockPrisma.renewalFormPersonalDetails.findUnique.mockResolvedValue({ id: 323, isSubmit: false });

            const resolved = await service.resolveApplication(323, 'RENEWAL');
            expect(resolved.type).toBe('RENEWAL');
            expect(resolved.applicationId).toBe(323);
        });

        it('auto-resolves to RENEWAL when ID only exists in renewal table', async () => {
            mockPrisma.freshLicenseApplicationPersonalDetails.findUnique.mockResolvedValue(null);
            mockPrisma.renewalFormPersonalDetails.findUnique.mockResolvedValue({ id: 323, isSubmit: false });

            const resolved = await service.resolveApplication(323);
            expect(resolved.type).toBe('RENEWAL');
            expect(resolved.applicationId).toBe(323);
        });

        it('auto-resolves to FRESH when ID only exists in fresh table', async () => {
            mockPrisma.freshLicenseApplicationPersonalDetails.findUnique.mockResolvedValue({ id: 10, isSubmit: false });
            mockPrisma.renewalFormPersonalDetails.findUnique.mockResolvedValue(null);

            const resolved = await service.resolveApplication(10);
            expect(resolved.type).toBe('FRESH');
            expect(resolved.applicationId).toBe(10);
        });

        it('disambiguates when ID exists in both tables based on draft status', async () => {
            mockPrisma.freshLicenseApplicationPersonalDetails.findUnique.mockResolvedValue({ id: 5, isSubmit: true });
            mockPrisma.renewalFormPersonalDetails.findUnique.mockResolvedValue({ id: 5, isSubmit: false });

            const resolved = await service.resolveApplication(5);
            expect(resolved.type).toBe('RENEWAL');
            expect(resolved.applicationId).toBe(5);
        });

        it('resolves from licenseId when ID matches a License record', async () => {
            mockPrisma.freshLicenseApplicationPersonalDetails.findUnique.mockResolvedValue(null);
            mockPrisma.renewalFormPersonalDetails.findUnique.mockResolvedValue(null);
            mockPrisma.licenses.findUnique.mockResolvedValue({
                id: 99,
                renewalApplicationId: 323,
                freshApplicationId: 10,
            });
            mockPrisma.renewalFormPersonalDetails.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 323 });

            const resolved = await service.resolveApplication(99);
            expect(resolved.type).toBe('RENEWAL');
            expect(resolved.applicationId).toBe(323);
        });

        it('throws 404 when application is not found anywhere', async () => {
            mockPrisma.freshLicenseApplicationPersonalDetails.findUnique.mockResolvedValue(null);
            mockPrisma.renewalFormPersonalDetails.findUnique.mockResolvedValue(null);
            mockPrisma.licenses.findUnique.mockResolvedValue(null);

            await expect(service.resolveApplication(999)).rejects.toThrow(HttpException);
        });
    });

    describe('storeFingerprint', () => {
        const dummyTemplate = {
            template: 'dummy-base64-template',
            quality: 85,
            captureTime: new Date().toISOString(),
            bitmapData: 'dummy-bitmap-data',
        };

        it('successfully stores fingerprint for Fresh Application in fLAFBiometricDatas', async () => {
            mockPrisma.freshLicenseApplicationPersonalDetails.findUnique.mockResolvedValue({ id: 10 });
            mockPrisma.renewalFormPersonalDetails.findUnique.mockResolvedValue(null);
            mockPrisma.fLAFBiometricDatas.findUnique.mockResolvedValue(null);
            mockPrisma.fLAFBiometricDatas.create.mockResolvedValue({});

            const result = await service.storeFingerprint(10, 'RIGHT_THUMB', dummyTemplate, 'Fresh capture', 1);

            expect(result.success).toBe(true);
            expect(result.message).toContain('RIGHT_THUMB');
            expect(mockPrisma.fLAFBiometricDatas.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    applicationId: 10,
                    biometricData: expect.objectContaining({
                        fingerprints: [expect.objectContaining({
                            position: 'RIGHT_THUMB',
                            template: 'dummy-base64-template',
                            quality: 85,
                        })],
                    }),
                }),
            }));
            expect(mockPrisma.renewalBiometricDatas.create).not.toHaveBeenCalled();
            expect(mockAudit.logBiometricAction).toHaveBeenCalledWith(
                10,
                1,
                'FINGERPRINT_ENROLLED',
                'RIGHT_THUMB',
                expect.objectContaining({ quality: 85, applicationType: 'FRESH' }),
            );
        });

        it('successfully stores fingerprint for Renewal Application in renewalBiometricDatas', async () => {
            mockPrisma.freshLicenseApplicationPersonalDetails.findUnique.mockResolvedValue(null);
            mockPrisma.renewalFormPersonalDetails.findUnique.mockResolvedValue({ id: 323 });
            mockPrisma.renewalBiometricDatas.findUnique.mockResolvedValue(null);
            mockPrisma.renewalBiometricDatas.create.mockResolvedValue({});

            const result = await service.storeFingerprint(323, 'RIGHT_THUMB', dummyTemplate, 'Renewal capture', 1);

            expect(result.success).toBe(true);
            expect(result.message).toContain('RIGHT_THUMB');
            expect(mockPrisma.renewalBiometricDatas.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    applicationId: 323,
                    biometricData: expect.objectContaining({
                        fingerprints: [expect.objectContaining({
                            position: 'RIGHT_THUMB',
                            template: 'dummy-base64-template',
                            quality: 85,
                        })],
                    }),
                }),
            }));
            expect(mockPrisma.fLAFBiometricDatas.create).not.toHaveBeenCalled();
            expect(mockAudit.logBiometricAction).toHaveBeenCalledWith(
                323,
                1,
                'FINGERPRINT_ENROLLED',
                'RIGHT_THUMB',
                expect.objectContaining({ quality: 85, applicationType: 'RENEWAL' }),
            );
        });

        it('allows updating finger position from RIGHT_THUMB to LEFT_THUMB in Renewal Application without altering Fresh Application', async () => {
            // Existing renewal biometric with RIGHT_THUMB
            mockPrisma.freshLicenseApplicationPersonalDetails.findUnique.mockResolvedValue(null);
            mockPrisma.renewalFormPersonalDetails.findUnique.mockResolvedValue({ id: 323 });
            mockPrisma.renewalBiometricDatas.findUnique.mockResolvedValue({
                applicationId: 323,
                biometricData: {
                    fingerprints: [{
                        id: 'old-hash',
                        position: 'RIGHT_THUMB',
                        template: 'old-right-template',
                        quality: 75,
                    }],
                },
            });
            mockPrisma.renewalBiometricDatas.update.mockResolvedValue({});

            const leftThumbTemplate = {
                template: 'new-left-template',
                quality: 90,
                captureTime: new Date().toISOString(),
                bitmapData: 'new-left-bitmap',
            };

            const result = await service.storeFingerprint(323, 'LEFT_THUMB', leftThumbTemplate, 'Updated to left thumb', 1, 'RENEWAL');

            expect(result.success).toBe(true);
            expect(result.message).toContain('LEFT_THUMB');
            expect(mockPrisma.renewalBiometricDatas.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { applicationId: 323 },
                data: expect.objectContaining({
                    biometricData: expect.objectContaining({
                        fingerprints: [expect.objectContaining({
                            position: 'LEFT_THUMB',
                            template: 'new-left-template',
                            quality: 90,
                        })],
                    }),
                }),
            }));
            // Fresh records are completely untouched
            expect(mockPrisma.fLAFBiometricDatas.update).not.toHaveBeenCalled();
            expect(mockPrisma.fLAFBiometricDatas.create).not.toHaveBeenCalled();
        });

        it('returns 404 when application does not exist', async () => {
            mockPrisma.freshLicenseApplicationPersonalDetails.findUnique.mockResolvedValue(null);
            mockPrisma.renewalFormPersonalDetails.findUnique.mockResolvedValue(null);
            mockPrisma.licenses.findUnique.mockResolvedValue(null);

            await expect(
                service.storeFingerprint(999, 'RIGHT_THUMB', dummyTemplate, 'Desc', 1),
            ).rejects.toThrow(HttpException);
        });
    });

    describe('getEnrolledFingerprints', () => {
        it('returns enrolled fingerprints from fLAFBiometricDatas for Fresh Application', async () => {
            mockPrisma.freshLicenseApplicationPersonalDetails.findUnique.mockResolvedValue({ id: 10 });
            mockPrisma.renewalFormPersonalDetails.findUnique.mockResolvedValue(null);
            mockPrisma.fLAFBiometricDatas.findUnique.mockResolvedValue({
                applicationId: 10,
                biometricData: {
                    fingerprints: [{
                        id: 'fp-1',
                        position: 'RIGHT_THUMB',
                        quality: 95,
                        enrolledAt: '2026-01-01T00:00:00Z',
                        description: 'Thumb',
                        bitmapData: 'bmp-1',
                    }],
                },
            });

            const fps = await service.getEnrolledFingerprints('10');
            expect(fps).toHaveLength(1);
            expect(fps[0].position).toBe('RIGHT_THUMB');
            expect(fps[0].bitmapData).toBe('bmp-1');
        });

        it('returns enrolled fingerprints from renewalBiometricDatas for Renewal Application', async () => {
            mockPrisma.freshLicenseApplicationPersonalDetails.findUnique.mockResolvedValue(null);
            mockPrisma.renewalFormPersonalDetails.findUnique.mockResolvedValue({ id: 323 });
            mockPrisma.renewalBiometricDatas.findUnique.mockResolvedValue({
                applicationId: 323,
                biometricData: {
                    fingerprints: [{
                        id: 'fp-2',
                        position: 'LEFT_THUMB',
                        quality: 90,
                        enrolledAt: '2026-02-01T00:00:00Z',
                        description: 'Left thumb',
                        bitmapData: 'bmp-2',
                    }],
                },
            });

            const fps = await service.getEnrolledFingerprints('323', 'RENEWAL');
            expect(fps).toHaveLength(1);
            expect(fps[0].position).toBe('LEFT_THUMB');
            expect(fps[0].bitmapData).toBe('bmp-2');
        });

        it('falls back to fresh application fingerprints if renewalBiometricDatas does not exist yet', async () => {
            mockPrisma.freshLicenseApplicationPersonalDetails.findUnique.mockResolvedValue(null);
            mockPrisma.renewalFormPersonalDetails.findUnique.mockResolvedValue({
                id: 323,
                licenses: { freshApplicationId: 10 },
            });
            mockPrisma.renewalBiometricDatas.findUnique.mockResolvedValue(null);
            mockPrisma.fLAFBiometricDatas.findUnique.mockResolvedValue({
                applicationId: 10,
                biometricData: {
                    fingerprints: [{
                        id: 'fp-original',
                        position: 'RIGHT_THUMB',
                        quality: 85,
                        enrolledAt: '2025-01-01T00:00:00Z',
                        bitmapData: 'bmp-orig',
                    }],
                },
            });

            const fps = await service.getEnrolledFingerprints('323', 'RENEWAL');
            expect(fps).toHaveLength(1);
            expect(fps[0].position).toBe('RIGHT_THUMB');
        });
    });

    describe('deleteEnrolledFingerprint', () => {
        it('deletes fingerprint from renewalBiometricDatas for Renewal Application', async () => {
            mockPrisma.freshLicenseApplicationPersonalDetails.findUnique.mockResolvedValue(null);
            mockPrisma.renewalFormPersonalDetails.findUnique.mockResolvedValue({ id: 323 });
            mockPrisma.renewalBiometricDatas.findUnique.mockResolvedValue({
                applicationId: 323,
                biometricData: {
                    fingerprints: [{ id: 'fp-del', position: 'RIGHT_THUMB' }],
                },
            });
            mockPrisma.renewalBiometricDatas.update.mockResolvedValue({});

            const result = await service.deleteEnrolledFingerprint('323', 'fp-del', 1, 'RENEWAL');
            expect(result.success).toBe(true);
            expect(mockPrisma.renewalBiometricDatas.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { applicationId: 323 },
                data: expect.objectContaining({
                    biometricData: expect.objectContaining({
                        fingerprints: [],
                    }),
                }),
            }));
        });
    });
});

