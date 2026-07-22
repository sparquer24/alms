import { Injectable, ConflictException, BadRequestException, InternalServerErrorException, NotFoundException, } from '@nestjs/common';
import prisma from '../../db/prismaClient';
import { CreateRenewalFormRequest, RenewalFormResponse, RenewalFiltersDto, } from '../../request/renewal-form';
import { CreateRenewalPersonalDetailsDto } from './dto/create-personal-details.dto';
import { PatchRenewalApplicationDetailsDto } from './dto/patch-application-details.dto';
import { UploadRenewalFileDto, UploadRenewalFileResponseDto } from './dto/upload-file.dto';
import { GetRenewalApplicationsDto } from './dto/get-applications.dto';
import { UpdateRenewalWorkflowStatusDto } from './dto/update-workflow-status.dto';
import { ACTION_CODES } from '../../constants/workflow-actions';
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
      // 1. Verify the license exists in the Licenses table
      const licenseRecord = createRequest.licenseId
        ? await prisma.licenses.findUnique({ where: { id: createRequest.licenseId } })
        : createRequest.licenseNumber
          ? await prisma.licenses.findUnique({ where: { licenseNumber: createRequest.licenseNumber } })
          : null;

      if (!licenseRecord) {
        throw new NotFoundException('License not found. Cannot create renewal without a valid license.');
      }

      const resolvedLicenseId = licenseRecord.id;
      const resolvedLicenseNumber = licenseRecord.licenseNumber;

      // 2. Check if there is any existing Renewal for the same License.
      //    - If an approved renewal exists → allow creation of a new renewal (prefilled from last approved).
      //    - If a non-approved renewal exists (Pending/In Progress/Rejected) → return the existing one
      //      so the user can continue editing it.
      const existingRenewal = await prisma.renewalFormPersonalDetails.findFirst({
        where: {
          licenseId: resolvedLicenseId,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (existingRenewal) {
        if (!existingRenewal.isApproved) {
          // Existing renewal is NOT approved (Pending/In Progress/Rejected/etc.)
          // Check if the latest workflow history actionTaken is CLOSE — if so, allow
          // creating a new renewal (auto-assigned to self user) instead of returning
          // the existing one.
          const latestHistory = await prisma.renewalApplicationsFormWorkflowHistories.findFirst({
            where: { applicationId: existingRenewal.id },
            orderBy: { createdAt: 'desc' },
          });
          if (!latestHistory || latestHistory.actionTaken !== ACTION_CODES.CLOSE) {
            // Not a closed renewal — return existing so the user can resume
            return this.mapApplicationToResponse(existingRenewal);
          }
          // actionTaken IS CLOSE → fall through to create a new renewal
        }
        // Existing renewal IS approved → fall through to create a new renewal
      }

      // 3. Fetch the almsLicenseId from the Licenses table to populate renewalLicenseId
      let renewalLicenseId: string | null = licenseRecord.almsLicenseId ?? null;

      // 4. Generate acknowledgement number (unique per renewal)
      const acknowledgementNo = `RAF${Date.now()}${Math.floor(Math.random() * 1000)}`;

      // 5. If lastModifiedRenewalId exists, prefetch the latest approved renewal data
      //    to use as the source for pre-filling the new renewal.
      let sourceRenewalData: any = null;
      if (licenseRecord.lastModifiedRenewalId) {
        sourceRenewalData = await prisma.renewalFormPersonalDetails.findFirst({
          where: {
            id: licenseRecord.lastModifiedRenewalId,
            isApproved: true,
          },
          include: {
            presentAddress: true,
            permanentAddress: true,
            occupationAndBusiness: true,
            licenseDetails: true,
          },
        });
      }

      const newApplication = await prisma.$transaction(async (tx: any) => {
        // Get DRAFT status ID
        const draftStatus = await tx.statuses.findFirst({
          where: { code: 'DRAFT' },
        });

        if (!draftStatus) {
          throw new BadRequestException('DRAFT status not found in the system.');
        }

        // Copy addresses from the latest approved renewal if available,
        // otherwise use the provided createRequest data.
        let presentAddressId: number | null = null;
        let permanentAddressId: number | null = null;
        let occupationAndBusinessId: number | null = null;

        if (sourceRenewalData?.presentAddress && sourceRenewalData.presentAddress.addressLine) {
          try {
            const copiedAddress = await tx.renewalAddressesAndContactDetails.create({
              data: {
                addressLine: sourceRenewalData.presentAddress.addressLine,
                stateId: sourceRenewalData.presentAddress.stateId,
                districtId: sourceRenewalData.presentAddress.districtId,
                policeStationId: sourceRenewalData.presentAddress.policeStationId,
                sinceResiding: sourceRenewalData.presentAddress.sinceResiding ? new Date(sourceRenewalData.presentAddress.sinceResiding) : undefined,
                divisionId: sourceRenewalData.presentAddress.divisionId,
                zoneId: sourceRenewalData.presentAddress.zoneId,
                rangeOfficeId: sourceRenewalData.presentAddress.rangeOfficeId || null,
                telephoneOffice: sourceRenewalData.presentAddress.telephoneOffice || null,
                telephoneResidence: sourceRenewalData.presentAddress.telephoneResidence || null,
                officeMobileNumber: sourceRenewalData.presentAddress.officeMobileNumber || null,
                alternativeMobile: sourceRenewalData.presentAddress.alternativeMobile || null,
              },
            });
            presentAddressId = copiedAddress.id;
            // Reuse same address for permanent if it matches
            permanentAddressId = copiedAddress.id;
          } catch (addrErr: any) {
            console.error('Error copying address from last approved renewal:', addrErr.message);
          }
        }

        if (sourceRenewalData?.occupationAndBusiness) {
          try {
            const copiedOcc = await tx.renewalOccupationAndBusiness.create({
              data: {
                occupation: sourceRenewalData.occupationAndBusiness.occupation,
                officeAddress: sourceRenewalData.occupationAndBusiness.officeAddress,
                stateId: sourceRenewalData.occupationAndBusiness.stateId,
                districtId: sourceRenewalData.occupationAndBusiness.districtId,
                cropLocation: sourceRenewalData.occupationAndBusiness.cropLocation || null,
                areaUnderCultivation: sourceRenewalData.occupationAndBusiness.areaUnderCultivation || null,
              },
            });
            occupationAndBusinessId = copiedOcc.id;
          } catch (occErr: any) {
            console.error('Error copying occupation from last approved renewal:', occErr.message);
          }
        }

        // Create the renewal application
        const application = await tx.renewalFormPersonalDetails.create({
          data: {
            acknowledgementNo,
            // Use the original license id and license number
            licenseId: resolvedLicenseId,
            licenseNumber: resolvedLicenseNumber,
            renewalLicenseId,
            firstName: sourceRenewalData?.firstName || createRequest.firstName,
            middleName: sourceRenewalData?.middleName || createRequest.middleName,
            lastName: sourceRenewalData?.lastName || createRequest.lastName,
            parentOrSpouseName: sourceRenewalData?.parentOrSpouseName || createRequest.parentOrSpouseName,
            sex: (sourceRenewalData?.sex || createRequest.sex) as any,
            dateOfBirth: sourceRenewalData?.dateOfBirth
              ? new Date(sourceRenewalData.dateOfBirth)
              : createRequest.dateOfBirth
                ? new Date(createRequest.dateOfBirth)
                : null,
            dobInWords: sourceRenewalData?.dobInWords || createRequest.dobInWords,
            panNumber: sourceRenewalData?.panNumber || createRequest.panNumber,
            aadharNumber: sourceRenewalData?.aadharNumber || createRequest.aadharNumber,
            placeOfBirth: sourceRenewalData?.placeOfBirth || createRequest.placeOfBirth,
            filledBy: createRequest.filledBy,
            currentUserId,
            workflowStatusId: draftStatus.id,
            presentAddressId,
            permanentAddressId,
            occupationAndBusinessId,
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
        || error instanceof NotFoundException
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
  ): Promise<any> {
    try {
      // Validate inputs early to prevent unnecessary database queries
      if (!applicationId || applicationId <= 0) {
        throw new BadRequestException('Invalid application ID');
      }

      if (!patchData || Object.keys(patchData).length === 0) {
        throw new BadRequestException('No data provided for update');
      }

      const shouldHandleSubmit = patchData.isSubmit !== undefined;
      const shouldCreateWorkflowHistory = patchData.isSubmit === true && !!currentUserId;

      // Pre-fetch required data in parallel to reduce latency
      const result = await Promise.all([
        prisma.renewalFormPersonalDetails.findUnique({
          where: { id: applicationId },
          // cast select to any to avoid transient type mismatches from generated client
          select: {
            id: true,
            presentAddressId: true,
            permanentAddressId: true,
            occupationAndBusinessId: true,
            isDeclarationAccepted: true,
            isAwareOfLegalConsequences: true,
            isTermsAccepted: true,
            licenseDetails: { select: { id: true } },
            licenseId: true,
          } as any,
        }),
        // Fetch statuses needed for submit/rollback behavior
        shouldHandleSubmit
          ? prisma.statuses.findMany({
            where: { code: { in: ['FORWARD', 'DRAFT', 'INITIATE', 'INITIATED'] } },
          })
          : Promise.resolve([]),
        // Pre-validate user if currentUserId provided
        shouldCreateWorkflowHistory
          ? prisma.users.findUnique({ where: { id: currentUserId } })
          : Promise.resolve(null),
      ]);

      const application: any = result[0];
      const statuses: any = result[1];
      const userExists: any = result[2];

      if (!application) {
        throw new NotFoundException('Renewal application not found.');
      }

      const statusMap = statuses.reduce((map: Record<string, number>, status: any) => {
        map[status.code] = status.id;
        return map;
      }, {});
      const initiateStatusId = statusMap['INITIATED'] ?? statusMap['INITIATE'] ?? statusMap['FORWARD'];

      // Pre-parse dates and format data outside transaction to reduce lock time
      const parsedAddressData: any = patchData.addressDetails ? {
        addressLine: patchData.addressDetails.addressLine,
        stateId: patchData.addressDetails.stateId,
        districtId: patchData.addressDetails.districtId,
        rangeOfficeId: patchData.addressDetails.rangeOfficeId,
        policeStationId: patchData.addressDetails.policeStationId,
        zoneId: patchData.addressDetails.zoneId,
        divisionId: patchData.addressDetails.divisionId,
        sinceResiding: patchData.addressDetails.sinceResiding ? new Date(patchData.addressDetails.sinceResiding) : undefined,
        telephoneOffice: patchData.addressDetails.telephoneOffice,
        telephoneResidence: patchData.addressDetails.telephoneResidence,
        officeMobileNumber: patchData.addressDetails.officeMobileNumber,
        alternativeMobile: patchData.addressDetails.alternativeMobile,
      } : null;

      const weaponConnections = patchData.licenseDetails?.requestedWeaponIds?.map((id) => ({ id }));

      let updateData: any = patchData.personalDetails ? { ...patchData.personalDetails } : {};
      if (updateData.dateOfBirth) {
        updateData.dateOfBirth = new Date(updateData.dateOfBirth);
      }

      // Update licenseId/licenseNumber on parent record if provided
      if (patchData.licenseId !== undefined) {
        updateData.licenseId = patchData.licenseId;
      }
      if (patchData.licenseNumber !== undefined) {
        updateData.licenseNumber = patchData.licenseNumber;
      }
      const relationUpdates: Promise<void>[] = [];

      // Handle addresses in parallel if provided
      if (parsedAddressData) {
        const addressData = parsedAddressData;
        relationUpdates.push((async () => {
          const [presentAddress, permanentAddress] = await Promise.all([
            application.presentAddressId
              ? prisma.renewalAddressesAndContactDetails.update({
                  where: { id: application.presentAddressId },
                  data: addressData,
                })
              : prisma.renewalAddressesAndContactDetails.create({
                  data: addressData,
                }),
            application.permanentAddressId
              ? prisma.renewalAddressesAndContactDetails.update({
                  where: { id: application.permanentAddressId },
                  data: addressData,
                })
              : prisma.renewalAddressesAndContactDetails.create({
                  data: addressData,
                }),
          ]);

          updateData.presentAddressId = presentAddress.id;
          updateData.permanentAddressId = permanentAddress.id;
        })());
      }

      // Update occupation and business if provided
      if (patchData.occupationAndBusiness) {
        const occupationAndBusiness = patchData.occupationAndBusiness;
        relationUpdates.push((async () => {
          let occupationBusiness;
          if (application.occupationAndBusinessId) {
            occupationBusiness = await prisma.renewalOccupationAndBusiness.update({
              where: { id: application.occupationAndBusinessId },
              data: occupationAndBusiness,
            });
          } else {
            occupationBusiness = await prisma.renewalOccupationAndBusiness.create({
              data: occupationAndBusiness,
            });
          }

          updateData.occupationAndBusinessId = occupationBusiness.id;
        })());
      }

      // Update license details if provided
      if (patchData.licenseDetails) {
        const licenseDetails = patchData.licenseDetails;
        relationUpdates.push((async () => {
          // Update or create license details
          const licenseDetail = application.licenseDetails[0];
          if (licenseDetail) {
            // Combine all updates into a single database call for efficiency
            const licenseUpdateData: any = {
              needForLicense: licenseDetails.needForLicense as any,
              armsCategory: licenseDetails.armsCategory as any,
              areaOfValidity: licenseDetails.areaOfValidity,
              ammunitionDescription: licenseDetails.ammunitionDescription,
              specialConsiderationReason: licenseDetails.specialConsiderationReason,
              licencePlaceArea: licenseDetails.licencePlaceArea,
            };

            if (weaponConnections) {
              licenseUpdateData.requestedWeapons = {
                set: [],
                connect: weaponConnections,
              };
            }

            await prisma.renewalLicenseDetails.update({
              where: { id: licenseDetail.id },
              data: licenseUpdateData,
            });
          } else {
            // Create new license details
            await prisma.renewalLicenseDetails.create({
              data: {
                applicationId,
                needForLicense: licenseDetails.needForLicense as any,
                armsCategory: licenseDetails.armsCategory as any,
                areaOfValidity: licenseDetails.areaOfValidity,
                ammunitionDescription: licenseDetails.ammunitionDescription,
                specialConsiderationReason:
                  licenseDetails.specialConsiderationReason,
                licencePlaceArea: licenseDetails.licencePlaceArea,
                requestedWeapons: weaponConnections
                  ? {
                      connect: weaponConnections,
                    }
                  : undefined,
              },
            });
          }
        })());
      }

      // Handle Criminal Histories (Replace all existing)
      if (patchData.criminalHistories && Array.isArray(patchData.criminalHistories)) {
        relationUpdates.push((async () => {
          // Delete existing criminal histories
          await prisma.renewalCriminalHistories.deleteMany({ where: { applicationId } });

          // Create new criminal histories
          if (patchData.criminalHistories!.length > 0) {
            for (const history of patchData.criminalHistories!) {
              const record: any = {
                applicationId,
                isConvicted: history.isConvicted ?? false,
                firDetails: history.firDetails ?? null,
                isBondExecuted: history.isBondExecuted ?? false,
                bondDate: history.bondDate ? new Date(history.bondDate) : null,
                bondPeriod: history.bondPeriod ?? null,
                isProhibited: history.isProhibited ?? false,
                prohibitionDate: history.prohibitionDate ? new Date(history.prohibitionDate) : null,
                prohibitionPeriod: history.prohibitionPeriod ?? null,
              };
              await prisma.renewalCriminalHistories.create({ data: record });
            }
          }
        })());
      }

      // Handle License Histories (Replace all existing)
      if (patchData.licenseHistories && Array.isArray(patchData.licenseHistories)) {
        relationUpdates.push((async () => {
          // Delete existing license histories
          await prisma.renewalLicenseHistories.deleteMany({ where: { applicationId } });

          // Create new license histories
          if (patchData.licenseHistories!.length > 0) {
            for (const history of patchData.licenseHistories!) {
              const record: any = {
                ...history,
                applicationId,
                dateAppliedFor: history.dateAppliedFor ? new Date(history.dateAppliedFor) : null,
              };
              await prisma.renewalLicenseHistories.create({ data: record });
            }
          }
        })());
      }

      // Handle Biometric Data
      if (patchData.biometricData) {
        relationUpdates.push((async () => {
          const biometricDataObject = patchData.biometricData;

          if (typeof biometricDataObject !== 'object' || biometricDataObject === null) {
            throw new BadRequestException('biometricData must be an object');
          }

          const existingBiometric = await prisma.renewalBiometricDatas.findUnique({
            where: { applicationId }
          });

          if (existingBiometric) {
            await prisma.renewalBiometricDatas.update({
              where: { applicationId },
              data: {
                biometricData: biometricDataObject as any
              } as any
            });
          } else {
            await prisma.renewalBiometricDatas.create({
              data: {
                applicationId,
                biometricData: biometricDataObject as any
              } as any
            });
          }
        })());
      }

      await Promise.all(relationUpdates);

      // Update acceptance flags if provided (only add if explicitly set)
      if (patchData.acceptanceFlags) {
        if (patchData.acceptanceFlags.isDeclarationAccepted !== undefined) {
          updateData.isDeclarationAccepted = patchData.acceptanceFlags.isDeclarationAccepted;
        }
        if (patchData.acceptanceFlags.isAwareOfLegalConsequences !== undefined) {
          updateData.isAwareOfLegalConsequences = patchData.acceptanceFlags.isAwareOfLegalConsequences;
        }
        if (patchData.acceptanceFlags.isTermsAccepted !== undefined) {
          updateData.isTermsAccepted = patchData.acceptanceFlags.isTermsAccepted;
        }
      }

      // Handle submission using pre-fetched statuses
      if (patchData.isSubmit !== undefined) {
        updateData.isSubmit = patchData.isSubmit;
        if (patchData.isSubmit) {
          // Use INITIATED / INITIATE status when submitting renewal, otherwise fall back to FORWARD
          if (initiateStatusId) {
            updateData.workflowStatusId = initiateStatusId;
            updateData.isPending = true;
          }
        } else {
          // Revert to DRAFT status
          if (statusMap['DRAFT']) {
            updateData.workflowStatusId = statusMap['DRAFT'];
          }
        }
      }

      // Update the application only when parent fields changed.
      if (Object.keys(updateData).length > 0) {
        await prisma.renewalFormPersonalDetails.update({
          where: { id: applicationId },
          data: updateData,
        });
      }

      if (patchData.isSubmit && currentUserId) {
        try {
          await prisma.renewalApplicationsFormWorkflowHistories.create({
            data: {
              applicationId,
              previousUserId: currentUserId,
              nextUserId: currentUserId,
              actionTaken: 'INITIATED',
              remarks: 'Application submitted for processing',
            },
          });
        } catch (historyError: any) {
          // Log error but don't interrupt submission
          console.error('[RenewalForm] Failed to create workflow history:', historyError?.message, historyError?.code);
        }
      }

      // Fetch fresh updated data with selective includes to minimize payload
      const finalApplication = await prisma.renewalFormPersonalDetails.findUnique({
        where: { id: applicationId },
        include: {
          workflowStatus: true,
          currentUser: {
            select: {
              id: true,
              username: true,
              email: true,
              role: { select: { id: true, name: true } }
            },
          },
          previousUser: {
            select: {
              id: true,
              username: true,
              email: true,
              role: { select: { id: true, name: true } }
            },
          },
          presentAddress: {
            select: {
              id: true,
              addressLine: true,
              stateId: true,
              districtId: true,
              rangeOfficeId: true,
              state: { select: { id: true, name: true } },
              district: { select: { id: true, name: true } },
              RangeOffices: { select: { id: true, name: true } },
              zone: { select: { id: true, name: true } },
              division: { select: { id: true, name: true } },
              policeStation: { select: { id: true, name: true } },
            }
          },
          permanentAddress: {
            select: {
              id: true,
              addressLine: true,
              stateId: true,
              districtId: true,
              rangeOfficeId: true,
              state: { select: { id: true, name: true } },
              district: { select: { id: true, name: true } },
              RangeOffices: { select: { id: true, name: true } },
              zone: { select: { id: true, name: true } },
              division: { select: { id: true, name: true } },
              policeStation: { select: { id: true, name: true } },
            }
          },
          occupationAndBusiness: {
            select: {
              id: true,
              occupation: true,
              officeAddress: true,
              stateId: true,
              districtId: true,
              state: { select: { id: true, name: true } },
              district: { select: { id: true, name: true } },
            }
          },
          licenseDetails: {
            include: { requestedWeapons: true },
          },
          criminalHistories: true,
          licenseHistories: true,
          fileUploads: true,
          biometricData: true,
          workflowHistories: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
              nextUser: {
                select: { id: true, username: true, email: true, role: { select: { id: true, name: true } } },
              },
              previousUser: {
                select: { id: true, username: true, email: true, role: { select: { id: true, name: true } } },
              },
            },
          },
        },
      });
      
      return finalApplication;
    } catch (error: any) {
      // Re-throw known exceptions
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      
      // Handle Prisma-specific errors
      if (error.code === 'P2025') {
        throw new NotFoundException('Renewal application or related record not found.');
      }
      if (error.code === 'P2003') {
        throw new BadRequestException('Invalid reference: related record does not exist.');
      }
      
      // Generic error response
      throw new InternalServerErrorException(
        `Failed to update renewal application: ${error?.message || 'Unknown error'}`,
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
        include: {
          application: {
            include: {
              workflowStatus: true,
            },
          },
        },
      });

      if (!file) {
        throw new NotFoundException('File not found.');
      }

      // Only allow file deletion if the application is in DRAFT status
      if (!file.application?.workflowStatus || file.application.workflowStatus.code !== 'DRAFT') {
        const statusName = file.application?.workflowStatus?.name || 'UNKNOWN';
        throw new BadRequestException(
          `Cannot delete file from an application with "${statusName}" status. Files can only be deleted from DRAFT applications.`,
        );
      }

      await prisma.renewalFileUploads.delete({
        where: { id: fileId },
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
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

      // Explicitly delete child records before the parent for consistency
      await prisma.renewalCriminalHistories.deleteMany({ where: { applicationId } });
      await prisma.renewalLicenseHistories.deleteMany({ where: { applicationId } });
      await prisma.renewalLicenseDetails.deleteMany({ where: { applicationId } });
      await prisma.renewalFileUploads.deleteMany({ where: { applicationId } });
      await prisma.renewalBiometricDatas.deleteMany({ where: { applicationId } });

      // Delete the main application (cascade will handle remaining related records)
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
  async getApplicationById(applicationId: number): Promise<any> {
    try {
      const application = await prisma.renewalFormPersonalDetails.findUnique({
        where: { id: applicationId },
        include: {
          workflowStatus: true,
          currentUser: {
            include: {
              role: true,
            },
          },
          previousUser: {
            include: {
              role: true,
            },
          },
          presentAddress: {
            select: {
              id: true,
              addressLine: true,
              stateId: true,
              districtId: true,
              policeStationId: true,
              sinceResiding: true,
              divisionId: true,
              zoneId: true,
              telephoneOffice: true,
              telephoneResidence: true,
              officeMobileNumber: true,
              alternativeMobile: true,
              rangeOfficeId: true,
              state: true,
              district: true,
              RangeOffices: true,
              zone: true,
              division: true,
              policeStation: true,
            },
          },
          permanentAddress: {
            select: {
              id: true,
              addressLine: true,
              stateId: true,
              districtId: true,
              policeStationId: true,
              sinceResiding: true,
              divisionId: true,
              zoneId: true,
              telephoneOffice: true,
              telephoneResidence: true,
              officeMobileNumber: true,
              alternativeMobile: true,
              rangeOfficeId: true,
              state: true,
              district: true,
              RangeOffices: true,
              zone: true,
              division: true,
              policeStation: true,
            },
          },
          occupationAndBusiness: {
            select: {
              id: true,
              occupation: true,
              officeAddress: true,
              stateId: true,
              districtId: true,
              cropLocation: true,
              areaUnderCultivation: true,
              state: true,
              district: true,
            },
          },
          licenseDetails: {
            include: { requestedWeapons: true },
          },
          criminalHistories: true,
          licenseHistories: true,
          fileUploads: true,
          biometricData: true,
          workflowHistories: {
            orderBy: { createdAt: 'desc' },
            include: {
              nextUser: {
                include: {role: true},
              },
              previousUser: {
                include: {role: true},
              },
              nextRole: true,
              previousRole: true,
            },
          },
        },
      });

      if (!application) {
        throw new NotFoundException('Renewal application not found.');
      }

      // Resolve the fresh application ID linked to this renewal.
      // The relationship is: renewal.licenseNumber === freshApp.acknowledgementNo
      let freshApplicationId: number | null = null;
      if (application.licenseNumber) {
        const freshApp = await prisma.freshLicenseApplicationPersonalDetails.findFirst({
          where: { acknowledgementNo: application.licenseNumber },
          select: { id: true },
        });
        if (freshApp) {
          freshApplicationId = freshApp.id;
        }
      }

      return {
        ...application,
        freshApplicationId: freshApplicationId,
      };
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
  ): Promise<{ data: any[]; total: number }> {
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

        skip,
        take: limit,
        orderBy: {
          [orderBy]: ordering.toLowerCase(),
        },
        include: {
          workflowStatus: true,
          currentUser: {
            include: { role: true },
          },
        previousUser: {
          include: {role: true},
        },
        presentAddress: {
          include: {
            state: true,
            district: true,
            RangeOffices: true,
            zone: true,
            division: true,
            policeStation: true,
        },
        },
        permanentAddress: {
          include: {
            state: true,
            district: true,
            RangeOffices: true,
            zone: true,
            division: true,
            policeStation: true,
          },
        },
        occupationAndBusiness: {
          include: {
            state: true,
            district: true,
          },
          },
          licenseDetails: {
            include: { requestedWeapons: true },
          },
          criminalHistories: true,
          licenseHistories: true,
          fileUploads: true,
          biometricData: true,
          workflowHistories: {
            orderBy: { createdAt: 'desc' },
            include: {
              nextUser: {
                include: {role: true},
              },
              previousUser: {
                include: {role: true},
              },
              nextRole: true,
              previousRole: true,
            },
          },
        
        },
    
      });

      return {
        data: applications,
        total,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'An error occurred while retrieving renewal applications.',
      );
    }
  }

  /**
   * Merge renewal license data into fresh license record
   */
  async mergeLicenses(
    licenseId: number,
    renewalLicenseId: number,
    currentUserId: number,
  ): Promise<any> {
    try {
      // Validate userId exists in database
      if (!currentUserId || currentUserId <= 0) {
        throw new BadRequestException('Invalid user ID for merge audit log');
      }

      // Fetch fresh license
      const freshLicense = await prisma.freshLicenseApplicationPersonalDetails.findUnique({
        where: { id: licenseId },
        include: {
          presentAddress: true,
          permanentAddress: true,
          occupationAndBusiness: true,
          licenseDetails: {
            include: {
              requestedWeapons: true,
            },
          },
        },
      });

      if (!freshLicense) {
        throw new NotFoundException(
          `License with ID ${licenseId} not found`
        );
      }
      // Ensure the fresh license has been approved before creating a master Licenses record
      if (!freshLicense.isApproved) {
        throw new BadRequestException('Merge can only be performed after fresh license approval');
      }

      // Fetch renewal license
      const renewalLicense = await prisma.renewalFormPersonalDetails.findUnique({
        where: { id: renewalLicenseId },
        include: {
          presentAddress: true,
          permanentAddress: true,
          occupationAndBusiness: true,
          licenseDetails: {
            include: {
              requestedWeapons: true,
            },
          },
        },
      });

      if (!renewalLicense) {
        throw new NotFoundException(
          `Renewal license with ID ${renewalLicenseId} not found`
        );
      }

      // // Validate that acknowledgementNo from fresh license matches licenseNumber from renewal license
      // if (freshLicense. !== renewalLicense.licenseNumber) {
      //   throw new BadRequestException(
      //     `Merge failed: Fresh license acknowledgement number (${freshLicense.acknowledgementNo}) does not match renewal license number (${renewalLicense.licenseNumber})`
      //   );
      // }

      const mergeId = `MERGE-${Date.now()}-${uuidv4().substring(0, 8)}`;
      const mergedFields: string[] = [];

      await prisma.$transaction(async (tx: any) => {
        // Merge personal details
        const personalUpdateData: any = {};

        if (renewalLicense.firstName && renewalLicense.firstName !== freshLicense.firstName) {
          personalUpdateData.firstName = renewalLicense.firstName;
          mergedFields.push('firstName');
        }
        if (renewalLicense.middleName && renewalLicense.middleName !== freshLicense.middleName) {
          personalUpdateData.middleName = renewalLicense.middleName;
          mergedFields.push('middleName');
        }
        if (renewalLicense.lastName && renewalLicense.lastName !== freshLicense.lastName) {
          personalUpdateData.lastName = renewalLicense.lastName;
          mergedFields.push('lastName');
        }
        if (renewalLicense.parentOrSpouseName && renewalLicense.parentOrSpouseName !== freshLicense.parentOrSpouseName) {
          personalUpdateData.parentOrSpouseName = renewalLicense.parentOrSpouseName;
          mergedFields.push('parentOrSpouseName');
        }
        if (renewalLicense.dateOfBirth && renewalLicense.dateOfBirth !== freshLicense.dateOfBirth) {
          personalUpdateData.dateOfBirth = renewalLicense.dateOfBirth;
          mergedFields.push('dateOfBirth');
        }
        if (renewalLicense.dobInWords && renewalLicense.dobInWords !== freshLicense.dobInWords) {
          personalUpdateData.dobInWords = renewalLicense.dobInWords;
          mergedFields.push('dobInWords');
        }
        if (renewalLicense.aadharNumber && renewalLicense.aadharNumber !== freshLicense.aadharNumber) {
          personalUpdateData.aadharNumber = renewalLicense.aadharNumber;
          mergedFields.push('aadharNumber');
        }
        if (renewalLicense.panNumber && renewalLicense.panNumber !== freshLicense.panNumber) {
          personalUpdateData.panNumber = renewalLicense.panNumber;
          mergedFields.push('panNumber');
        }
        if ((renewalLicense as any).placeOfBirth && (renewalLicense as any).placeOfBirth !== (freshLicense as any).placeOfBirth) {
          personalUpdateData.placeOfBirth = (renewalLicense as any).placeOfBirth;
          mergedFields.push('placeOfBirth');
        }

        // Merge addresses
        if (renewalLicense.presentAddress) {
          if (freshLicense.presentAddressId) {
            await tx.FLAFAddressesAndContactDetails.update({
              where: { id: freshLicense.presentAddressId },
              data: {
                addressLine: renewalLicense.presentAddress.addressLine,
                stateId: renewalLicense.presentAddress.stateId,
                districtId: renewalLicense.presentAddress.districtId,
                policeStationId: renewalLicense.presentAddress.policeStationId,
                zoneId: renewalLicense.presentAddress.zoneId,
                divisionId: renewalLicense.presentAddress.divisionId,
                sinceResiding: renewalLicense.presentAddress.sinceResiding,
                telephoneOffice: renewalLicense.presentAddress.telephoneOffice,
                officeMobileNumber: renewalLicense.presentAddress.officeMobileNumber,
                alternativeMobile: renewalLicense.presentAddress.alternativeMobile,
              },
            });
          } else {
            const newPresentAddr = await tx.FLAFAddressesAndContactDetails.create({
              data: {
                addressLine: renewalLicense.presentAddress.addressLine,
                stateId: renewalLicense.presentAddress.stateId,
                districtId: renewalLicense.presentAddress.districtId,
                policeStationId: renewalLicense.presentAddress.policeStationId,
                zoneId: renewalLicense.presentAddress.zoneId,
                divisionId: renewalLicense.presentAddress.divisionId,
                sinceResiding: renewalLicense.presentAddress.sinceResiding,
                telephoneOffice: renewalLicense.presentAddress.telephoneOffice,
                officeMobileNumber: renewalLicense.presentAddress.officeMobileNumber,
                alternativeMobile: renewalLicense.presentAddress.alternativeMobile,
              },
            });
            personalUpdateData.presentAddressId = newPresentAddr.id;
          }
          mergedFields.push('presentAddress');
        }

        if (renewalLicense.permanentAddress) {
          if (freshLicense.permanentAddressId) {
            await tx.FLAFAddressesAndContactDetails.update({
              where: { id: freshLicense.permanentAddressId },
              data: {
                addressLine: renewalLicense.permanentAddress.addressLine,
                stateId: renewalLicense.permanentAddress.stateId,
                districtId: renewalLicense.permanentAddress.districtId,
                policeStationId: renewalLicense.permanentAddress.policeStationId,
                zoneId: renewalLicense.permanentAddress.zoneId,
                divisionId: renewalLicense.permanentAddress.divisionId,
                sinceResiding: renewalLicense.permanentAddress.sinceResiding,
                telephoneOffice: renewalLicense.permanentAddress.telephoneOffice,
                officeMobileNumber: renewalLicense.permanentAddress.officeMobileNumber,
                alternativeMobile: renewalLicense.permanentAddress.alternativeMobile,
              },
            });
          } else {
            const newPermAddr = await tx.FLAFAddressesAndContactDetails.create({
              data: {
                addressLine: renewalLicense.permanentAddress.addressLine,
                stateId: renewalLicense.permanentAddress.stateId,
                districtId: renewalLicense.permanentAddress.districtId,
                policeStationId: renewalLicense.permanentAddress.policeStationId,
                zoneId: renewalLicense.permanentAddress.zoneId,
                divisionId: renewalLicense.permanentAddress.divisionId,
                sinceResiding: renewalLicense.permanentAddress.sinceResiding,
                telephoneOffice: renewalLicense.permanentAddress.telephoneOffice,
                officeMobileNumber: renewalLicense.permanentAddress.officeMobileNumber,
                alternativeMobile: renewalLicense.permanentAddress.alternativeMobile,
              },
            });
            personalUpdateData.permanentAddressId = newPermAddr.id;
          }
          mergedFields.push('permanentAddress');
        }

        // Merge occupation and business
        if (renewalLicense.occupationAndBusiness) {
          if (freshLicense.occupationAndBusinessId) {
            await tx.FLAFOccupationAndBusiness.update({
              where: { id: freshLicense.occupationAndBusinessId },
              data: {
                occupation: renewalLicense.occupationAndBusiness.occupation,
                officeAddress: renewalLicense.occupationAndBusiness.officeAddress,
                stateId: renewalLicense.occupationAndBusiness.stateId,
                districtId: renewalLicense.occupationAndBusiness.districtId,
                cropLocation: renewalLicense.occupationAndBusiness.cropLocation,
                areaUnderCultivation: renewalLicense.occupationAndBusiness.areaUnderCultivation,
              },
            });
          } else {
            const newOccBusiness = await tx.FLAFOccupationAndBusiness.create({
              data: {
                occupation: renewalLicense.occupationAndBusiness.occupation,
                officeAddress: renewalLicense.occupationAndBusiness.officeAddress,
                stateId: renewalLicense.occupationAndBusiness.stateId,
                districtId: renewalLicense.occupationAndBusiness.districtId,
                cropLocation: renewalLicense.occupationAndBusiness.cropLocation,
                areaUnderCultivation: renewalLicense.occupationAndBusiness.areaUnderCultivation,
              },
            });
            personalUpdateData.occupationAndBusinessId = newOccBusiness.id;
          }
          mergedFields.push('occupationAndBusiness');
        }

        // Merge license details
        if (renewalLicense.licenseDetails && renewalLicense.licenseDetails.length > 0) {
          const renewalLicDetail = renewalLicense.licenseDetails[0];
          const freshLicDetail = freshLicense.licenseDetails?.[0];

          if (freshLicDetail) {
            const licenseUpdateData: any = {};

            if (renewalLicDetail.needForLicense) {
              licenseUpdateData.needForLicense = renewalLicDetail.needForLicense;
            }
            if (renewalLicDetail.armsCategory) {
              licenseUpdateData.armsCategory = renewalLicDetail.armsCategory;
            }
            if (renewalLicDetail.areaOfValidity) {
              licenseUpdateData.areaOfValidity = renewalLicDetail.areaOfValidity;
            }
            if (renewalLicDetail.ammunitionDescription) {
              licenseUpdateData.ammunitionDescription = renewalLicDetail.ammunitionDescription;
            }
            if (renewalLicDetail.specialConsiderationReason) {
              licenseUpdateData.specialConsiderationReason = renewalLicDetail.specialConsiderationReason;
            }
            if (renewalLicDetail.licencePlaceArea) {
              licenseUpdateData.licencePlaceArea = renewalLicDetail.licencePlaceArea;
            }

            await tx.FLAFLicenseDetails.update({
              where: { id: freshLicDetail.id },
              data: licenseUpdateData,
            });

            // Update weapons
            if (renewalLicDetail.requestedWeapons && renewalLicDetail.requestedWeapons.length > 0) {
              await tx.FLAFLicenseDetails.update({
                where: { id: freshLicDetail.id },
                data: {
                  requestedWeapons: {
                    set: renewalLicDetail.requestedWeapons.map((weapon: any) => ({
                      id: weapon.id,
                    })),
                  },
                },
              });
            }
          } else {
            // Create new license details
            await tx.FLAFLicenseDetails.create({
              data: {
                applicationId: licenseId,
                needForLicense: renewalLicDetail.needForLicense as any,
                armsCategory: renewalLicDetail.armsCategory as any,
                areaOfValidity: renewalLicDetail.areaOfValidity,
                ammunitionDescription: renewalLicDetail.ammunitionDescription,
                specialConsiderationReason: renewalLicDetail.specialConsiderationReason,
                licencePlaceArea: renewalLicDetail.licencePlaceArea,
                requestedWeapons: renewalLicDetail.requestedWeapons && renewalLicDetail.requestedWeapons.length > 0
                  ? {
                      connect: renewalLicDetail.requestedWeapons.map((weapon: any) => ({
                        id: weapon.id,
                      })),
                    }
                  : undefined,
              },
            });
          }
          mergedFields.push('licenseDetails');
        }

        // Update fresh license personal details
        personalUpdateData.updatedAt = new Date();
        const updatedFreshLicense = await tx.freshLicenseApplicationPersonalDetails.update({
            where: { id: licenseId },
          data: personalUpdateData,
          include: {
            workflowStatus: true,
            currentUser: true,
          },
        });

        // Create merge audit log
        // Create Licenses master record from approved fresh license
        let createdLicense: any = null;
        try {
          const licenseDetail = freshLicense.licenseDetails?.[0];
          const licenseData: any = {
            licenseNumber: `LIC-${Date.now()}-${licenseId}`,
            issueDate: new Date(),
            firstName: freshLicense.firstName,
            middleName: freshLicense.middleName,
            lastName: freshLicense.lastName,
            parentOrSpouseName: freshLicense.parentOrSpouseName,
            sex: freshLicense.sex,
            dateOfBirth: freshLicense.dateOfBirth,
            placeOfBirth: freshLicense.placeOfBirth,
            aadharNumber: freshLicense.aadharNumber,
            panNumber: freshLicense.panNumber,
            validFrom: new Date(),
            validTill: new Date(new Date().setFullYear(new Date().getFullYear() + 5)),
            armsCategory: licenseDetail?.armsCategory,
            areaOfValidity: licenseDetail?.areaOfValidity,
            ammunitionDescription: licenseDetail?.ammunitionDescription,
            licencePlaceArea: licenseDetail?.licencePlaceArea,
            specialConsiderationReason: licenseDetail?.specialConsiderationReason,
            needForLicense: licenseDetail?.needForLicense,
            presentAddressLine: freshLicense.presentAddress?.addressLine,
            presentStateId: freshLicense.presentAddress?.stateId,
            presentDistrictId: freshLicense.presentAddress?.districtId,
            presentPoliceStationId: freshLicense.presentAddress?.policeStationId,
            presentZoneId: freshLicense.presentAddress?.zoneId,
            presentDivisionId: freshLicense.presentAddress?.divisionId,
            presentRangeOfficeId: freshLicense.presentAddress?.rangeOfficeId,
            permanentAddressLine: freshLicense.permanentAddress?.addressLine,
            permanentStateId: freshLicense.permanentAddress?.stateId,
            permanentDistrictId: freshLicense.permanentAddress?.districtId,
            permanentPoliceStationId: freshLicense.permanentAddress?.policeStationId,
            permanentZoneId: freshLicense.permanentAddress?.zoneId,
            permanentDivisionId: freshLicense.permanentAddress?.divisionId,
            permanentRangeOfficeId: freshLicense.permanentAddress?.rangeOfficeId,
            occupation: freshLicense.occupationAndBusiness?.occupation,
            officeAddress: freshLicense.occupationAndBusiness?.officeAddress,
            freshApplicationId: licenseId,
            issuedBy: currentUserId,
          };

          createdLicense = await tx.licenses.create({ data: licenseData });
          mergedFields.push('licenseCreated');
        } catch (createLicenseError: any) {
          // If license creation fails, continue to create audit log but transaction will rollback on error propagation
          createdLicense = null;
        }

        // Create merge audit log
        try {
          const mergeLog = await tx.LicensesMergeAuditLog.create({
            data: {
              mergeId,
              freshLicenseId: licenseId,
              renewalLicenseId,
              mergedFields: mergedFields.join(','),
              mergedBy: currentUserId,
              mergedAt: new Date(),
              status: 'COMPLETED',
              remarks: `Merged renewal license ${renewalLicenseId} into fresh license ${licenseId}`,
            },
          });
        } catch (auditLogError: any) {
          
        }

        return {
          success: true,
          message: 'Renewal license successfully merged into fresh license',
          data: {
            mergeId,
            licenseId,
            renewalLicenseId,
            mergedFields,
            mergedAt: new Date(),
            mergedBy: currentUserId,
            freshLicenseUpdated: this.mapApplicationToResponse(updatedFreshLicense),
            createdLicenseId: createdLicense ? createdLicense.id : undefined,
          },
        };
      });
    } catch (error: any) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('One or both licenses not found');
      }
      throw new InternalServerErrorException(
        `An error occurred while merging licenses: ${error?.message || 'Unknown error'}`,
      );
    }
  }

  /**
   * Get merge audit logs with pagination and filtering
   */
  async getMergeAuditLogs(page = 1, limit = 10, filters: any = {}) {
    try {
      const skip = (page - 1) * limit;

      const where: any = {};
      if (filters.mergeId) where.mergeId = { contains: filters.mergeId };
      if (filters.licenseId) where.licenseId = parseInt(filters.licenseId);
      if (filters.renewalLicenseId) where.renewalLicenseId = parseInt(filters.renewalLicenseId);
      if (filters.status) where.status = filters.status;
      if (filters.mergedBy) where.mergedBy = parseInt(filters.mergedBy);

      const [logs, total] = await Promise.all([
        prisma.licensesMergeAuditLog.findMany({
          where,
          include: {
            freshLicense: {
              select: {
                id: true,
                acknowledgementNo: true,
                firstName: true,
                lastName: true,
              },
            },
            renewalLicense: {
              select: {
                id: true,
                acknowledgementNo: true,
                firstName: true,
                lastName: true,
              },
            },
            mergedByUser: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
          orderBy: { mergedAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.licensesMergeAuditLog.count({ where }),
      ]);

      return {
        data: logs,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error: any) {
      throw new InternalServerErrorException(
        `Failed to retrieve merge audit logs: ${error?.message || 'Unknown error'}`,
      );
    }
  }

  /**
   * Get a specific merge audit log by merge ID
   */
  async getMergeAuditLogByMergeId(mergeId: string) {
    try {
      const log = await prisma.licensesMergeAuditLog.findUnique({
        where: { mergeId },
        include: {
          freshLicense: {
            select: {
              id: true,
              acknowledgementNo: true,
              firstName: true,
              middleName: true,
              lastName: true,
              dateOfBirth: true,
              aadharNumber: true,
              panNumber: true,
            },
          },
          renewalLicense: {
            select: {
              id: true,
              acknowledgementNo: true,
              firstName: true,
              middleName: true,
              lastName: true,
              dateOfBirth: true,
              aadharNumber: true,
              panNumber: true,
            },
          },
          mergedByUser: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });

      if (!log) {
        throw new NotFoundException(`Merge audit log with ID ${mergeId} not found`);
      }

      return log;
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to retrieve merge audit log: ${error?.message || 'Unknown error'}`,
      );
    }
  }

  /**
   * Copy renewal form details from a FreshLicenseApplicationPersonalDetails record
   * Creates a new RenewalFormPersonalDetails entry with the same data
   */
  async copyFromFreshLicense(
    freshLicenseId: number,
    currentUserId?: number,
  ): Promise<RenewalFormResponse> {
    try {
      // 1. Find the Licenses record that has this freshApplicationId
      const licenseRecord = await prisma.licenses.findFirst({
        where: { freshApplicationId: freshLicenseId },
      });

      if (!licenseRecord) {
        throw new NotFoundException(
          'No License record found for this fresh application. Create a license first.',
        );
      }

      const resolvedLicenseId = licenseRecord.id;
      const resolvedLicenseNumber = licenseRecord.licenseNumber;

      // 2. Check if there is any existing Renewal for the same License.
      //    - If an approved renewal exists → allow creation of a new renewal (prefilled from last approved).
      //    - If a non-approved renewal exists (Pending/In Progress/Rejected) → return the existing one
      //      so the user can continue editing it.
      const existingRenewal = await prisma.renewalFormPersonalDetails.findFirst({
        where: {
          licenseId: resolvedLicenseId,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (existingRenewal) {
        if (!existingRenewal.isApproved) {
          // Existing renewal is NOT approved (Pending/In Progress/Rejected/etc.)
          // Check if the latest workflow history actionTaken is CLOSE — if so, allow
          // creating a new renewal (auto-assigned to self user) instead of returning
          // the existing one.
          const latestHistory = await prisma.renewalApplicationsFormWorkflowHistories.findFirst({
            where: { applicationId: existingRenewal.id },
            orderBy: { createdAt: 'desc' },
          });
          if (!latestHistory || latestHistory.actionTaken !== ACTION_CODES.CLOSE) {
            // Not a closed renewal — return existing so the user can resume
            return this.mapApplicationToResponse(existingRenewal);
          }
          // actionTaken IS CLOSE → fall through to create a new renewal
        }
        // Existing renewal IS approved → fall through to create a new renewal
      }

      // 3. Determine the source data for pre-filling:
      //    - If lastModifiedRenewalId exists and that renewal is APPROVED, use it as source
      //    - Otherwise, use the original fresh license data
      let sourceData: any = null;
      let sourceFromRenewal = false;

      if (licenseRecord.lastModifiedRenewalId) {
        const approvedRenewal = await prisma.renewalFormPersonalDetails.findFirst({
          where: {
            id: licenseRecord.lastModifiedRenewalId,
            isApproved: true,
          },
          include: {
            presentAddress: true,
            permanentAddress: true,
            occupationAndBusiness: true,
            licenseDetails: true,
          },
        });
        if (approvedRenewal) {
          sourceData = approvedRenewal;
          sourceFromRenewal = true;
        }
      }

      // If no approved renewal source, fall back to fresh license data
      if (!sourceData) {
        sourceData = await prisma.freshLicenseApplicationPersonalDetails.findUnique({
          where: { id: freshLicenseId },
          include: {
            presentAddress: true,
            permanentAddress: true,
            occupationAndBusiness: true,
            licenseDetails: true,
          },
        });

        if (!sourceData) {
          throw new NotFoundException('Fresh license record not found');
        }
      }

      // Generate acknowledgement number
      const acknowledgementNo = `RAF${Date.now()}${Math.floor(Math.random() * 1000)}`;

      // Create the renewal record within a transaction
      const renewalRecord = await prisma.$transaction(async (tx: any) => {
        // Get DRAFT status
        const draftStatus = await tx.statuses.findFirst({
          where: { code: 'DRAFT' },
        });

        if (!draftStatus) {
          throw new BadRequestException('DRAFT status not found in the system.');
        }

        // Copy present address from source
        let presentAddressId: number | null = null;
        if (
          sourceData.presentAddress &&
          sourceData.presentAddress.addressLine
        ) {
          try {
            const copiedPresentAddress = await tx.renewalAddressesAndContactDetails.create({
              data: {
                addressLine: sourceData.presentAddress.addressLine,
                stateId: sourceData.presentAddress.stateId,
                districtId: sourceData.presentAddress.districtId,
                zoneId: sourceData.presentAddress.zoneId,
                divisionId: sourceData.presentAddress.divisionId,
                policeStationId: sourceData.presentAddress.policeStationId,
                sinceResiding: sourceData.presentAddress.sinceResiding
                  ? new Date(sourceData.presentAddress.sinceResiding)
                  : undefined,
                telephoneOffice: sourceData.presentAddress.telephoneOffice || null,
                telephoneResidence: sourceData.presentAddress.telephoneResidence || null,
                officeMobileNumber: sourceData.presentAddress.officeMobileNumber || null,
                alternativeMobile: sourceData.presentAddress.alternativeMobile || null,
              },
            });
            presentAddressId = copiedPresentAddress.id;
          } catch (addrError: any) {
            console.error('Error copying present address:', addrError.message);
          }
        }

        // Copy permanent address
        let permanentAddressId: number | null = null;
        if (
          sourceData.permanentAddress &&
          sourceData.permanentAddress.addressLine
        ) {
          try {
            const copiedPermanentAddress = await tx.renewalAddressesAndContactDetails.create({
              data: {
                addressLine: sourceData.permanentAddress.addressLine,
                stateId: sourceData.permanentAddress.stateId,
                districtId: sourceData.permanentAddress.districtId,
                zoneId: sourceData.permanentAddress.zoneId,
                divisionId: sourceData.permanentAddress.divisionId,
                policeStationId: sourceData.permanentAddress.policeStationId,
                sinceResiding: sourceData.permanentAddress.sinceResiding
                  ? new Date(sourceData.permanentAddress.sinceResiding)
                  : undefined,
                telephoneOffice: sourceData.permanentAddress.telephoneOffice || null,
                telephoneResidence: sourceData.permanentAddress.telephoneResidence || null,
                officeMobileNumber: sourceData.permanentAddress.officeMobileNumber || null,
                alternativeMobile: sourceData.permanentAddress.alternativeMobile || null,
              },
            });
            permanentAddressId = copiedPermanentAddress.id;
          } catch (addrError: any) {
            console.error('Error copying permanent address:', addrError.message);
          }
        }

        // Copy occupation and business
        let occupationAndBusinessId: number | null = null;
        if (
          sourceData.occupationAndBusiness &&
          sourceData.occupationAndBusiness.occupation
        ) {
          try {
            const copiedOccupation = await tx.renewalOccupationAndBusiness.create({
              data: {
                occupation: sourceData.occupationAndBusiness.occupation,
                officeAddress: sourceData.occupationAndBusiness.officeAddress,
                stateId: sourceData.occupationAndBusiness.stateId,
                districtId: sourceData.occupationAndBusiness.districtId,
                cropLocation: sourceData.occupationAndBusiness.cropLocation || null,
                areaUnderCultivation: sourceData.occupationAndBusiness.areaUnderCultivation || null,
              },
            });
            occupationAndBusinessId = copiedOccupation.id;
          } catch (occError: any) {
            console.error('Error copying occupation:', occError.message);
          }
        }

        // Create the renewal record using the original license's id and license number
        const newRenewalRecord = await tx.renewalFormPersonalDetails.create({
          data: {
            acknowledgementNo,
            // Use the original license id and license number (not generated)
            licenseId: resolvedLicenseId,
            licenseNumber: resolvedLicenseNumber,
            renewalLicenseId: licenseRecord.almsLicenseId || null,
            firstName: sourceData.firstName,
            middleName: sourceData.middleName || null,
            lastName: sourceData.lastName,
            parentOrSpouseName: sourceData.parentOrSpouseName,
            sex: sourceData.sex,
            dateOfBirth: sourceData.dateOfBirth || null,
            dobInWords: sourceData.dobInWords || null,
            panNumber: sourceData.panNumber || null,
            aadharNumber: sourceData.aadharNumber || null,
            filledBy: sourceData.filledBy || null,
            currentUserId: currentUserId || null,
            workflowStatusId: draftStatus.id,
            occupationAndBusinessId,
            presentAddressId,
            permanentAddressId,
            isAwareOfLegalConsequences: sourceData.isAwareOfLegalConsequences || false,
            isDeclarationAccepted: sourceData.isDeclarationAccepted || false,
            isTermsAccepted: sourceData.isTermsAccepted || false,
            isSubmit: false,
          },
          include: {
            workflowStatus: true,
            currentUser: true,
            presentAddress: true,
            permanentAddress: true,
            occupationAndBusiness: true,
          },
        });

        return newRenewalRecord;
      });

      return this.mapApplicationToResponse(renewalRecord);
    } catch (error: any) {
      if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof ConflictException) {
        throw error;
      }
      if (error.code === 'P2003') {
        throw new BadRequestException(`Invalid foreign key reference while copying from fresh license. Error: ${error.message}`);
      }
      throw new InternalServerErrorException(
        `An error occurred while creating renewal: ${error?.message || 'Unknown error'}`,
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
      licenseId: application.licenseId,
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
      isDeclarationAccepted: application.isDeclarationAccepted,
      isAwareOfLegalConsequences: application.isAwareOfLegalConsequences,
      isTermsAccepted: application.isTermsAccepted,
    };
  }
}
