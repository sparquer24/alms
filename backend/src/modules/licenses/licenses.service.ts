import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../services/prisma.service';
import { ArmsCategory, LicensePurpose, LicenseStatus, Prisma, Sex } from '@prisma/client';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import * as QRCode from 'qrcode';

/** Caller context for bulk import: identity plus the jurisdiction to scope rows to. */
export interface LicenseImportScope {
  userId?: number;
  stateId?: number;
  roleCode?: string;
}

/** A spreadsheet row keyed by canonical license field name (see IMPORT_FIELD_ALIASES). */
type NormalizedImportRow = Record<string, unknown>;

type ImportRowStatus = 'valid' | 'warning' | 'error' | 'skipped';

interface ImportRowOutcome {
  rowNumber: number;
  status: ImportRowStatus;
  errors: string[];
  warnings: string[];
  /** Present when the row passed validation and can be persisted. */
  data?: Record<string, any>;
  display: {
    licenseNumber: string | null;
    holderName: string | null;
    district: string | null;
    state: string | null;
  };
}

// Rows are validated and inserted one at a time so a single bad record cannot
// roll back a whole batch. The global ErrorsInterceptor times requests out at
// 60s, which this cap keeps comfortably under, so larger files should be split.
const MAX_IMPORT_ROWS = 2000;

@Injectable()
export class LicensesService {
  private readonly logger = new Logger(LicensesService.name);

  constructor(private prisma: PrismaService) { }

  /**
   * Maps a normalized spreadsheet header to the canonical license field name.
   * Keys are lowercased and stripped of every non-alphanumeric character, so
   * "License Number", "license_number" and "licenseNumber" all collapse to the
   * same entry. Both readable names ("district") and raw ids ("presentDistrictId")
   * are accepted for the address hierarchy.
   */
  private static readonly IMPORT_FIELD_ALIASES: Record<string, string> = {
    // identifiers
    licensenumber: 'licenseNumber',
    licenseno: 'licenseNumber',
    almslicenseid: 'almsLicenseId',
    almslicensenumber: 'almsLicenseId',
    // personal details
    firstname: 'firstName',
    middlename: 'middleName',
    lastname: 'lastName',
    parentorspousename: 'parentOrSpouseName',
    father: 'parentOrSpouseName',
    fathername: 'parentOrSpouseName',
    fathersname: 'parentOrSpouseName',
    fatherofapplicant: 'parentOrSpouseName',
    fatherorguardianname: 'parentOrSpouseName',
    // The licence list export labels this column "Father/Guardian Name".
    fatherguardianname: 'parentOrSpouseName',
    guardianname: 'parentOrSpouseName',
    spouse: 'parentOrSpouseName',
    spousename: 'parentOrSpouseName',
    husband: 'parentOrSpouseName',
    husbandname: 'parentOrSpouseName',
    // Combined name column produced by the licence export.
    licenseholdername: 'holderName',
    licenceholdername: 'holderName',
    nameoflicenseholder: 'holderName',
    sex: 'sex',
    gender: 'sex',
    dateofbirth: 'dateOfBirth',
    dob: 'dateOfBirth',
    placeofbirth: 'placeOfBirth',
    aadharnumber: 'aadharNumber',
    aadharno: 'aadharNumber',
    aadhaar: 'aadharNumber',
    aadhar: 'aadharNumber',
    pannumber: 'panNumber',
    panno: 'panNumber',
    pan: 'panNumber',
    // license terms
    issuedate: 'issueDate',
    validfrom: 'validFrom',
    validtill: 'validTill',
    expirydate: 'validTill',
    dateofexpiry: 'validTill',
    armscategory: 'armsCategory',
    weaponcategory: 'armsCategory',
    weapontype: 'armsCategory',
    areaofvalidity: 'areaOfValidity',
    ammunitiondescription: 'ammunitionDescription',
    licenceplacearea: 'licencePlaceArea',
    licenseplacearea: 'licencePlaceArea',
    specialconsiderationreason: 'specialConsiderationReason',
    needforlicense: 'needForLicense',
    licensepurpose: 'needForLicense',
    purpose: 'needForLicense',
    endorsedweapons: 'endorsedWeapons',
    weapons: 'endorsedWeapons',
    weapondetails: 'endorsedWeapons',
    // present address
    presentaddressline: 'presentAddressLine',
    currentaddress: 'presentAddressLine',
    presentaddress: 'presentAddressLine',
    address: 'presentAddressLine',
    presentstatename: 'presentStateName',
    presentstate: 'presentStateName',
    statename: 'presentStateName',
    state: 'presentStateName',
    presentstateid: 'presentStateId',
    presentdistrictname: 'presentDistrictName',
    presentdistrict: 'presentDistrictName',
    districtname: 'presentDistrictName',
    district: 'presentDistrictName',
    presentdistrictid: 'presentDistrictId',
    presentpolicestationname: 'presentPoliceStationName',
    presentpolicestation: 'presentPoliceStationName',
    policestationname: 'presentPoliceStationName',
    policestation: 'presentPoliceStationName',
    thana: 'presentPoliceStationName',
    presentpolicestationid: 'presentPoliceStationId',
    presentzonename: 'presentZoneName',
    presentzone: 'presentZoneName',
    zonename: 'presentZoneName',
    zone: 'presentZoneName',
    presentzoneid: 'presentZoneId',
    presentdivisionname: 'presentDivisionName',
    presentdivision: 'presentDivisionName',
    divisionname: 'presentDivisionName',
    division: 'presentDivisionName',
    presentdivisionid: 'presentDivisionId',
    presentrangeofficename: 'presentRangeOfficeName',
    presentrangeoffice: 'presentRangeOfficeName',
    rangeofficename: 'presentRangeOfficeName',
    rangeoffice: 'presentRangeOfficeName',
    presentrangeofficeid: 'presentRangeOfficeId',
    // permanent address
    permanentaddressline: 'permanentAddressLine',
    permanentaddress: 'permanentAddressLine',
    permanentstatename: 'permanentStateName',
    permanentstate: 'permanentStateName',
    permanentstateid: 'permanentStateId',
    permanentdistrictname: 'permanentDistrictName',
    permanentdistrict: 'permanentDistrictName',
    permanentdistrictid: 'permanentDistrictId',
    permanentpolicestationname: 'permanentPoliceStationName',
    permanentpolicestation: 'permanentPoliceStationName',
    permanentpolicestationid: 'permanentPoliceStationId',
    permanentzonename: 'permanentZoneName',
    permanentzone: 'permanentZoneName',
    permanentzoneid: 'permanentZoneId',
    permanentdivisionname: 'permanentDivisionName',
    permanentdivision: 'permanentDivisionName',
    permanentdivisionid: 'permanentDivisionId',
    permanentrangeofficename: 'permanentRangeOfficeName',
    permanentrangeoffice: 'permanentRangeOfficeName',
    permanentrangeofficeid: 'permanentRangeOfficeId',
    // occupation / miscellaneous
    occupation: 'occupation',
    officeaddress: 'officeAddress',
    status: 'status',
    licensestatus: 'status',
    remarks: 'remarks',
  };

  private normalizeApplicationType(lastModifiedAppType?: string | null): 'FRESH' | 'RENEWAL' | 'CANCELLATION' | null {
    if (!lastModifiedAppType) {
      return null;
    }

    const normalized = String(lastModifiedAppType).trim().toUpperCase();
    switch (normalized) {
      case 'FRESH':
      case 'FRESHAPPLICATION':
      case 'FRESH_LICENSE':
      case 'FRESHLICENSEAPPLICATION':
        return 'FRESH';
      case 'RENEWAL':
      case 'RENEWALAPPLICATION':
      case 'RENEWAL_APPLICATION':
        return 'RENEWAL';
      case 'CANCELLATION':
      case 'CANCEL':
      case 'CANCELLED':
      case 'CANCELREQUEST':
      case 'CANCEL_FORM_REQUEST':
        return 'CANCELLATION';
      default:
        return null;
    }
  }

