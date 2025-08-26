import { Injectable, ConflictException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import prisma from '../../db/prismaClient';
import { Sex, FileType, LicensePurpose, WeaponCategory } from '@prisma/client';

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

    if (!data.currentUserId) {
      throw new BadRequestException('Current user information is required. Please ensure you are properly authenticated.');
    }

    const currentUser = await this.getUserWithRole(data.currentUserId);
    if (!currentUser) throw new BadRequestException('Invalid user. User not found in the system.');
    if (!currentUser.role) throw new BadRequestException('User role information is missing. Please contact administrator.');

    // Check duplicate aadhar
    const existing = await prisma.freshLicenseApplicationsForms.findUnique({
      where: { aadharNumber: data.aadharNumber },
      select: { id: true }
    });
    if (existing) {
      throw new ConflictException(`An application with Aadhar number ${data.aadharNumber} already exists.`);
    }

    await this.validateReferencesExist(data);

    const initialStatusId = await this.getInitialStatus();
    const acknowledgementNo = `ALMS${Date.now()}`;

    return await prisma.$transaction(async (tx:any) => {
      const application = await tx.freshLicenseApplicationsForms.create({
        data: {
          acknowledgementNo,
          firstName: data.firstName,
          middleName: data.middleName,
          lastName: data.lastName,
          filledBy: data.filledBy,
          parentOrSpouseName: data.parentOrSpouseName,
          sex: data.sex,
          placeOfBirth: data.placeOfBirth,
          dateOfBirth: new Date(data.dateOfBirth),
          panNumber: data.panNumber,
          aadharNumber: data.aadharNumber,
          dobInWords: data.dobInWords,
          stateId: data.stateId,
          districtId: data.districtId,
          currentUserId: currentUser.id,
          currentRoleId: currentUser.roleId,
          previousUserId: data.previousUserId ?? null,
          previousRoleId: data.previousRoleId ?? null,
          statusId: initialStatusId,

          // ✅ nested relations
          presentAddress: { create: {
            addressLine: data.presentAddress.addressLine,
            stateId: data.presentAddress.stateId,
            districtId: data.presentAddress.districtId,
            sinceResiding: new Date(data.presentAddress.sinceResiding),
          }},
          permanentAddress: data.permanentAddress ? { create: {
            addressLine: data.permanentAddress.addressLine,
            stateId: data.permanentAddress.stateId,
            districtId: data.permanentAddress.districtId,
            sinceResiding: new Date(data.permanentAddress.sinceResiding),
          }} : undefined,
          contactInfo: { create: {
            telephoneOffice: data.contactInfo.telephoneOffice,
            telephoneResidence: data.contactInfo.telephoneResidence,
            mobileNumber: data.contactInfo.mobileNumber,
            officeMobileNumber: data.contactInfo.officeMobileNumber,
            alternativeMobile: data.contactInfo.alternativeMobile,
          }},
          occupationInfo: data.occupationInfo ? { create: {
            occupation: data.occupationInfo.occupation,
            officeAddress: data.occupationInfo.officeAddress,
            stateId: data.occupationInfo.stateId,
            districtId: data.occupationInfo.districtId,
            cropLocation: data.occupationInfo.cropLocation,
            areaUnderCultivation: data.occupationInfo.areaUnderCultivation,
          }} : undefined,
          biometricData: data.biometricData ? { create: {
            signatureImageUrl: data.biometricData.signatureImageUrl,
            irisScanImageUrl: data.biometricData.irisScanImageUrl,
            photoImageUrl: data.biometricData.photoImageUrl,
          }} : undefined,
          criminalHistory: data.criminalHistory?.length ? {
            create: data.criminalHistory.map(c => ({
              convicted: c.convicted,
              convictionData: c.convictionData,
              bondExecutionOrdered: c.bondExecutionOrdered,
              bondDate: c.bondDate ? new Date(c.bondDate) : null,
              periodOfBond: c.periodOfBond,
              prohibitedUnderArmsAct: c.prohibitedUnderArmsAct,
              prohibitedDate: c.prohibitedDate ? new Date(c.prohibitedDate) : null,
            }))
          } : undefined,
          licenseHistory: data.licenseHistory?.length ? {
            create: data.licenseHistory.map(l => ({
              hasAppliedBefore: l.hasAppliedBefore,
              previousApplications: l.previousApplications,
              hasOtherApplications: l.hasOtherApplications,
              otherApplications: l.otherApplications,
              familyMemberHasArmsLicense: l.familyMemberHasArmsLicense,
              familyMemberLicenses: l.familyMemberLicenses,
              hasSafePlaceForArms: l.hasSafePlaceForArms,
              safeStorageDetails: l.safeStorageDetails,
              hasUndergoneTraining: l.hasUndergoneTraining,
              trainingDetails: l.trainingDetails,
            }))
          } : undefined,
          licenseDetails: data.licenseRequestDetails ? { create: {
            needForLicense: data.licenseRequestDetails.needForLicense,
            weaponCategory: data.licenseRequestDetails.weaponCategory,
            areaOfValidity: data.licenseRequestDetails.areaOfValidity,
            requestedWeapons: data.licenseRequestDetails.requestedWeaponIds?.length
              ? { connect: data.licenseRequestDetails.requestedWeaponIds.map(id => ({ id: Number(id) })) }
              : undefined,
          }} : undefined,
          fileUploads: data.fileUploads?.length ? {
            create: data.fileUploads.map(f => ({
              fileName: f.fileName,
              fileSize: f.fileSize,
              fileType: f.fileType,
              fileUrl: f.fileUrl,
            }))
          } : undefined,
        },
        include: {
          presentAddress: { include: { state: true, district: true } },
          permanentAddress: { include: { state: true, district: true } },
          contactInfo: true,
          occupationInfo: { include: { state: true, district: true } },
          biometricData: true,
          criminalHistory: true,
          licenseHistory: true,
          licenseDetails: { include: { requestedWeapons: true } },
          fileUploads: true,
          state: true,
          district: true,
          status: true,
          currentRole: true,
          previousRole: true,
          currentUser: true,
          previousUser: true,
        }
      });

      return application;
    });
  } catch (error) {
    // your error handling block (P2002, etc.) can stay same
   
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

 public async getFilteredApplications(filter: { 
  statusIds?: number[];
  currentUserId?: string; 
  page?: number; 
  limit?: number; 
  searchField?: string; 
  search?: string; 
  orderBy?: string; 
  order?: 'asc' | 'desc'; 
}) {
  const where: any = {};

  if (filter.statusIds && Array.isArray(filter.statusIds) && filter.statusIds.length > 0) {
    where.statusId = { in: filter.statusIds };
  }

  if (filter.currentUserId !== undefined) {
    where.currentUserId = filter.currentUserId;
  }

  const page = filter.page ?? 1;
  const limit = filter.limit ?? 10;
  const skip = (page - 1) * limit;

  // Search filter
  if (filter.searchField && filter.search) {
    if (['id', 'firstName', 'lastName', 'acknowledgementNo'].includes(filter.searchField)) {
      if (filter.searchField === 'id') {
        const idVal = Number(filter.search);
        if (!isNaN(idVal)) where.id = idVal;
      } else {
        where[filter.searchField] = { contains: filter.search, mode: 'insensitive' };
      }
    }
  }

  const orderByObj: any = {};
  if (filter.orderBy) {
    orderByObj[filter.orderBy] = filter.order ?? 'desc';
  } else {
    orderByObj.createdAt = 'desc';
  }

  const [total, data] = await Promise.all([
    prisma.freshLicenseApplicationsForms.count({ where }),
    prisma.freshLicenseApplicationsForms.findMany({
      where,
      skip,
      take: limit,
      orderBy: orderByObj,
      include: {
        presentAddress: { include: { state: true, district: true } },
        permanentAddress: { include: { state: true, district: true } },
        contactInfo: true,
        occupationInfo: { include: { state: true, district: true } },
        biometricData: true,
        criminalHistory: true,
        licenseHistory: true,
        licenseDetails: { include: { requestedWeapons: true } },
        fileUploads: true,
        state: true,
        district: true,
        status: true,
        currentRole: true,
        previousRole: true,
        currentUser: true,
        previousUser: true,
      },
    }),
  ]);

  return { total, data };
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

  // public async getFilteredApplications(filter: { statusId?: number; statusIds?: number[]; currentUserId?: string; page?: number; limit?: number; searchField?: string; search?: string; orderBy?: string; order?: 'asc' | 'desc' }) {
  //   const where: any = {};
  //   if (filter.statusIds !== undefined && Array.isArray(filter.statusIds)) {
  //     where.statusId = { in: filter.statusIds };
  //   } else if (filter.statusId !== undefined) {
  //     where.statusId = filter.statusId;
  //   }
  //   if (filter.currentUserId !== undefined) {
  //     where.currentUserId = filter.currentUserId;
  //   }

  //   const page = filter.page ?? 1;
  //   const limit = filter.limit ?? 10;
  //   const skip = (page - 1) * limit;

  //   // Apply search filter if provided
  //   if (filter.searchField && filter.search) {
  //     // Only allow specific fields handled at controller level
  //     if (['id', 'firstName', 'lastName', 'acknowledgementNo'].includes(filter.searchField)) {
  //       if (filter.searchField === 'id') {
  //         const idVal = Number(filter.search);
  //         if (!isNaN(idVal)) where.id = idVal;
  //       } else {
  //         where[filter.searchField] = { contains: filter.search, mode: 'insensitive' } as any;
  //       }
  //     }
  //   }

  //   const orderByObj: any = {};
  //   if (filter.orderBy) {
  //     orderByObj[filter.orderBy] = filter.order ?? 'desc';
  //   } else {
  //     orderByObj.createdAt = 'desc';
  //   }

  //   const [total, data] = await Promise.all([
  //     prisma.freshLicenseApplicationsForms.count({ where }),
  //     prisma.freshLicenseApplicationsForms.findMany({
  //       where,
  //       skip,
  //       take: limit,
  //       orderBy: orderByObj,
  //       include: {
  //       presentAddress: {
  //         include: {
  //           state: true,
  //           district: true,
  //         }
  //       },
  //       permanentAddress: {
  //         include: {
  //           state: true,
  //           district: true,
  //         }
  //       },
  //       contactInfo: true,
  //       occupationInfo: {
  //         include: {
  //           state: true,
  //           district: true,
  //         }
  //       },
  //       biometricData: true,
  //       criminalHistory: true,
  //       licenseHistory: true,
  //       licenseDetails: {
  //         include: {
  //           requestedWeapons: true,
  //         }
  //       },
  //       fileUploads: true,
  //       state: true,
  //       district: true,
  //       status: true,
  //       currentRole: true,
  //       previousRole: true,
  //       currentUser: true,
  //       previousUser: true,
  //       },
  //     }),
  //   ]);

  //   return { total, data };
  // }

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
