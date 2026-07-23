import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import prisma from '../../db/prismaClient';
import { ApplicationType } from './dto/get-documents.dto';

export interface DocumentResponse {
  id: number;
  applicationId: number;
  applicationType: 'Fresh' | 'Renewal' | 'Cancellation';
  fileType: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedAt: Date;
}

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  /**
   * Resolve an acknowledgement number to a numeric application ID for the given type.
   *
   * @param applicationNumber - The acknowledgement number (e.g. FALS..., RAF..., CAF...)
   * @param type              - Application type
   * @returns The numeric application ID
   */
  async resolveApplicationNumber(
    applicationNumber: string,
    type: ApplicationType,
  ): Promise<number> {
    switch (type) {
      case ApplicationType.Fresh: {
        const app = await prisma.freshLicenseApplicationPersonalDetails.findFirst({
          where: { acknowledgementNo: applicationNumber },
          select: { id: true },
        });
        if (!app) {
          throw new NotFoundException(
            `Fresh application with acknowledgement number "${applicationNumber}" not found`,
          );
        }
        return app.id;
      }
      case ApplicationType.Renewal: {
        const app = await prisma.renewalFormPersonalDetails.findFirst({
          where: { acknowledgementNo: applicationNumber },
          select: { id: true },
        });
        if (!app) {
          throw new NotFoundException(
            `Renewal application with acknowledgement number "${applicationNumber}" not found`,
          );
        }
        return app.id;
      }
      case ApplicationType.Cancellation: {
        const app = await prisma.cancelFormRequests.findFirst({
          where: { acknowledgementNo: applicationNumber },
          select: { id: true },
        });
        if (!app) {
          throw new NotFoundException(
            `Cancellation request with acknowledgement number "${applicationNumber}" not found`,
          );
        }
        return app.id;
      }
      default:
        throw new BadRequestException(`Unsupported application type: ${type}`);
    }
  }

  /**
   * Get all uploaded documents for a given application by type.
   *
   * @param applicationId - The application ID in the corresponding table
   * @param type          - Application type: Fresh, Renewal, or Cancellation
   * @returns Array of normalized document records
   */
  async getDocuments(
    applicationId: number,
    type: ApplicationType,
  ): Promise<DocumentResponse[]> {
    // Validate application exists before fetching documents.
    // This also resolves license IDs to application IDs if needed.
    const resolvedId = await this.validateAndResolveApplicationId(applicationId, type);

    // Fetch documents from the appropriate table using the resolved ID
    switch (type) {
      case ApplicationType.Fresh:
        return this.getFreshDocuments(resolvedId);
      case ApplicationType.Renewal:
        return this.getRenewalDocuments(resolvedId);
      case ApplicationType.Cancellation:
        // Cancellation requests have no dedicated file upload table.
        // Return empty array; could be extended to read attachments
        // from CancelWorkflowHistories JSON field in the future.
        return [];
      default:
        throw new BadRequestException(
          `Unsupported application type: ${type}`,
        );
    }
  }

  /**
   * Validate that the application exists in the corresponding table,
   * and resolve the ID if it turns out to be a license ID instead of an application ID.
   * Returns the resolved application ID.
   */
  private async validateAndResolveApplicationId(
    applicationId: number,
    type: ApplicationType,
  ): Promise<number> {
    // First try direct lookup in the expected application table
    switch (type) {
      case ApplicationType.Fresh: {
        const app = await prisma.freshLicenseApplicationPersonalDetails.findUnique({
          where: { id: applicationId },
          select: { id: true },
        });
        if (app) return app.id;

        // Not found as a fresh app — try resolving as a license ID
        const license = await prisma.licenses.findUnique({
          where: { id: applicationId },
          select: { freshApplicationId: true },
        });
        if (license?.freshApplicationId && license.freshApplicationId !== applicationId) {
          return this.validateAndResolveApplicationId(license.freshApplicationId, type);
        }

        throw new NotFoundException(
          `Application with ID ${applicationId} not found in Fresh applications`,
        );
      }
      case ApplicationType.Renewal: {
        const app = await prisma.renewalFormPersonalDetails.findUnique({
          where: { id: applicationId },
          select: { id: true },
        });
        if (app) return app.id;

        // Not found as a renewal app — try resolving as a license ID
        const license = await prisma.licenses.findUnique({
          where: { id: applicationId },
          select: { renewalApplicationId: true },
        });
        if (license?.renewalApplicationId && license.renewalApplicationId !== applicationId) {
          return this.validateAndResolveApplicationId(license.renewalApplicationId, type);
        }

        throw new NotFoundException(
          `Application with ID ${applicationId} not found in Renewal applications`,
        );
      }
      case ApplicationType.Cancellation: {
        const app = await prisma.cancelFormRequests.findUnique({
          where: { id: applicationId },
          select: { id: true },
        });
        if (app) return app.id;

        // Not found as a cancel app — try resolving as a license ID
        const license = await prisma.licenses.findUnique({
          where: { id: applicationId },
          select: { cancelApplicationId: true },
        });
        if (license?.cancelApplicationId && license.cancelApplicationId !== applicationId) {
          return this.validateAndResolveApplicationId(license.cancelApplicationId, type);
        }

        throw new NotFoundException(
          `Application with ID ${applicationId} not found in Cancellation requests`,
        );
      }
      default:
        throw new BadRequestException(`Unsupported application type: ${type}`);
    }
  }

  /**
   * Fetch documents from the Fresh application file uploads table.
   */
  private async getFreshDocuments(
    applicationId: number,
  ): Promise<DocumentResponse[]> {
    const files = await prisma.fLAFFileUploads.findMany({
      where: { applicationId },
      orderBy: { uploadedAt: 'desc' },
    });

    return files.map((file) => ({
      id: file.id,
      applicationId: file.applicationId,
      applicationType: 'Fresh' as const,
      fileType: file.fileType,
      fileName: file.fileName,
      fileUrl: file.fileUrl,
      fileSize: file.fileSize,
      uploadedAt: file.uploadedAt,
    }));
  }

  /**
   * Fetch documents from the Renewal application file uploads table.
   */
  private async getRenewalDocuments(
    applicationId: number,
  ): Promise<DocumentResponse[]> {
    const files = await prisma.renewalFileUploads.findMany({
      where: { applicationId },
      orderBy: { uploadedAt: 'desc' },
    });

    return files.map((file) => ({
      id: file.id,
      applicationId: file.applicationId,
      applicationType: 'Renewal' as const,
      fileType: file.fileType,
      fileName: file.fileName,
      fileUrl: file.fileUrl,
      fileSize: file.fileSize,
      uploadedAt: file.uploadedAt,
    }));
  }
}
