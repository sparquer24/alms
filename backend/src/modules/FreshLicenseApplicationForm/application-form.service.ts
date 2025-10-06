import { Injectable, ConflictException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import prisma from '../../db/prismaClient';
import { Sex, FileType, LicensePurpose, ApplicationLifecycleStatus } from '@prisma/client';
import { UploadFileDto } from './dto/upload-file.dto';

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

    // Combined duplicate check against personal details table (reduce to one DB call)
    const whereOr: any[] = [];
    if (aadharNumberForPersonal) whereOr.push({ aadharNumber: aadharNumberForPersonal as any });
    const trimmedAck = acknowledgementNo ? String(acknowledgementNo).trim() : undefined;
    if (trimmedAck) whereOr.push({ acknowledgementNo: trimmedAck });

    if (whereOr.length > 0) {
      const existing = await prisma.freshLicenseApplicationPersonalDetails.findFirst({
        where: { OR: whereOr },
        select: { id: true, aadharNumber: true, acknowledgementNo: true },
      });
      if (existing) {
        if (aadharNumberForPersonal && existing.aadharNumber === aadharNumberForPersonal) {
          return [new ConflictException(`An application with Aadhaar ${aadharNumber} already exists.`), null];
        }
        if (trimmedAck && existing.acknowledgementNo === trimmedAck) {
          return [new ConflictException(`An application with acknowledgementNo ${trimmedAck} already exists.`), null];
        }
        // Fallback
        return [new ConflictException('An application with the provided identifier already exists.'), null];
      }
    }

    // Transaction: create only the personal-details row (no application)
    const created = await prisma.$transaction(async (tx) => {
      // Generate acknowledgementNo once
      const finalAcknowledgementNo = acknowledgementNo ?? `ALMS${Date.now()}`;

        // Determine lifecycle status: use provided value if valid, otherwise default to DRAFT
        let lifecycleStatus: ApplicationLifecycleStatus = ApplicationLifecycleStatus.DRAFT;
        if ((data as any).applicationLifecycleStatus) {
          const provided = (data as any).applicationLifecycleStatus as string;
          if (Object.values(ApplicationLifecycleStatus).includes(provided as any)) {
            lifecycleStatus = provided as ApplicationLifecycleStatus;
          }
        }

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
            applicationLifecycleStatus: lifecycleStatus,
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
   */
  async patchApplicationDetails(applicationId: number, data: any): Promise<[any, any]> {
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
          // Check if occupation already exists
          const existingOccupation = await tx.freshLicenseApplicationPersonalDetails.findUnique({
            where: { id: applicationId },
            select: { occupationAndBusinessId: true }
          });

          if (existingOccupation?.occupationAndBusinessId) {
            // Update existing occupation
            await tx.fLAFOccupationAndBusiness.update({
              where: { id: existingOccupation.occupationAndBusinessId },
              data: data.occupationAndBusiness
            });
          } else {
            // Create new occupation and link it
            const newOccupation = await tx.fLAFOccupationAndBusiness.create({
              data: data.occupationAndBusiness
            });
            await tx.freshLicenseApplicationPersonalDetails.update({
              where: { id: applicationId },
              data: { occupationAndBusinessId: newOccupation.id }
            });
          }
          updatedSections.push('occupationAndBusiness');
        }

        // 4. Handle Criminal Histories (Replace all existing)
        if (data.criminalHistories && Array.isArray(data.criminalHistories)) {
          // Delete existing criminal histories
          await tx.fLAFCriminalHistories.deleteMany({
            where: { applicationId }
          });

          // Create new criminal histories
          if (data.criminalHistories.length > 0) {
            const criminalHistoriesData = data.criminalHistories.map((history: any) => ({
              ...history,
              applicationId,
              dateOfSentence: history.dateOfSentence ? new Date(history.dateOfSentence) : null,
              bondDate: history.bondDate ? new Date(history.bondDate) : null,
              prohibitionDate: history.prohibitionDate ? new Date(history.prohibitionDate) : null
            }));

            await tx.fLAFCriminalHistories.createMany({
              data: criminalHistoriesData
            });
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
      });

      // Fetch updated application with all relations
      const updatedApplication = await prisma.freshLicenseApplicationPersonalDetails.findUnique({
        where: { id: applicationId },
        include: {
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

 /* async getApplicationById(id?: number | undefined, acknowledgementNo?: string | undefined | null): Promise<[any, any]> {
    try {
      let whereCondition: any = {};
      if (id) {
        whereCondition = { id };
      }
      if (acknowledgementNo) {
        whereCondition = { ...whereCondition, acknowledgementNo };
      }

      let application: any = await prisma.freshLicenseApplicationsForms.findUnique({
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
          FreshLicenseApplicationsFormWorkflowHistories: {
            orderBy: { createdAt: 'desc' },
            include: {
              previousRole: true,
              previousUser: true,
              nextRole: true,
              nextUser: true
            }
          }
        },
      });


      // Add previousUserName and previousRoleName to each workflow history entry
      if (application?.FreshLicenseApplicationsFormWorkflowHistories?.length) {
        for (const history of application.FreshLicenseApplicationsFormWorkflowHistories) {
          let previousUserName: string | null = null;
          let previousRoleName: string | null = null;
          if (history.previousUser) {
            previousUserName = history.previousUser.username;
          }
          if (history.previousRole) {
            previousRoleName = history.previousRole.name;
          }
          history.previousUserName = previousUserName;
          history.previousRoleName = previousRoleName;
          delete history.previousUser;
          delete history.previousRole;

          let nextUserName: string | null = null;
          let nextRoleName: string | null = null;
          if (history.nextUser) {
            nextUserName = history.nextUser.username;
          }
          if (history.nextRole) {
            nextRoleName = history.nextRole.name;
          }
          history.nextUserName = nextUserName;
          history.nextRoleName = nextRoleName;
          delete history.nextUser;
          delete history.nextRole;

        }
      }

      let usersInHierarchy: any[] = [];
      // Defensive: check presentAddress and policeStation
      if (application.presentAddress && application.presentAddress.policeStationId) {
        // Fetch the full policeStation hierarchy
        const policeStation = await prisma.policeStations.findUnique({
          where: { id: application.presentAddress.policeStationId },
          include: {
            division: {
              include: {
                zone: {
                  include: {
                    district: {
                      include: { state: true }
                    }
                  }
                }
              }
            }
          }
        });
        if (policeStation) {
          const division = policeStation.division;
          const zone = division?.zone;
          const district = zone?.district;
          const state = district?.state;
          const policeStationId = policeStation.id;
          const divisionId = division?.id;
          const zoneId = zone?.id;
          const districtId = district?.id;
          const stateId = state?.id;
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
                  roleId: true
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
                  roleId: true
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
                  roleId: true
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
                  roleId: true
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
                  roleId: true
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

  public async getFilteredApplications(filter: {
    statusIds?: number[];
    currentUserId?: string;
    page?: number;
    limit?: number;
    searchField?: string;
    search?: string;
    orderBy?: string;
    order?: 'asc' | 'desc';
    applicationId?: number;
    isOwned?: boolean| undefined;
  })  {
    // Build a compact, frontend-friendly query: include necessary relations
    try {
      const where: any = {};

      // Status filter (accepts numeric IDs)
      if (filter.statusIds && Array.isArray(filter.statusIds) && filter.statusIds.length > 0) {
        where.statusId = { in: filter.statusIds };
      }

      // If user asked for only owned applications, restrict to currentUserId
      if (filter.isOwned === true && filter.currentUserId) {
        const uid = Number(filter.currentUserId);
        if (!isNaN(uid)) where.currentUserId = uid;
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

      // Pagination
      const page = Math.max(Number(filter.page ?? 1), 1);
      const limit = Math.max(Number(filter.limit ?? 10), 1);
      const skip = (page - 1) * limit;

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
        // Include status code/name
        status: {
          select: {
            id: true,
            code: true,
            name: true,
          }
        },
        // Top-level state/district (names) for quick display
        state: { select: { id: true, name: true } },
        district: { select: { id: true, name: true } },
        // Addresses: include only addressLine and related names
        presentAddress: {
          select: {
            id: true,
            addressLine: true,
            sinceResiding: true,
            state: { select: { id: true, name: true } },
            district: { select: { id: true, name: true } },
            zone: { select: { id: true, name: true } },
            division: { select: { id: true, name: true } },
            policeStation: { select: { id: true, name: true } },
          }
        },
        permanentAddress: {
          select: {
            id: true,
            addressLine: true,
            sinceResiding: true,
            state: { select: { id: true, name: true } },
            district: { select: { id: true, name: true } },
            zone: { select: { id: true, name: true } },
            division: { select: { id: true, name: true } },
            policeStation: { select: { id: true, name: true } },
          }
        },
        // Users / roles: include only id and username/code for display
        currentUser: { select: { id: true, username: true } },
        previousUser: { select: { id: true, username: true } },
        currentRole: { select: { id: true, code: true, name: true } },
        previousRole: { select: { id: true, code: true, name: true } },
        // Include the most recent few workflow history items (lightweight)
        FreshLicenseApplicationsFormWorkflowHistories: {
          take: 3,
          orderBy: { createdAt: 'desc' as const },
          select: {
            id: true,
            actionTaken: true,
            remarks: true,
            createdAt: true,
            attachments: true,
            actiones: { select: { id: true, code: true, name: true } },
            nextUser: { select: { id: true, username: true } },
            previousUser: { select: { id: true, username: true } },
            nextRole: { select: { id: true, code: true, name: true } },
            previousRole: { select: { id: true, code: true, name: true } },
          }
        }
      };

      const [total, rawData] = await Promise.all([
        prisma.freshLicenseApplicationsForms.count({ where }),
        prisma.freshLicenseApplicationsForms.findMany({
          where,
          skip,
          take: limit,
          orderBy: orderByObj,
          select,
        }),
      ]);

      // Transform each application to a frontend-friendly shape and build usersInHierarchy
      const finalData: any[] = [];
      const combinedUsersMap: Record<string, any> = {};

      for (const row of rawData) {
        // Applicant name
        const applicantName = [row.firstName, row.middleName, row.lastName].filter(Boolean).join(' ') || 'Unknown Applicant';

        // State / district names
        const stateName = row.state ? row.state.name : null;
        const districtName = row.district ? row.district.name : null;

        // Roles / Users names
        const currentUserName = row.currentUser ? row.currentUser.username : null;
        const previousUserName = row.previousUser ? row.previousUser.username : null;
        const currentRoleName = row.currentRole ? (row.currentRole.name ?? row.currentRole.code) : null;
        const previousRoleName = row.previousRole ? (row.previousRole.name ?? row.previousRole.code) : null;

        // Status as code/name only
        const status = row.status ? { code: row.status.code, name: row.status.name } : null;

        // Transform addresses
        const transformAddress = (addr: any) => {
          if (!addr) return null;
          return {
            addressLine: addr.addressLine,
            sinceResiding: addr.sinceResiding,
            stateName: addr.state ? addr.state.name : null,
            districtName: addr.district ? addr.district.name : null,
            zoneName: addr.zone ? addr.zone.name : null,
            divisionName: addr.division ? addr.division.name : null,
            policeStationName: addr.policeStation ? addr.policeStation.name : null,
          };
        };

        const presentAddress = transformAddress(row.presentAddress);
        const permanentAddress = transformAddress(row.permanentAddress);

        // Transform workflow histories
        const workflowHistories = Array.isArray(row.FreshLicenseApplicationsFormWorkflowHistories)
          ? row.FreshLicenseApplicationsFormWorkflowHistories.map((h: any) => ({
              id: h.id,
              actionTaken: h.actionTaken,
              remarks: h.remarks,
              createdAt: h.createdAt,
              attachments: h.attachments || null,
              action: h.actiones ? (h.actiones.code ?? h.actiones.name) : null,
              previousUserName: h.previousUser ? h.previousUser.username : null,
              previousRoleName: h.previousRole ? (h.previousRole.name ?? h.previousRole.code) : null,
              nextUserName: h.nextUser ? h.nextUser.username : null,
              nextRoleName: h.nextRole ? (h.nextRole.name ?? h.nextRole.code) : null,
            }))
          : [];

        // Build usersInHierarchy for this application using a single OR query
        let usersInHierarchy: any[] = [];
        try {
          // Determine hierarchy ids from presentAddress
          const psId = row.presentAddress?.policeStation?.id ?? null;
          const divisionId = row.presentAddress?.division?.id ?? null;
          const zoneId = row.presentAddress?.zone?.id ?? null;
          const districtId = row.presentAddress?.district?.id ?? null;
          const stateId = row.presentAddress?.state?.id ?? null;

          const orClauses: any[] = [];
          if (psId) orClauses.push({ policeStationId: psId });
          if (divisionId) orClauses.push({ divisionId: divisionId, policeStationId: null });
          if (zoneId) orClauses.push({ zoneId: zoneId, divisionId: null });
          if (districtId) orClauses.push({ districtId: districtId, zoneId: null });
          if (stateId) orClauses.push({ stateId: stateId, districtId: null });

          if (orClauses.length > 0) {
            const users = await prisma.users.findMany({
              where: { OR: orClauses },
              select: {
                id: true,
                username: true,
                email: true,
                role: { select: { id: true, code: true, name: true } },
                stateId: true,
                districtId: true,
                zoneId: true,
                divisionId: true,
                policeStationId: true,
              }
            });

            // Map users to include roleName and level (to preserve specificity)
            usersInHierarchy = users.map(u => {
              let level = null as string | null;
              let locationName = null as string | null;
              if (psId && u.policeStationId === psId) {
                level = 'policeStation';
                locationName = row.presentAddress?.policeStation?.name ?? null;
              } else if (divisionId && u.divisionId === divisionId && u.policeStationId == null) {
                level = 'division';
                locationName = row.presentAddress?.division?.name ?? null;
              } else if (zoneId && u.zoneId === zoneId && u.divisionId == null) {
                level = 'zone';
                locationName = row.presentAddress?.zone?.name ?? null;
              } else if (districtId && u.districtId === districtId && u.zoneId == null) {
                level = 'district';
                locationName = row.presentAddress?.district?.name ?? null;
              } else if (stateId && u.stateId === stateId && u.districtId == null) {
                level = 'state';
                locationName = row.presentAddress?.state?.name ?? null;
              }

              const roleName = u.role ? (u.role.name ?? u.role.code) : null;

              // Add to combined map for top-level usersInHierarchy
              if (!combinedUsersMap[u.username]) {
                combinedUsersMap[u.username] = {
                  username: u.username,
                  email: u.email || null,
                  roleName,
                  level,
                  locationName,
                };
              }

              return {
                username: u.username,
                email: u.email || null,
                roleName,
                level,
                locationName,
              };
            });
          }
        } catch (e) {
          // ignore usersInHierarchy errors per application to avoid breaking whole list
          usersInHierarchy = [];
        }

        // Build final transformed object (strip raw id fields)
        const transformed = {
          id: row.id,
          acknowledgementNo: row.acknowledgementNo,
          applicantName,
          createdAt: row.createdAt,
          status,
          state: stateName,
          district: districtName,
          presentAddress,
          permanentAddress,
          currentUser: currentUserName,
          previousUser: previousUserName,
          currentRole: currentRoleName,
          previousRole: previousRoleName,
          workflowHistory: workflowHistories,
          usersInHierarchy,
        };

        finalData.push(transformed);
      }

      // Build combined usersInHierarchy array
      const usersInHierarchy = Object.values(combinedUsersMap);

      return [null, { total, data: finalData, usersInHierarchy }];
    } catch (error) {
      return [error, null];
    }
  }

  public async getUserApplications(userId: string) {
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

      // File size validation (2MB limit)
      const maxFileSize = 2 * 1024 * 1024; // 2MB in bytes
      if (dto.fileSize > maxFileSize) {
        return ['File size too large. Maximum allowed size is 2MB', null];
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
}
