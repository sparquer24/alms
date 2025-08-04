import { Injectable, ConflictException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import prisma from '../../db/prismaClient';
import { Sex, FileType, LicensePurpose, WeaponCategory } from '@prisma/client';
import { Prisma } from '@prisma/client';

export interface CreateAddressInput {
  addressLine: string;
  stateId: number;
  districtId: number;
  sinceResiding: Date;
  jurisdictionStationId: number;
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
  if (typeof data.presentAddress.jurisdictionStationId !== 'number') missingAddressFields.push('jurisdictionStationId');
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

  async validateReferenceIds(ids: { stateId?: number; districtId?: number; jurisdictionStationId?: number }) {
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
    
    if (ids.jurisdictionStationId) {
      const policeStation = await prisma.policeStations.findUnique({
        where: { id: ids.jurisdictionStationId },
        select: { id: true, name: true, divisionId: true }
      });
      validation.policeStation = {
        id: ids.jurisdictionStationId,
        exists: !!policeStation,
        data: policeStation
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
    
    const jurisdictionStation = await prisma.policeStations.findUnique({ where: { id: data.presentAddress.jurisdictionStationId } });
    if (!jurisdictionStation) {
      throw new Error(`Jurisdiction station with ID ${data.presentAddress.jurisdictionStationId} does not exist`);
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
      
      const permanentJurisdictionStation = await prisma.policeStations.findUnique({ where: { id: data.permanentAddress.jurisdictionStationId } });
      if (!permanentJurisdictionStation) {
        throw new Error(`Permanent address jurisdiction station with ID ${data.permanentAddress.jurisdictionStationId} does not exist`);
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

  async createApplication(data: CreateFreshLicenseApplicationsFormsInput) {
    try {
      validateCreateApplicationInput(data);
      
      // Check if aadhar number already exists
      const existingApplication = await prisma.freshLicenseApplicationsForms.findUnique({
        where: { aadharNumber: data.aadharNumber },
        select: { id: true, acknowledgementNo: true, firstName: true, lastName: true }
      });
      
      if (existingApplication) {
        throw new ConflictException(
          `An application already exists with Aadhar number ${data.aadharNumber}. ` +
          `Application ID: ${existingApplication.id}, ` +
          `Acknowledgement No: ${existingApplication.acknowledgementNo}, ` +
          `Applicant: ${existingApplication.firstName} ${existingApplication.lastName}`
        );
      }
      
      // Validate reference IDs before starting transaction
      await this.validateReferencesExist(data);
      
      return await prisma.$transaction(async (tx) => {
        // Generate acknowledgement number
        const timestamp = Date.now();
        const acknowledgementNo = `ALMS${timestamp}`;

        // Create present address
        const presentAddress = await tx.freshLicenseApplicationsFormAddresses.create({
          data: {
            addressLine: data.presentAddress.addressLine,
            stateId: data.presentAddress.stateId,
            districtId: data.presentAddress.districtId,
            sinceResiding: new Date(data.presentAddress.sinceResiding),
            jurisdictionStationId: data.presentAddress.jurisdictionStationId
          }
        });
        // Create permanent address if provided
        let permanentAddress = null;
        if (data.permanentAddress) {
          permanentAddress = await tx.freshLicenseApplicationsFormAddresses.create({
            data: {
              addressLine: data.permanentAddress.addressLine,
              stateId: data.permanentAddress.stateId,
              districtId: data.permanentAddress.districtId,
              sinceResiding: new Date(data.permanentAddress.sinceResiding),
              jurisdictionStationId: data.permanentAddress.jurisdictionStationId
            },
          });
        }

        // Create contact info first (without applicationId since it doesn't exist in DB)
        const contactInfo = await tx.freshLicenseApplicationsFormContactInfos.create({
          data: {
            telephoneOffice: data.contactInfo.telephoneOffice, 
            telephoneResidence: data.contactInfo.telephoneResidence,
            mobileNumber: data.contactInfo.mobileNumber,
            officeMobileNumber: data.contactInfo.officeMobileNumber,
            alternativeMobile: data.contactInfo.alternativeMobile,
          },
        });

        // Create the main application
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
            presentAddressId: presentAddress.id,
            permanentAddressId: permanentAddress?.id,
            contactInfoId: contactInfo.id,
          },
        });

        // Create occupation info if provided
        let occupationInfo = null;
        if (data.occupationInfo) {
          occupationInfo = await tx.freshLicenseApplicationsFormOccupationInfos.create({
            data: {
              occupation: data.occupationInfo.occupation,
              officeAddress: data.occupationInfo.officeAddress,
              stateId: data.occupationInfo.stateId,
              districtId: data.occupationInfo.districtId,
              cropLocation: data.occupationInfo.cropLocation,
              areaUnderCultivation: data.occupationInfo.areaUnderCultivation,
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
        if (data.biometricData) {
          biometricData = await tx.freshLicenseApplicationsFormBiometricDatas.create({
            data: {
              applicationId: application.id,
              signatureImageUrl: data.biometricData.signatureImageUrl,
              irisScanImageUrl: data.biometricData.irisScanImageUrl,
              photoImageUrl: data.biometricData.photoImageUrl,
            },
          });
          
          // Update the application with biometricDataId
          await tx.freshLicenseApplicationsForms.update({
            where: { id: application.id },
            data: { biometricDataId: biometricData.id }
          });
        }

        // Create criminal history if provided
        if (data.criminalHistory && data.criminalHistory.length > 0) {
          await Promise.all(
            data.criminalHistory.map((criminal) =>
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
        if (data.licenseHistory && data.licenseHistory.length > 0) {
          await Promise.all(
            data.licenseHistory.map((license) =>
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
        if (data.licenseRequestDetails) {
          const licenseRequestDetails = await tx.freshLicenseApplicationsFormLicenseRequestDetails.create({
            data: {
              applicationId: application.id,
              needForLicense: data.licenseRequestDetails.needForLicense,
              weaponCategory: data.licenseRequestDetails.weaponCategory,
              areaOfValidity: data.licenseRequestDetails.areaOfValidity,
            },
          });

          // Connect requested weapons if provided
          if (data.licenseRequestDetails.requestedWeaponIds && data.licenseRequestDetails.requestedWeaponIds.length > 0) {
            await tx.freshLicenseApplicationsFormLicenseRequestDetails.update({
              where: { id: licenseRequestDetails.id },
              data: {
                requestedWeapons: {
                  connect: data.licenseRequestDetails.requestedWeaponIds.map(id => ({ id }))
                }
              }
            });
          }
        }

        // Create file uploads if provided
        if (data.fileUploads && data.fileUploads.length > 0) {
          await Promise.all(
            data.fileUploads.map((file) =>
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
                jurisdictionStation: true,
              }
            },
            permanentAddress: {
              include: {
                state: true,
                district: true,
                jurisdictionStation: true,
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
              'Invalid reference data provided. Please check the provided IDs for states, districts, or police stations.'
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
        error.message.includes('does not exist')
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

  async getApplicationById(id: string) {
    return await prisma.freshLicenseApplicationsForms.findUnique({
      where: { id },
      include: {
        presentAddress: {
          include: {
            state: true,
            district: true,
            jurisdictionStation: true,
          }
        },
        permanentAddress: {
          include: {
            state: true,
            district: true,
            jurisdictionStation: true,
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
            jurisdictionStation: true,
          }
        },
        permanentAddress: {
          include: {
            state: true,
            district: true,
            jurisdictionStation: true,
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
            jurisdictionStation: true,
          }
        },
        permanentAddress: {
          include: {
            state: true,
            district: true,
            jurisdictionStation: true,
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
            jurisdictionStation: true,
          }
        },
        permanentAddress: {
          include: {
            state: true,
            district: true,
            jurisdictionStation: true,
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
}
