import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../services/prisma.service';
import { LicenseStatus, Prisma } from '@prisma/client';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import * as QRCode from 'qrcode';

@Injectable()
export class LicensesService {
  private readonly logger = new Logger(LicensesService.name);

  constructor(private prisma: PrismaService) { }

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
      //   biometricData: true,
      criminalHistories: true,
      licenseHistories: true,
      licenseDetails: {
        include: {
          requestedWeapons: true,
        },
      },
      //   fileUploads: true,
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
      lastModifiedRenewalId: license.lastModifiedRenewalId ?? null,
      renewalIds: license.renewalIds ?? [],
    };

    // If no source application found, return just the license metadata
    if (!sourceApplication) {
      return {
        ...baseMetadata,
        applicantName: null,
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
      select: {
        id: true,
        licenseNumber: true,
        almsLicenseId: true,
        freshApplicationId: true,
        renewalApplicationId: true,
        cancelApplicationId: true,
        lastModifiedAppType: true,
        lastModifiedRenewalId: true,
        renewalIds: true,
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
    orderBy?: string;
    order?: 'asc' | 'desc';
  }) {
    const page = Math.max(Number(filters.page ?? 1), 1);
    const limit = Math.max(Number(filters.limit ?? 10), 1);
    const skip = (page - 1) * limit;

    const where: any = {};

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
      if (normalized.includes('FRESH')) {
        where.freshApplicationId = { not: null };
      } else if (normalized.includes('IMPORT')) {
        where.freshApplicationId = null;
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

    return { data, total, page, limit };
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
   */
  async getLicenseStatistics() {
    const now = new Date();
    const daysFromNow = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const [total, activeCount, expiredCount, cancelledCount, suspendedCount, revokedCount, expiringSoonCount, expiringWithin60Days, expiringWithin90Days, renewedCount] = await Promise.all([
      this.prisma.licenses.count(),
      this.prisma.licenses.count({ where: { status: 'ACTIVE' as any } }),
      this.prisma.licenses.count({ where: { status: 'EXPIRED' as any } }),
      this.prisma.licenses.count({ where: { status: 'CANCELLED' as any } }),
      this.prisma.licenses.count({ where: { status: 'SUSPENDED' as any } }),
      this.prisma.licenses.count({ where: { status: 'REVOKED' as any } }),
      this.prisma.licenses.count({
        where: {
          status: 'ACTIVE' as any,
          validTill: {
            lte: daysFromNow(30),
            gte: now
          }
        }
      }),
      this.prisma.licenses.count({
        where: {
          status: 'ACTIVE' as any,
          validTill: {
            lte: daysFromNow(60),
            gte: now
          }
        }
      }),
      this.prisma.licenses.count({
        where: {
          status: 'ACTIVE' as any,
          validTill: {
            lte: daysFromNow(90),
            gte: now
          }
        }
      }),
      this.prisma.licenses.count({
        where: {
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
    // Capture the license's current status BEFORE the update so the workflow
    // history accurately reflects the previous state (fixes hardcoded ACTIVE bug).
    const currentLicense = await tx.licenses.findUnique({
      where: { id: licenseId },
      select: { status: true },
    });

    await tx.licenses.update({
      where: { id: licenseId },
      data: {
        status: LicenseStatus.CANCELLED,
        validTill: null,
        cancellationReason: reason,
        cancellationDate: new Date(),
        cancelApplicationId: applicationId,
        lastModifiedAppType: 'CANCELLATION',
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
}
