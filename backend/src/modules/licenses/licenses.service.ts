import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../services/prisma.service';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import * as QRCode from 'qrcode';

@Injectable()
export class LicensesService {
  private readonly logger = new Logger(LicensesService.name);

  constructor(private prisma: PrismaService) {}

  async generateLicensePdf(applicationId: number, issuedBy: number) {
    // Check if license already exists
    const existingLicense = await this.prisma.licenses.findFirst({
      where: { applicationId }
    });

    if (existingLicense) {
      this.logger.log(`License already exists for application ${applicationId}, returning existing`);
      return existingLicense;
    }

    const application = await this.prisma.freshLicenseApplicationPersonalDetails.findUnique({
      where: { id: applicationId },
      include: {
        presentAddress: { include: { state: true, district: true, policeStation: true } },
        permanentAddress: { include: { state: true, district: true, policeStation: true } },
        occupationAndBusiness: true,
        criminalHistories: true,
        licenseHistories: true,
        licenseDetails: true
      }
    });

    if (!application) throw new Error('Application not found');

    // Fetch Applicant's Photograph
    const photoUpload = await this.prisma.fLAFFileUploads.findFirst({
      where: { applicationId, fileType: 'PHOTOGRAPH' }
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

    const licenseNumber = 'ALMS-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 100000);
    const validFrom = new Date();
    const validTill = new Date();
    validTill.setFullYear(validTill.getFullYear() + 2); // 2 years validity

    // Generate QR Code
    const qrData = JSON.stringify({
      licenseNumber,
      applicationId,
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
                  <td style="color: #c0392b; font-weight: 600;">${validTill.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</td>
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

    const license = await this.prisma.licenses.create({
      data: {
        licenseNumber,
        applicationId,
        issueDate: new Date(),
        validFrom,
        validTill,
        status: 'ACTIVE',
        pdfUrl: dataUri,
        qrCodeUrl,
        issuedBy
      }
    });

    this.logger.log(`Generated license ${licenseNumber} for application ${applicationId}`);
    return license;
  }
}
