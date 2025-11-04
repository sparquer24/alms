import { Injectable, ConflictException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import prisma from '../../db/prismaClient';
import { Sex, FileType, LicensePurpose } from '@prisma/client';
import { UploadFileDto } from './dto/upload-file.dto';
import { STATUS_CODES, ACTION_CODES, ROLE_CODES } from '../../constants/workflow-actions';

// Define the missing input type (adjust fields as per your requirements)
export interface CreateFreshLicenseApplicationsFormsInput {
  firstName: string;
  middleName?: string;
  lastName: string;
  filledBy?: string;
  parentOrSpouseName: string;
  sex: Sex;
  placeOfBirth: string;
  dateOfBirth: Date | string;
  panNumber?: string;
  aadharNumber: string;
  dobInWords?: string;
  stateId: number;
  districtId: number;
  presentAddress: CreateAddressInput;
  permanentAddress?: CreateAddressInput;
  contactInfo: CreateContactInfoInput;
  occupationInfo?: CreateOccupationInfoInput;
  biometricData?: any;
  criminalHistory?: CreateCriminalHistoryInput[];
  licenseHistory?: CreateLicenseHistoryInput[];
  licenseRequestDetails?: CreateLicenseRequestDetailsInput;
  fileUploads?: CreateFileUploadInput[];
  currentUserId?: number;
  previousUserId?: number;
  previousRoleId?: number;
  statusId: number;
  actionTaken?: string;
  remarks?: string;
}

export interface CreateAddressInput {
  addressLine: string;
  stateId: number;
  districtId: number;
  policeStationId: number;
  zoneId: number;
  divisionId: number;
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
  employerName?: string;
  businessDetails?: string;
  annualIncome?: string;
  workExperience?: string;
  businessType?: string;
}

export interface CreateLicenseRequestDetailsInput {
  needForLicense?: LicensePurpose;
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

  // Helper to extract acceptance flags from payload or personalDetails object
  private extractAcceptanceFlagsFromPayload(payload: any) {
    // payload may be either the whole DTO or the personalDetails object itself
    const source = (payload && payload.personalDetails && typeof payload.personalDetails === 'object') ? payload.personalDetails : payload;
    const result: any = {};
    if (source?.isDeclarationAccepted !== undefined) result.isDeclarationAccepted = source.isDeclarationAccepted;
    if (source?.isAwareOfLegalConsequences !== undefined) result.isAwareOfLegalConsequences = source.isAwareOfLegalConsequences;
    if (source?.isTermsAccepted !== undefined) result.isTermsAccepted = source.isTermsAccepted;
    return result;
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


  /**
   * Create personal details in the dedicated personal details table and return applicationId
   */
  async createPersonalDetails(data: any): Promise<[any, any]> {
    try {
      // Pick supported fields from input
      const {
        acknowledgementNo,
        firstName,
        middleName,
        lastName,
        parentOrSpouseName,
        filledBy,
        sex,
        placeOfBirth,
        dateOfBirth,
        dobInWords,
        aadharNumber,
        panNumber,
        currentUserId
      } = data || {};

      // Basic validation
      if (!firstName || !lastName) {
        throw new BadRequestException('firstName and lastName are required');
      }

      if (!parentOrSpouseName) {
        throw new BadRequestException('parentOrSpouseName is required');
      }

      if (!sex) {
        throw new BadRequestException('sex is required');
      }

      // Normalize Aadhaar (keep as string to preserve leading zeros and match DB type)
      let aadharNumberStr: string | null = null;
      if (aadharNumber) {
        const raw = String(aadharNumber).trim();
        if (!/^[0-9]{12}$/.test(raw)) {
          return [new BadRequestException('Aadhar number must be a 12-digit numeric string'), null];
        }
        aadharNumberStr = raw;
      }

      // Normalize PAN (keep as string; PANs are typically alphanumeric)
      let panNumberStr: string | null = null;
      if (panNumber) {
        const rawPan = String(panNumber).trim();
        // Accept any non-empty trimmed PAN string; further validation can be added if needed
        panNumberStr = rawPan || null;
      }

      // Use string variants for personal details model to avoid integer overflow.
      const aadharNumberForPersonal: string | null = aadharNumberStr;
      const panNumberForPersonal: string | null = panNumberStr || null;

      // Validate sex if provided
      if (sex && !Object.values(Sex).includes(sex as Sex)) {
        return [new BadRequestException('Invalid sex value'), null];
      }
      // Transaction: create only the personal-details row (no application)
      const created = await prisma.$transaction(async (tx) => {
        // Generate acknowledgementNo once
        const finalAcknowledgementNo = acknowledgementNo ?? `ALMS${Date.now()}`;

        // Find DRAFT status ID by code (more reliable than assuming ID)
        const draftStatus = await prisma.statuses.findFirst({
          where: { code: STATUS_CODES.DRAFT, isActive: true }
        });

        if (!draftStatus) {
          throw new Error(`${STATUS_CODES.DRAFT} status not found in Statuses table. Please ensure DRAFT status exists.`);
        }

        const draftStatusId = draftStatus.id;

        const personal = await tx.freshLicenseApplicationPersonalDetails.create({
          data: ({
            acknowledgementNo: finalAcknowledgementNo,
            firstName,
            middleName,
            lastName,
            parentOrSpouseName,
            filledBy,
            sex,
            placeOfBirth,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
            dobInWords,
            aadharNumber: aadharNumberForPersonal ? aadharNumberForPersonal : undefined,
            panNumber: panNumberForPersonal ?? undefined as any,
            currentUserId: currentUserId || null,
            workflowStatusId: draftStatusId,
          } as any),
        });

        return personal;
      });

      return [null, created.id];
    } catch (error: any) {
      if (error?.code === 'P2002') {
        const target = error?.meta?.target ? error.meta.target.join(',') : 'field';
        return [new ConflictException(`Duplicate value for unique field(s): ${target}`), null];
      }
      return [error, null];
    }
  }

  /**
   * Patch application details - update related tables (addresses, occupation, histories, license details)
   * @param applicationId - Application ID to update
   * @param isSubmit - Whether this is a final submission
   * @param data - Data to update
   * @param currentUserId - Authenticated user ID from JWT token (optional)
   */
  async patchApplicationDetails(applicationId: number, isSubmit: boolean, data: any, currentUserId?: number): Promise<[any, any]> {
    try {
      // First validate that the application exists
      const existingApplication = await prisma.freshLicenseApplicationPersonalDetails.findUnique({
        where: { id: applicationId },
        select: { id: true, acknowledgementNo: true }
      });

      if (!existingApplication) {
        return [new BadRequestException(`Application with ID ${applicationId} not found`), null];
      }

      const updatedSections: string[] = [];

      await prisma.$transaction(async (tx) => {
        // 1. Handle Present Address
        if (data.presentAddress) {
          const presentAddressData = {
            ...data.presentAddress,
            sinceResiding: new Date(data.presentAddress.sinceResiding)
          };

          // Check if present address already exists
          const existingPresentAddress = await tx.freshLicenseApplicationPersonalDetails.findUnique({
            where: { id: applicationId },
            select: { presentAddressId: true }
          });

          if (existingPresentAddress?.presentAddressId) {
            // Update existing address
            await tx.fLAFAddressesAndContactDetails.update({
              where: { id: existingPresentAddress.presentAddressId },
              data: presentAddressData
            });
          } else {
            // Create new address and link it
            const newPresentAddress = await tx.fLAFAddressesAndContactDetails.create({
              data: presentAddressData
            });
            await tx.freshLicenseApplicationPersonalDetails.update({
              where: { id: applicationId },
              data: { presentAddressId: newPresentAddress.id }
            });
          }
          updatedSections.push('presentAddress');
        }

        // 2. Handle Permanent Address
        if (data.permanentAddress) {
          const permanentAddressData = {
            ...data.permanentAddress,
            sinceResiding: new Date(data.permanentAddress.sinceResiding)
          };

          // Check if permanent address already exists
          const existingPermanentAddress = await tx.freshLicenseApplicationPersonalDetails.findUnique({
            where: { id: applicationId },
            select: { permanentAddressId: true }
          });

          if (existingPermanentAddress?.permanentAddressId) {
            // Update existing address
            await tx.fLAFAddressesAndContactDetails.update({
              where: { id: existingPermanentAddress.permanentAddressId },
              data: permanentAddressData
            });
          } else {
            // Create new address and link it
            const newPermanentAddress = await tx.fLAFAddressesAndContactDetails.create({
              data: permanentAddressData
            });
            await tx.freshLicenseApplicationPersonalDetails.update({
              where: { id: applicationId },
              data: { permanentAddressId: newPermanentAddress.id }
            });
          }
          updatedSections.push('permanentAddress');
        }

        // 3. Handle Occupation and Business
        if (data.occupationAndBusiness) {
          // Sanitize and coerce occupation payload to avoid invalid FK values or wrong types
          const rawOcc: any = data.occupationAndBusiness || {};
          // Only pick fields that are declared in the PatchOccupationBusinessDto
          // DTO fields: occupation, officeAddress, stateId, districtId, cropLocation, areaUnderCultivation
          const occData: any = {
            occupation: rawOcc.occupation,
            officeAddress: rawOcc.officeAddress,
            cropLocation: rawOcc.cropLocation ?? undefined,
          };

          // Coerce numeric fields only if valid positive numbers
          if (rawOcc.areaUnderCultivation !== undefined && rawOcc.areaUnderCultivation !== null) {
            const a = Number(rawOcc.areaUnderCultivation);
            if (!isNaN(a)) occData.areaUnderCultivation = a;
          }

          if (rawOcc.stateId !== undefined && rawOcc.stateId !== null) {
            const s = Number(rawOcc.stateId);
            if (!isNaN(s)) occData.stateId = s;
          }

          if (rawOcc.districtId !== undefined && rawOcc.districtId !== null) {
            const d = Number(rawOcc.districtId);
            if (!isNaN(d)) occData.districtId = d;
          }

          // Check if occupation already exists
          const existingOccupation = await tx.freshLicenseApplicationPersonalDetails.findUnique({
            where: { id: applicationId },
            select: { occupationAndBusinessId: true }
          });

          if (existingOccupation?.occupationAndBusinessId) {
            // Update existing occupation
            await tx.fLAFOccupationAndBusiness.update({
              where: { id: existingOccupation.occupationAndBusinessId },
              data: occData
            });
          } else {
            // Create new occupation and link it
            const newOccupation = await tx.fLAFOccupationAndBusiness.create({
              data: occData
            });
            await tx.freshLicenseApplicationPersonalDetails.update({
              where: { id: applicationId },
              data: { occupationAndBusinessId: newOccupation.id }
            });
          }
          updatedSections.push('occupationAndBusiness');
        }

        // 3.a Handle Personal Details (first name, last name, aadhar, pan, dob, sex, etc.)
        if (data.personalDetails) {
          const pd = data.personalDetails;
          const updateData: any = {};

          if (pd.firstName !== undefined) updateData.firstName = pd.firstName;
          if (pd.middleName !== undefined) updateData.middleName = pd.middleName;
          if (pd.lastName !== undefined) updateData.lastName = pd.lastName;
          if (pd.parentOrSpouseName !== undefined) updateData.parentOrSpouseName = pd.parentOrSpouseName;
          if (pd.filledBy !== undefined) updateData.filledBy = pd.filledBy;
          if (pd.placeOfBirth !== undefined) updateData.placeOfBirth = pd.placeOfBirth;
          if (pd.dobInWords !== undefined) updateData.dobInWords = pd.dobInWords;

          if (pd.sex !== undefined) {
            // Validate sex enum
            if (!Object.values(Sex).includes(pd.sex as Sex)) {
              throw new Error('Invalid sex value');
            }
            updateData.sex = pd.sex;
          }

          if (pd.dateOfBirth !== undefined) {
            const dob = pd.dateOfBirth ? new Date(pd.dateOfBirth) : null;
            if (dob && isNaN(dob.getTime())) {
              throw new Error('Invalid dateOfBirth');
            }
            updateData.dateOfBirth = dob ?? undefined;
          }

          // Aadhaar validation (format only). PAN trimming handled alongside when provided.
          if (pd.aadharNumber !== undefined) {
            const raw = pd.aadharNumber ? String(pd.aadharNumber).trim() : '';
            if (raw && !/^[0-9]{12}$/.test(raw)) {
              throw new BadRequestException('Aadhar number must be a 12-digit numeric string');
            }
            updateData.aadharNumber = raw || undefined; // allow clearing by setting undefined if empty string
            updateData.panNumber = pd.panNumber ? String(pd.panNumber).trim() : undefined;
          }

          // If there is something to update, perform the update
          // Also include acceptance flags here if provided (ensure these are
          // updated when personalDetails is present, even if this is called
          // outside of isSubmit flow)
          Object.assign(updateData, this.extractAcceptanceFlagsFromPayload(pd));

          if (Object.keys(updateData).length > 0) {
            await tx.freshLicenseApplicationPersonalDetails.update({
              where: { id: applicationId },
              data: {
                ...updateData,
                updatedAt: new Date()
              }
            });
            updatedSections.push('personalDetails');
          }
        }

        // 4. Handle Criminal Histories (Replace all existing)
        if (data.criminalHistories && Array.isArray(data.criminalHistories)) {
          // Delete existing criminal histories
          await tx.fLAFCriminalHistories.deleteMany({ where: { applicationId } });

          // Create new criminal histories one-by-one to surface any validation/constraint errors
          if (data.criminalHistories.length > 0) {
            for (const history of data.criminalHistories) {
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

              // Create the record and let any errors bubble to the transaction so they can be handled
              await tx.fLAFCriminalHistories.create({ data: record });
            }
          }

          updatedSections.push('criminalHistories');
        }

        // 5. Handle License Histories (Replace all existing)
        if (data.licenseHistories && Array.isArray(data.licenseHistories)) {
          // Delete existing license histories
          await tx.fLAFLicenseHistories.deleteMany({
            where: { applicationId }
          });

          // Create new license histories
          if (data.licenseHistories.length > 0) {
            const licenseHistoriesData = data.licenseHistories.map((history: any) => ({
              ...history,
              applicationId,
              dateAppliedFor: history.dateAppliedFor ? new Date(history.dateAppliedFor) : null
            }));

            await tx.fLAFLicenseHistories.createMany({
              data: licenseHistoriesData
            });
          }
          updatedSections.push('licenseHistories');
        }

        // 6. Handle License Details (Replace all existing)
        if (data.licenseDetails && Array.isArray(data.licenseDetails)) {
          // Delete existing license details (this will also remove weapon connections due to relation)
          await tx.fLAFLicenseDetails.deleteMany({
            where: { applicationId }
          });

          // Create new license details
          if (data.licenseDetails.length > 0) {
            for (const licenseDetail of data.licenseDetails) {
              const { requestedWeaponIds, ...licenseDetailData } = licenseDetail;

              const newLicenseDetail = await tx.fLAFLicenseDetails.create({
                data: {
                  ...licenseDetailData,
                  applicationId
                }
              });

              // Handle weapon connections if provided
              if (requestedWeaponIds && requestedWeaponIds.length > 0) {
                // Connect weapons using the many-to-many relation
                await tx.fLAFLicenseDetails.update({
                  where: { id: newLicenseDetail.id },
                  data: {
                    requestedWeapons: {
                      connect: requestedWeaponIds.map((weaponId: number) => ({ id: weaponId }))
                    }
                  }
                });
              }
            }
          }
          updatedSections.push('licenseDetails');
        }

        // Handle workflow status updates - only when isSubmit is true
        if (isSubmit === true) {
          // Get the status where isStarted is true
          const initiatedStatus = await tx.statuses.findFirst({
            where: { isStarted: true, isActive: true }
          });   

          // Get current application details to know the current user
          const currentApp = await tx.freshLicenseApplicationPersonalDetails.findUnique({
            where: { id: applicationId },
            select: {
              currentUserId: true,
              previousUserId: true,
              workflowStatusId: true
            }
          });

          // Determine which user ID to use: passed from auth token > currentUserId from app > previousUserId from app
          const effectiveUserId = currentUserId || currentApp?.currentUserId || currentApp?.previousUserId;

          // If we still don't have a user ID, we cannot create workflow history
          if (!effectiveUserId) {
            throw new BadRequestException('Cannot submit application: No user information available. Please ensure you are authenticated.');
          }

          // workflowStatus and acceptance flags are saved together.
          const updateData: any = {
            updatedAt: new Date()
          };
          // mark submitted flag so it's written as part of the same update
          updateData.isSubmit = true;

          // Update currentUserId if it was passed from auth token and is different from what's stored
          if (currentUserId && currentApp?.currentUserId !== currentUserId) {
            updateData.currentUserId = currentUserId;
          }

          // Only update workflowStatusId when isSubmit is true
          if (initiatedStatus && initiatedStatus.id) {
            updateData.workflowStatusId = initiatedStatus.id;
          }

          // Defensive: accept flags from either personalDetails or top-level payload.
          Object.assign(updateData, this.extractAcceptanceFlagsFromPayload(data));

          // If there's something other than updatedAt to save, perform the update
          const hasUpdatableKeys = Object.keys(updateData).some(k => k !== 'updatedAt');
          if (hasUpdatableKeys) {
            // small debug to help trace why an update may not happen in future
            console.debug('Updating workflow/personal acceptance fields for application', applicationId, updateData);

            await tx.freshLicenseApplicationPersonalDetails.update({
              where: { id: applicationId },
              data: updateData
            });

            // Create workflow history entry for INITIATE action
            if (initiatedStatus) {
              // Get user's role
              let currentUserRoleId: number | null = null;
              const currentUser = await tx.users.findUnique({
                where: { id: effectiveUserId },
                select: { roleId: true }
              });
              currentUserRoleId = currentUser?.roleId || null;

              // Create workflow history
              await tx.freshLicenseApplicationsFormWorkflowHistories.create({
                data: {
                  applicationId: applicationId,
                  previousUserId: effectiveUserId, // Use the authenticated user as initiator
                  nextUserId: effectiveUserId, // Same user initially
                  actionTaken: initiatedStatus.code,
                  remarks: 'Application submitted for review',
                  previousRoleId: currentUserRoleId,
                  nextRoleId: currentUserRoleId,
                }
              });

              updatedSections.push('workflowHistory');
            }

            // Push appropriate section markers
            if (updateData.workflowStatusId) updatedSections.push('workflowStatus');
            if (updateData.isDeclarationAccepted !== undefined || updateData.isAwareOfLegalConsequences !== undefined || updateData.isTermsAccepted !== undefined) {
              updatedSections.push('personalDetails');
            }
            if (updateData.isSubmit) updatedSections.push('isSubmit');
          }
        }
      });

      // Fetch updated application with all relations
      const updatedApplication = await prisma.freshLicenseApplicationPersonalDetails.findUnique({
        where: { id: applicationId },
        include: {
          workflowStatus: {
            select: {
              id: true,
              code: true,
              name: true,
              description: true
            }
          },
          presentAddress: {
            include: {
              state: true,
              district: true,
              zone: true,
              division: true,
              policeStation: true
            }
          },
          permanentAddress: {
            include: {
              state: true,
              district: true,
              zone: true,
              division: true,
              policeStation: true
            }
          },
          occupationAndBusiness: {
            include: {
              state: true,
              district: true
            }
          },
          criminalHistories: true,
          licenseHistories: true,
          licenseDetails: {
            include: {
              requestedWeapons: true
            }
          }
        }
      });

      return [null, { updatedSections, application: updatedApplication }];
    } catch (error: any) {
      if (error?.code === 'P2002') {
        const target = error?.meta?.target ? error.meta.target.join(',') : 'field';
        return [new ConflictException(`Duplicate value for unique field(s): ${target}`), null];
      }
      if (error?.code === 'P2003') {
        return [new BadRequestException('Invalid foreign key reference. Please check state, district, zone, division, or weapon IDs.'), null];
      }
      return [error, null];
    }
  }
  async deleteApplicationId(fileId: number): Promise<[any, boolean]> {
    try {
      // First, check if the file record exists
      const existingFile = await prisma.fLAFFileUploads.findUnique({
        where: { id: fileId }
      });
      if (!existingFile) {
        return [new BadRequestException(`File with ID ${fileId} not found`), false];
      }
      // Delete the file record
      await prisma.fLAFFileUploads.delete({
        where: { id: fileId }
      });
      return [null, true];
    }
    catch (error) {
      return [error, false];
    }
  }


  async getApplicationById(id?: number | undefined, acknowledgementNo?: string | undefined | null): Promise<[any, any]> {
    try {
      let whereCondition: any = {};
      if (id) {
        whereCondition = { id };
      }
      if (acknowledgementNo) {
        whereCondition = { ...whereCondition, acknowledgementNo };
      }

      let application: any = await prisma.freshLicenseApplicationPersonalDetails.findUnique({
        where: whereCondition,
        include: {
          // Status and user tracking
          workflowStatus: {
            select: {
              id: true,
              code: true,
              name: true,
            }
          },
          currentUser: {
            select: {
              id: true,
              username: true,
              email: true,
              role: {
                select: {
                  id: true,
                  code: true,
                  name: true
                }
              },
            }
          },
          previousUser: {
            select: {
              id: true,
              username: true,
              email: true,
              role: {
                select: {
                  id: true,
                  code: true,
                  name: true
                }
              }
            }
          },
          // Address details
          presentAddress: {
            include: {
              state: true,
              district: true,
              zone: true,
              division: true,
              policeStation: true
            }
          },
          permanentAddress: {
            include: {
              state: true,
              district: true,
              zone: true,
              division: true,
              policeStation: true
            }
          },
          // Other details
          occupationAndBusiness: {
            include: {
              state: true,
              district: true
            }
          },
          biometricData: true,
          criminalHistories: true,
          licenseHistories: true,
          licenseDetails: {
            include: {
              requestedWeapons: true,
            }
          },
          fileUploads: true,
        },
      });

      // Get workflow histories for this application
      const workflowHistories = await prisma.freshLicenseApplicationsFormWorkflowHistories.findMany({
        where: { applicationId: application?.id },
        orderBy: { createdAt: 'desc' },
        include: {
          previousRole: true,
          previousUser: true,
          nextRole: true,
          nextUser: true,
          actiones: true,
        }
      });

      // Add previousUserName and previousRoleName to each workflow history entry
      if (workflowHistories?.length) {
        // Transform histories
        const transformedHistories = workflowHistories.map((history) => {
          const { previousUser, previousRole, nextUser, nextRole, ...rest } = history;

          return {
            ...rest,
            previousUserName: previousUser?.username ?? null,
            previousRoleName: previousRole?.name ?? null,
            nextUserName: nextUser?.username ?? null,
            nextRoleName: nextRole?.name ?? null,
          };
        });
        application.workflowHistories = transformedHistories;
      }

      let usersInHierarchy: any[] = [];
      // Defensive: check presentAddress and policeStation
      if (application?.presentAddress && application.presentAddress.policeStationId) {
        // Since we already have the hierarchy included in the presentAddress, we can use it directly
        const policeStationId = application.presentAddress.policeStationId;
        const divisionId = application.presentAddress.divisionId;
        const zoneId = application.presentAddress.zoneId;
        const districtId = application.presentAddress.districtId;
        const stateId = application.presentAddress.stateId;

        // Execute 5 separate queries for each hierarchical level
        // Users are only returned for a level if they don't belong to a more specific level
        const queries = [];

        // 1. Police Station level users (most specific)
        if (policeStationId) {
          queries.push(
            prisma.users.findMany({
              where: {
                policeStationId: policeStationId
              },
              select: {
                id: true,
                username: true,
                email: true,
                stateId: true,
                districtId: true,
                zoneId: true,
                divisionId: true,
                policeStationId: true,
                roleId: true,
                role: {
                  select: {
                    id: true,
                    code: true,
                    name: true
                  }
                }
              }
            })
          );
        }

        // 2. Division level users (only if policeStationId is null)
        if (divisionId) {
          queries.push(
            prisma.users.findMany({
              where: {
                divisionId: divisionId,
                policeStationId: null
              },
              select: {
                id: true,
                username: true,
                email: true,
                stateId: true,
                districtId: true,
                zoneId: true,
                divisionId: true,
                policeStationId: true,
                roleId: true,
                role: {
                  select: {
                    id: true,
                    code: true,
                    name: true
                  }
                }
              }
            })
          );
        }

        // 3. Zone level users (only if divisionId is null)
        if (zoneId) {
          queries.push(
            prisma.users.findMany({
              where: {
                zoneId: zoneId,
                divisionId: null
              },
              select: {
                id: true,
                username: true,
                email: true,
                stateId: true,
                districtId: true,
                zoneId: true,
                divisionId: true,
                policeStationId: true,
                roleId: true,
                role: {
                  select: {
                    id: true,
                    code: true,
                    name: true
                  }
                }
              }
            })
          );
        }

        // 4. District level users (only if zoneId is null)
        if (districtId) {
          queries.push(
            prisma.users.findMany({
              where: {
                districtId: districtId,
                zoneId: null
              },
              select: {
                id: true,
                username: true,
                email: true,
                stateId: true,
                districtId: true,
                zoneId: true,
                divisionId: true,
                policeStationId: true,
                roleId: true,
                role: {
                  select: {
                    id: true,
                    code: true,
                    name: true
                  }
                }
              }
            })
          );
        }

        // 5. State level users (only if districtId is null)
        if (stateId) {
          queries.push(
            prisma.users.findMany({
              where: {
                stateId: stateId,
                districtId: null
              },
              select: {
                id: true,
                username: true,
                email: true,
                stateId: true,
                districtId: true,
                zoneId: true,
                divisionId: true,
                policeStationId: true,
                roleId: true,
                role: {
                  select: {
                    id: true,
                    code: true,
                    name: true
                  }
                }
              }
            })
          );
        }

        // Execute all queries in parallel and combine results
        if (queries.length > 0) {
          const results = await Promise.all(queries);
          // Flatten the array of arrays into a single array
          usersInHierarchy = results.flat();
        }
      }
      application = {
        ...application,
        usersInHierarchy
      };
      return [null, application];
    } catch (err) {
      return [err, null];
    }
  }


  // page: pageNum,
  // limit: limitNum,
  // searchField: parsedSearchField,
  // search: parsedSearchValue,
  // orderBy: parsedOrderBy,
  // order: parsedOrder as 'asc' | 'desc',
  // currentUserId: req.user?.sub, 
  public async getFilteredApplications(filter: {
    statusIds?: Array<number | string>;
    currentUserId?: string;
    page?: number;
    limit?: number;
    searchField?: string;
    search?: string;
    orderBy?: string;
    order?: 'asc' | 'desc';
    isOwned?: boolean;
    isSent?: boolean;
  }) {
    // Build a compact, frontend-friendly query: include necessary relations
    try {
      const where: any = {};

      // Pagination (move earlier so we can early-return when resolved status filter is empty)
      const page = Math.max(Number(filter.page ?? 1), 1);
      const limit = Math.max(Number(filter.limit ?? 10), 1);
      const skip = (page - 1) * limit;

      // Handle isSent parameter - fetch applications from workflow history
      if (filter.isSent === true && filter.currentUserId) {
        const parsedUserId = Number(filter.currentUserId);
        if (!isNaN(parsedUserId)) {
          // Get all workflow history entries where the user took action
          const workflowHistories = await prisma.freshLicenseApplicationsFormWorkflowHistories.findMany({
            where: {
              previousUserId: parsedUserId
            },
            select: {
              applicationId: true,
              id: true,
              createdAt: true,
              actionTaken: true,
              remarks: true
            },
            orderBy: {
              createdAt: 'desc'
            }
          });

          if (workflowHistories.length === 0) {
            // No workflow history found for this user
            return [null, { total: 0, page, limit, data: [] }];
          }

          // Group histories by applicationId and count occurrences
          const applicationMap = new Map<number, any[]>();
          for (const history of workflowHistories) {
            if (!applicationMap.has(history.applicationId)) {
              applicationMap.set(history.applicationId, []);
            }
            applicationMap.get(history.applicationId)!.push(history);
          }

          // Fetch all unique application IDs
          const applicationIds = Array.from(applicationMap.keys());

          // Apply pagination on the grouped results
          // Since we need to duplicate applications based on action count, we need special handling
          let allResults: any[] = [];

          // Fetch all applications - only select required fields
          const applications = await prisma.freshLicenseApplicationPersonalDetails.findMany({
            where: {
              id: { in: applicationIds }
            },
            select: {
              id: true, // Keep id for mapping
              acknowledgementNo: true,
              createdAt: true,
              firstName: true,
              middleName: true,
              lastName: true,
            }
          });

          // Create a map for quick application lookup
          const appMap = new Map(applications.map(app => [app.id, app]));

          // Build results array with duplicates based on action count
          for (const [applicationId, histories] of applicationMap.entries()) {
            const application = appMap.get(applicationId);
            if (application) {
              // Build applicant name
              const applicantName = [application.firstName, application.middleName, application.lastName]
                .filter(Boolean)
                .join(' ');

              // Add the application once for each action taken by the user
              for (const history of histories) {
                allResults.push({
                  applicationId: application.id,
                  acknowledgementNo: application.acknowledgementNo,
                  createdAt: application.createdAt,
                  applicantName: applicantName,
                  workflowHistoryId: history.id,
                  actionTakenAt: history.createdAt,
                  actionTaken: history.actionTaken,
                  actionRemarks: history.remarks
                });
              }
            }
          }

          // Apply ordering if specified
          const allowedOrderFields = ['applicationId', 'acknowledgementNo', 'createdAt', 'applicantName', 'actionTakenAt'];
          const orderByField = (filter.orderBy && allowedOrderFields.includes(filter.orderBy)) ? filter.orderBy : 'actionTakenAt';
          const orderDirection = filter.order && filter.order.toLowerCase() === 'asc' ? 'asc' : 'desc';

          allResults.sort((a, b) => {
            const aValue = a[orderByField];
            const bValue = b[orderByField];

            if (aValue < bValue) return orderDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return orderDirection === 'asc' ? 1 : -1;
            return 0;
          });

          // Apply pagination
          const total = allResults.length;
          const paginatedResults = allResults.slice(skip, skip + limit);

          return [null, { total, page, limit, data: paginatedResults }];
        }
      }

      // Role-based filtering: Get current user's role
      let userRole = null;
      if (filter.currentUserId) {
        const parsedUserId = Number(filter.currentUserId);
        if (!isNaN(parsedUserId)) {
          const user = await prisma.users.findUnique({
            where: { id: parsedUserId },
            include: { role: true }
          });
          userRole = user?.role?.code;

          // For non-ZS users, filter by currentUserId
          // ZS users can see all applications
          if (userRole && userRole !== ROLE_CODES.ZS) {
            where.currentUserId = parsedUserId;
          }
        }
      }

      // Workflow status filter: accept numeric IDs or textual identifiers (codes/names)
      if (filter.statusIds && Array.isArray(filter.statusIds) && filter.statusIds.length > 0) {
        // Split numeric-like entries and non-numeric entries
        const numericCandidates = filter.statusIds.map((s: any) => Number(s)).filter((n: any) => !isNaN(n));
        const nonNumeric = filter.statusIds.filter((s: any) => isNaN(Number(s))).map(String);

        let resolvedIds: number[] = [...numericCandidates];

        if (nonNumeric.length > 0) {
          // Use existing helper to resolve textual identifiers (codes/names) to numeric IDs
          const fromResolver = await this.resolveStatusIdentifiers(nonNumeric);
          if (fromResolver && fromResolver.length > 0) {
            resolvedIds = Array.from(new Set([...resolvedIds, ...fromResolver]));
          }
        }

        // If we didn't resolve any numeric IDs, return empty result set early (no statuses match)
        if (!resolvedIds || resolvedIds.length === 0) {
          return [null, { total: 0, page, limit, data: [] }];
        }

        where.workflowStatusId = { in: resolvedIds };
      }

      // Specific application ID filter (ownership) - for explicit isOwned flag
      if (filter.isOwned == true && filter.currentUserId) {
        // currentUserId might be string; convert if numeric
        const parsed = Number(filter.currentUserId);
        where.currentUserId = !isNaN(parsed) ? parsed : filter.currentUserId;
      }

      // Search filter (supports id exact match or text contains on allowed fields)
      if (filter.searchField && filter.search) {
        const allowed = ['id', 'firstName', 'lastName', 'acknowledgementNo'];
        if (allowed.includes(filter.searchField)) {
          if (filter.searchField === 'id') {
            const idVal = Number(filter.search);
            if (!isNaN(idVal)) where.id = idVal;
          } else {
            // case-insensitive partial match for frontend search
            where[filter.searchField] = { contains: String(filter.search), mode: 'insensitive' };
          }
        }
      }

      // Ordering: allow only a small set of fields for safety
      const allowedOrderFields = ['id', 'firstName', 'lastName', 'acknowledgementNo', 'createdAt'];
      const orderByField = (filter.orderBy && allowedOrderFields.includes(filter.orderBy)) ? filter.orderBy : 'createdAt';
      const orderDirection = filter.order && filter.order.toLowerCase() === 'asc' ? 'asc' : 'desc';
      const orderByObj: any = { [orderByField]: orderDirection };

      // Minimal selects for list view (frontend needs these fields)
      const select = {
        id: true,
        acknowledgementNo: true,
        firstName: true,
        middleName: true,
        lastName: true,
        createdAt: true,
        // Workflow status
        workflowStatus: {
          select: {
            id: true,
            code: true,
            name: true,
          }
        },
        // User and role tracking (role accessed through user.role)
        currentUser: {
          select: {
            id: true,
            username: true,
            email: true,
            role: {
              select: {
                code: true,
              }
            }
          }
        },
        previousUser: {
          select: {
            id: true,
            username: true,
            email: true,
            role: {
              select: {
                id: true,
                code: true,
              }
            }
          }
        },
      };

      const [total, rawData] = await Promise.all([
        prisma.freshLicenseApplicationPersonalDetails.count({ where }),
        prisma.freshLicenseApplicationPersonalDetails.findMany({
          where,
          skip,
          take: limit,
          orderBy: orderByObj,
          select,
        }),
      ]);
      // Build 'applicatenName' by joining first/middle/last for each record
      const transformedData = (rawData || []).map((row: any) => {
        const parts = [row.firstName, row.middleName, row.lastName].filter((p: any) => p && String(p).trim());
        return {
          ...row,
        };
      });

      // Return in the [error, result] tuple format used across the service methods
      return [null, { total, page, limit, data: transformedData }];
    } catch (error) {
      return [error, null];
    }
  }

  public async getUserApplications(userId: string) {
    const userIdNum = parseInt(userId);
    return await prisma.freshLicenseApplicationPersonalDetails.findMany({
      where: {
        currentUserId: userIdNum
      },
      include: {
        // User and role tracking (role accessed through user.role)
        currentUser: {
          select: {
            id: true,
            username: true,
            email: true,
            role: {
              select: {
                id: true,
                code: true,
                name: true
              }
            }
          }
        },
        previousUser: {
          select: {
            id: true,
            username: true,
            email: true,
            role: {
              select: {
                id: true,
                code: true,
                name: true
              }
            }
          }
        },
        // Address details
        presentAddress: {
          include: {
            state: true,
            district: true,
            zone: true,
            division: true,
            policeStation: true,
          }
        },
        permanentAddress: {
          include: {
            state: true,
            district: true,
            zone: true,
            division: true,
            policeStation: true,
          }
        },
        // Other details
        occupationAndBusiness: {
          include: {
            state: true,
            district: true,
          }
        },
        biometricData: true,
        criminalHistories: true,
        licenseHistories: true,
        licenseDetails: {
          include: {
            requestedWeapons: true,
          }
        },
        fileUploads: true,
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
  // Method to update application user and role during workflow transitions*/
  /*  async updateApplicationUserAndRole(
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
      */

  /**
   * Upload file for application
   */
  async uploadFile(applicationId: number, dto: UploadFileDto): Promise<[any, any]> {
    try {
      // Validate application exists
      const application = await prisma.freshLicenseApplicationPersonalDetails.findUnique({
        where: { id: applicationId }
      });

      if (!application) {
        return ['Application not found', null];
      }

      // File size validation (10MB limit)
      const maxFileSize = 10 * 1024 * 1024; // 10MB in bytes
      if (dto.fileSize > maxFileSize) {
        return ['File size too large. Maximum allowed size is 10MB', null];
      }

      // Save file record to database
      const fileRecord = await prisma.fLAFFileUploads.create({
        data: {
          applicationId: applicationId,
          fileType: dto.fileType,
          fileName: dto.fileName,
          fileUrl: dto.fileUrl,
          fileSize: dto.fileSize
        }
      });

      return [null, {
        id: fileRecord.id,
        applicationId: fileRecord.applicationId,
        fileType: fileRecord.fileType,
        fileName: fileRecord.fileName,
        fileUrl: fileRecord.fileUrl,
        fileSize: fileRecord.fileSize,
        uploadedAt: fileRecord.uploadedAt
      }];

    } catch (error: any) {
      console.error('Error storing file metadata:', error);

      if (error.code === 'P2002') {
        return ['File metadata storage failed due to duplicate entry', null];
      }

      return [`File metadata storage failed: ${error.message || 'Unknown error'}`, null];
    }
  }

  /**
   * Get status ID by status code
   * This ensures we get the correct ID regardless of insertion order
   */
  private async getStatusIdByCode(statusCode: string): Promise<number> {
    const status = await prisma.statuses.findFirst({
      where: {
        code: statusCode,
        isActive: true
      },
      select: { id: true }
    });

    if (!status) {
      throw new Error(`Status with code '${statusCode}' not found or inactive`);
    }

    return status.id;
  }

  /**
   * Get standard status IDs from Statuses table
   * This ensures consistent status IDs across the application
   */
  async getStatusIds() {
    const statusCodes = ['DRAFT', 'INITIATE', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'];
    const statusMap: Record<string, number> = {};

    for (const code of statusCodes) {
      try {
        statusMap[code] = await this.getStatusIdByCode(code);
      } catch (error) {
        console.warn(`Status '${code}' not found in database`);
        // Don't throw error, just skip missing statuses
      }
    }

    return statusMap;
  }

  /**
   * Initialize default statuses if they don't exist
   * Call this method to ensure required statuses are available
   */
  async initializeDefaultStatuses() {
    const defaultStatuses = [
      { code: 'DRAFT', name: 'Draft', description: 'Application is being filled out' },
      { code: 'INITIATE', name: 'Initiate', description: 'Application has been submitted for review' },
      { code: 'UNDER_REVIEW', name: 'Under Review', description: 'Application is being reviewed by officer' },
      { code: 'APPROVED', name: 'Approved', description: 'Application has been approved' },
      { code: 'REJECTED', name: 'Rejected', description: 'Application has been rejected' }
    ];

    for (const statusData of defaultStatuses) {
      const existingStatus = await prisma.statuses.findFirst({
        where: { code: statusData.code }
      });

      if (!existingStatus) {
        await prisma.statuses.create({
          data: statusData
        });
      }
    }
  }
}
