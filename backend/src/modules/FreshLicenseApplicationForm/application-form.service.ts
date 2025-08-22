import { Injectable, ConflictException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import prisma from '../../db/prismaClient';
import { Sex, FileType, LicensePurpose, WeaponCategory } from '@prisma/client';
import { Prisma } from '@prisma/client';

export interface CreateAddressInput {
  addressLine: string;
  stateId: number;
  districtId: number;
  sinceResiding: Date;
}

export interface CreateContactInfoInput {
  telephoneOffice?: string;
  telephoneResidence?: string;
  mobileNumber: string;
  officeMobileNumber?: string;
  alternativeMobile?: string;
}

export interface CreateOccupationInfoInput {
  occupation: string;
  officeAddress: string;
  stateId: number;
  districtId: number;
  cropLocation?: string;
  areaUnderCultivation?: number;
}

export interface CreateLicenseRequestDetailsInput {
  needForLicense?: LicensePurpose;
  weaponCategory?: WeaponCategory;
  requestedWeaponIds?: string[]; // Array of WeaponTypeMaster IDs
  areaOfValidity?: string;
}

export interface CreateCriminalHistoryInput {
  convicted: boolean;
  convictionData?: any; // JSON object with FIR details
  bondExecutionOrdered?: boolean;
  bondDate?: Date;
  periodOfBond?: string;
  prohibitedUnderArmsAct?: boolean;
  prohibitedDate?: Date;
}

export interface CreateLicenseHistoryInput {
  hasAppliedBefore: boolean;
  previousApplications?: any; // JSON array
  hasOtherApplications: boolean;
  otherApplications?: any; // JSON object
  familyMemberHasArmsLicense: boolean;
  familyMemberLicenses?: any; // JSON array
  hasSafePlaceForArms: boolean;
  safeStorageDetails?: string;
  hasUndergoneTraining: boolean;
  trainingDetails?: string;
}

export interface CreateFileUploadInput {
  fileName: string;
  fileSize: number;
  fileType: FileType;
  fileUrl: string;
}

export interface CreateBiometricDataInput {
  signatureImageUrl?: string;
  irisScanImageUrl?: string;
  photoImageUrl?: string;
}

export interface CreateFreshLicenseApplicationsFormsInput {
  firstName: string;
  middleName?: string;
  lastName: string;
  filledBy?: string;
  parentOrSpouseName: string;
  sex: Sex;
  placeOfBirth: string;
  dateOfBirth: Date;
  panNumber?: string;
  aadharNumber: string;
  dobInWords?: string;
  stateId: number;
  districtId: number;
  
  // User and Role tracking fields (extracted from token)
  currentUserId?: number;
  currentRoleId?: number;
  previousUserId?: number;
  previousRoleId?: number;
  
  // Nested objects
  presentAddress: CreateAddressInput;
  permanentAddress?: CreateAddressInput;
  contactInfo: CreateContactInfoInput;
  occupationInfo?: CreateOccupationInfoInput;
  biometricData?: CreateBiometricDataInput;
  criminalHistory?: CreateCriminalHistoryInput[];
  licenseHistory?: CreateLicenseHistoryInput[];
  licenseRequestDetails?: CreateLicenseRequestDetailsInput;
  fileUploads?: CreateFileUploadInput[];
}

function validateCreateApplicationInput(data: any): asserts data is Required<CreateFreshLicenseApplicationsFormsInput> {
  const requiredFields = [
    'firstName', 'lastName', 'parentOrSpouseName', 'sex', 'placeOfBirth', 
    'dateOfBirth', 'aadharNumber', 'stateId', 'districtId', 'presentAddress', 'contactInfo'
  ];
  
  for (const field of requiredFields) {
    if (!data[field]) {
      throw new Error(`${field} is required.`);
    }
  }

  // Validate nested presentAddress
  const missingAddressFields = [];
  if (!data.presentAddress.addressLine) missingAddressFields.push('addressLine');
  if (!data.presentAddress.stateId) missingAddressFields.push('stateId');
  if (!data.presentAddress.districtId) missingAddressFields.push('districtId');
  if (!data.presentAddress.sinceResiding) missingAddressFields.push('sinceResiding');
  if (missingAddressFields.length > 0) {
    throw new Error(`Present address fields are incomplete. Missing: ${missingAddressFields.join(', ')}`);
  }

  // Validate nested contactInfo
  if (!data.contactInfo.mobileNumber) {
    throw new Error('Mobile number is required in contact info.');
  }

  // Validate enums
  if (!Object.values(Sex).includes(data.sex)) {
    throw new Error('Invalid sex value.');
  }

  // Validate aadhar uniqueness will be handled by database constraint
  if (typeof data.aadharNumber !== 'string' || data.aadharNumber.length !== 12) {
    throw new Error('Aadhar number must be a 12-digit string.');
  }

  // Validate license request details if provided
  if (data.licenseRequestDetails) {
    if (data.licenseRequestDetails.needForLicense && !Object.values(LicensePurpose).includes(data.licenseRequestDetails.needForLicense)) {
      throw new Error(`Invalid license purpose. Valid values are: ${Object.values(LicensePurpose).join(', ')}`);
    }
    if (data.licenseRequestDetails.weaponCategory && !Object.values(WeaponCategory).includes(data.licenseRequestDetails.weaponCategory)) {
      throw new Error(`Invalid weapon category. Valid values are: ${Object.values(WeaponCategory).join(', ')}`);
    }
  }

  // Validate file uploads if provided
  if (data.fileUploads && data.fileUploads.length > 0) {
    for (const file of data.fileUploads) {
      if (!Object.values(FileType).includes(file.fileType)) {
        throw new Error(`Invalid file type "${file.fileType}". Valid values are: ${Object.values(FileType).join(', ')}`);
      }
    }
  }
}

@Injectable()
export class ApplicationFormService {
  // Helper method to get user information with role details
  private async getUserWithRole(userId: number) {
    return await prisma.users.findUnique({
      where: { id: userId },
      include: {
        role: true,
      },
    });
  }

  // Helper method to determine initial status for new applications
  private async getInitialStatus() {
    // Get the initial status (e.g., "SUBMITTED" or "PENDING")
    const initialStatus = await prisma.statuses.findFirst({
      where: { 
        OR: [
          { code: 'SUBMITTED' },
          { code: 'PENDING' },
          { code: 'INITIAL' }
        ]
      },
      orderBy: { id: 'asc' } // Get the first available status
    });
    
    return initialStatus?.id || null;
  }

  // Helper methods to get valid IDs for testing
  async getStates() {
    return await prisma.states.findMany({
      select: {
        id: true,
        name: true,
      },
    });
  }

  async getDistrictsByState(stateId: number) {
    return await prisma.districts.findMany({
      where: { stateId },
      select: {
        id: true,
        name: true,
        stateId: true,
      },
    });
  }

  async getPoliceStationsByDivision(divisionId: number) {
    return await prisma.policeStations.findMany({
      where: { divisionId },
      select: {
        id: true,
        name: true,
        divisionId: true,
      },
    });
  }

  async checkAadharExists(aadharNumber: string) {
    const existingApplication = await prisma.freshLicenseApplicationsForms.findUnique({
      where: { aadharNumber },
      select: {
        id: true,
        acknowledgementNo: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        status: {
          select: {
            name: true,
            code: true
          }
        }
      }
    });
    
    return {
      exists: !!existingApplication,
      application: existingApplication
    };
  }

  async validateReferenceIds(ids: { stateId?: number; districtId?: number }) {
    const validation: any = {};
    
    if (ids.stateId) {
      const state = await prisma.states.findUnique({
        where: { id: ids.stateId },
        select: { id: true, name: true }
      });
      validation.state = {
        id: ids.stateId,
        exists: !!state,
        data: state
      };
    }
    
    if (ids.districtId) {
      const district = await prisma.districts.findUnique({
        where: { id: ids.districtId },
        select: { id: true, name: true, stateId: true }
      });
      validation.district = {
        id: ids.districtId,
        exists: !!district,
        data: district
      };
    }
    
    return validation;
  }

  private async validateReferencesExist(data: CreateFreshLicenseApplicationsFormsInput) {
    // Validate main state and district
    const state = await prisma.states.findUnique({ where: { id: data.stateId } });
    if (!state) {
      throw new Error(`State with ID ${data.stateId} does not exist`);
    }
    
    const district = await prisma.districts.findUnique({ where: { id: data.districtId } });
    if (!district) {
      throw new Error(`District with ID ${data.districtId} does not exist`);
    }
    
    // Validate present address references
    const presentState = await prisma.states.findUnique({ where: { id: data.presentAddress.stateId } });
    if (!presentState) {
      throw new Error(`Present address state with ID ${data.presentAddress.stateId} does not exist`);
    }
    
    const presentDistrict = await prisma.districts.findUnique({ where: { id: data.presentAddress.districtId } });
    if (!presentDistrict) {
      throw new Error(`Present address district with ID ${data.presentAddress.districtId} does not exist`);
    }
    
    // Validate permanent address references if provided
    if (data.permanentAddress) {
      const permanentState = await prisma.states.findUnique({ where: { id: data.permanentAddress.stateId } });
      if (!permanentState) {
        throw new Error(`Permanent address state with ID ${data.permanentAddress.stateId} does not exist`);
      }
      
      const permanentDistrict = await prisma.districts.findUnique({ where: { id: data.permanentAddress.districtId } });
      if (!permanentDistrict) {
        throw new Error(`Permanent address district with ID ${data.permanentAddress.districtId} does not exist`);
      }
    }
    
    // Validate occupation info references if provided
    if (data.occupationInfo) {
      const occupationState = await prisma.states.findUnique({ where: { id: data.occupationInfo.stateId } });
      if (!occupationState) {
        throw new Error(`Occupation state with ID ${data.occupationInfo.stateId} does not exist`);
      }
      
      const occupationDistrict = await prisma.districts.findUnique({ where: { id: data.occupationInfo.districtId } });
      if (!occupationDistrict) {
        throw new Error(`Occupation district with ID ${data.occupationInfo.districtId} does not exist`);
      }
    }
  }

  /**
   * Creates a new fresh license application with proper user and role tracking.
   * 
   * This method ensures that:
   * 1. currentUserId and currentRoleId are extracted from the authenticated user (token)
   * 2. These fields are never left null or empty
   * 3. previousUserId and previousRoleId are set to null for new applications
   * 4. All required validations are performed before creation
   * 
   * @param data - Application data including user context from token
   * @returns Created application with all relations
   */
  async createApplication(data: CreateFreshLicenseApplicationsFormsInput) {
    try {
      validateCreateApplicationInput(data);
      
      // Ensure currentUserId is provided (this should come from the token)
      if (!data.currentUserId) {
        throw new BadRequestException('Current user information is required. Please ensure you are properly authenticated.');
      }

      // Get user information with role details
      const currentUser = await this.getUserWithRole(data.currentUserId);
      if (!currentUser) {
        throw new BadRequestException('Invalid user. User not found in the system.');
      }

      if (!currentUser.role) {
        throw new BadRequestException('User role information is missing. Please contact administrator.');
      }

      // Set role information from current user
      const applicationData = {
        ...data,
        currentUserId: currentUser.id,
        currentRoleId: currentUser.roleId,
        // For new applications, previous user and role are typically undefined
        // They will be set when the application moves through workflow
        previousUserId: data.previousUserId || undefined,
        previousRoleId: data.previousRoleId || undefined,
      };

      // Check if aadhar number already exists
      const existingApplication = await prisma.freshLicenseApplicationsForms.findUnique({
        where: { aadharNumber: applicationData.aadharNumber },
        select: { id: true, acknowledgementNo: true, firstName: true, lastName: true }
      });
      
      if (existingApplication) {
        throw new ConflictException(
          `An application already exists with Aadhar number ${applicationData.aadharNumber}. ` +
          `Application ID: ${existingApplication.id}, ` +
          `Acknowledgement No: ${existingApplication.acknowledgementNo}, ` +
          `Applicant: ${existingApplication.firstName} ${existingApplication.lastName}`
        );
      }
      
      // Validate reference IDs before starting transaction
      await this.validateReferencesExist(applicationData);
      
      // Get initial status for the application
      const initialStatusId = await this.getInitialStatus();
      
      return await prisma.$transaction(async (tx) => {
        // Generate acknowledgement number
        const timestamp = Date.now();
        const acknowledgementNo = `ALMS${timestamp}`;

        // Create present address
        const presentAddress = await tx.freshLicenseApplicationsFormAddresses.create({
          data: {
            addressLine: applicationData.presentAddress.addressLine,
            stateId: applicationData.presentAddress.stateId,
            districtId: applicationData.presentAddress.districtId,
            sinceResiding: new Date(applicationData.presentAddress.sinceResiding),
          }
        });
        // Create permanent address if provided
        let permanentAddress = null;
        if (applicationData.permanentAddress) {
          permanentAddress = await tx.freshLicenseApplicationsFormAddresses.create({
            data: {
              addressLine: applicationData.permanentAddress.addressLine,
              stateId: applicationData.permanentAddress.stateId,
              districtId: applicationData.permanentAddress.districtId,
              sinceResiding: new Date(applicationData.permanentAddress.sinceResiding),
            },
          });
        }

        // Create contact info first (without applicationId since it doesn't exist in DB)
        const contactInfo = await tx.freshLicenseApplicationsFormContactInfos.create({
          data: {
            telephoneOffice: applicationData.contactInfo.telephoneOffice, 
            telephoneResidence: applicationData.contactInfo.telephoneResidence,
            mobileNumber: applicationData.contactInfo.mobileNumber,
            officeMobileNumber: applicationData.contactInfo.officeMobileNumber,
            alternativeMobile: applicationData.contactInfo.alternativeMobile,
          },
        });
        
        // Create the main application with user and role information
        const application = await tx.freshLicenseApplicationsForms.create({
          data: {
            acknowledgementNo,
            firstName: applicationData.firstName,
            middleName: applicationData.middleName,
            lastName: applicationData.lastName,
            filledBy: applicationData.filledBy,
            parentOrSpouseName: applicationData.parentOrSpouseName,
            sex: applicationData.sex,
            placeOfBirth: applicationData.placeOfBirth,
            dateOfBirth: new Date(applicationData.dateOfBirth),
            panNumber: applicationData.panNumber,
            aadharNumber: applicationData.aadharNumber,
            dobInWords: applicationData.dobInWords,
            stateId: applicationData.stateId,
            districtId: applicationData.districtId,
            presentAddressId: presentAddress.id,
            permanentAddressId: permanentAddress?.id,
            contactInfoId: contactInfo.id,
            // Set user and role tracking fields - these should never be null/empty
            currentUserId: applicationData.currentUserId,
            currentRoleId: applicationData.currentRoleId,
            previousUserId: applicationData.previousUserId || null, // null for new applications
            previousRoleId: applicationData.previousRoleId || null, // null for new applications
            statusId: initialStatusId, // Set initial status
          },
        });

        // Create occupation info if provided
        let occupationInfo = null;
        if (applicationData.occupationInfo) {
          occupationInfo = await tx.freshLicenseApplicationsFormOccupationInfos.create({
            data: {
              occupation: applicationData.occupationInfo.occupation,
              officeAddress: applicationData.occupationInfo.officeAddress,
              stateId: applicationData.occupationInfo.stateId,
              districtId: applicationData.occupationInfo.districtId,
              cropLocation: applicationData.occupationInfo.cropLocation,
              areaUnderCultivation: applicationData.occupationInfo.areaUnderCultivation,
            },
          });
          
          // Update the application with occupationInfoId
          await tx.freshLicenseApplicationsForms.update({
            where: { id: application.id },
            data: { occupationInfoId: occupationInfo.id }
          });
        }

        // Create biometric data if provided
        let biometricData = null;
        if (applicationData.biometricData) {
          biometricData = await tx.freshLicenseApplicationsFormBiometricDatas.create({
            data: {
              applicationId: application.id,
              signatureImageUrl: applicationData.biometricData.signatureImageUrl,
              irisScanImageUrl: applicationData.biometricData.irisScanImageUrl,
              photoImageUrl: applicationData.biometricData.photoImageUrl,
            },
          });
          
          // Update the application with biometricDataId
          await tx.freshLicenseApplicationsForms.update({
            where: { id: application.id },
            data: { biometricDataId: biometricData.id }
          });
        }

        // Create criminal history if provided
        if (applicationData.criminalHistory && applicationData.criminalHistory.length > 0) {
          await Promise.all(
            applicationData.criminalHistory.map((criminal) =>
              tx.freshLicenseApplicationsFormCriminalHistories.create({
                data: {
                  applicationId: application.id,
                  convicted: criminal.convicted,
                  convictionData: criminal.convictionData,
                  bondExecutionOrdered: criminal.bondExecutionOrdered,
                  bondDate: criminal.bondDate ? new Date(criminal.bondDate) : null,
                  periodOfBond: criminal.periodOfBond,
                  prohibitedUnderArmsAct: criminal.prohibitedUnderArmsAct,
                  prohibitedDate: criminal.prohibitedDate ? new Date(criminal.prohibitedDate) : null,
                },
              })
            )
          );
        }

        // Create license history if provided
        if (applicationData.licenseHistory && applicationData.licenseHistory.length > 0) {
          await Promise.all(
            applicationData.licenseHistory.map((license) =>
              tx.freshLicenseApplicationsFormLicenseHistories.create({
                data: {
                  applicationId: application.id,
                  hasAppliedBefore: license.hasAppliedBefore,
                  previousApplications: license.previousApplications,
                  hasOtherApplications: license.hasOtherApplications,
                  otherApplications: license.otherApplications,
                  familyMemberHasArmsLicense: license.familyMemberHasArmsLicense,
                  familyMemberLicenses: license.familyMemberLicenses,
                  hasSafePlaceForArms: license.hasSafePlaceForArms,
                  safeStorageDetails: license.safeStorageDetails,
                  hasUndergoneTraining: license.hasUndergoneTraining,
                  trainingDetails: license.trainingDetails,
                },
              })
            )
          );
        }

        // Create license request details if provided
        if (applicationData.licenseRequestDetails) {
          const licenseRequestDetails = await tx.freshLicenseApplicationsFormLicenseRequestDetails.create({
            data: {
              applicationId: application.id,
              needForLicense: applicationData.licenseRequestDetails.needForLicense,
              weaponCategory: applicationData.licenseRequestDetails.weaponCategory,
              areaOfValidity: applicationData.licenseRequestDetails.areaOfValidity,
            },
          });

          // Connect requested weapons if provided
          if (applicationData.licenseRequestDetails.requestedWeaponIds && applicationData.licenseRequestDetails.requestedWeaponIds.length > 0) {
            await tx.freshLicenseApplicationsFormLicenseRequestDetails.update({
              where: { id: licenseRequestDetails.id },
              data: {
                requestedWeapons: {
                  connect: applicationData.licenseRequestDetails.requestedWeaponIds.map(id => ({ id: Number(id) }))
                }
              }
            });
          }
        }

        // Create file uploads if provided
        if (applicationData.fileUploads && applicationData.fileUploads.length > 0) {
          await Promise.all(
            applicationData.fileUploads.map((file) =>
              tx.freshLicenseApplicationsFormFileUploads.create({
                data: {
                  applicationId: application.id,
                  fileName: file.fileName,
                  fileSize: file.fileSize,
                  fileType: file.fileType,
                  fileUrl: file.fileUrl,
                },
              })
            )
          );
        }

        // Return the created application with relations
        return await tx.freshLicenseApplicationsForms.findUnique({
          where: { id: application.id },
          include: {
            presentAddress: {
              include: {
                state: true,
                district: true,
              }
            },
            permanentAddress: {
              include: {
                state: true,
                district: true,
              }
            },
            contactInfo: true,
            occupationInfo: {
              include: {
                state: true,
                district: true,
              }
            },
            biometricData: true,
            criminalHistory: true,
            licenseHistory: true,
            licenseDetails: {
              include: {
                requestedWeapons: true,
              }
            },
            fileUploads: true,
            state: true,
            district: true,
            status: true,
            currentRole: true,
            previousRole: true,
            currentUser: true,
            previousUser: true,
          },
        });
      });
    } catch (error) {
      // Handle Prisma-specific errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2002':
            // Unique constraint violation
            const target = error.meta?.target as string[];
            if (target?.includes('aadharNumber')) {
              throw new ConflictException(
                `An application with Aadhar number ${data.aadharNumber} already exists. ` +
                'Each Aadhar number can only be used once for application submission.'
              );
            }
            throw new ConflictException('A record with this information already exists.');
          
          case 'P2003':
            // Foreign key constraint violation
            throw new BadRequestException(
              'Invalid reference data provided. Please check the provided IDs for states, districts, users, or roles.'
            );
          
          case 'P2025':
            // Record not found
            throw new BadRequestException('Required reference data not found.');
          
          default:
            throw new InternalServerErrorException(
              `Database error occurred: ${error.message}`
            );
        }
      }
      
      // Handle validation errors from our custom validation
      if (error instanceof Error && (
        error.message.includes('is required') ||
        error.message.includes('Invalid') ||
        error.message.includes('does not exist') ||
        error.message.includes('User not found') ||
        error.message.includes('User role information')
      )) {
        throw new BadRequestException(error.message);
      }
      
      // Handle NestJS HTTP exceptions
      if (error instanceof ConflictException || 
          error instanceof BadRequestException || 
          error instanceof InternalServerErrorException) {
        throw error;
      }
      
      // Handle any other unexpected errors
      console.error('Unexpected error in createApplication:', error);
      throw new InternalServerErrorException('An unexpected error occurred while creating the application.');
    }
  }

  async getApplicationById(id: string | number) {
    return await prisma.freshLicenseApplicationsForms.findUnique({
      where: { id: typeof id === 'string' ? Number(id) : id },
      include: {
        presentAddress: {
          include: {
            state: true,
            district: true,
          }
        },
        permanentAddress: {
          include: {
            state: true,
            district: true,
          }
        },
        contactInfo: true,
        occupationInfo: {
          include: {
            state: true,
            district: true,
          }
        },
        biometricData: true,
        criminalHistory: true,
        licenseHistory: true,
        licenseDetails: {
          include: {
            requestedWeapons: true,
          }
        },
        fileUploads: true,
        state: true,
        district: true,
        status: true,
        currentRole: true,
        previousRole: true,
        currentUser: true,
        previousUser: true,
      },
    });
  }

  async getAllApplications() {
    return await prisma.freshLicenseApplicationsForms.findMany({
      include: {
        presentAddress: {
          include: {
            state: true,
            district: true,
          }
        },
        permanentAddress: {
          include: {
            state: true,
            district: true,
          }
        },
        contactInfo: true,
        occupationInfo: {
          include: {
            state: true,
            district: true,
          }
        },
        biometricData: true,
        criminalHistory: true,
        licenseHistory: true,
        licenseDetails: {
          include: {
            requestedWeapons: true,
          }
        },
        fileUploads: true,
        state: true,
        district: true,
        status: true,
        currentRole: true,
        previousRole: true,
        currentUser: true,
        previousUser: true,
      },
    });
  }

  async getUserApplications(userId: string) {
    // For now, we'll return all applications
    // In a proper implementation, you would need to add a userId field to FreshLicenseApplicationsForms
    // or establish a relationship between User and Application
    return await prisma.freshLicenseApplicationsForms.findMany({
      include: {
        presentAddress: {
          include: {
            state: true,
            district: true,
          }
        },
        permanentAddress: {
          include: {
            state: true,
            district: true,
          }
        },
        contactInfo: true,
        occupationInfo: {
          include: {
            state: true,
            district: true,
          }
        },
        biometricData: true,
        criminalHistory: true,
        licenseHistory: true,
        licenseDetails: {
          include: {
            requestedWeapons: true,
          }
        },
        fileUploads: true,
        state: true,
        district: true,
        status: true,
        currentRole: true,
        previousRole: true,
        currentUser: true,
        previousUser: true,
      },
    });
  }

  public async getFilteredApplications(filter: { statusId?: number; currentUserId?: string }) {
    const where: any = {};
    if (filter.statusId !== undefined) {
      where.statusId = filter.statusId;
    }
    if (filter.currentUserId !== undefined) {
      where.currentUserId = filter.currentUserId;
    }
    return await prisma.freshLicenseApplicationsForms.findMany({
      where,
      include: {
        presentAddress: {
          include: {
            state: true,
            district: true,
          }
        },
        permanentAddress: {
          include: {
            state: true,
            district: true,
          }
        },
        contactInfo: true,
        occupationInfo: {
          include: {
            state: true,
            district: true,
          }
        },
        biometricData: true,
        criminalHistory: true,
        licenseHistory: true,
        licenseDetails: {
          include: {
            requestedWeapons: true,
          }
        },
        fileUploads: true,
        state: true,
        district: true,
        status: true,
        currentRole: true,
        previousRole: true,
        currentUser: true,
        previousUser: true,
      },
    });
  }

  /**
   * Updates application user and role information during workflow transitions.
   * 
   * This method:
   * 1. Moves current user/role to previous user/role
   * 2. Sets new user/role as current
   * 3. Ensures proper tracking throughout the workflow
   * 4. Updates status and remarks if provided
   * 
   * @param applicationId - ID of the application to update
   * @param newUserId - ID of the new user taking ownership
   * @param statusId - Optional new status ID
   * @param remarks - Optional remarks for the transition
   * @returns Updated application with user/role information
   */
  // Method to update application user and role during workflow transitions
  async updateApplicationUserAndRole(
    applicationId: number, 
    newUserId: number, 
    statusId?: number,
    remarks?: string
  ) {
    try {
      // Get the current application to preserve the current user/role as previous
      const currentApplication = await prisma.freshLicenseApplicationsForms.findUnique({
        where: { id: applicationId },
        select: {
          id: true,
          currentUserId: true,
          currentRoleId: true,
          acknowledgementNo: true,
        }
      });

      if (!currentApplication) {
        throw new BadRequestException(`Application with ID ${applicationId} not found.`);
      }

      // Get the new user with role information
      const newUser = await this.getUserWithRole(newUserId);
      if (!newUser) {
        throw new BadRequestException('Invalid new user. User not found in the system.');
      }

      if (!newUser.role) {
        throw new BadRequestException('New user role information is missing.');
      }

      // Update the application with new user/role and move current to previous
      const updatedApplication = await prisma.freshLicenseApplicationsForms.update({
        where: { id: applicationId },
        data: {
          // Move current to previous
          previousUserId: currentApplication.currentUserId,
          previousRoleId: currentApplication.currentRoleId,
          // Set new current
          currentUserId: newUser.id,
          currentRoleId: newUser.roleId,
          // Update status if provided
          ...(statusId && { statusId }),
          // Update remarks if provided
          ...(remarks && { remarks }),
          updatedAt: new Date(),
        },
        include: {
          currentRole: true,
          previousRole: true,
          currentUser: true,
          previousUser: true,
          status: true,
        }
      });

      return updatedApplication;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      console.error('Error updating application user and role:', error);
      throw new InternalServerErrorException('Failed to update application user and role information.');
    }
  }
}