  private buildFreshApplicationInclude() {
    return {
      workflowStatus: {
        select: {
          id: true,
          code: true,
          name: true,
        },
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
              name: true,
            },
          },
        },
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
              name: true,
            },
          },
        },
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
      biometricData: true,
      criminalHistories: true,
      licenseHistories: true,
      licenseDetails: {
        include: {
          requestedWeapons: true,
        },
      },
      fileUploads: true,
    };
  }

  private buildRenewalApplicationInclude() {
    return {
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
      biometricData: true
    };
  }

  private async attachFreshWorkflowHistories(application: any) {
    const workflowHistories = await this.prisma.freshLicenseApplicationsFormWorkflowHistories.findMany({
      where: { applicationId: application.id },
      orderBy: { createdAt: 'desc' },
      include: {
        previousRole: true,
        previousUser: true,
        nextRole: true,
        nextUser: true,
        actiones: true,
      },
    });

    if (workflowHistories.length > 0) {
      application.workflowHistories = workflowHistories.map(({ previousUser, previousRole, nextUser, nextRole, ...rest }: { previousUser: any; previousRole: any; nextUser: any; nextRole: any;[key: string]: any }) => ({
        ...rest,
        previousUserName: previousUser?.username ?? null,
        previousRoleName: previousRole?.name ?? null,
        nextUserName: nextUser?.username ?? null,
        nextRoleName: nextRole?.name ?? null,
      }));
    }

    return application;
  }

  private async loadApplicationForLicense(licenseRecord: any) {
    const applicationType = this.normalizeApplicationType(licenseRecord?.lastModifiedAppType);

    // Attempt type-specific lookup first
    if (applicationType === 'FRESH') {
      const appId = licenseRecord?.freshApplicationId;
      if (appId) {
        const application = await this.prisma.freshLicenseApplicationPersonalDetails.findUnique({
          where: { id: appId },
          include: this.buildFreshApplicationInclude(),
        });
        if (application) return application;
      }
    }

    if (applicationType === 'RENEWAL') {
      // Determine which renewal application ID to use.
      // If lastModifiedRenewalId is set, prefer it (it points to the most recently
      // approved renewal that modified the license).
      // Otherwise fall back to the standard renewalApplicationId.
      let appId = licenseRecord?.lastModifiedRenewalId ?? licenseRecord?.renewalApplicationId;

      if (!appId) {
        // If lastModifiedRenewalId is set but the linked renewal no longer exists,
        // fall back to renewalApplicationId as a safety net.
        appId = licenseRecord?.renewalApplicationId;
        if (appId) {
          const fallbackApp = await this.prisma.renewalFormPersonalDetails.findUnique({
            where: { id: appId },
            include: this.buildRenewalApplicationInclude(),
          });
          if (fallbackApp) {
            const freshAppId = await this.resolveFreshIdFromRenewal(fallbackApp.licenseNumber);
            return { ...fallbackApp, freshApplicationId: freshAppId };
          }
        }
        return null;
      }

      const application = await this.prisma.renewalFormPersonalDetails.findUnique({
        where: { id: appId },
        include: this.buildRenewalApplicationInclude(),
      });

      // If the preferred appId (lastModifiedRenewalId) doesn't exist, fall back
      if (!application && licenseRecord?.lastModifiedRenewalId) {
        const fallbackId = licenseRecord?.renewalApplicationId;
        if (fallbackId) {
          const fallbackApp = await this.prisma.renewalFormPersonalDetails.findUnique({
            where: { id: fallbackId },
            include: this.buildRenewalApplicationInclude(),
          });
          if (fallbackApp) {
            const freshAppId = await this.resolveFreshIdFromRenewal(fallbackApp.licenseNumber);
            return { ...fallbackApp, freshApplicationId: freshAppId };
          }
        }
      }

      if (application) {
        const freshAppId = await this.resolveFreshIdFromRenewal(application.licenseNumber);
        return {
          ...application,
          freshApplicationId: freshAppId,
        };
      }
    }

    if (applicationType === 'CANCELLATION') {
      const cancelAppId = licenseRecord?.cancelApplicationId;
      if (cancelAppId) {
        const cancelRequest = await this.prisma.cancelFormRequests.findUnique({
          where: { id: cancelAppId },
          include: {
            workflowStatus: true,
            requester: { select: { id: true, username: true } },
            actioner: { select: { id: true, username: true } },
            Licenses: { select: { id: true, licenseNumber: true } },
          }
        });
        if (cancelRequest) return cancelRequest;
      }
    }

    // Universal fallback: try all available application IDs regardless of type
    if (licenseRecord?.freshApplicationId) {
      const application = await this.prisma.freshLicenseApplicationPersonalDetails.findUnique({
        where: { id: licenseRecord.freshApplicationId },
        include: this.buildFreshApplicationInclude(),
      });
      if (application) return application;
    }

    if (licenseRecord?.renewalApplicationId) {
      const application = await this.prisma.renewalFormPersonalDetails.findUnique({
        where: { id: licenseRecord.renewalApplicationId },
        include: this.buildRenewalApplicationInclude(),
      });
      if (application) {
        const freshAppId = await this.resolveFreshIdFromRenewal(application.licenseNumber);
        return { ...application, freshApplicationId: freshAppId };
      }
    }

    if (licenseRecord?.cancelApplicationId) {
      const cancelRequest = await this.prisma.cancelFormRequests.findUnique({
        where: { id: licenseRecord.cancelApplicationId },
        include: {
          workflowStatus: true,
          requester: { select: { id: true, username: true } },
          actioner: { select: { id: true, username: true } },
          Licenses: { select: { id: true, licenseNumber: true } },
        }
      });
      if (cancelRequest) return cancelRequest;
    }

    // If we get here, the license exists but none of its related applications were found
    if (licenseRecord?.id) {
      this.logger.warn(
        `Orphaned license detected: ID ${licenseRecord.id}, number ${licenseRecord.licenseNumber ?? 'N/A'}. ` +
        `No related application found for type: ${licenseRecord.lastModifiedAppType ?? 'null'}.`
      );
    }

    return null;
  }

  /**
   * Resolve the fresh application ID from a renewal's license number.
   * The renewal's licenseNumber matches the fresh application's acknowledgementNo.
   */
  private async resolveFreshIdFromRenewal(licenseNumber?: string | null): Promise<number | null> {
    if (!licenseNumber) return null;
    const freshApp = await this.prisma.freshLicenseApplicationPersonalDetails.findFirst({
      where: { acknowledgementNo: licenseNumber },
      select: { id: true },
    });
    return freshApp?.id ?? null;
  }

  buildLicenseDetailResponse(license: any, sourceApplication: any) {
    if (!license) {
      return null;
    }

    // Build base license metadata that is always present
    const baseMetadata: Record<string, any> = {
      licenseId: license.id,
      licenseNumber: license.licenseNumber,
      almsLicenseId: license.almsLicenseId,
      freshApplicationId: license.freshApplicationId,
      renewalApplicationId: license.renewalApplicationId,
      cancelApplicationId: license.cancelApplicationId,
      lastModifiedAppType: license.lastModifiedAppType,
      lastModifiedAppId: license.lastModifiedAppId ?? null,
      previousModifiedAppType: license.previousModifiedAppType ?? null,
      previousModifiedAppId: license.previousModifiedAppId ?? null,
      lastModifiedRenewalId: license.lastModifiedRenewalId ?? null,
      renewalIds: license.renewalIds ?? [],
    };

    // If no source application found, this is typically a bulk-imported license
    // (lastModifiedAppType 'IMPORT') that was never created through the fresh/renewal
    // application flow. Its applicant/address/license details live directly on the
    // license row itself, so build an equivalent response from those columns instead
    // of returning bare metadata -- otherwise the license details page and the
    // renewal form (which requires isSubmit=true) see an empty/incomplete record.
    if (!sourceApplication) {
      const hasOwnApplicantData = Boolean(license.firstName || license.lastName);
      if (!hasOwnApplicantData) {
        return {
          ...baseMetadata,
          applicantName: null,
        };
      }

      return {
        ...baseMetadata,
        isSubmit: true,
        status: license.status,
        firstName: license.firstName,
        middleName: license.middleName,
        lastName: license.lastName,
        applicantName: [license.firstName, license.middleName, license.lastName]
          .filter(Boolean)
          .join(' '),
        parentOrSpouseName: license.parentOrSpouseName,
        sex: license.sex,
        dateOfBirth: license.dateOfBirth,
        placeOfBirth: license.placeOfBirth,
        aadharNumber: license.aadharNumber,
        panNumber: license.panNumber,
        issueDate: license.issueDate,
        validFrom: license.validFrom,
        validTill: license.validTill,
        presentAddress: {
          addressLine: license.presentAddressLine,
          stateId: license.presentStateId,
          districtId: license.presentDistrictId,
          policeStationId: license.presentPoliceStationId,
          zoneId: license.presentZoneId,
          divisionId: license.presentDivisionId,
          rangeOfficeId: license.presentRangeOfficeId,
        },
        permanentAddress: {
          addressLine: license.permanentAddressLine,
          stateId: license.permanentStateId,
          districtId: license.permanentDistrictId,
          policeStationId: license.permanentPoliceStationId,
          zoneId: license.permanentZoneId,
          divisionId: license.permanentDivisionId,
          rangeOfficeId: license.permanentRangeOfficeId,
        },
        occupationAndBusiness:
          license.occupation || license.officeAddress
            ? {
                occupation: license.occupation,
                officeAddress: license.officeAddress,
              }
            : null,
        licenseDetails: [
          {
            armsCategory: license.armsCategory,
            areaOfValidity: license.areaOfValidity,
            ammunitionDescription: license.ammunitionDescription,
            licencePlaceArea: license.licencePlaceArea,
            specialConsiderationReason: license.specialConsiderationReason,
            needForLicense: license.needForLicense,
            licenseValidity: license.validTill,
            requestedWeapons: license.endorsedWeapons ?? [],
          },
        ],
      };
    }

    const excludedKeys = [
      'presentAddressId',
      'permanentAddressId',
      'contactInfoId',
      'occupationInfoId',
      'biometricDataId',
      'statusId',
      'workflowStatusId',
      'currentRoleId',
      'previousRoleId',
      'currentUserId',
      'previousUserId',
      'stateId',
      'districtId',
    ];

    const transformed: Record<string, any> = {
      ...sourceApplication,
      ...baseMetadata,
      applicantName: [sourceApplication.firstName, sourceApplication.middleName, sourceApplication.lastName].filter(Boolean).join(' '),
      // Always expose documents from the most recently approved application (fresh or renewal).
      // The sourceApplication already reflects the last approved application per loadApplicationForLicense.
      documents: sourceApplication.fileUploads ?? [],
    };

    excludedKeys.forEach((key) => {
      delete transformed[key];
    });

    return transformed;
  }

  async generateLicensePdf(freshApplicationId: number, issuedBy: number) {
    // Check if license already exists
    const existingLicense = await this.prisma.licenses.findFirst({
      where: { freshApplicationId }
    });

    if (existingLicense) {
      this.logger.log(`License already exists for application ${freshApplicationId}, returning existing`);
      return existingLicense;
    }

    const application = await this.prisma.freshLicenseApplicationPersonalDetails.findUnique({
      where: { id: freshApplicationId },
      include: {
        presentAddress: { include: { state: true, district: true, policeStation: true, zone: true, division: true, RangeOffices: true } },
        permanentAddress: { include: { state: true, district: true, policeStation: true, zone: true, division: true, RangeOffices: true } },
        occupationAndBusiness: { include: { state: true, district: true } },
        criminalHistories: true,
        licenseHistories: true,
        licenseDetails: { include: { requestedWeapons: true } }
      }
    });

    if (!application) throw new Error('Application not found');

    // Fetch Applicant's Photograph
    const photoUpload = await this.prisma.fLAFFileUploads.findFirst({
      where: { applicationId: freshApplicationId, fileType: 'PHOTOGRAPH' }
    });

    let photoBase64 = '';
    if (photoUpload && (photoUpload.fileUrl || photoUpload.fileName)) {
      try {
        let photoPath = photoUpload.fileUrl;
        if (photoPath && photoPath.startsWith('data:image')) {
          // It's already a base64 string from the frontend
          photoBase64 = photoPath;
        } else if (photoPath && photoPath.startsWith('/uploads/')) {
          photoPath = path.join(process.cwd(), photoPath);
          if (fs.existsSync(photoPath)) {
            const photoBuffer = fs.readFileSync(photoPath);
            const ext = path.extname(photoPath).toLowerCase().replace('.', '') || 'jpeg';
            photoBase64 = `data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,${photoBuffer.toString('base64')}`;
          }
        } else {
          const nameToUse = photoPath ? photoPath.split('/').pop() : photoUpload.fileName;
          const localPath = path.join(process.cwd(), 'uploads', nameToUse || '');
          if (fs.existsSync(localPath)) {
            const photoBuffer = fs.readFileSync(localPath);
            const ext = path.extname(localPath).toLowerCase().replace('.', '') || 'jpeg';
            photoBase64 = `data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,${photoBuffer.toString('base64')}`;
          } else {
            this.logger.warn(`Photograph file not found at path: ${localPath}`);
          }
        }
      } catch (err) {
        this.logger.error('Failed to read photograph: ' + err);
      }
    }

    // Generate license number in LUAN format: LUAN-YYYY-MM-DD-HH-mm-ss-mmmmmm
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const ms = now.getMilliseconds().toString().padStart(6, '0');
    const licenseNumber = `LUAN${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}${ms}`;

    const validFrom = new Date();
    const validTill = new Date();
    validTill.setFullYear(validTill.getFullYear() + 2); // 2 years validity

    // Generate QR Code
    const qrData = JSON.stringify({
      licenseNumber,
      freshApplicationId,
      validTill: validTill.toISOString().split('T')[0]
    });
    const qrCodeUrl = await QRCode.toDataURL(qrData, { width: 120, margin: 1 });

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700;900&family=Open+Sans:wght@400;600&display=swap');
            
            body { 
              font-family: 'Open Sans', sans-serif; 
              padding: 0; 
              margin: 0;
              background-color: #fff;
              color: #1a1a1a;
            }
            .document-container {
              padding: 40px;
              margin: 20px;
              border: 8px double #2c3e50;
              position: relative;
              background: #fff;
              min-height: 950px;
            }
            .watermark {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 120px;
              color: rgba(44, 62, 80, 0.05);
              font-family: 'Merriweather', serif;
              font-weight: 900;
              z-index: 1;
              pointer-events: none;
              white-space: nowrap;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px;
              position: relative;
              z-index: 2;
            }
            .header h1 {
              font-family: 'Merriweather', serif;
              font-size: 28px;
              font-weight: 900;
              margin: 0 0 5px 0;
              text-transform: uppercase;
              color: #2c3e50;
              letter-spacing: 2px;
            }
            .header h2 {
              font-family: 'Merriweather', serif;
              font-size: 18px;
              margin: 0 0 15px 0;
              color: #34495e;
              font-weight: 700;
            }
            .header h3 {
              font-family: 'Open Sans', sans-serif;
              font-size: 14px;
              margin: 0 0 20px 0;
              color: #7f8c8d;
              font-weight: 600;
              text-transform: uppercase;
              border-bottom: 2px solid #2c3e50;
              padding-bottom: 15px;
            }
            .photo-box {
              position: absolute;
              top: 40px;
              right: 40px;
              width: 120px;
              height: 150px;
              border: 2px dashed #95a5a6;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #95a5a6;
              font-size: 12px;
              text-align: center;
              background: #f8f9fa;
              z-index: 2;
            }
            .content-grid { 
              display: grid;
              grid-template-columns: 1fr;
              gap: 20px;
              position: relative;
              z-index: 2;
              margin-top: 40px;
            }
            .section-title {
              font-family: 'Merriweather', serif;
              font-size: 16px;
              font-weight: 700;
              background-color: #f1f2f6;
              padding: 8px 15px;
              border-left: 4px solid #2c3e50;
              margin: 20px 0 10px 0;
              color: #2c3e50;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
              font-size: 14px;
            }
            th, td {
              border: 1px solid #dfe4ea;
              padding: 10px 15px;
              text-align: left;
            }
            th {
              background-color: #f8f9fa;
              color: #2f3542;
              width: 35%;
              font-weight: 600;
            }
            td {
              color: #1e272e;
              font-weight: 400;
            }
            .footer { 
              margin-top: 80px; 
              display: flex;
              justify-content: space-between;
              position: relative;
              z-index: 2;
            }
            .signature-block {
              text-align: center;
              width: 250px;
            }
            .signature-line {
              border-top: 1px solid #2c3e50;
              margin-top: 60px;
              padding-top: 10px;
            }
            .signature-title {
              font-weight: 600;
              font-size: 14px;
              color: #2c3e50;
            }
            .signature-subtitle {
              font-size: 12px;
              color: #7f8c8d;
              margin-top: 3px;
            }
            .qr-placeholder {
              width: 100px;
              height: 100px;
              border: 2px solid #2c3e50;
              padding: 5px;
              background: #fff;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 10px;
              color: #2c3e50;
              text-align: center;
            }
            .terms {
              margin-top: 40px;
              font-size: 11px;
              color: #57606f;
              line-height: 1.5;
              border-top: 1px dashed #ced6e0;
              padding-top: 15px;
            }
            .terms ol {
              margin: 5px 0 0 0;
              padding-left: 20px;
            }
          </style>
        </head>
        <body>
          <div class="document-container">
            <div class="watermark">APPROVED</div>
            
            <div class="photo-box">
              ${photoBase64 ? '<img src="' + photoBase64 + '" alt="Applicant Photo" style="max-width: 100%; max-height: 100%; object-fit: cover;">' : 'Passport Size<br>Photograph'}
            </div>

            <div class="header">
              <h1>GOVERNMENT OF STATE</h1>
              <h2>HOME DEPARTMENT</h2>
              <h3>FORM III - ARMS LICENCE<br><span style="font-size: 11px; font-weight: 400; text-transform: none;">(See Rule 11 of the Arms Rules, 2016)</span></h3>
            </div>
            
            <div class="content-grid">
              
              <div class="section-title">1. Licence Details</div>
              <table>
                <tr>
                  <th>Licence UIN (Number)</th>
                  <td style="font-family: monospace; font-size: 16px; font-weight: bold; letter-spacing: 1px;">${licenseNumber}</td>
                </tr>
                <tr>
                  <th>Date of Issue</th>
                  <td>${validFrom.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</td>
                </tr>
                <tr>
                  <th>Valid Till</th>
                  <td style="color: #c0392b; font-weight: 600;">${validTill ? validTill.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : 'N/A'}</td>
                </tr>
                <tr>
                  <th>Area of Validity</th>
                  <td>Whole of State</td>
                </tr>
              </table>

              <div class="section-title">2. Licensee Particulars</div>
              <table>
                <tr>
                  <th>Full Name</th>
                  <td style="font-weight: bold; text-transform: uppercase;">${application.firstName} ${application.lastName}</td>
                </tr>
                <tr>
                  <th>Father's / Spouse's Name</th>
                  <td>${application.parentOrSpouseName}</td>
                </tr>
                <tr>
                  <th>Date of Birth</th>
                  <td>${application.dateOfBirth ? new Date(application.dateOfBirth).toLocaleDateString('en-IN') : 'N/A'}</td>
                </tr>
                <tr>
                  <th>Present Address</th>
                  <td>${application.presentAddress ? application.presentAddress.addressLine + ', ' + (application.presentAddress.policeStation?.name || '') + ', ' + (application.presentAddress.district?.name || '') + ', ' + (application.presentAddress.state?.name || '') : 'N/A'}</td>
                </tr>
                <tr>
                  <th>Occupation</th>
                  <td>${application.occupationAndBusiness ? application.occupationAndBusiness.occupation : 'N/A'}</td>
                </tr>
              </table>

              <div class="section-title">3. Background & History</div>
              <table>
                <tr>
                  <th>Criminal History Found</th>
                  <td>${application.criminalHistories && application.criminalHistories.length > 0 ? 'Yes (Check ALMS for details)' : 'None'}</td>
                </tr>
                <tr>
                  <th>Previous License Applied</th>
                  <td>${application.licenseHistories && application.licenseHistories.length > 0 && application.licenseHistories[0].hasAppliedBefore ? 'Yes' : 'No'}</td>
                </tr>
              </table>

              <div class="section-title">3. Arms & Ammunition Authorized</div>
              <table>
                <tr>
                  <th>Category of Arms</th>
                  <td>N.P.B. (Non-Prohibited Bore)</td>
                </tr>
                <tr>
                  <th>Description of Arms</th>
                  <td>Revolver / Pistol / Rifle</td>
                </tr>
                <tr>
                  <th>Max Ammunition Allowed</th>
                  <td>Purchasable: 50 | Possessable: 50</td>
                </tr>
              </table>
            </div>

            <div class="terms">
              <strong>CONDITIONS OF LICENCE:</strong>
              <ol>
                <li>This licence is granted subject to the provisions of the Arms Act, 1959 and the Arms Rules, 2016.</li>
                <li>The licensee shall not carry any arms covered by the licence in any public place unless appropriately concealed.</li>
                <li>The weapons and ammunition must be securely kept to prevent unauthorized access.</li>
                <li>This document is digitally generated and must be verified against the ALMS central database.</li>
              </ol>
            </div>

            <div class="footer">
              <div class="qr-placeholder" style="border: none; padding: 0;">
                <img src="${qrCodeUrl}" alt="QR Code" style="width: 100%; height: 100%;">
              </div>
              <div class="signature-block">
                <div class="signature-line">
                  <div class="signature-title">Licensing Authority</div>
                  <div class="signature-subtitle">Digitally Signed & Approved</div>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });

    const pdfBuffer = await page.pdf({ format: 'A4' });
    await browser.close();

    const base64Pdf = Buffer.from(pdfBuffer).toString('base64');
    const dataUri = `data:application/pdf;base64,${base64Pdf}`;

    // Populate denormalized fields from the application data
    const licenseFirstLicenseDetail = application.licenseDetails?.[0];
    const presentAddr = application.presentAddress;
    const permAddr = application.permanentAddress;

    // Wrap license creation and workflow history in a transaction for atomicity
    const license = await this.prisma.$transaction(async (tx: any) => {
      const created = await tx.licenses.create({
        data: {
          // === IDENTIFIERS ===
          licenseNumber,
          almsLicenseId: application.almsLicenseId,
          freshApplicationId,
          issueDate: new Date(),

          // === PERSONAL DETAILS ===
          firstName: application.firstName,
          middleName: application.middleName,
          lastName: application.lastName,
          parentOrSpouseName: application.parentOrSpouseName,
          sex: application.sex,
          dateOfBirth: application.dateOfBirth || undefined,
          placeOfBirth: application.placeOfBirth,
          aadharNumber: application.aadharNumber,
          panNumber: application.panNumber,

          // === LICENSE TERMS ===
          validFrom,
          validTill,
          armsCategory: licenseFirstLicenseDetail?.armsCategory || undefined,
          areaOfValidity: licenseFirstLicenseDetail?.areaOfValidity,
          ammunitionDescription: licenseFirstLicenseDetail?.ammunitionDescription,
          licencePlaceArea: licenseFirstLicenseDetail?.licencePlaceArea,
          specialConsiderationReason: licenseFirstLicenseDetail?.specialConsiderationReason,
          needForLicense: licenseFirstLicenseDetail?.needForLicense || undefined,

          // === PRESENT ADDRESS ===
          presentAddressLine: presentAddr?.addressLine,
          presentStateId: presentAddr?.stateId,
          presentDistrictId: presentAddr?.districtId,
          presentPoliceStationId: presentAddr?.policeStationId,
          presentZoneId: presentAddr?.zoneId,
          presentDivisionId: presentAddr?.divisionId,
          presentRangeOfficeId: presentAddr?.rangeOfficeId,

          // === PERMANENT ADDRESS ===
          permanentAddressLine: permAddr?.addressLine,
          permanentStateId: permAddr?.stateId,
          permanentDistrictId: permAddr?.districtId,
          permanentPoliceStationId: permAddr?.policeStationId,
          permanentZoneId: permAddr?.zoneId,
          permanentDivisionId: permAddr?.divisionId,
          permanentRangeOfficeId: permAddr?.rangeOfficeId,

          // === OCCUPATION ===
          occupation: application.occupationAndBusiness?.occupation,
          officeAddress: application.occupationAndBusiness?.officeAddress,

          // === STATUS ===
          status: LicenseStatus.ACTIVE,

          // === DOCUMENTS ===
          pdfUrl: dataUri,
          qrCodeUrl,
          issuedBy,

          // === ENDORSED WEAPONS ===
          endorsedWeapons: licenseFirstLicenseDetail?.requestedWeapons?.length
            ? { connect: licenseFirstLicenseDetail.requestedWeapons.map((w: any) => ({ id: w.id })) }
            : undefined,

          // === TRACKING ===
          renewalCount: 0,
          lastModifiedAppType: 'FRESH',
          lastModifiedAppId: freshApplicationId,
        }
      });

      // Create LicenseWorkflowHistory entry within the same transaction
      await tx.licenseWorkflowHistory.create({
        data: {
          licenseId: created.id,
          action: 'ISSUED',
          applicationId: freshApplicationId,
          applicationType: 'FRESH',
          newStatus: LicenseStatus.ACTIVE,
          changedBy: issuedBy,
          remarks: 'License issued upon fresh application approval',
        }
      });

      return created;
    });

    this.logger.log(`Generated license ${licenseNumber} for application ${freshApplicationId}`);
    return license;
  }

  /**
   * Get a single license by ID with full details
   * Accepts either:
   * - A numeric license ID (e.g. "4")   -> queries by licenseId field
   * - A LUAN-prefixed license number     -> queries by licenseNumber field
   * First checks for an existing draft renewal application; if found, returns it.
   * Otherwise falls through to the standard license -> source application flow.
   */
  async getLicenseById(id: string) {
    const isLicenseNumber = id.toUpperCase().startsWith('LUAN');

    // First check: is there an existing draft renewal for this license?
    // With multi-renewal support, multiple renewals can share the same licenseNumber.
    // We order by createdAt descending to get the most recent draft.
    const draftRenewal = await this.prisma.renewalFormPersonalDetails.findFirst({
      where: isLicenseNumber
        ? { licenseNumber: id, isSubmit: false }
        : {
          OR: [
            { licenseId: Number(id) },
            { id: Number(id) },
          ],
          isSubmit: false,
        },
      orderBy: { createdAt: 'desc' },
      include: this.buildRenewalApplicationInclude(),
    });
    console.log('Draft Renewal Check:', draftRenewal);
    if (draftRenewal) {
      return draftRenewal;
    }
    console.log('No draft renewal found, proceeding to standard license lookup for id:', id); ``
    // Fall through to standard license lookup
    const licenseRecord = await this.prisma.licenses.findUnique({
      where: isLicenseNumber
        ? { licenseNumber: id }
        : { id: Number(id) },
      include: {
        endorsedWeapons: true,
      },
    })
    console.log('License Record:', licenseRecord);
    if (!licenseRecord) {
      return null;
    }

    const sourceApplication = await this.loadApplicationForLicense(licenseRecord as any);
    const mapped = this.buildLicenseDetailResponse(licenseRecord, sourceApplication);

    if (!mapped) {
      return null;
    }

    return mapped;
  }

  /**
   * List/search licenses with filtering and pagination
   */
  /** Roles whose license visibility is scoped to their own district (CP, JTCP, and the arms section). */
  private static readonly DISTRICT_SCOPED_ROLES = new Set(['CP', 'JTCP', 'ARMS_SUPDT', 'ARMS_SEAT', 'ACO']);

  /** Roles whose license visibility is scoped to their own zone. */
  private static readonly ZONE_SCOPED_ROLES = new Set(['DCP', 'ZS']);

  /**
   * Resolves the Prisma `where` fragment that scopes licenses to a user's jurisdiction.
   * SUPER_ADMIN sees everything. District/zone-scoped roles are narrowed to their own
   * district/zone; every other role falls back to the existing state-level scoping.
   */
  private buildLocationScopeWhere(scope: { stateId?: number; districtId?: number; zoneId?: number; roleCode?: string }): Record<string, any> {
    const roleCode = scope.roleCode?.toUpperCase();

    if (!roleCode || roleCode === 'SUPER_ADMIN') {
      return {};
    }

    if (LicensesService.DISTRICT_SCOPED_ROLES.has(roleCode)) {
      return scope.districtId ? { presentDistrictId: scope.districtId } : {};
    }

    if (LicensesService.ZONE_SCOPED_ROLES.has(roleCode)) {
      return scope.zoneId ? { presentZoneId: scope.zoneId } : {};
    }

    return scope.stateId ? { presentStateId: scope.stateId } : {};
  }

  async getAllLicenses(filters: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    licenseNumber?: string;
    aadharNumber?: string;
    freshApplicationId?: number;
    expiringWithinDays?: number;
    createdFrom?: string;
    purpose?: string;
    renewedOnly?: boolean;
    orderBy?: string;
    order?: 'asc' | 'desc';
    stateId?: number;
    districtId?: number;
    zoneId?: number;
    roleCode?: string;
  }) {
    const page = Math.max(Number(filters.page ?? 1), 1);
    const limit = Math.max(Number(filters.limit ?? 10), 1);
    const skip = (page - 1) * limit;

    const where: any = {
      ...this.buildLocationScopeWhere(filters),
    };

    if (filters.freshApplicationId) {
      where.freshApplicationId = filters.freshApplicationId;
    }

    if (filters.expiringWithinDays) {
      const now = new Date();
      const until = new Date(Date.now() + filters.expiringWithinDays * 24 * 60 * 60 * 1000);
      where.validTill = {
        gte: now,
        lte: until,
      };
    }

    if (filters.createdFrom) {
      const normalized = String(filters.createdFrom).toUpperCase();
      if (normalized.includes('IMPORT')) {
        where.lastModifiedAppType = 'IMPORT';
      } else if (normalized.includes('RENEWAL')) {
        where.lastModifiedAppType = 'RENEWAL';
      } else if (normalized.includes('CANCEL')) {
        where.lastModifiedAppType = 'CANCELLATION';
      } else if (normalized.includes('FRESH')) {
        where.lastModifiedAppType = 'FRESH';
      }
    }

    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { licenseNumber: { contains: filters.search, mode: 'insensitive' } },
        { aadharNumber: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.licenseNumber) {
      where.licenseNumber = { contains: filters.licenseNumber, mode: 'insensitive' };
    }

    if (filters.aadharNumber) {
      where.aadharNumber = { contains: filters.aadharNumber };
    }

    if (filters.purpose) {
      where.needForLicense = filters.purpose as any;
    }

    if (filters.renewedOnly) {
      where.renewalCount = { gt: 0 };
    }

    const allowedOrderFields = ['id', 'licenseNumber', 'firstName', 'lastName', 'createdAt', 'validTill', 'status'];
    const orderByField = (filters.orderBy && allowedOrderFields.includes(filters.orderBy)) ? filters.orderBy : 'createdAt';
    const orderDirection = filters.order && filters.order.toLowerCase() === 'asc' ? 'asc' : 'desc';

    const [licenses, total] = await Promise.all([
      this.prisma.licenses.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderByField]: orderDirection },
        include: {
          endorsedWeapons: {
            select: { id: true, name: true }
          }
        }
      }),
      this.prisma.licenses.count({ where }),
    ]);

    // Batch-enrich licenses with source application metadata using type-based lookups
    const freshLicenseIds: number[] = [];
    const renewalLicenseIds: number[] = [];
    for (const lic of licenses) {
      const appType = this.normalizeApplicationType(lic.lastModifiedAppType);
      if (lic.freshApplicationId && appType === 'FRESH') {
        freshLicenseIds.push(lic.freshApplicationId);
      } else if (lic.renewalApplicationId && appType === 'RENEWAL') {
        renewalLicenseIds.push(lic.renewalApplicationId);
      }
    }

    // Fetch all fresh source apps in one query
    const freshApps = freshLicenseIds.length > 0
      ? await this.prisma.freshLicenseApplicationPersonalDetails.findMany({
        where: { id: { in: freshLicenseIds } },
        select: { id: true, acknowledgementNo: true, almsLicenseId: true },
      })
      : [];
    const freshAppMap = new Map(freshApps.map(a => [a.id, a]));

    // Fetch all renewal source apps in one query
    const renewalApps = renewalLicenseIds.length > 0
      ? await this.prisma.renewalFormPersonalDetails.findMany({
        where: { id: { in: renewalLicenseIds } },
        select: { id: true, acknowledgementNo: true },
      })
      : [];
    const renewalAppMap = new Map(renewalApps.map(a => [a.id, a]));

    // Enrich each license
    const data = licenses.map((license) => {
      let sourceAppMeta: { id: number; acknowledgementNo: string | null; almsLicenseId: string | null } | null = null;
      const appType = this.normalizeApplicationType(license.lastModifiedAppType);
      if (license.freshApplicationId && appType === 'FRESH') {
        const app = freshAppMap.get(license.freshApplicationId);
        if (app) {
          sourceAppMeta = { id: app.id, acknowledgementNo: app.acknowledgementNo, almsLicenseId: app.almsLicenseId };
        }
      } else if (license.renewalApplicationId && appType === 'RENEWAL') {
        const app = renewalAppMap.get(license.renewalApplicationId);
        if (app) {
          sourceAppMeta = { id: app.id, acknowledgementNo: app.acknowledgementNo, almsLicenseId: null };
        }
      }
      return { ...license, sourceApplication: sourceAppMeta };
    });

    return { data: await this.attachLocationNames(data), total, page, limit };
  }

  /**
   * Get workflow history for a license
   */
  async getLicenseHistory(licenseId: number) {
    return this.prisma.licenseWorkflowHistory.findMany({
      where: { licenseId },
      orderBy: { createdAt: 'desc' },
      include: {
        changedByUser: {
          select: { id: true, username: true }
        }
      }
    });
  }

  /**
   * Lookup license by license number
   * First checks for an existing draft renewal application; if found, returns it.
   * Otherwise falls through to the standard license lookup.
   */
  async getLicenseByNumber(licenseNumber: string) {
    const license = await this.prisma.licenses.findUnique({
      where: { licenseNumber },
      include: {
        issuedByUser: {
          select: { id: true, username: true }
        },
        endorsedWeapons: {
          select: { id: true, name: true, description: true }
        }
      }
    });

    if (license) {
      const appType = this.normalizeApplicationType(license.lastModifiedAppType);
      let sourceAppMeta: { id: number; acknowledgementNo: string | null; almsLicenseId: string | null } | null = null;
      if (appType === 'FRESH' && license.freshApplicationId) {
        const app = await this.prisma.freshLicenseApplicationPersonalDetails.findUnique({
          where: { id: license.freshApplicationId },
          select: { id: true, acknowledgementNo: true, almsLicenseId: true },
        });
        if (app) {
          sourceAppMeta = { id: app.id, acknowledgementNo: app.acknowledgementNo, almsLicenseId: app.almsLicenseId };
        }
      } else if (appType === 'RENEWAL' && license.renewalApplicationId) {
        const app = await this.prisma.renewalFormPersonalDetails.findUnique({
          where: { id: license.renewalApplicationId },
          select: { id: true, acknowledgementNo: true },
        });
        if (app) {
          sourceAppMeta = { id: app.id, acknowledgementNo: app.acknowledgementNo, almsLicenseId: null };
        }
      }
      return { ...license, sourceApplication: sourceAppMeta };
    }

    return null;
  }

  /**
   * Lookup licenses by aadhar number
   */
  async getLicenseByAadhar(aadharNumber: string) {
    return this.prisma.licenses.findMany({
      where: { aadharNumber },
      include: {
        endorsedWeapons: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Get license statistics (counts by status)
   * Filters by state for ADMIN users, SUPER_ADMIN sees all states
   */
  async getLicenseStatistics(stateId?: number, roleCode?: string, districtId?: number, zoneId?: number) {
    const now = new Date();
    const daysFromNow = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const baseWhere: any = {
      ...this.buildLocationScopeWhere({ stateId, districtId, zoneId, roleCode }),
    };

    const [total, activeCount, expiredCount, cancelledCount, suspendedCount, revokedCount, expiringSoonCount, expiringWithin60Days, expiringWithin90Days, renewedCount] = await Promise.all([
      this.prisma.licenses.count({ where: baseWhere }),
      this.prisma.licenses.count({ where: { ...baseWhere, status: 'ACTIVE' as any } }),
      this.prisma.licenses.count({ where: { ...baseWhere, status: 'EXPIRED' as any } }),
      this.prisma.licenses.count({ where: { ...baseWhere, status: 'CANCELLED' as any } }),
      this.prisma.licenses.count({ where: { ...baseWhere, status: 'SUSPENDED' as any } }),
      this.prisma.licenses.count({ where: { ...baseWhere, status: 'REVOKED' as any } }),
      this.prisma.licenses.count({
        where: {
          ...baseWhere,
          status: 'ACTIVE' as any,
          validTill: {
            lte: daysFromNow(30),
            gte: now
          }
        }
      }),
      this.prisma.licenses.count({
        where: {
          ...baseWhere,
          status: 'ACTIVE' as any,
          validTill: {
            lte: daysFromNow(60),
            gte: now
          }
        }
      }),
      this.prisma.licenses.count({
        where: {
          ...baseWhere,
          status: 'ACTIVE' as any,
          validTill: {
            lte: daysFromNow(90),
            gte: now
          }
        }
      }),
      this.prisma.licenses.count({
        where: {
          ...baseWhere,
          renewalCount: {
            gt: 0
          }
        }
      }),
    ]);

    return {
      total,
      active: activeCount,
      expired: expiredCount,
      cancelled: cancelledCount,
      suspended: suspendedCount,
      revoked: revokedCount,
      expiringWithin30Days: expiringSoonCount,
      expiringWithin60Days,
      expiringWithin90Days,
      renewed: renewedCount,
    };
  }

  /**
   * List/search workflow audit history across ALL licenses, with pagination.
   * Backs the dashboard's global "Audit & Activity Logs" tab.
   */
  async getLicenseAuditLogs(filters: {
    page?: number;
    limit?: number;
    search?: string;
    action?: string;
    dateFrom?: string;
    dateTo?: string;
    stateId?: number;
    districtId?: number;
    zoneId?: number;
    roleCode?: string;
  }) {
    const page = Math.max(Number(filters.page ?? 1), 1);
    const limit = Math.max(Number(filters.limit ?? 10), 1);
    const skip = (page - 1) * limit;

    const where: any = {};

    const locationScope = this.buildLocationScopeWhere(filters);
    if (Object.keys(locationScope).length > 0) {
      where.license = locationScope;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        const start = new Date(filters.dateFrom);
        if (!Number.isNaN(start.getTime())) where.createdAt.gte = start;
      }
      if (filters.dateTo) {
        const end = new Date(filters.dateTo);
        if (!Number.isNaN(end.getTime())) {
          end.setHours(23, 59, 59, 999);
          where.createdAt.lte = end;
        }
      }
    }

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.search) {
      where.OR = [
        { action: { contains: filters.search, mode: 'insensitive' } },
        { remarks: { contains: filters.search, mode: 'insensitive' } },
        { license: { licenseNumber: { contains: filters.search, mode: 'insensitive' } } },
        { license: { firstName: { contains: filters.search, mode: 'insensitive' } } },
        { license: { lastName: { contains: filters.search, mode: 'insensitive' } } },
        { changedByUser: { username: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    const [rows, total] = await Promise.all([
      this.prisma.licenseWorkflowHistory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          license: { select: { id: true, licenseNumber: true, firstName: true, lastName: true } },
          changedByUser: { select: { id: true, username: true } },
        },
      }),
      this.prisma.licenseWorkflowHistory.count({ where }),
    ]);

    const data = rows.map((entry) => ({
      id: entry.id,
      licenseId: entry.licenseId,
      licenseNumber: entry.license?.licenseNumber ?? null,
      licenseHolderName:
        [entry.license?.firstName, entry.license?.lastName].filter(Boolean).join(' ') || null,
      event: entry.action,
      previousStatus: entry.previousStatus,
      newStatus: entry.newStatus,
      officer: entry.changedByUser?.username || (entry.changedBy != null ? String(entry.changedBy) : '-'),
      remarks: entry.remarks,
      applicationId: entry.applicationId,
      applicationType: entry.applicationType,
      createdAt: entry.createdAt,
    }));

    return { data, total, page, limit };
  }

  async getLicenseAudit(licenseId: number) {
    const history = await this.getLicenseHistory(licenseId);
    return history.map((entry: any) => ({
      id: entry.id,
      licenseId: entry.licenseId,
      event: entry.action,
      previousStatus: entry.previousStatus,
      newStatus: entry.newStatus,
      officer: entry.changedByUser?.username || entry.changedBy,
      remarks: entry.remarks,
      applicationId: entry.applicationId,
      applicationType: entry.applicationType,
      createdAt: entry.createdAt,
    }));
  }

  /**
   * Get a license's source application (the fresh application that originated it)
   */
  async getLicenseSourceApplication(licenseId: number) {
    const license = await this.prisma.licenses.findUnique({
      where: { id: licenseId },
      select: {
        id: true,
        freshApplicationId: true,
        renewalApplicationId: true,
        cancelApplicationId: true,
        lastModifiedAppType: true,
        lastModifiedAppId: true,
        previousModifiedAppType: true,
        previousModifiedAppId: true,
        lastModifiedRenewalId: true,
        renewalIds: true,
        licenseNumber: true,
      }
    });

    if (!license) {
      throw new Error('License not found');
    }

    const appType = this.normalizeApplicationType(license.lastModifiedAppType);
    if (!appType) {
      throw new BadRequestException(`Unsupported lastModifiedAppType: ${license.lastModifiedAppType}`);
    }

    if (appType === 'FRESH') {
      if (!license.freshApplicationId) {
        throw new Error('Fresh application ID not found on license');
      }
      const sourceApplication = await this.prisma.freshLicenseApplicationPersonalDetails.findUnique({
        where: { id: license.freshApplicationId },
        include: {
          presentAddress: { include: { state: true, district: true, policeStation: true, zone: true, division: true } },
          permanentAddress: { include: { state: true, district: true, policeStation: true, zone: true, division: true } },
          occupationAndBusiness: true,
          licenseDetails: { include: { requestedWeapons: true } },
          criminalHistories: true,
          licenseHistories: true,
          fileUploads: true,
          biometricData: true,
        }
      });
      if (!sourceApplication) {
        throw new Error('Fresh Application not found');
      }
      return sourceApplication;
    }

    if (appType === 'RENEWAL') {
      if (!license.renewalApplicationId) {
        throw new Error('Renewal application ID not found on license');
      }
      const sourceApplication = await this.prisma.renewalFormPersonalDetails.findUnique({
        where: { id: license.renewalApplicationId },
        include: {
          presentAddress: { include: { state: true, district: true, policeStation: true, zone: true, division: true } },
          permanentAddress: { include: { state: true, district: true, policeStation: true, zone: true, division: true } },
          occupationAndBusiness: true,
          licenseDetails: { include: { requestedWeapons: true } },
          criminalHistories: true,
          licenseHistories: true,
          fileUploads: true,
          biometricData: true,
        }
      });
      if (!sourceApplication) {
        throw new Error('Renewal License Application not found');
      }

      // Resolve freshApplicationId linked to this renewal
      let freshApplicationId: number | null = null;
      if (sourceApplication.licenseNumber) {
        const freshApp = await this.prisma.freshLicenseApplicationPersonalDetails.findFirst({
          where: { acknowledgementNo: sourceApplication.licenseNumber },
          select: { id: true },
        });
        if (freshApp) {
          freshApplicationId = freshApp.id;
        }
      }

      return { ...sourceApplication, freshApplicationId };
    }

    if (appType === 'CANCELLATION') {
      // For cancellations, use cancelApplicationId (with fallback to fresh/renewal)
      const lookupId = license.cancelApplicationId || license.freshApplicationId || license.renewalApplicationId;
      if (!lookupId) {
        throw new Error('No application ID found for cancellation lookup');
      }
      const cancelRequest = await this.prisma.cancelFormRequests.findUnique({
        where: { id: lookupId },
        include: {
          workflowStatus: true,
          requester: { select: { id: true, username: true } },
          actioner: { select: { id: true, username: true } },
          Licenses: { select: { id: true, licenseNumber: true } },
        }
      });
      if (!cancelRequest) {
        throw new Error('Cancel Request not found');
      }
      return cancelRequest;
    }

    return null;
  }

  async cancelLicense(
    licenseId: number,
    reason: string,
    applicationId: number,
    currentUserId: number,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    // Capture the license's current status and tracking fields BEFORE the update
    // so the workflow history and previous-modified tracking are accurate.
    const currentLicense = await tx.licenses.findUnique({
      where: { id: licenseId },
      select: {
        status: true,
        lastModifiedAppType: true,
        lastModifiedAppId: true,
        lastModifiedRenewalId: true,
        renewalApplicationId: true,
        freshApplicationId: true,
      },
    });

    await tx.licenses.update({
      where: { id: licenseId },
      data: {
        status: LicenseStatus.CANCELLED,
        validTill: null,
        cancellationReason: reason,
        cancellationDate: new Date(),
        cancelApplicationId: applicationId,
        // Shift current → previous tracking
        previousModifiedAppType: currentLicense?.lastModifiedAppType,
        previousModifiedAppId: currentLicense?.lastModifiedAppId ?? (
          (currentLicense?.lastModifiedAppType || '').toUpperCase() === 'FRESH'
            ? currentLicense?.freshApplicationId
            : currentLicense?.lastModifiedRenewalId ?? currentLicense?.renewalApplicationId
        ),
        lastModifiedAppType: 'CANCELLATION',
        lastModifiedAppId: applicationId,
      },
    });

    await tx.licenseWorkflowHistory.create({
      data: {
        licenseId,
        action: 'CANCELLED',
        applicationId,
        applicationType: 'CANCELLATION',
        previousStatus: currentLicense?.status ?? LicenseStatus.ACTIVE,
        newStatus: LicenseStatus.CANCELLED,
        changedBy: currentUserId,
        remarks: `License cancelled. Reason: ${reason}`,
      },
    });
  }

  // ==========================================================================
  // BULK LICENSE IMPORT
  //
  // Rows arrive as plain spreadsheet objects (parsed client-side). Everything
  // the file may contain is validated here rather than trusted from the client:
  // required fields, enum values, dates, the 12-field address hierarchy and
  // duplicates. Address columns accept either a readable name or a raw id, and
  // the resolved ids are what actually get persisted on the license.
  // ==========================================================================

  private static readonly LICENSE_STATUS_VALUES: LicenseStatus[] = [
    LicenseStatus.ACTIVE,
    LicenseStatus.SUSPENDED,
    LicenseStatus.CANCELLED,
    LicenseStatus.EXPIRED,
    LicenseStatus.REVOKED,
  ];

  private static readonly ARMS_CATEGORY_VALUES: ArmsCategory[] = [
    ArmsCategory.RESTRICTED,
    ArmsCategory.PERMISSIBLE,
  ];

  private static readonly SEX_VALUES: Sex[] = [Sex.MALE, Sex.FEMALE, Sex.OTHER];

  /** Natural-language weapon categories seen in legacy registers, mapped to the enum. */
  private static readonly ARMS_CATEGORY_ALIASES: Record<string, ArmsCategory> = {
    PROHIBITED: ArmsCategory.RESTRICTED,
    RESTRICTED: ArmsCategory.RESTRICTED,
    NONPROHIBITED: ArmsCategory.PERMISSIBLE,
    NONPROHIBITEDBORE: ArmsCategory.PERMISSIBLE,
    PERMISSIBLE: ArmsCategory.PERMISSIBLE,
  };

  private static readonly PERMANENT_ADDRESS_KEYS = [
    'permanentAddressLine',
    'permanentStateId',
    'permanentStateName',
    'permanentDistrictId',
    'permanentDistrictName',
    'permanentPoliceStationId',
    'permanentPoliceStationName',
    'permanentZoneId',
    'permanentZoneName',
    'permanentDivisionId',
    'permanentDivisionName',
    'permanentRangeOfficeId',
    'permanentRangeOfficeName',
  ];

  /** Lowercase + strip non-alphanumerics so header spellings collapse together. */
  private normalizeImportHeader(header: string): string {
    return String(header ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  /** Re-key a row by canonical license field names; unknown columns are dropped. */
  private normalizeImportRow(raw: Record<string, unknown>): NormalizedImportRow {
    const normalized: NormalizedImportRow = {};
    if (!raw || typeof raw !== 'object') return normalized;
    for (const [header, value] of Object.entries(raw)) {
      if (value === null || value === undefined || value === '') continue;
      const canonical = LicensesService.IMPORT_FIELD_ALIASES[this.normalizeImportHeader(header)];
      if (!canonical) continue;
      // First non-empty column wins so duplicate aliases in one sheet are harmless.
      if (normalized[canonical] === undefined) normalized[canonical] = value;
    }
    return normalized;
  }

  private importString(value: unknown): string | undefined {
    if (value === null || value === undefined) return undefined;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? undefined : value.toISOString();
    const text = String(value).trim();
    return text === '' ? undefined : text;
  }

  private importNumber(value: unknown): number | undefined {
    if (value === null || value === undefined || value === '') return undefined;
    if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
    const text = String(value).trim();
    if (!text) return undefined;
    const parsed = Number(text.replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private hasAnyImportValue(row: NormalizedImportRow, keys: string[]): boolean {
    return keys.some((key) => this.importString(row[key]) !== undefined);
  }

  /**
   * Accepts the value shapes a spreadsheet can produce: real dates (when the
   * client reads with cellDates), Excel serial numbers, ISO strings and the
   * day-first `DD/MM/YYYY` form used on Indian registers.
   */
  private parseImportDate(raw: unknown, label: string, errors: string[]): Date | undefined {
    if (raw === null || raw === undefined) return undefined;
    if (raw instanceof Date) {
      if (Number.isNaN(raw.getTime())) {
        errors.push(`${label} is an invalid date`);
        return undefined;
      }
      return raw;
    }

    const text = String(raw).trim();
    if (!text) return undefined;

    // Excel serial date: days elapsed since 1899-12-30 (25569 days before the epoch).
    if (/^\d+(\.\d+)?$/.test(text)) {
      const serial = Number(text);
      if (serial > 1 && serial < 80000) {
        const fromSerial = new Date(Math.round((serial - 25569) * 86400 * 1000));
        if (!Number.isNaN(fromSerial.getTime())) return fromSerial;
      }
      if (serial > 1e11) {
        const fromEpoch = new Date(serial);
        if (!Number.isNaN(fromEpoch.getTime())) return fromEpoch;
      }
      errors.push(`${label} "${text}" could not be parsed as a date`);
      return undefined;
    }

    const dmy = text.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.]((?:\d{4}))$/) || text.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.]((?:\d{2}))$/);
    if (dmy) {
      let day = Number(dmy[1]);
      let month = Number(dmy[2]);
      // Day-first is the norm on these registers; only flip when the values
      // can only be month-first (e.g. 03/25/2024).
      if (month > 12 && day <= 12) {
        const swap = day;
        day = month;
        month = swap;
      }
      const rawYear = dmy[3];
      const year = rawYear.length === 2 ? 2000 + Number(rawYear) : Number(rawYear);
      const parsed = new Date(Date.UTC(year, month - 1, day));
      if (
        parsed.getUTCFullYear() === year &&
        parsed.getUTCMonth() === month - 1 &&
        parsed.getUTCDate() === day
      ) {
        return parsed;
      }
      errors.push(`${label} "${text}" is not a valid calendar date`);
      return undefined;
    }

    const iso = Date.parse(text.replace(' ', 'T'));
    if (!Number.isNaN(iso)) return new Date(iso);

    errors.push(`${label} "${text}" could not be parsed as a date — use YYYY-MM-DD`);
    return undefined;
  }

  private parseImportEnum<T extends string>(value: unknown, allowed: T[], label: string): { value?: T; error?: string } {
    const text = this.importString(value);
    if (!text) return {};
    const normalized = text.toUpperCase().replace(/[\s-]+/g, '_');
    const match = allowed.find((candidate) => candidate.toUpperCase() === normalized);
    if (!match) {
      return { error: `${label} "${text}" is not valid — expected one of: ${allowed.join(', ')}` };
    }
    return { value: match };
  }

  /** Location master lookups, indexed by id and by lowercased name. */
  private async loadLocationRegistry() {
    const [states, districts, rangeOffices, zones, divisions, policeStations] = await Promise.all([
      this.prisma.states.findMany({ select: { id: true, name: true } }),
      this.prisma.districts.findMany({ select: { id: true, name: true, stateId: true } }),
      this.prisma.rangeOffices.findMany({ select: { id: true, name: true, districtId: true } }),
      this.prisma.zones.findMany({ select: { id: true, name: true, rangeOfficeId: true } }),
      this.prisma.divisions.findMany({ select: { id: true, name: true, zoneId: true } }),
      this.prisma.policeStations.findMany({ select: { id: true, name: true, divisionId: true } }),
    ]);

    const index = (rows: Array<{ id: number; name: string }>) => ({
      byId: new Map<number, any>(rows.map((row) => [row.id, row])),
      byName: new Map<string, any>(rows.map((row) => [String(row.name ?? '').trim().toLowerCase(), row])),
    });

    return {
      states: index(states),
      districts: index(districts as any),
      rangeOffices: index(rangeOffices as any),
      zones: index(zones as any),
      divisions: index(divisions as any),
      policeStations: index(policeStations as any),
    };
  }

  /** Resolve one hierarchy level from a name or a raw id, and verify its parent. */
  private resolveLocationLevel(params: {
    label: string;
    rawId?: unknown;
    rawName?: unknown;
    byId: Map<number, any>;
    byName: Map<string, any>;
    parentField?: string;
    parentLabel?: string;
    expectedParentId?: number;
  }): { id?: number; name?: string; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const idCandidate = this.importNumber(params.rawId);
    const nameCandidate = this.importString(params.rawName);

    let record: any;
    if (idCandidate !== undefined) {
      record = params.byId.get(idCandidate);
      if (!record) {
        errors.push(`${params.label} id ${idCandidate} does not exist in the location master`);
        return { errors, warnings };
      }
      if (nameCandidate && String(record.name).trim().toLowerCase() !== nameCandidate.trim().toLowerCase()) {
        warnings.push(
          `${params.label} id ${idCandidate} is "${record.name}" but the sheet says "${nameCandidate}" — the id was used`,
        );
      }
    } else if (nameCandidate) {
      record = params.byName.get(nameCandidate.trim().toLowerCase());
      if (!record) {
        errors.push(`${params.label} "${nameCandidate}" was not found in the location master`);
        return { errors, warnings };
      }
    }

    if (!record) return { errors, warnings };

    if (
      params.expectedParentId !== undefined &&
      params.parentField &&
      record[params.parentField] !== null &&
      record[params.parentField] !== undefined &&
      Number(record[params.parentField]) !== params.expectedParentId
    ) {
      errors.push(
        `${params.label} "${record.name}" does not belong to the selected ${params.parentLabel ?? 'parent'} (id ${params.expectedParentId})`,
      );
      return { errors, warnings };
    }

    return { id: record.id, name: record.name, errors, warnings };
  }

  /**
   * Resolve the full address hierarchy for one side (present/permanent).
   * Non-SUPER_ADMIN callers are pinned to their own state: a blank state is
   * filled in from the session, and a conflicting state is an error so rows can
   * never be imported into a jurisdiction the user cannot see.
   */
  private resolveImportAddress(
    side: 'present' | 'permanent',
    row: NormalizedImportRow,
    registry: Awaited<ReturnType<LicensesService['loadLocationRegistry']>>,
    scope: LicenseImportScope,
    errors: string[],
    warnings: string[],
  ) {
    const label = side === 'present' ? 'Present' : 'Permanent';
    const isSuperAdmin = scope.roleCode === 'SUPER_ADMIN';

    const state = this.resolveLocationLevel({
      label: `${label} state`,
      rawId: row[`${side}StateId`],
      rawName: row[`${side}StateName`],
      byId: registry.states.byId,
      byName: registry.states.byName,
    });
    errors.push(...state.errors);
    warnings.push(...state.warnings);

    let stateId = state.id;
    let stateName = state.name;
    if (stateId === undefined) {
      if (!isSuperAdmin && scope.stateId) {
        stateId = scope.stateId;
        stateName = registry.states.byId.get(scope.stateId)?.name ?? stateName;
        warnings.push(`${label} state was blank; defaulted to your state (${stateName ?? stateId})`);
      } else {
        errors.push(`${label} state is required — provide a state name or state id`);
      }
    } else if (!isSuperAdmin && scope.stateId && stateId !== scope.stateId) {
      errors.push(
        `${label} state "${stateName ?? stateId}" is outside your jurisdiction (your state id is ${scope.stateId})`,
      );
    }

    const district = this.resolveLocationLevel({
      label: `${label} district`,
      rawId: row[`${side}DistrictId`],
      rawName: row[`${side}DistrictName`],
      byId: registry.districts.byId,
      byName: registry.districts.byName,
      parentField: 'stateId',
      parentLabel: `${label.toLowerCase()} state`,
      expectedParentId: stateId,
    });
    errors.push(...district.errors);
    warnings.push(...district.warnings);

    const rangeOffice = this.resolveLocationLevel({
      label: `${label} range office`,
      rawId: row[`${side}RangeOfficeId`],
      rawName: row[`${side}RangeOfficeName`],
      byId: registry.rangeOffices.byId,
      byName: registry.rangeOffices.byName,
      parentField: 'districtId',
      parentLabel: `${label.toLowerCase()} district`,
      expectedParentId: district.id,
    });
    errors.push(...rangeOffice.errors);
    warnings.push(...rangeOffice.warnings);

    const zone = this.resolveLocationLevel({
      label: `${label} zone`,
      rawId: row[`${side}ZoneId`],
      rawName: row[`${side}ZoneName`],
      byId: registry.zones.byId,
      byName: registry.zones.byName,
      parentField: 'rangeOfficeId',
      parentLabel: `${label.toLowerCase()} range office`,
      expectedParentId: rangeOffice.id,
    });
    errors.push(...zone.errors);
    warnings.push(...zone.warnings);

    const division = this.resolveLocationLevel({
      label: `${label} division`,
      rawId: row[`${side}DivisionId`],
      rawName: row[`${side}DivisionName`],
      byId: registry.divisions.byId,
      byName: registry.divisions.byName,
      parentField: 'zoneId',
      parentLabel: `${label.toLowerCase()} zone`,
      expectedParentId: zone.id,
    });
    errors.push(...division.errors);
    warnings.push(...division.warnings);

    const policeStation = this.resolveLocationLevel({
      label: `${label} police station`,
      rawId: row[`${side}PoliceStationId`],
      rawName: row[`${side}PoliceStationName`],
      byId: registry.policeStations.byId,
      byName: registry.policeStations.byName,
      parentField: 'divisionId',
      parentLabel: `${label.toLowerCase()} division`,
      expectedParentId: division.id,
    });
    errors.push(...policeStation.errors);
    warnings.push(...policeStation.warnings);

    return {
      addressLine: this.importString(row[`${side}AddressLine`]),
      stateId,
      stateName,
      districtId: district.id,
      districtName: district.name,
      policeStationId: policeStation.id,
      zoneId: zone.id,
      divisionId: division.id,
      rangeOfficeId: rangeOffice.id,
    };
  }

  /** Validate a single row and build the payload that would be persisted. */
  private buildImportRow(
    row: NormalizedImportRow,
    rowNumber: number,
    ctx: {
      registry: Awaited<ReturnType<LicensesService['loadLocationRegistry']>>;
      scope: LicenseImportScope;
      existingByNumber: Map<string, any>;
      existingByAadhar: Map<string, any[]>;
      seenNumbers: Map<string, number>;
      seenAadhars: Map<string, number>;
      weaponByName: Map<string, any>;
      onDuplicate: 'fail' | 'skip';
    },
  ): ImportRowOutcome {
    const errors: string[] = [];
    const warnings: string[] = [];

    const licenseNumber = this.importString(row.licenseNumber);
    const parentOrSpouseName = this.importString(row.parentOrSpouseName);
    const aadharNumber = this.importString(row.aadharNumber);

    // The licence list export collapses the holder into one "License Holder Name"
    // column. Accept it as a fallback and split it back into first / middle / last
    // so a file exported from this app can be re-imported as-is.
    const holderName = this.importString(row.holderName);
    const nameParts = holderName ? holderName.split(/\s+/).filter(Boolean) : [];
    const firstName = this.importString(row.firstName) ?? nameParts[0];
    const lastName =
      this.importString(row.lastName) ??
      (nameParts.length > 1 ? nameParts[nameParts.length - 1] : undefined);
    const middleName =
      this.importString(row.middleName) ??
      (nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : undefined);

    if (!licenseNumber) errors.push('License number is required');
    if (!firstName) errors.push('First name is required');
    if (!lastName) errors.push('Last name is required');
    if (!parentOrSpouseName) errors.push('Father/guardian/spouse name is required');

    const rawSex = this.importString(row.sex);
    let sex: Sex | undefined;
    if (!rawSex) {
      errors.push('Gender is required — use MALE, FEMALE or OTHER');
    } else {
      const normalizedSex = rawSex.trim().toUpperCase();
      const sexAliases: Record<string, Sex> = {
        M: Sex.MALE,
        MALE: Sex.MALE,
        F: Sex.FEMALE,
        FEMALE: Sex.FEMALE,
        O: Sex.OTHER,
        OTHER: Sex.OTHER,
      };
      sex = sexAliases[normalizedSex];
      if (!sex) errors.push(`Gender "${rawSex}" is not recognised — use MALE, FEMALE or OTHER`);
    }

    const issueDate = this.parseImportDate(row.issueDate, 'Issue date', errors);
    if (this.importString(row.issueDate) === undefined) errors.push('Issue date is required');
    let validFrom = this.parseImportDate(row.validFrom, 'Valid from', errors);
    if (!validFrom && issueDate) {
      validFrom = issueDate;
      warnings.push('Valid from was blank; defaulted to the issue date');
    }
    const validTill = this.parseImportDate(row.validTill, 'Valid till', errors);
    const dateOfBirth = this.parseImportDate(row.dateOfBirth, 'Date of birth', errors);

    if (issueDate && validTill && validTill.getTime() < issueDate.getTime()) {
      warnings.push('Valid till is before the issue date');
    }

    if (aadharNumber && !/^\d{12}$/.test(aadharNumber.replace(/\s/g, ''))) {
      warnings.push(`Aadhar number "${aadharNumber}" is not 12 digits`);
    }

    const statusParsed = this.parseImportEnum(row.status, LicensesService.LICENSE_STATUS_VALUES, 'Status');
    if (statusParsed.error) errors.push(statusParsed.error);
    const status = statusParsed.value ?? LicenseStatus.ACTIVE;

    const armsCategoryParsed = this.parseImportEnum(
      row.armsCategory,
      LicensesService.ARMS_CATEGORY_VALUES,
      'Arms category',
    );
    let armsCategory = armsCategoryParsed.value;
    if (armsCategoryParsed.error) {
      const aliasKey = this.normalizeImportHeader(this.importString(row.armsCategory) ?? '');
      const aliased = LicensesService.ARMS_CATEGORY_ALIASES[aliasKey];
      if (aliased) {
        armsCategory = aliased;
      } else {
        errors.push(armsCategoryParsed.error);
      }
    }

    const purposeParsed = this.parseImportEnum(row.needForLicense, Object.values(LicensePurpose), 'License purpose');
    if (purposeParsed.error) errors.push(purposeParsed.error);

    const present = this.resolveImportAddress('present', row, ctx.registry, ctx.scope, errors, warnings);
    const permanentProvided = this.hasAnyImportValue(row, LicensesService.PERMANENT_ADDRESS_KEYS);
    const permanent = permanentProvided
      ? this.resolveImportAddress('permanent', row, ctx.registry, ctx.scope, errors, warnings)
      : present;
    if (!permanentProvided) {
      warnings.push('Permanent address was blank; copied from the present address');
    }

    // Weapons are matched against the endorsed-weapon master; unknown names are
    // reported instead of failing the row so a typo never blocks an import.
    const weaponsRaw = this.importString(row.endorsedWeapons);
    let endorsedWeapons: Array<{ id: number }> | undefined;
    if (weaponsRaw) {
      const names = weaponsRaw.split(/[,;|\/]/).map((part) => part.trim()).filter(Boolean);
      const matchedIds: number[] = [];
      const unknown: string[] = [];
      for (const name of names) {
        const weapon = ctx.weaponByName.get(name.toLowerCase());
        if (weapon) {
          if (!matchedIds.includes(weapon.id)) matchedIds.push(weapon.id);
        } else {
          unknown.push(name);
        }
      }
      if (unknown.length) {
        warnings.push(`Weapon(s) not found in the master and were skipped: ${unknown.join(', ')}`);
      }
      if (matchedIds.length) endorsedWeapons = matchedIds.map((id) => ({ id }));
    }

    // --- Duplicate detection -------------------------------------------------
    let skipped = false;
    if (licenseNumber) {
      const numberKey = licenseNumber.trim().toLowerCase();
      const duplicateRow = ctx.seenNumbers.get(numberKey);
      if (duplicateRow !== undefined) {
        errors.push(`Duplicate license number in the file — first seen on row ${duplicateRow}`);
      } else {
        ctx.seenNumbers.set(numberKey, rowNumber);
      }

      const existing = ctx.existingByNumber.get(numberKey);
      if (existing) {
        if (ctx.onDuplicate === 'skip') {
          skipped = true;
          warnings.push(
            `License number ${licenseNumber} already exists (license #${existing.id}) — row skipped`,
          );
        } else {
          errors.push(`License number ${licenseNumber} already exists (license #${existing.id})`);
        }
      }
    }

    if (aadharNumber) {
      const aadharKey = aadharNumber.replace(/\s/g, '');
      const existingForAadhar = ctx.existingByAadhar.get(aadharKey) ?? [];
      const softDuplicate = existingForAadhar.find(
        (license) => !armsCategory || !license.armsCategory || license.armsCategory === armsCategory,
      );
      if (softDuplicate) {
        warnings.push(
          `Possible duplicate: aadhar ${aadharNumber} is already on license ${softDuplicate.licenseNumber} (#${softDuplicate.id})`,
        );
      }
      const sameRowAadhar = ctx.seenAadhars.get(aadharKey);
      if (sameRowAadhar !== undefined) {
        warnings.push(`Possible duplicate: aadhar ${aadharNumber} also appears on row ${sameRowAadhar}`);
      } else {
        ctx.seenAadhars.set(aadharKey, rowNumber);
      }
    }

    const rowStatus: ImportRowStatus = errors.length
      ? 'error'
      : skipped
        ? 'skipped'
        : warnings.length
          ? 'warning'
          : 'valid';

    const outcome: ImportRowOutcome = {
      rowNumber,
      status: rowStatus,
      errors,
      warnings,
      display: {
        licenseNumber: licenseNumber ?? null,
        holderName: [firstName, middleName, lastName].filter(Boolean).join(' ') || null,
        district: present.districtName ?? null,
        state: present.stateName ?? null,
      },
    };

    if (rowStatus === 'error') return outcome;

    outcome.data = {
      licenseNumber: licenseNumber!,
      almsLicenseId: this.importString(row.almsLicenseId) ?? null,
      firstName: firstName!,
      middleName: middleName ?? null,
      lastName: lastName!,
      parentOrSpouseName: parentOrSpouseName!,
      sex: sex!,
      dateOfBirth: dateOfBirth ?? null,
      placeOfBirth: this.importString(row.placeOfBirth) ?? null,
      aadharNumber: aadharNumber ?? null,
      panNumber: this.importString(row.panNumber) ?? null,
      issueDate: issueDate!,
      validFrom: validFrom!,
      validTill: validTill ?? null,
      armsCategory: armsCategory ?? null,
      areaOfValidity: this.importString(row.areaOfValidity) ?? null,
      ammunitionDescription: this.importString(row.ammunitionDescription) ?? null,
      licencePlaceArea: this.importString(row.licencePlaceArea) ?? null,
      specialConsiderationReason: this.importString(row.specialConsiderationReason) ?? null,
      needForLicense: purposeParsed.value ?? null,
      presentAddressLine: present.addressLine ?? null,
      presentStateId: present.stateId ?? null,
      presentDistrictId: present.districtId ?? null,
      presentPoliceStationId: present.policeStationId ?? null,
      presentZoneId: present.zoneId ?? null,
      presentDivisionId: present.divisionId ?? null,
      presentRangeOfficeId: present.rangeOfficeId ?? null,
      permanentAddressLine: permanent.addressLine ?? null,
      permanentStateId: permanent.stateId ?? null,
      permanentDistrictId: permanent.districtId ?? null,
      permanentPoliceStationId: permanent.policeStationId ?? null,
      permanentZoneId: permanent.zoneId ?? null,
      permanentDivisionId: permanent.divisionId ?? null,
      permanentRangeOfficeId: permanent.rangeOfficeId ?? null,
      occupation: this.importString(row.occupation) ?? null,
      officeAddress: this.importString(row.officeAddress) ?? null,
      status,
      issuedBy: ctx.scope.userId ?? null,
      renewalCount: 0,
      renewalIds: [],
      // Marks the row as imported so the list can show "Imported" instead of a
      // source application, and leaves freshApplicationId null on purpose.
      lastModifiedAppType: 'IMPORT',
      lastModifiedAppId: null,
      endorsedWeapons: endorsedWeapons ? { connect: endorsedWeapons } : undefined,
    };

    return outcome;
  }

  /** Validate every row without writing anything. Backs the preview step. */
  private async buildImportPlan(
    rows: Record<string, unknown>[],
    scope: LicenseImportScope,
    options: { strict?: boolean; onDuplicate?: 'fail' | 'skip' } = {},
  ) {
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new BadRequestException('At least one row is required');
    }
    if (rows.length > MAX_IMPORT_ROWS) {
      throw new BadRequestException(
        `A maximum of ${MAX_IMPORT_ROWS} rows can be processed per request (received ${rows.length})`,
      );
    }
    if (scope.roleCode !== 'SUPER_ADMIN' && !scope.stateId) {
      throw new BadRequestException(
        'Your account is not linked to a state, so imported licenses cannot be scoped. Contact an administrator.',
      );
    }

    const normalizedRows = rows.map((row) => this.normalizeImportRow(row));
    const registry = await this.loadLocationRegistry();
    const onDuplicate: 'fail' | 'skip' = options.onDuplicate === 'skip' ? 'skip' : 'fail';

    const rawNumbers = [
      ...new Set(normalizedRows.map((row) => this.importString(row.licenseNumber)).filter((v): v is string => !!v)),
    ];
    const aadhars = [
      ...new Set(
        normalizedRows
          .map((row) => this.importString(row.aadharNumber)?.replace(/\s/g, ''))
          .filter((v): v is string => !!v),
      ),
    ];
    const hasWeapons = normalizedRows.some((row) => this.importString(row.endorsedWeapons) !== undefined);

    const [existingLicenses, aadharLicenses, weapons] = await Promise.all([
      rawNumbers.length
        ? this.prisma.licenses.findMany({
            where: {
              OR: [
                { licenseNumber: { in: rawNumbers } },
                { licenseNumber: { in: rawNumbers.map((value) => value.toLowerCase()) } },
              ],
            },
            select: { id: true, licenseNumber: true, status: true },
          })
        : [],
      aadhars.length
        ? this.prisma.licenses.findMany({
            where: { aadharNumber: { in: aadhars } },
            select: { id: true, licenseNumber: true, aadharNumber: true, armsCategory: true },
          })
        : [],
      // The weapon master is small enough to load whole, which avoids casing
      // mismatches between the sheet and the stored names.
      hasWeapons ? this.prisma.weaponTypeMaster.findMany({ select: { id: true, name: true } }) : [],
    ]);

    const existingByNumber = new Map<string, any>(
      existingLicenses.map((license) => [String(license.licenseNumber).trim().toLowerCase(), license]),
    );
    const existingByAadhar = new Map<string, any[]>();
    for (const license of aadharLicenses) {
      const key = String(license.aadharNumber ?? '').replace(/\s/g, '');
      if (!key) continue;
      existingByAadhar.set(key, [...(existingByAadhar.get(key) ?? []), license]);
    }
    const weaponByName = new Map<string, any>(
      weapons.map((weapon) => [String(weapon.name).trim().toLowerCase(), weapon]),
    );

    // The seen* maps are shared across rows so duplicate-in-file detection can
    // point at the earlier row number. Spreadsheet row 1 is the header, so the
    // first data row is reported as row 2.
    const seenNumbers = new Map<string, number>();
    const seenAadhars = new Map<string, number>();
    const sequenced = normalizedRows.map((row, index) =>
      this.buildImportRow(row, index + 2, {
        registry,
        scope,
        existingByNumber,
        existingByAadhar,
        seenNumbers,
        seenAadhars,
        weaponByName,
        onDuplicate,
      }),
    );

    const strict = !!options.strict;
    const summary = {
      total: sequenced.length,
      valid: sequenced.filter((o) => o.status === 'valid').length,
      warnings: sequenced.filter((o) => o.status === 'warning').length,
      errors: sequenced.filter((o) => o.status === 'error').length,
      skipped: sequenced.filter((o) => o.status === 'skipped').length,
      importable: sequenced.filter((o) => o.status === 'valid' || (!strict && o.status === 'warning')).length,
    };

    const stateName =
      scope.stateId !== undefined ? registry.states.byId.get(scope.stateId)?.name ?? null : null;

    return { rows: sequenced, summary, strict, onDuplicate, stateName };
  }

  /** Validate the file and return a row-by-row report without persisting anything. */
  async previewLicenseImport(
    rows: Record<string, unknown>[],
    scope: LicenseImportScope,
    options: { strict?: boolean; onDuplicate?: 'fail' | 'skip' } = {},
  ) {
    const plan = await this.buildImportPlan(rows, scope, options);
    return {
      success: true,
      message: 'Import preview generated'.replace('generated', 'generated — nothing has been saved yet'),
      summary: plan.summary,
      strict: plan.strict,
      onDuplicate: plan.onDuplicate,
      scope: { stateId: scope.stateId ?? null, stateName: plan.stateName, roleCode: scope.roleCode ?? null },
      rows: plan.rows.map((row) => ({
        rowNumber: row.rowNumber,
        status: row.status,
        errors: row.errors,
        warnings: row.warnings,
        display: row.display,
      })),
    };
  }

  /**
   * Re-validate and persist the importable rows one at a time so a single bad
   * record cannot roll back the whole batch. Each created license gets an
   * IMPORTED workflow-history entry tagged with the batch id, which is what
   * powers rollback.
   */
  async commitLicenseImport(
    rows: Record<string, unknown>[],
    scope: LicenseImportScope,
    options: { strict?: boolean; onDuplicate?: 'fail' | 'skip'; fileName?: string } = {},
  ) {
    const plan = await this.buildImportPlan(rows, scope, options);
    const fileName = this.importString(options.fileName);
    const batchId = `IMP-${new Date().toISOString().replace(/[-:.TZ]/g, '')}-${Math.random()
      .toString(36)
      .slice(2, 8)
      .toUpperCase()}`;

    const importable = plan.rows.filter(
      (row) => row.status === 'valid' || (row.status === 'warning' && !plan.strict),
    );

    const results: Array<{
      rowNumber: number;
      status: 'imported' | 'failed' | 'skipped' | 'rejected';
      licenseId?: number;
      licenseNumber?: string;
      errors: string[];
      warnings: string[];
    }> = [];
    let imported = 0;
    let failed = 0;

    for (const row of plan.rows) {
      if (row.status === 'error') {
        failed += 1;
        results.push({
          rowNumber: row.rowNumber,
          status: 'failed',
          errors: row.errors,
          warnings: row.warnings,
        });
        continue;
      }
      if (row.status === 'skipped') {
        results.push({
          rowNumber: row.rowNumber,
          status: 'skipped',
          errors: row.errors,
          warnings: row.warnings,
        });
        continue;
      }
      if (row.status === 'warning' && plan.strict) {
        results.push({
          rowNumber: row.rowNumber,
          status: 'rejected',
          errors: ['Blocked by strict mode (row only had warnings)'],
          warnings: row.warnings,
        });
        continue;
      }
      if (!row.data) {
        failed += 1;
        results.push({
          rowNumber: row.rowNumber,
          status: 'failed',
          errors: ['Row could not be prepared for import'],
          warnings: row.warnings,
        });
        continue;
      }

      try {
        const created = await this.prisma.$transaction(async (tx: any) => {
          const license = await tx.licenses.create({ data: row.data });
          await tx.licenseWorkflowHistory.create({
            data: {
              licenseId: license.id,
              action: 'IMPORTED',
              applicationType: 'IMPORT',
              newStatus: license.status,
              changedBy: scope.userId ?? null,
              remarks: `Bulk license import (batch ${batchId}) — sheet row ${row.rowNumber}${
                fileName ? ` of ${fileName}` : ''
              }`,
            },
          });
          return license;
        });
        imported += 1;
        results.push({
          rowNumber: row.rowNumber,
          status: 'imported',
          licenseId: created.id,
          licenseNumber: created.licenseNumber,
          errors: [],
          warnings: row.warnings,
        });
      } catch (error: any) {
        failed += 1;
        this.logger.error(
          `Bulk import row ${row.rowNumber} failed for batch ${batchId}: ${error?.message}`,
          error?.stack,
        );
        results.push({
          rowNumber: row.rowNumber,
          status: 'failed',
          errors: [error?.message || 'Failed to save the license'],
          warnings: row.warnings,
        });
      }
    }

    this.logger.log(
      `Bulk license import ${batchId}: ${imported} imported, ${failed} failed, ${plan.summary.skipped} skipped, ${importable.length} attempted`,
    );

    const rejectedByStrictMode = results.filter((result) => result.status === 'rejected').length;

    // Record the batch on the audit trail so bulk licence changes are traceable
    // the same way application events are. Best-effort: an audit failure must
    // never fail an import that already succeeded.
    if (scope.userId) {
      try {
        await this.prisma.auditLogs.create({
          data: {
            userId: scope.userId,
            entity: 'Licenses',
            entityId: batchId,
            action: 'BULK_IMPORT',
            newValue: {
              fileName: fileName ?? null,
              stateId: scope.stateId ?? null,
              stateName: plan.stateName,
              imported,
              failed,
              skipped: plan.summary.skipped,
              rejectedByStrictMode,
              onDuplicate: plan.onDuplicate,
              strict: plan.strict,
              licenseIds: results
                .filter((result) => result.status === 'imported')
                .map((result) => result.licenseId)
                .filter((id): id is number => typeof id === 'number'),
            },
          },
        });
      } catch (auditError: any) {
        this.logger.error(`Audit log failed for bulk import ${batchId}: ${auditError?.message}`);
      }
    }

    return {
      success: true,
      batchId,
      fileName: fileName ?? null,
      importedAt: new Date().toISOString(),
      scope: { stateId: scope.stateId ?? null, stateName: plan.stateName, roleCode: scope.roleCode ?? null },
      summary: {
        total: plan.summary.total,
        imported,
        failed,
        skipped: plan.summary.skipped,
        rejectedByStrictMode,
      },
      results,
    };
  }

  /**
   * Undo a previous import batch. Only licenses still untouched by any renewal
   * or cancellation are removed; the rest are reported so a human can decide.
   */
  async rollbackLicenseImportBatch(batchId: string, scope: LicenseImportScope) {
    const trimmedBatch = this.importString(batchId);
    if (!trimmedBatch) throw new BadRequestException('A batch id is required to roll back an import');

    const histories = await this.prisma.licenseWorkflowHistory.findMany({
      where: { action: 'IMPORTED', remarks: { contains: trimmedBatch } },
      select: { licenseId: true },
    });
    const licenseIds = [...new Set(histories.map((history) => history.licenseId))];

    if (licenseIds.length === 0) {
      return {
        success: true,
        batchId: trimmedBatch,
        removedCount: 0,
        removed: [],
        skipped: [],
        message: 'No licenses were found for this import batch — it may already have been rolled back.',
      };
    }

    const licenses = await this.prisma.licenses.findMany({
      where: { id: { in: licenseIds } },
      select: {
        id: true,
        licenseNumber: true,
        status: true,
        renewalCount: true,
        presentStateId: true,
      },
    });

    const removed: Array<{ id: number; licenseNumber: string }> = [];
    const skipped: Array<{ id: number; licenseNumber: string; reason: string }> = [];

    for (const license of licenses) {
      if (scope.roleCode !== 'SUPER_ADMIN' && scope.stateId && license.presentStateId !== scope.stateId) {
        skipped.push({ id: license.id, licenseNumber: license.licenseNumber, reason: 'Outside your jurisdiction' });
        continue;
      }
      if ((license.renewalCount ?? 0) > 0) {
        skipped.push({ id: license.id, licenseNumber: license.licenseNumber, reason: 'License has renewals' });
        continue;
      }
      if (license.status === LicenseStatus.CANCELLED) {
        skipped.push({ id: license.id, licenseNumber: license.licenseNumber, reason: 'License is already cancelled' });
        continue;
      }

      try {
        await this.prisma.licenses.delete({ where: { id: license.id } });
        removed.push({ id: license.id, licenseNumber: license.licenseNumber });
      } catch (error: any) {
        skipped.push({
          id: license.id,
          licenseNumber: license.licenseNumber,
          reason: `In use by another record (${error?.code ?? 'delete failed'})`,
        });
      }
    }

    this.logger.warn(
      `Bulk import rollback ${trimmedBatch}: ${removed.length} removed, ${skipped.length} kept`,
    );

    if (scope.userId) {
      try {
        await this.prisma.auditLogs.create({
          data: {
            userId: scope.userId,
            entity: 'Licenses',
            entityId: trimmedBatch,
            action: 'BULK_IMPORT_ROLLBACK',
            newValue: {
              removedCount: removed.length,
              keptCount: skipped.length,
              removedLicenseIds: removed.map((item) => item.id),
            },
          },
        });
      } catch (auditError: any) {
        this.logger.error(`Audit log failed for bulk import rollback ${trimmedBatch}: ${auditError?.message}`);
      }
    }

    return {
      success: true,
      batchId: trimmedBatch,
      removedCount: removed.length,
      removed,
      skipped,
      message: `${removed.length} license(s) removed, ${skipped.length} kept.`,
    };
  }

  /**
   * Attach the resolved location names for every address id a license carries,
   * so the license list can render "Hyderabad" instead of "District #579".
   * Uses targeted `in` lookups (6 queries total) rather than per-license reads.
   */
  private async attachLocationNames<T extends Record<string, any>>(licenses: T[]): Promise<T[]> {
    if (!licenses || licenses.length === 0) return licenses;

    const collectIds = (fields: string[]): number[] => {
      const ids = new Set<number>();
      for (const license of licenses) {
        for (const field of fields) {
          const value = license?.[field];
          if (typeof value === 'number' && Number.isFinite(value)) ids.add(value);
        }
      }
      return [...ids];
    };

    const stateIds = collectIds(['presentStateId', 'permanentStateId']);
    const districtIds = collectIds(['presentDistrictId', 'permanentDistrictId']);
    const stationIds = collectIds(['presentPoliceStationId', 'permanentPoliceStationId']);
    const zoneIds = collectIds(['presentZoneId', 'permanentZoneId']);
    const divisionIds = collectIds(['presentDivisionId', 'permanentDivisionId']);
    const rangeIds = collectIds(['presentRangeOfficeId', 'permanentRangeOfficeId']);

    if (!stateIds.length && !districtIds.length && !stationIds.length && !zoneIds.length && !divisionIds.length && !rangeIds.length) {
      return licenses;
    }

    const [states, districts, stations, zones, divisions, ranges] = await Promise.all([
      stateIds.length ? this.prisma.states.findMany({ where: { id: { in: stateIds } }, select: { id: true, name: true } }) : [],
      districtIds.length ? this.prisma.districts.findMany({ where: { id: { in: districtIds } }, select: { id: true, name: true } }) : [],
      stationIds.length ? this.prisma.policeStations.findMany({ where: { id: { in: stationIds } }, select: { id: true, name: true } }) : [],
      zoneIds.length ? this.prisma.zones.findMany({ where: { id: { in: zoneIds } }, select: { id: true, name: true } }) : [],
      divisionIds.length ? this.prisma.divisions.findMany({ where: { id: { in: divisionIds } }, select: { id: true, name: true } }) : [],
      rangeIds.length ? this.prisma.rangeOffices.findMany({ where: { id: { in: rangeIds } }, select: { id: true, name: true } }) : [],
    ]);

    const nameById = (rows: Array<{ id: number; name: string }>) =>
      new Map<number, string>(rows.map((row) => [row.id, row.name]));
    const stateNames = nameById(states);
    const districtNames = nameById(districts);
    const stationNames = nameById(stations);
    const zoneNames = nameById(zones);
    const divisionNames = nameById(divisions);
    const rangeNames = nameById(ranges);

    return licenses.map((license) => ({
      ...license,
      presentStateName: license.presentStateId != null ? stateNames.get(license.presentStateId) ?? null : null,
      presentDistrictName: license.presentDistrictId != null ? districtNames.get(license.presentDistrictId) ?? null : null,
      presentPoliceStationName:
        license.presentPoliceStationId != null ? stationNames.get(license.presentPoliceStationId) ?? null : null,
      presentZoneName: license.presentZoneId != null ? zoneNames.get(license.presentZoneId) ?? null : null,
      presentDivisionName: license.presentDivisionId != null ? divisionNames.get(license.presentDivisionId) ?? null : null,
      presentRangeOfficeName:
        license.presentRangeOfficeId != null ? rangeNames.get(license.presentRangeOfficeId) ?? null : null,
      permanentStateName:
        license.permanentStateId != null ? stateNames.get(license.permanentStateId) ?? null : null,
      permanentDistrictName:
        license.permanentDistrictId != null ? districtNames.get(license.permanentDistrictId) ?? null : null,
      permanentPoliceStationName:
        license.permanentPoliceStationId != null ? stationNames.get(license.permanentPoliceStationId) ?? null : null,
      permanentZoneName: license.permanentZoneId != null ? zoneNames.get(license.permanentZoneId) ?? null : null,
      permanentDivisionName:
        license.permanentDivisionId != null ? divisionNames.get(license.permanentDivisionId) ?? null : null,
      permanentRangeOfficeName:
        license.permanentRangeOfficeId != null ? rangeNames.get(license.permanentRangeOfficeId) ?? null : null,
    }));
  }
}
