import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import sharp from 'sharp';
import { BiometricPhotoService } from './biometric-photo.service';

describe('BiometricPhotoService', () => {
  let service: BiometricPhotoService;
  let validImageBuffer: Buffer;
  let smallImageBuffer: Buffer;

  beforeAll(async () => {
    // Generate valid test JPEG (300x300)
    validImageBuffer = await sharp({
      create: {
        width: 300,
        height: 300,
        channels: 3,
        background: { r: 200, g: 200, b: 200 },
      },
    })
      .jpeg()
      .toBuffer();

    // Generate small test JPEG (100x100) below minimum 200x200
    smallImageBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 100, g: 100, b: 100 },
      },
    })
      .jpeg()
      .toBuffer();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BiometricPhotoService],
    }).compile();

    service = module.get<BiometricPhotoService>(BiometricPhotoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should validate valid photograph with 1 face successfully', async () => {
    const result = await service.validatePhotograph(validImageBuffer, {
      faceCount: 1,
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe('BIOMETRIC_ACCEPTED');
    expect(result.metadata?.width).toBe(300);
    expect(result.metadata?.height).toBe(300);
    expect(result.metadata?.faceCount).toBe(1);
  });

  it('should reject photograph if no person is detected (faceCount = 0)', async () => {
    await expect(
      service.validatePhotograph(validImageBuffer, { faceCount: 0 }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject photograph if multiple persons are detected (faceCount = 2)', async () => {
    await expect(
      service.validatePhotograph(validImageBuffer, { faceCount: 2 }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject photograph if resolution is below 200x200 pixels', async () => {
    await expect(
      service.validatePhotograph(smallImageBuffer, { faceCount: 1 }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject invalid non-image buffer', async () => {
    const fakeBuffer = Buffer.from('This is not an image at all');
    await expect(
      service.validatePhotograph(fakeBuffer, { faceCount: 1 }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should parse base64 data URLs correctly', () => {
    const base64Str = `data:image/jpeg;base64,${validImageBuffer.toString('base64')}`;
    const parsed = service.parseImageBuffer(undefined, base64Str);
    expect(Buffer.isBuffer(parsed)).toBe(true);
    expect(parsed.length).toBe(validImageBuffer.length);
  });
});
