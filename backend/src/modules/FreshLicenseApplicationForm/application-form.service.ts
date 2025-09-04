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

let include = {
    status: {
      select: {
        id: true,
        name: true,
        code: true
      }
    },
    currentRole: {
      select: {
        id: true,
        name: true,
        code: true
      }
    },
    previousRole: {
      select: {
        id: true,
        name: true,
        code: true
      },
    },
    currentUser: {
      select: {
        id: true,
        username: true,
        email: true
      }
    },
    previousUser: {
      select: {
        id: true,
        username: true,
        email: true
      }
    },
  }

function validateCreateApplicationInput(data: any): asserts data is Required<CreateFreshLicenseApplicationsFormsInput> {
  const requiredFields = [
    'firstName', 'lastName', 'parentOrSpouseName', 'sex', 'placeOfBirth', 
    'dateOfBirth', 'aadharNumber', 'stateId', 'districtId'
  ];
  
  for (const field of requiredFields) {
    if (!data[field]) {
      throw new Error(`${field} is required.`);
    }
  }

  // Validate nested presentAddress
  const missingAddressFields = [];
  if (!data.presentAddress.stateId) missingAddressFields.push('stateId');
  if (!data.presentAddress.districtId) missingAddressFields.push('districtId');
  if (!data.presentAddress.sinceResiding) missingAddressFields.push('sinceResiding');
  if (missingAddressFields.length > 0) {
    throw new Error(`Present address fields are incomplete. Missing: ${missingAddressFields.join(', ')}`);
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

  /**
   * Resolve a mixed list of status identifiers (numeric IDs or status codes/names)
   * to an array of numeric status IDs present in the statuses table.
   * Accepts case-insensitive codes/names. Invalid entries are ignored.
   */
  async resolveStatusIdentifiers(identifiers: string[]): Promise<number[]> {
    if (!identifiers || identifiers.length === 0) return [];
    // Separate numeric IDs and textual codes/names
    const numericIds = identifiers
      .map(id => Number(id))
      .filter(n => !isNaN(n));
    const textIdentifiers = identifiers
      .filter(id => isNaN(Number(id)))
      .map(s => s.toUpperCase());

    const statuses = await prisma.statuses.findMany({
      where: {
        OR: [
          ...(numericIds.length ? [{ id: { in: numericIds } }] : []),
          ...(textIdentifiers.length ? [
            { code: { in: textIdentifiers } },
            { name: { in: textIdentifiers } }
          ] : [])
        ]
      },
      select: { id: true, code: true, name: true }
    });

    const resolved = Array.from(new Set(statuses.map(s => s.id)));
    return resolved;
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
  // top-level state/district
  const state = await prisma.states.findUnique({ where: { id: data.stateId } });
  if (!state) throw new Error(`State with ID ${data.stateId} does not exist`);

  const district = await prisma.districts.findUnique({ where: { id: data.districtId } });
  if (!district) throw new Error(`District with ID ${data.districtId} does not exist`);

  // present address state/district
  const presentState = await prisma.states.findUnique({ where: { id: data.presentAddress.stateId } });
  if (!presentState) throw new Error(`Present address state with ID ${data.presentAddress.stateId} does not exist`);
  const presentDistrict = await prisma.districts.findUnique({ where: { id: data.presentAddress.districtId } });
  if (!presentDistrict) throw new Error(`Present address district with ID ${data.presentAddress.districtId} does not exist`);

  // permanent address
  if (data.permanentAddress) {
    const permState = await prisma.states.findUnique({ where: { id: data.permanentAddress.stateId } });
    if (!permState) throw new Error(`Permanent address state with ID ${data.permanentAddress.stateId} does not exist`);
    const permDistrict = await prisma.districts.findUnique({ where: { id: data.permanentAddress.districtId } });
    if (!permDistrict) throw new Error(`Permanent address district with ID ${data.permanentAddress.districtId} does not exist`);
  }

  // occupation info
  if (data.occupationInfo) {
    const occState = await prisma.states.findUnique({ where: { id: data.occupationInfo.stateId } });
    if (!occState) throw new Error(`Occupation state with ID ${data.occupationInfo.stateId} does not exist`);
    const occDistrict = await prisma.districts.findUnique({ where: { id: data.occupationInfo.districtId } });
    if (!occDistrict) throw new Error(`Occupation district with ID ${data.occupationInfo.districtId} does not exist`);
  }

  // licenseRequestDetails.requestedWeaponIds
  if (data.licenseRequestDetails?.requestedWeaponIds?.length) {
    // convert strings -> numbers
    const weaponIds = data.licenseRequestDetails.requestedWeaponIds.map((id: any) => Number(id));
    const found = await prisma.weaponTypeMaster.findMany({ where: { id: { in: weaponIds } }, select: { id: true } });
    const foundIds = found.map(w => w.id);
    const missing = weaponIds.filter((id: number) => !foundIds.includes(id));
    if (missing.length) throw new Error(`Requested weapons not found: ${missing.join(', ')}`);
  }

  // currentUser.roleId: ensure role exists if currentUser has a role
  if (data.currentUserId) {
    const user = await prisma.users.findUnique({ where: { id: data.currentUserId }, select: { id: true, roleId: true } });
    if (!user) throw new Error(`User with ID ${data.currentUserId} not found`);
    if (!user.roleId) throw new Error(`Current user (id:${data.currentUserId}) does not have a roleId set`);
    const role = await prisma.roles.findUnique({ where: { id: user.roleId } });
    if (!role) throw new Error(`Role with ID ${user.roleId} (user's roleId) does not exist`);
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
    // Validate input
    validateCreateApplicationInput(data);

    // Ensure user context
    if (!data.currentUserId) {
      throw new BadRequestException("Current user information is required. Please ensure you are properly authenticated.");
    }

    // Fetch user and role
    const currentUser = await this.getUserWithRole(data.currentUserId);
    if (!currentUser) throw new BadRequestException("Invalid user. User not found in the system.");
    if (!currentUser.role) throw new BadRequestException("User role information is missing. Please contact administrator.");

    // Check for duplicate Aadhar
    const existing = await prisma.freshLicenseApplicationsForms.findUnique({
      where: { aadharNumber: data.aadharNumber },
      select: { id: true },
    });
    if (existing) throw new ConflictException(`An application with Aadhar ${data.aadharNumber} already exists.`);

    // Validate referenced records
    await this.validateReferencesExist(data);

    // Get initial status and generate acknowledgement number
    const initialStatusId = await this.getInitialStatus();
    const acknowledgementNo = `ALMS${Date.now()}`;

    // Create application in a transaction
    const application = await prisma.$transaction(async (tx) => {
      const created = await tx.freshLicenseApplicationsForms.create({
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
          state: { connect: { id: data.stateId } },
          district: { connect: { id: data.districtId } },
          ...(initialStatusId ? { status: { connect: { id: initialStatusId } } } : {}),
          currentUser: { connect: { id: currentUser.id } },
          ...(currentUser.roleId ? { currentRole: { connect: { id: currentUser.roleId } } } : {}),
          ...(data.previousUserId ? { previousUser: { connect: { id: data.previousUserId } } } : {}),
          ...(data.previousRoleId ? { previousRole: { connect: { id: data.previousRoleId } } } : {}),
          presentAddress: {
            create: {
              addressLine: data.presentAddress.addressLine,
              sinceResiding: data.presentAddress.sinceResiding ? new Date(data.presentAddress.sinceResiding) : new Date(),
              state: { connect: { id: data.presentAddress.stateId } },
              district: { connect: { id: data.presentAddress.districtId } },
            },
          },
          ...(data.permanentAddress ? {
            permanentAddress: {
              create: {
                addressLine: data.permanentAddress.addressLine,
                sinceResiding: data.permanentAddress.sinceResiding ? new Date(data.permanentAddress.sinceResiding) : new Date(),
                state: { connect: { id: data.permanentAddress.stateId } },
                district: { connect: { id: data.permanentAddress.districtId } },
              },
            },
          } : {}),
          contactInfo: {
            create: {
              telephoneOffice: data.contactInfo.telephoneOffice,
              telephoneResidence: data.contactInfo.telephoneResidence,
              mobileNumber: data.contactInfo.mobileNumber,
              officeMobileNumber: data.contactInfo.officeMobileNumber,
              alternativeMobile: data.contactInfo.alternativeMobile,
            },
          },
          ...(data.occupationInfo ? {
            occupationInfo: {
              create: {
                occupation: data.occupationInfo.occupation,
                officeAddress: data.occupationInfo.officeAddress,
                cropLocation: data.occupationInfo.cropLocation,
                areaUnderCultivation: data.occupationInfo.areaUnderCultivation,
                state: { connect: { id: data.occupationInfo.stateId } },
                district: { connect: { id: data.occupationInfo.districtId } },
              }
            }
          } : {}),
          // biometricData will be created separately after application is created
          ...(data.criminalHistory?.length ? {
            criminalHistory: { create: data.criminalHistory.map(c => ({
              convicted: c.convicted,
              convictionData: c.convictionData,
              bondExecutionOrdered: c.bondExecutionOrdered,
              bondDate: c.bondDate ? new Date(c.bondDate) : null,
              periodOfBond: c.periodOfBond,
              prohibitedUnderArmsAct: c.prohibitedUnderArmsAct,
              prohibitedDate: c.prohibitedDate ? new Date(c.prohibitedDate) : null,
            })) }
          } : {}),
          ...(data.licenseHistory?.length ? {
            licenseHistory: { create: data.licenseHistory.map(l => ({ ...l })) }
          } : {}),
          ...(data.licenseRequestDetails ? {
            licenseDetails: {
              create: [
                {
                  needForLicense: data.licenseRequestDetails.needForLicense,
                  weaponCategory: data.licenseRequestDetails.weaponCategory,
                  areaOfValidity: data.licenseRequestDetails.areaOfValidity,
                  ...(data.licenseRequestDetails.requestedWeaponIds?.length ? {
                    requestedWeapons: { connect: data.licenseRequestDetails.requestedWeaponIds.map((id: any) => ({ id: Number(id) })) }
                  } : {}),
                }
              ]
            }
          } : {}),
          ...(data.fileUploads?.length ? { fileUploads: { create: data.fileUploads.map(f => ({ fileName: f.fileName, fileSize: f.fileSize, fileType: f.fileType, fileUrl: f.fileUrl })) } } : {}),
        },
        include: {
          presentAddress: { include: { state: true, district: true } },
          permanentAddress: { include: { state: true, district: true } },
          contactInfo: true,
          occupationInfo: { include: { state: true, district: true } },
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
      });
      // After main application is created, create biometricData if provided
      if (data.biometricData) {
        await tx.freshLicenseApplicationsFormBiometricDatas.create({
          data: {
            ...data.biometricData,
            applicationId: created.id,
          },
        });
      }
      return created;
    });

    // Return [error, data] format
    return [null, application];
  } catch (error: any) {
    // Return [error, data] format
    return [error, null];
  }
}


async getApplicationById(id: number | undefined, acknowledgementNo: string | undefined): Promise<[any, any]> {
  try {
    console.log({ id, acknowledgementNo });
    let whereCondition: any = {};
    if (id){
      whereCondition = { id };
    }
    if (acknowledgementNo) {
      whereCondition = { ...whereCondition, acknowledgementNo };
    }
    return [null, await prisma.freshLicenseApplicationsForms.findUnique({
      where: whereCondition,
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
    })];
  } catch (err) {
    return [err, null];
  }
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
  try {
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
        include,
      }),
    ]);

    let filteredData  = data.map(item => ({
      id: item.id,
      acknowledgementNo: item.acknowledgementNo,
      applicantFullName: [item.firstName, item.middleName, item.lastName].filter(Boolean).join(" "),
      currentRole: item.currentRole,
      previousRole: item.previousRole,
      currentUser: item.currentUser,
      previousUser: item.previousUser,
      isApprovied: item.isApprovied,
      isFLAFGenerated: item.isFLAFGenerated,
      isGroundReportGenerated: item.isGroundReportGenerated,
      isPending: item.isPending,
      isReEnquiry: item.isReEnquiry,
      isReEnquiryDone: item.isReEnquiryDone,
      isRejected: item.isRejected,
      remarks: item.remarks,
      status: item.status
    }));

    return [null, { total, data: filteredData }];
  }catch (error) {
    return [error, null];
  }
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
