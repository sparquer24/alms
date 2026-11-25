import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import prisma from '../../../db/prismaClient';
import { detectFileType } from '../../../utils/file-signature.util';
import {
  BiometricPhotoResponseDto,
  ValidateBiometricPhotoDto,
} from '../dto/biometric-photo.dto';

const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const MIN_DIMENSION = 200; // 200 x 200 minimum resolution

@Injectable()
export class BiometricPhotoService {
  private readonly logger = new Logger(BiometricPhotoService.name);

  /**
   * Helper to parse image buffer from either multipart buffer or base64 string
   */
  parseImageBuffer(fileBuffer?: Buffer, base64Image?: string): Buffer {
    if (fileBuffer && Buffer.isBuffer(fileBuffer) && fileBuffer.length > 0) {
      return fileBuffer;
    }

    if (base64Image && typeof base64Image === 'string') {
      const match = base64Image.match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/);
      const rawData = match ? match[2] : base64Image;
      return Buffer.from(rawData, 'base64');
    }

    throw new BadRequestException('Photograph file or base64 image data is required.');
  }

  /**
   * Validate biometric photograph without permanently saving
   */
  async validatePhotograph(
    buffer: Buffer,
    dto: ValidateBiometricPhotoDto,
  ): Promise<BiometricPhotoResponseDto> {
    const { metadata } = await this.performValidation(buffer, dto);

    return {
      success: true,
      status: 'BIOMETRIC_ACCEPTED',
      message: 'Biometric photograph validated successfully.',
      metadata,
    };
  }

  /**
   * Validate and permanently store accepted photograph
   */
  async uploadPhotograph(
    buffer: Buffer,
    dto: ValidateBiometricPhotoDto,
    originalFilename?: string,
  ): Promise<BiometricPhotoResponseDto> {
    const { detectedExt, metadata } = await this.performValidation(buffer, dto);

    const mime = detectedExt === 'png' ? 'image/png' : detectedExt === 'webp' ? 'image/webp' : 'image/jpeg';
    const base64Url = `data:${mime};base64,${buffer.toString('base64')}`;
    const filename = originalFilename || `biometric_${randomUUID()}.${detectedExt || 'jpg'}`;

    let filePath = base64Url;

    // Only write physical file to local disk if explicitly requested via environment variable.
    // By default, ALMS persists photograph binaries directly in the database as base64 data URLs
    // ensuring files are centralized and resilient against local file deletion.
    if (process.env.STORE_LOCAL_BIOMETRIC_FILES === 'true') {
      const targetDir = path.resolve(process.cwd(), 'uploads', 'accepted', 'BIOMETRIC');
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      const fullPath = path.join(targetDir, filename);
      await fs.promises.writeFile(fullPath, buffer);
      filePath = `uploads/accepted/BIOMETRIC/${filename}`;
    }

    let createdRecord: any = null;
    // Associate with existing ALMS application if provided
    if (dto.applicationId) {
      createdRecord = await this.associateWithApplication(
        Number(dto.applicationId),
        dto.applicationType || 'Fresh',
        base64Url,
        filename,
        buffer.length,
      );
    }

    this.logger.log(
      `Biometric photograph saved: dimensions=${metadata.width}x${metadata.height}, applicationId=${dto.applicationId || 'none'}, recordId=${createdRecord?.id || 'none'}`,
    );

    return {
      success: true,
      status: 'BIOMETRIC_ACCEPTED',
      message: 'Biometric photograph captured, validated, and saved successfully.',
      filePath,
      fileUrl: base64Url,
      fileId: createdRecord?.id,
      metadata,
    };
  }

  /**
   * Internal validation for format, dimensions, and face count
   */
  private async performValidation(
    buffer: Buffer,
    dto: ValidateBiometricPhotoDto,
  ): Promise<{ detectedExt: string; metadata: any }> {
    // 1. File magic byte signature check
    const typeResult = await detectFileType(buffer);
    if (!typeResult || !ALLOWED_IMAGE_MIMES.includes(typeResult.mime)) {
      throw new BadRequestException(
        `Invalid image format (${typeResult?.mime || 'unknown'}). Allowed formats: JPEG, PNG, WebP.`,
      );
    }

    // 2. Validate dimensions using sharp
    let sharpMeta: any;
    try {
      sharpMeta = await sharp(buffer).metadata();
    } catch (err: any) {
      throw new BadRequestException(`Failed to parse image file: ${err.message}`);
    }

    const width = sharpMeta.width || 0;
    const height = sharpMeta.height || 0;

    if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
      throw new BadRequestException(
        `Image resolution (${width}x${height} px) does not meet minimum requirement of ${MIN_DIMENSION}x${MIN_DIMENSION} pixels.`,
      );
    }

    // 3. Face Count Validation
    const parsedFaceCount =
      dto.faceCount !== undefined && dto.faceCount !== null
        ? Number(dto.faceCount)
        : 1;

    if (Number.isNaN(parsedFaceCount)) {
      throw new BadRequestException('Face count must be a valid number.');
    }

    if (parsedFaceCount === 0) {
      throw new BadRequestException('No person detected. Only one person is allowed.');
    }

    if (parsedFaceCount > 1) {
      throw new BadRequestException(
        `Multiple persons detected (${parsedFaceCount}). Only one person is allowed.`,
      );
    }

    const metadata = {
      format: typeResult.ext === 'jpg' ? 'jpeg' : typeResult.ext,
      width,
      height,
      size: buffer.length,
      faceCount: parsedFaceCount,
      capturedAt: dto.capturedAt || new Date().toISOString(),
      uploadedAt: new Date().toISOString(),
    };

    return {
      detectedExt: typeResult.ext,
      metadata,
    };
  }

  /**
   * Associate saved photograph with an application (Fresh or Renewal)
   */
  private async associateWithApplication(
    applicationId: number,
    applicationType: string,
    fileUrl: string,
    fileName: string,
    fileSize: number,
  ) {
    try {
      const isRenewal = applicationType.trim().toLowerCase().includes('renewal');

      if (isRenewal) {
        // Delete any existing photograph for renewal
        await prisma.renewalFileUploads.deleteMany({
          where: { applicationId, fileType: 'PHOTOGRAPH' },
        });

        return await prisma.renewalFileUploads.create({
          data: {
            applicationId,
            fileType: 'PHOTOGRAPH',
            fileUrl,
            fileName,
            fileSize,
          },
        });
      } else {
        // Delete any existing photograph for fresh
        await prisma.fLAFFileUploads.deleteMany({
          where: { applicationId, fileType: 'PHOTOGRAPH' },
        });

        return await prisma.fLAFFileUploads.create({
          data: {
            applicationId,
            fileType: 'PHOTOGRAPH',
            fileUrl,
            fileName,
            fileSize,
          },
        });
      }
    } catch (dbErr: any) {
      this.logger.warn(
        `Could not associate biometric photo with application ${applicationId}: ${dbErr.message}`,
      );
      return null;
    }
  }
}
