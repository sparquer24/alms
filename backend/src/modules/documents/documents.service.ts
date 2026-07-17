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
    // Validate application exists before fetching documents
    await this.validateApplicationExists(applicationId, type);

    // Fetch documents from the appropriate table
    switch (type) {
      case ApplicationType.Fresh:
        return this.getFreshDocuments(applicationId);
      case ApplicationType.Renewal:
        return this.getRenewalDocuments(applicationId);
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
   * Validate that the application exists in the corresponding table.
   */
  private async validateApplicationExists(
    applicationId: number,
    type: ApplicationType,
  ): Promise<void> {
    switch (type) {
      case ApplicationType.Fresh: {
        const app = await prisma.freshLicenseApplicationPersonalDetails.findUnique({
          where: { id: applicationId },
          select: { id: true },
        });
        if (!app) {
          throw new NotFoundException(
            `Application with ID ${applicationId} not found in Fresh applications`,
          );
        }
        break;
      }
      case ApplicationType.Renewal: {
        const app = await prisma.renewalFormPersonalDetails.findUnique({
          where: { id: applicationId },
          select: { id: true },
        });
        if (!app) {
          throw new NotFoundException(
            `Application with ID ${applicationId} not found in Renewal applications`,
          );
        }
        break;
      }
      case ApplicationType.Cancellation: {
        const app = await prisma.cancelFormRequests.findUnique({
          where: { id: applicationId },
          select: { id: true },
        });
        if (!app) {
          throw new NotFoundException(
            `Application with ID ${applicationId} not found in Cancellation requests`,
          );
        }
        break;
      }
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
