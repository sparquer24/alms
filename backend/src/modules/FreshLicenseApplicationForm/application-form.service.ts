import { Injectable } from '@nestjs/common';
import prisma from '../../db/prismaClient';
import { Sex, ArmsCategory, AreaOfUse, FileType } from '@prisma/client';

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
  cropProtectionRequired?: boolean;
  cropLocation?: string;
  areaUnderCultivation?: number;
}

export interface CreateCriminalHistoryInput {
  convicted: boolean;
  firNumber?: string;
  underSection?: string;
  policeStation?: string;
  unit?: string;
  district?: string;
  state?: string;
  offence?: string;
  sentence?: string;
  dateOfSentence?: Date;
}

export interface CreateLicenseHistoryInput {
  previouslyApplied: boolean;
  dateApplied?: Date;
  licenseName?: string;
  authority?: string;
  result?: string;
  status?: string;
  rejectionDocumentUrl?: string;
  licenseSuspended?: boolean;
  licenseDetails?: string;
}

export interface CreateFileUploadInput {
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
  needForLicense: string;
  descriptionOfArms: string;
  armsCategory: ArmsCategory;
  areasOfUse: AreaOfUse;
  specialConsideration?: string;
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
  fileUploads?: CreateFileUploadInput[];
}

function validateCreateApplicationInput(data: any): asserts data is Required<CreateFreshLicenseApplicationsFormsInput> {
  const requiredFields = [
    'firstName', 'lastName', 'parentOrSpouseName', 'sex', 'placeOfBirth', 
    'dateOfBirth', 'aadharNumber', 'needForLicense', 'descriptionOfArms', 
    'armsCategory', 'areasOfUse', 'stateId', 'districtId', 'presentAddress', 'contactInfo'
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
  if (!Object.values(ArmsCategory).includes(data.armsCategory)) {
    throw new Error('Invalid arms category.');
  }
  if (!Object.values(AreaOfUse).includes(data.areasOfUse)) {
    throw new Error('Invalid area of use.');
  }

  // Validate aadhar uniqueness will be handled by database constraint
  if (typeof data.aadharNumber !== 'string' || data.aadharNumber.length !== 12) {
    throw new Error('Aadhar number must be a 12-digit string.');
  }
}

@Injectable()
export class ApplicationFormService {
  async createApplication(data: CreateFreshLicenseApplicationsFormsInput) {
    validateCreateApplicationInput(data);
    
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
      })
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

      // Create contact info
      const contactInfo = await tx.freshLicenseApplicationsFormContactInfos.create({
        data: {
          telephoneOffice: data.contactInfo.telephoneOffice, 
          telephoneResidence: data.contactInfo.telephoneResidence,
          mobileNumber: data.contactInfo.mobileNumber,
          officeMobileNumber: data.contactInfo.officeMobileNumber,
          alternativeMobile: data.contactInfo.alternativeMobile,
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
            cropProtectionRequired: data.occupationInfo.cropProtectionRequired || false,
            cropLocation: data.occupationInfo.cropLocation,
            areaUnderCultivation: data.occupationInfo.areaUnderCultivation,
          },
        });
      }

      // Create biometric data if provided
      let biometricData = null;
      if (data.biometricData) {
        biometricData = await tx.freshLicenseApplicationsFormBiometricDatas.create({
          data: {
            signatureImageUrl: data.biometricData.signatureImageUrl,
            irisScanImageUrl: data.biometricData.irisScanImageUrl,
            photoImageUrl: data.biometricData.photoImageUrl,
          },
        });
      }

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
          needForLicense: data.needForLicense,
          descriptionOfArms: data.descriptionOfArms,
          armsCategory: data.armsCategory,
          areasOfUse: data.areasOfUse,
          specialConsideration: data.specialConsideration,
          stateId: data.stateId,
          districtId: data.districtId,
          presentAddressId: presentAddress.id,
          permanentAddressId: permanentAddress?.id,
          contactInfoId: contactInfo.id,
          occupationInfoId: occupationInfo?.id,
          biometricDataId: biometricData?.id,
        },
      });

      // Create criminal history if provided
      if (data.criminalHistory && data.criminalHistory.length > 0) {
        await Promise.all(
          data.criminalHistory.map((criminal) =>
            tx.freshLicenseApplicationsFormCriminalHistories.create({
              data: {
                applicationId: application.id,
                convicted: criminal.convicted,
                firNumber: criminal.firNumber,
                underSection: criminal.underSection,
                policeStation: criminal.policeStation,
                unit: criminal.unit,
                district: criminal.district,
                state: criminal.state,
                offence: criminal.offence,
                sentence: criminal.sentence,
                dateOfSentence: criminal.dateOfSentence ? new Date(criminal.dateOfSentence) : null,
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
                previouslyApplied: license.previouslyApplied,
                dateApplied: license.dateApplied ? new Date(license.dateApplied) : null,
                licenseName: license.licenseName,
                authority: license.authority,
                result: license.result as any,
                status: license.status,
                rejectionDocumentUrl: license.rejectionDocumentUrl,
                licenseSuspended: license.licenseSuspended,
                licenseDetails: license.licenseDetails,
              },
            })
          )
        );
      }

      // Create file uploads if provided
      if (data.fileUploads && data.fileUploads.length > 0) {
        await Promise.all(
          data.fileUploads.map((file) =>
            tx.freshLicenseApplicationsFormFileUploads.create({
              data: {
                applicationId: application.id,
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
          presentAddress: true,
          permanentAddress: true,
          contactInfo: true,
          occupationInfo: true,
          biometricData: true,
          criminalHistory: true,
          licenseHistory: true,
          fileUploads: true,
          state: true,
          district: true,
        },
      });
    });
  }

  async getApplicationById(id: string) {
    return await prisma.freshLicenseApplicationsForms.findUnique({
      where: { id },
      include: {
        presentAddress: true,
        permanentAddress: true,
        contactInfo: true,
        occupationInfo: true,
        biometricData: true,
        criminalHistory: true,
        licenseHistory: true,
        fileUploads: true,
        state: true,
        district: true,
      },
    });
  }

  async getAllApplications() {
    return await prisma.freshLicenseApplicationsForms.findMany({
      include: {
        presentAddress: true,
        permanentAddress: true,
        contactInfo: true,
        occupationInfo: true,
        biometricData: true,
        criminalHistory: true,
        licenseHistory: true,
        fileUploads: true,
        state: true,
        district: true,
      },
    });
  }

  async getUserApplications(userId: string) {
    // For now, we'll return all applications
    // In a proper implementation, you would need to add a userId field to FreshLicenseApplicationsForms
    // or establish a relationship between User and Application
    return await prisma.freshLicenseApplicationsForms.findMany({
      include: {
        presentAddress: true,
        permanentAddress: true,
        contactInfo: true,
        occupationInfo: true,
        biometricData: true,
        criminalHistory: true,
        licenseHistory: true,
        fileUploads: true,
        state: true,
        district: true,
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
        presentAddress: true,
        permanentAddress: true,
        contactInfo: true,
        occupationInfo: true,
        biometricData: true,
        criminalHistory: true,
        licenseHistory: true,
        fileUploads: true,
        state: true,
        district: true,
      },
    });
  }
}
