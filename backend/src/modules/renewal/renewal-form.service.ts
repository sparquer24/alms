import { Injectable, ConflictException, BadRequestException,InternalServerErrorException,NotFoundException,} from '@nestjs/common';
import prisma from '../../db/prismaClient';
import {CreateRenewalFormRequest,RenewalFormResponse,RenewalFiltersDto,} from '../../request/renewal-form';
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
  ): Promise<any> {
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
              patchData.acceptanceFlags.isDeclarationAccepted !== undefined
                ? patchData.acceptanceFlags.isDeclarationAccepted
                : application.isDeclarationAccepted,
            isAwareOfLegalConsequences:
              patchData.acceptanceFlags.isAwareOfLegalConsequences !== undefined
                ? patchData.acceptanceFlags.isAwareOfLegalConsequences
                : application.isAwareOfLegalConsequences,
            isTermsAccepted:
              patchData.acceptanceFlags.isTermsAccepted !== undefined
                ? patchData.acceptanceFlags.isTermsAccepted
                : application.isTermsAccepted,
          };
        }

        // Handle submission
        if (patchData.isSubmit !== undefined) {
          if (patchData.isSubmit) {
            // Submitting the application
            // Use FORWARD status to mark as submitted
            const forwardStatus = await tx.statuses.findFirst({
              where: { code: 'FORWARD' },
            });

            updateData.isSubmit = true;
            if (forwardStatus) {
              updateData.workflowStatusId = forwardStatus.id;
            }

            // Create workflow history entry only if currentUserId is valid and user exists
            if (currentUserId) {
              try {
                // Check if the user exists before creating history
                const userExists = await tx.users.findUnique({
                  where: { id: currentUserId },
                });

                if (userExists) {
                  await tx.renewalApplicationsFormWorkflowHistories.create({
                    data: {
                      applicationId,
                      previousUserId: currentUserId,
                      nextUserId: currentUserId,
                      actionTaken: 'SUBMITTED',
                      remarks: 'Application submitted for processing',
                    },
                  });
                } else {
                  console.warn(`⚠️ User ${currentUserId} does not exist, skipping workflow history`);
                }
              } catch (historyError: any) {
                // Log but don't fail the submission if history creation fails
                console.warn('⚠️ Could not create workflow history:', historyError.message);
              }
            }
          } else {
            // Unsetting submission - revert to DRAFT status
            const draftStatus = await tx.statuses.findFirst({
              where: { code: 'DRAFT' },
            });
            updateData.isSubmit = false;
            if (draftStatus) {
              updateData.workflowStatusId = draftStatus.id;
            }
          }
        }

        // Update the application
        const updatedApplication = await tx.renewalFormPersonalDetails.update({
          where: { id: applicationId },
          data: updateData,
          include: {
            workflowStatus: true,
            currentUser: {
              include: { role: true },
            },
            previousUser: {
              include: { role: true },
            },
            presentAddress: {
              include: {
                state: true,
                district: true,
                zone: true,
                division: true,
                policeStation: true,
              },
          },
          permanentAddress: {
            include: {
              state: true,
              district: true,
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
          fileUploads: true,
          biometricData: true,
          workflowHistories: {
            include: {
              nextUser: {
                include: { role: true },
              },
              previousUser: {
                include: { role: true },
              },
              nextRole: true,
              previousRole: true,
            },
          },
        },

        });

        //return this.mapApplicationToResponse(updatedApplication);
        return updatedApplication;
      });
    } catch (error: any) {
      console.error('❌ [patchApplicationDetails] Error:', error?.message);
      
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('Renewal application or related record not found.');
      }
      if (error.code === 'P2003') {
        throw new BadRequestException('Invalid reference: related record does not exist.');
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
            include: {
              state: true,
              district: true,
              zone: true,
              division: true,
              policeStation: true,
            },
          },
          permanentAddress: {
            include: {
              state: true,
              district: true,
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
          fileUploads: true,
          biometricData: true,
          workflowHistories: {
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
       return application;
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
            include: {role: true},
          },
        previousUser: {
          include: {role: true},
        },
        presentAddress: {
          include: {
            state: true,
            district: true,
            zone: true,
            division: true,
            policeStation: true,
        },
        },
        permanentAddress: {
          include: {
            state: true,
            district: true,
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
          fileUploads: true,
          biometricData: true,
          workflowHistories: {
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
    freshLicenseId: number,
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
        where: { id: freshLicenseId },
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
          `Fresh license with ID ${freshLicenseId} not found`
        );
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

      // Validate that acknowledgementNo from fresh license matches licenseNumber from renewal license
      if (freshLicense.acknowledgementNo !== renewalLicense.licenseNumber) {
        throw new BadRequestException(
          `Merge failed: Fresh license acknowledgement number (${freshLicense.acknowledgementNo}) does not match renewal license number (${renewalLicense.licenseNumber})`
        );
      }

      const mergeId = `MERGE-${Date.now()}-${uuidv4().substring(0, 8)}`;
      const mergedFields: string[] = [];

      return await prisma.$transaction(async (tx: any) => {
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
                applicationId: freshLicenseId,
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
          where: { id: freshLicenseId },
          data: personalUpdateData,
          include: {
            workflowStatus: true,
            currentUser: true,
          },
        });

        // Create merge audit log
        try {
          const mergeLog = await tx.LicensesMergeAuditLog.create({
            data: {
              mergeId,
              freshLicenseId,
              renewalLicenseId,
              mergedFields: mergedFields.join(','),
              mergedBy: currentUserId,
              mergedAt: new Date(),
              status: 'COMPLETED',
              remarks: `Merged renewal license ${renewalLicenseId} into fresh license ${freshLicenseId}`,
            },
          });
        } catch (auditLogError: any) {
          
        }

        return {
          success: true,
          message: 'Renewal license successfully merged into fresh license',
          data: {
            mergeId,
            freshLicenseId,
            renewalLicenseId,
            mergedFields,
            mergedAt: new Date(),
            mergedBy: currentUserId,
            freshLicenseUpdated: this.mapApplicationToResponse(updatedFreshLicense),
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
      if (filters.freshLicenseId) where.freshLicenseId = parseInt(filters.freshLicenseId);
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
      // Fetch the fresh license record
      const freshLicense = await prisma.freshLicenseApplicationPersonalDetails.findUnique({
        where: { id: freshLicenseId },
        include: {
          presentAddress: true,
          permanentAddress: true,
          occupationAndBusiness: true,
          licenseDetails: true,
        },
      });

      // If fresh license not found, throw error
      if (!freshLicense) {
        throw new NotFoundException('ID not found');
      }

      // Generate acknowledgement and license number for renewal
      const acknowledgementNo = `RENEWAL-${Date.now()}-${uuidv4().substring(0, 8)}`;
      const licenseNumber = `RENEWAL-${freshLicenseId}-${Date.now()}`;

      // Create the renewal record within a transaction
      const renewalRecord = await prisma.$transaction(async (tx: any) => {
        // Get DRAFT status
        const draftStatus = await tx.statuses.findFirst({
          where: { code: 'DRAFT' },
        });

        if (!draftStatus) {
          throw new BadRequestException('DRAFT status not found in the system.');
        }

        // Copy present address if exists and has all required fields
        let presentAddressId: number | null = null;
        if (
          freshLicense.presentAddress &&
          freshLicense.presentAddress.addressLine &&
          freshLicense.presentAddress.stateId &&
          freshLicense.presentAddress.districtId &&
          freshLicense.presentAddress.zoneId &&
          freshLicense.presentAddress.divisionId &&
          freshLicense.presentAddress.policeStationId &&
          freshLicense.presentAddress.sinceResiding
        ) {
          try {
            const copiedPresentAddress = await tx.renewalAddressesAndContactDetails.create({
              data: {
                addressLine: freshLicense.presentAddress.addressLine,
                stateId: freshLicense.presentAddress.stateId,
                districtId: freshLicense.presentAddress.districtId,
                zoneId: freshLicense.presentAddress.zoneId,
                divisionId: freshLicense.presentAddress.divisionId,
                policeStationId: freshLicense.presentAddress.policeStationId,
                sinceResiding: freshLicense.presentAddress.sinceResiding,
                telephoneOffice: freshLicense.presentAddress.telephoneOffice || null,
                telephoneResidence: freshLicense.presentAddress.telephoneResidence || null,
                officeMobileNumber: freshLicense.presentAddress.officeMobileNumber || null,
                alternativeMobile: freshLicense.presentAddress.alternativeMobile || null,
              },
            });
            presentAddressId = copiedPresentAddress.id;
          } catch (addrError: any) {
            console.error('Error copying present address:', addrError.message);
            // Continue without present address if copy fails
          }
        }

        // Copy permanent address if exists and has all required fields
        let permanentAddressId: number | null = null;
        if (
          freshLicense.permanentAddress &&
          freshLicense.permanentAddress.addressLine &&
          freshLicense.permanentAddress.stateId &&
          freshLicense.permanentAddress.districtId &&
          freshLicense.permanentAddress.zoneId &&
          freshLicense.permanentAddress.divisionId &&
          freshLicense.permanentAddress.policeStationId &&
          freshLicense.permanentAddress.sinceResiding
        ) {
          try {
            const copiedPermanentAddress = await tx.renewalAddressesAndContactDetails.create({
              data: {
                addressLine: freshLicense.permanentAddress.addressLine,
                stateId: freshLicense.permanentAddress.stateId,
                districtId: freshLicense.permanentAddress.districtId,
                zoneId: freshLicense.permanentAddress.zoneId,
                divisionId: freshLicense.permanentAddress.divisionId,
                policeStationId: freshLicense.permanentAddress.policeStationId,
                sinceResiding: freshLicense.permanentAddress.sinceResiding,
                telephoneOffice: freshLicense.permanentAddress.telephoneOffice || null,
                telephoneResidence: freshLicense.permanentAddress.telephoneResidence || null,
                officeMobileNumber: freshLicense.permanentAddress.officeMobileNumber || null,
                alternativeMobile: freshLicense.permanentAddress.alternativeMobile || null,
              },
            });
            permanentAddressId = copiedPermanentAddress.id;
          } catch (addrError: any) {
            console.error('Error copying permanent address:', addrError.message);
            // Continue without permanent address if copy fails
          }
        }

        // Copy occupation and business if exists and has all required fields
        let occupationAndBusinessId: number | null = null;
        if (
          freshLicense.occupationAndBusiness &&
          freshLicense.occupationAndBusiness.occupation &&
          freshLicense.occupationAndBusiness.officeAddress &&
          freshLicense.occupationAndBusiness.stateId &&
          freshLicense.occupationAndBusiness.districtId
        ) {
          try {
            const copiedOccupation = await tx.renewalOccupationAndBusiness.create({
              data: {
                occupation: freshLicense.occupationAndBusiness.occupation,
                officeAddress: freshLicense.occupationAndBusiness.officeAddress,
                stateId: freshLicense.occupationAndBusiness.stateId,
                districtId: freshLicense.occupationAndBusiness.districtId,
                cropLocation: freshLicense.occupationAndBusiness.cropLocation || null,
                areaUnderCultivation: freshLicense.occupationAndBusiness.areaUnderCultivation || null,
              },
            });
            occupationAndBusinessId = copiedOccupation.id;
          } catch (occError: any) {
            console.error('Error copying occupation and business:', occError.message);
            // Continue without occupation if copy fails
          }
        }

        // Create the renewal record
        const newRenewalRecord = await tx.renewalFormPersonalDetails.create({
          data: {
            acknowledgementNo,
            licenseNumber,
            firstName: freshLicense.firstName,
            middleName: freshLicense.middleName || null,
            lastName: freshLicense.lastName,
            parentOrSpouseName: freshLicense.parentOrSpouseName,
            sex: freshLicense.sex,
            dateOfBirth: freshLicense.dateOfBirth || null,
            dobInWords: freshLicense.dobInWords || null,
            panNumber: freshLicense.panNumber || null,
            aadharNumber: freshLicense.aadharNumber || null,
            filledBy: freshLicense.filledBy || null,
            currentUserId: currentUserId || null,
            workflowStatusId: draftStatus.id,
            occupationAndBusinessId,
            presentAddressId,
            permanentAddressId,
            isAwareOfLegalConsequences: freshLicense.isAwareOfLegalConsequences || false,
            isDeclarationAccepted: freshLicense.isDeclarationAccepted || false,
            isTermsAccepted: freshLicense.isTermsAccepted || false,
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
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      if (error.code === 'P2003') {
        throw new BadRequestException(`Invalid foreign key reference while copying from fresh license. Error: ${error.message}`);
      }
      throw new InternalServerErrorException(
        `An error occurred while copying from fresh license: ${error?.message || 'Unknown error'}`,
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
      isDeclarationAccepted: application.isDeclarationAccepted,
      isAwareOfLegalConsequences: application.isAwareOfLegalConsequences,
      isTermsAccepted: application.isTermsAccepted,
    };
  }
}