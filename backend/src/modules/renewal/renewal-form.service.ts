import {
  Injectable,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import prisma from '../../db/prismaClient';
import {
  CreateRenewalFormRequest,
  RenewalFormResponse,
  RenewalFiltersDto,
} from '../../request/renewal-form';
import { CreateRenewalPersonalDetailsDto } from './dto/create-personal-details.dto';
import { PatchRenewalApplicationDetailsDto } from './dto/patch-application-details.dto';
import { UploadRenewalFileDto, UploadRenewalFileResponseDto } from './dto/upload-file.dto';
import { GetRenewalApplicationsDto } from './dto/get-applications.dto';
import { UpdateRenewalWorkflowStatusDto } from './dto/update-workflow-status.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RenewalFormService {
  /**
   * Create a new renewal application with personal details (DRAFT status)
   */
  async createPersonalDetails(
    createRequest: CreateRenewalPersonalDetailsDto,
    currentUserId: number,
  ): Promise<RenewalFormResponse> {
    try {
      // Verify the license exists and get the license holder info
      const existingLicense = await prisma.renewalFormPersonalDetails.findUnique({
        where: { licenseNumber: createRequest.licenseNumber },
      });

      if (existingLicense) {
        throw new ConflictException(
          'A renewal application for this license already exists.',
        );
      }

      // Generate acknowledgement number
      const acknowledgementNo = `RENEWAL-${Date.now()}-${uuidv4().substring(0, 8)}`;

      const newApplication = await prisma.$transaction(async (tx: any) => {
        // Get DRAFT status ID
        const draftStatus = await tx.statuses.findFirst({
          where: { code: 'DRAFT' },
        });

        if (!draftStatus) {
          throw new BadRequestException('DRAFT status not found in the system.');
        }

        // Create the renewal application
        const application = await tx.renewalFormPersonalDetails.create({
          data: {
            acknowledgementNo,
            licenseNumber: createRequest.licenseNumber,
            firstName: createRequest.firstName,
            middleName: createRequest.middleName,
            lastName: createRequest.lastName,
            parentOrSpouseName: createRequest.parentOrSpouseName,
            sex: createRequest.sex as any,
            dateOfBirth: createRequest.dateOfBirth
              ? new Date(createRequest.dateOfBirth)
              : null,
            dobInWords: createRequest.dobInWords,
            panNumber: createRequest.panNumber,
            aadharNumber: createRequest.aadharNumber,
            filledBy: createRequest.filledBy,
            currentUserId,
            workflowStatusId: draftStatus.id,
            isSubmit: false,
          },
          include: {
            workflowStatus: true,
            currentUser: true,
          },
        });

        return application;
      });

      return this.mapApplicationToResponse(newApplication);
    } catch (error: any) {
      if (error instanceof ConflictException
        || error instanceof BadRequestException) {
        throw error;
      }
      if (error.code === 'P2002') {
        throw new ConflictException(
          'A renewal form with the same unique constraint already exists.',
        );
      }
      if (error.code === 'P2003') {
        throw new BadRequestException('Invalid foreign key reference in the renewal application data.');
      }
      throw new InternalServerErrorException(
        'An error occurred while creating the renewal application.',
      );
    }
  }

  /**
   * Update renewal application details (addresses, occupation, license details, biometrics, etc.)
   */
  async patchApplicationDetails(
    applicationId: number,
    patchData: PatchRenewalApplicationDetailsDto,
    currentUserId: number,
  ): Promise<RenewalFormResponse> {
    try {
      // Get the current application
      const application = await prisma.renewalFormPersonalDetails.findUnique({
        where: { id: applicationId },
        include: {
          presentAddress: true,
          permanentAddress: true,
          occupationAndBusiness: true,
          licenseDetails: true,
        },
      });

      if (!application) {
        throw new NotFoundException('Renewal application not found.');
      }

      return await prisma.$transaction(async (tx: any) => {
        let updateData: any = {};

        // Update personal details if provided
        if (patchData.personalDetails) {
          updateData = { ...updateData, ...patchData.personalDetails };
        }

        // Update address details if provided
        if (patchData.addressDetails) {
          // Create or update present address
          const presentAddress = await tx.renewalAddressesAndContactDetails.upsert({
            where: { id: application.presentAddressId || 0 },
            create: patchData.addressDetails,
            update: patchData.addressDetails,
          });
          updateData.presentAddressId = presentAddress.id;

          // Create or update permanent address (same as present for renewal)
          const permanentAddress = await tx.renewalAddressesAndContactDetails.upsert({
            where: { id: application.permanentAddressId || 0 },
            create: patchData.addressDetails,
            update: patchData.addressDetails,
          });
          updateData.permanentAddressId = permanentAddress.id;
        }

        // Update occupation and business if provided
        if (patchData.occupationAndBusiness) {
          const occupationBusiness = await tx.renewalOccupationAndBusiness.upsert({
            where: { id: application.occupationAndBusinessId || 0 },
            create: patchData.occupationAndBusiness,
            update: patchData.occupationAndBusiness,
          });
          updateData.occupationAndBusinessId = occupationBusiness.id;
        }

        // Update license details if provided
        if (patchData.licenseDetails) {
          // Update or create license details
          const licenseDetail = application.licenseDetails[0];
          if (licenseDetail) {
            await tx.renewalLicenseDetails.update({
              where: { id: licenseDetail.id },
              data: {
                needForLicense: patchData.licenseDetails.needForLicense as any,
                armsCategory: patchData.licenseDetails.armsCategory as any,
                areaOfValidity: patchData.licenseDetails.areaOfValidity,
                ammunitionDescription: patchData.licenseDetails.ammunitionDescription,
                specialConsiderationReason:
                  patchData.licenseDetails.specialConsiderationReason,
                licencePlaceArea: patchData.licenseDetails.licencePlaceArea,
              },
            });

            // Update requested weapons if provided
            if (patchData.licenseDetails.requestedWeaponIds) {
              // Remove existing weapons and add new ones
              await tx.renewalLicenseDetails.update({
                where: { id: licenseDetail.id },
                data: {
                  requestedWeapons: {
                    connect: patchData.licenseDetails.requestedWeaponIds.map((id) => ({
                      id,
                    })),
                  },
                },
              });
            }
          } else {
            // Create new license details
            await tx.renewalLicenseDetails.create({
              data: {
                applicationId,
                needForLicense: patchData.licenseDetails.needForLicense as any,
                armsCategory: patchData.licenseDetails.armsCategory as any,
                areaOfValidity: patchData.licenseDetails.areaOfValidity,
                ammunitionDescription: patchData.licenseDetails.ammunitionDescription,
                specialConsiderationReason:
                  patchData.licenseDetails.specialConsiderationReason,
                licencePlaceArea: patchData.licenseDetails.licencePlaceArea,
                requestedWeapons: patchData.licenseDetails.requestedWeaponIds
                  ? {
                      connect: patchData.licenseDetails.requestedWeaponIds.map((id) => ({
                        id,
                      })),
                    }
                  : undefined,
              },
            });
          }
        }

        // Update acceptance flags if provided
        if (patchData.acceptanceFlags) {
          updateData = {
            ...updateData,
            isDeclarationAccepted:
              patchData.acceptanceFlags.isDeclarationAccepted ||
              application.isDeclarationAccepted,
            isAwareOfLegalConsequences:
              patchData.acceptanceFlags.isAwareOfLegalConsequences ||
              application.isAwareOfLegalConsequences,
            isTermsAccepted:
              patchData.acceptanceFlags.isTermsAccepted || application.isTermsAccepted,
          };
        }

        // Handle submission
        if (patchData.isSubmit) {
          const submittedStatus = await tx.statuses.findFirst({
            where: { code: 'SUBMITTED' },
          });

          updateData.isSubmit = true;
          updateData.workflowStatusId = submittedStatus?.id || application.workflowStatusId;

          // Create workflow history entry
          await tx.renewalApplicationsFormWorkflowHistories.create({
            data: {
              applicationId,
              previousUserId: currentUserId,
              nextUserId: currentUserId,
              actionTaken: 'SUBMITTED',
              remarks: 'Application submitted for processing',
            },
          });
        }

        // Update the application
        const updatedApplication = await tx.renewalFormPersonalDetails.update({
          where: { id: applicationId },
          data: updateData,
          include: {
            workflowStatus: true,
            currentUser: true,
          },
        });

        return this.mapApplicationToResponse(updatedApplication);
      });
    } catch (error: any) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('Renewal application or related record not found.');
      }
      throw new InternalServerErrorException(
        'An error occurred while updating the renewal application.',
      );
    }
  }

  /**
   * Upload a file for renewal application
   */
  async uploadFile(
    applicationId: number,
    uploadData: UploadRenewalFileDto,
  ): Promise<UploadRenewalFileResponseDto> {
    try {
      const application = await prisma.renewalFormPersonalDetails.findUnique({
        where: { id: applicationId },
      });

      if (!application) {
        throw new NotFoundException('Renewal application not found.');
      }

      const fileUpload = await prisma.renewalFileUploads.create({
        data: {
          applicationId,
          fileType: uploadData.fileType as any,
          fileUrl: uploadData.fileUrl,
          fileName: uploadData.fileName,
          fileSize: uploadData.fileSize,
        },
      });

      return {
        id: fileUpload.id,
        applicationId: fileUpload.applicationId,
        fileType: fileUpload.fileType,
        fileUrl: fileUpload.fileUrl,
        fileName: fileUpload.fileName,
        fileSize: fileUpload.fileSize,
        uploadedAt: fileUpload.uploadedAt,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred while uploading the file.',
      );
    }
  }

  /**
   * Delete a file from renewal application
   */
  async deleteFile(fileId: number): Promise<void> {
    try {
      const file = await prisma.renewalFileUploads.findUnique({
        where: { id: fileId },
      });

      if (!file) {
        throw new NotFoundException('File not found.');
      }

      await prisma.renewalFileUploads.delete({
        where: { id: fileId },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('An error occurred while deleting the file.');
    }
  }

  /**
   * Delete entire renewal application (only for DRAFT status)
   */
  async deleteApplicationById(applicationId: number): Promise<void> {
    try {
      const application = await prisma.renewalFormPersonalDetails.findUnique({
        where: { id: applicationId },
        include: { workflowStatus: true },
      });

      if (!application) {
        throw new NotFoundException('Renewal application not found.');
      }

      // Only allow deletion of DRAFT applications
      if (application.workflowStatus?.code !== 'DRAFT') {
        throw new BadRequestException(
          'Only DRAFT applications can be deleted.',
        );
      }

      // Cascade delete will handle related records
      await prisma.renewalFormPersonalDetails.delete({
        where: { id: applicationId },
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred while deleting the renewal application.',
      );
    }
  }

  /**
   * Get renewal application by ID
   */
  async getApplicationById(applicationId: number): Promise<RenewalFormResponse> {
    try {
      const application = await prisma.renewalFormPersonalDetails.findUnique({
        where: { id: applicationId },
        include: {
          workflowStatus: true,
          currentUser: true,
          previousUser: true,
          presentAddress: true,
          permanentAddress: true,
          occupationAndBusiness: true,
          licenseDetails: {
            include: { requestedWeapons: true },
          },
          fileUploads: true,
          biometricData: true,
          workflowHistories: {
            include: {
              nextUser: true,
              previousUser: true,
              nextRole: true,
              previousRole: true,
            },
          },
        },
      });

      if (!application) {
        throw new NotFoundException('Renewal application not found.');
      }

      return this.mapApplicationToResponse(application);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred while retrieving the renewal application.',
      );
    }
  }

  /**
   * Get filtered renewal applications with pagination
   */
  async getFilteredApplications(
    filters: GetRenewalApplicationsDto,
  ): Promise<{ data: RenewalFormResponse[]; total: number }> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        status,
        currentUserId,
        ordering = 'DESC',
        orderBy = 'createdAt',
      } = filters;

      const skip = (page - 1) * limit;

      // Build where clause
      const whereClause: any = {};

      if (search) {
        whereClause.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { licenseNumber: { contains: search, mode: 'insensitive' } },
          { acknowledgementNo: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (status) {
        const statusRecord = await prisma.statuses.findFirst({
          where: {
            OR: [
              { code: status },
              { name: status },
            ],
          },
        });
        if (statusRecord) {
          whereClause.workflowStatusId = statusRecord.id;
        }
      }

      if (currentUserId) {
        whereClause.currentUserId = currentUserId;
      }

      // Get total count
      const total = await prisma.renewalFormPersonalDetails.count({
        where: whereClause,
      });

      // Get paginated results
      const applications = await prisma.renewalFormPersonalDetails.findMany({
        where: whereClause,
        include: {
          workflowStatus: true,
          currentUser: true,
        },
        skip,
        take: limit,
        orderBy: {
          [orderBy]: ordering.toLowerCase(),
        },
      });

      return {
        data: applications.map((app: any) => this.mapApplicationToResponse(app)),
        total,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'An error occurred while retrieving renewal applications.',
      );
    }
  }

  /**
   * Helper method to map application to response
   */
  private mapApplicationToResponse(application: any): RenewalFormResponse {
    const applicantName = `${application.firstName}${application.middleName ? ' ' + application.middleName : ''}${application.lastName ? ' ' + application.lastName : ''}`;
    return {
      id: application.id,
      acknowledgementNo: application.acknowledgementNo,
      licenseNumber: application.licenseNumber,
      applicantName: applicantName,
      parentOrSpouseName: application.parentOrSpouseName,
      sex: application.sex,
      dateOfBirth: application.dateOfBirth,
      dobInWords: application.dobInWords,
      panNumber: application.panNumber,
      aadharNumber: application.aadharNumber,
      createdAt: application.createdAt,
      updatedAt: application.updatedAt,
      isSubmit: application.isSubmit,
      renewalLicenseId: application.renewalLicenseId,
      isApproved: application.isApproved,
      isPending: application.isPending,
      isRejected: application.isRejected,
      workflowStatusId: application.workflowStatusId,
      currentUserId: application.currentUserId,
    };
  }
}