'use client';

import React, { useState, useEffect } from 'react';
import { formatGender, formatApplicationType } from '../../../utils/formatters';

interface PrintApplicationFormProps {
  application: any;
  applicantName: string;
}

// PDF Thumbnail generator component
function PDFPreview({ url, name }: { url: string; name: string }) {
  const [imgSrcs, setImgSrcs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagesCount, setPagesCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadPdf = async () => {
      try {
        // Dynamically import pdfjs-dist
        const pdfjsLib = await import('pdfjs-dist');

        // Use internal packaged worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url
        ).toString();

        // Normalize URL - rewrite any URL containing '/files/' to use the local API files download proxy
        let targetUrl = url;
        if (url.includes('/files/')) {
          const fileNameOnly = url.substring(url.indexOf('/files/') + '/files/'.length);
          if (typeof window !== 'undefined') {
            targetUrl = window.location.origin + '/api/files/download/' + fileNameOnly;
          }
        } else if (typeof window !== 'undefined' && url.startsWith('/')) {
          targetUrl = window.location.origin + url;
        }

        const loadingTask = pdfjsLib.getDocument({ url: targetUrl });
        const pdf = await loadingTask.promise;
        if (!active) return;

        const totalPages = pdf.numPages;
        setPagesCount(totalPages);

        const urls: string[] = [];
        // Render all pages
        for (let i = 1; i <= totalPages; i++) {
          const page = await pdf.getPage(i);
          // Scale to 2.0 for higher readability & clear text
          const viewport = page.getViewport({ scale: 2.0 });

          // Prepare canvas
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          if (context) {
            const renderContext = {
              canvasContext: context,
              viewport: viewport,
            } as any;
            await page.render(renderContext).promise;
            urls.push(canvas.toDataURL('image/png'));
          }
        }

        if (active) {
          setImgSrcs(urls);
        }
      } catch (err: any) {
        console.error('Error rendering PDF thumbnail:', err);
        if (active) {
          setError(err?.message || String(err));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    if (url) {
      loadPdf();
    }
    return () => {
      active = false;
    };
  }, [url]);

  if (loading) {
    return <div className='print-doc-placeholder'>Loading PDF Preview...</div>;
  }

  if (error) {
    return (
      <div className='print-doc-placeholder' style={{ color: '#d32f2f' }}>
        Preview Error: {error}
      </div>
    );
  }

  if (imgSrcs.length > 0) {
    return (
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          position: 'relative',
        }}
      >
        {imgSrcs.map((src, index) => (
          <div
            key={index}
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
              pageBreakInside: 'avoid',
              breakInside: 'avoid',
            }}
          >
            <img
              src={src}
              alt={`${name} - Page ${index + 1}`}
              className='print-doc-preview-image'
              style={{ width: '100%', height: 'auto', border: '1px solid #ddd' }}
            />
            <div style={{ marginTop: '4px', fontSize: '8px', color: '#666', fontWeight: 'bold' }}>
              Page {index + 1} of {pagesCount}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return <div className='print-doc-placeholder'>Document Preview Not Available</div>;
}

export default function PrintApplicationForm({
  application,
  applicantName,
}: PrintApplicationFormProps) {
  if (!application) return null;

  // Formatting dates helper
  const formatDate = (dateStr: any) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch (e) {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr: any) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch (e) {
      return dateStr;
    }
  };

  // License info
  const licenseDetails = application?.licenseDetails || application?.licenseDetail;
  const license = (Array.isArray(licenseDetails) ? licenseDetails[0] : licenseDetails) || {};
  const requestedWeapons = Array.isArray(license?.requestedWeapons)
    ? license.requestedWeapons
    : license?.requestedWeaponIds;
  const weaponsLabel = Array.isArray(requestedWeapons)
    ? requestedWeapons
        .map((w: any) => (typeof w === 'object' ? w?.name || w?.type || w?.id : w))
        .filter(Boolean)
        .join(', ')
    : '';

  // History info
  const history = ((application?.licenseHistories && application.licenseHistories[0]) || {}) as any;
  const familyWeapons = Array.isArray(history.familyWeaponsEndorsed)
    ? history.familyWeaponsEndorsed.filter(Boolean).join(', ')
    : null;

  // Address info
  const present = (application?.presentAddress || {}) as any;
  const presentState = typeof present.state === 'object' ? present.state?.name : present.state;
  const presentDistrict =
    typeof present.district === 'object' ? present.district?.name : present.district;

  const permanent = (application?.permanentAddress || {}) as any;
  const permanentState =
    typeof permanent.state === 'object' ? permanent.state?.name : permanent.state;
  const permanentDistrict =
    typeof permanent.district === 'object' ? permanent.district?.name : permanent.district;

  // Occupation info
  const occ = (application?.occupationAndBusiness || {}) as any;

  // HTML to plain text converter for print (strips tags, handles line breaks & lists)
  const htmlToPlainText = (html: string): string => {
    if (!html) return '';
    try {
      let text = html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<\/li>/gi, '\n')
        .replace(/<li[^>]*>/gi, '• ')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&#x27;/gi, "'")
        .replace(/&#x2F;/gi, '/')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n');
      return text;
    } catch {
      return html;
    }
  };

  // Criminal history
  const criminal = ((application?.criminalHistories && application.criminalHistories[0]) ||
    {}) as any;
  const firDetails = criminal?.firDetails || [];

  const photoUrl = application?.photoUrl || application?.photo;

  // Determine if this is a renewal application
  const isRenewal =
    application?.applicationType === 'Renewal' ||
    application?.renewalId ||
    application?.isRenewal === true;

  // Dynamic header based on application type
  const headerText = isRenewal ? 'Renewal Details' : 'Fresh Details';

  return (
    <div className='print-form-container font-serif text-black p-4 w-[210mm] max-w-[210mm] mx-auto bg-white box-border'>
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
          .print-hidden-element,
          header,
          footer,
          aside,
          nav,
          button,
          .print\:hidden {
            display: none !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print-form-container {
            padding: 0 !important;
            margin: 0 auto !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: 0 !important;
            box-sizing: border-box !important;
          }
          @page {
            size: A4 portrait;
            margin: 0 !important;
          }
          body {
            padding: 10mm 15mm !important;
          }
          /* Add watermark wrapper layer repeating across multiple pages */
          body::before {
            content: 'Sparquer';
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 80px;
            color: rgba(135, 206, 250, 0.15) !important;
            pointer-events: none;
            z-index: 9999;
            font-family: sans-serif;
            font-weight: bold;
            letter-spacing: 4px;
            white-space: nowrap;
          }
          /* CSS Page counter initialization and display */
          body {
            counter-reset: page;
          }
          .print-footer-page-number {
            display: none;
          }
          @media print {
            .print-footer-page-number {
              display: block !important;
              position: fixed !important;
              bottom: 10mm !important;
              right: 15mm !important;
              font-size: 9px !important;
              font-family: sans-serif !important;
              color: #555 !important;
              z-index: 9999;
            }
            .print-footer-page-number::after {
              content: 'Page ' counter(page);
            }
          }
          .print-form-container {
            position: relative;
          }
        }

        .print-form-table {
          width: 100% !important;
          table-layout: fixed;
          border-collapse: collapse;
          margin-bottom: 8px;
          box-sizing: border-box;
          page-break-inside: avoid;
          break-inside: avoid;
        }

        .print-form-table th,
        .print-form-table td {
          border: 1px solid #111;
          padding: 4px 6px;
          text-align: left;
          vertical-align: top;
          font-size: 9px;
          line-height: 1.15;
          word-wrap: break-word;
          overflow-wrap: break-word;
          box-sizing: border-box;
        }

        .print-form-table th {
          background-color: #f2f2f2;
          font-weight: bold;
        }

        .section-header-row {
          background-color: #e6e6e6 !important;
          font-weight: bold;
          font-size: 10px !important;
          text-transform: uppercase;
          border-bottom: 2px solid #111 !important;
        }

        .label-cell {
          font-weight: 500;
          color: #333;
          width: 25%;
        }

        .value-cell {
          font-weight: bold;
          color: #000;
          width: 25%;
        }

        .print-documents-grid {
          display: flex;
          flex-direction: column;
          gap: 20px;
          width: 100%;
          box-sizing: border-box;
        }

        .print-doc-card {
          border: 1px solid #111;
          background: #fff;
          padding: 10px;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          page-break-before: always;
          break-before: page;
          page-break-inside: avoid;
          break-inside: avoid;
          min-height: 260mm;
          justify-content: flex-start;
        }

        .print-doc-title {
          font-weight: bold;
          font-size: 12px;
          background-color: #e6e6e6;
          border: 1px solid #111;
          padding: 6px 10px;
          margin-bottom: 12px;
          text-transform: uppercase;
        }

        .print-doc-preview-container {
          width: 100%;
          min-height: 220mm;
          border: 1px solid #111;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          background-color: #fff;
          box-sizing: border-box;
          margin-bottom: 10px;
          padding: 10px;
        }

        .print-doc-preview-image {
          width: 100%;
          height: auto;
          max-width: 100%;
          object-fit: contain;
        }

        .print-doc-placeholder {
          font-size: 14px;
          color: #666;
          text-align: center;
          padding: 20px;
          font-weight: bold;
        }

        .print-doc-name {
          font-size: 10px;
          color: #111;
          word-break: break-all;
          line-height: 1.4;
          font-family: monospace;
          font-weight: bold;
          border-top: 1px solid #111;
          padding-top: 8px;
        }
      `}</style>

      {/* Main Form Title */}
      <div className='text-center font-bold text-base tracking-wide border-2 border-black p-2 mb-4 uppercase'>
        {headerText}
      </div>

      {/* 1. Applicant Information Section */}
      <table className='print-form-table'>
        <thead>
          <tr>
            <th colSpan={5} className='section-header-row'>
              1. Applicant Information
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className='label-cell'>Application ID</td>
            <td className='value-cell'>{application.id || application.applicationId || ''}</td>
            <td className='label-cell'>Application Type</td>
            <td className='value-cell'>
              {formatApplicationType(application.applicationType) || 'Fresh'}
            </td>
            <td
              rowSpan={6}
              style={{
                width: '100px',
                textAlign: 'center',
                verticalAlign: 'middle',
                padding: '2px',
              }}
            >
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt='Applicant Photo'
                  style={{
                    width: '80px',
                    height: '100px',
                    objectFit: 'cover',
                    border: '1px solid #111',
                    display: 'inline-block',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '80px',
                    height: '100px',
                    border: '1px dashed #111',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '8px',
                    margin: '0 auto',
                  }}
                >
                  Applicant Photo
                </div>
              )}
              <div style={{ fontSize: '8px', marginTop: '2px', fontWeight: 'bold' }}>
                Applicant Photo
              </div>
            </td>
          </tr>
          <tr>
            <td className='label-cell'>Full Name</td>
            <td className='value-cell'>{applicantName}</td>
            <td className='label-cell'>Gender</td>
            <td className='value-cell'>{formatGender(application.sex || application.gender)}</td>
          </tr>
          <tr>
            <td className='label-cell'>Parent / Spouse Name</td>
            <td className='value-cell'>{application.parentOrSpouseName || '—'}</td>
            <td className='label-cell'>Date of Birth</td>
            <td className='value-cell'>{formatDate(application.dateOfBirth || application.dob)}</td>
          </tr>
          <tr>
            <td className='label-cell'>Place of Birth</td>
            <td className='value-cell'>{application.placeOfBirth || '—'}</td>
            <td className='label-cell'>Aadhaar Number</td>
            <td className='value-cell' style={{ fontFamily: 'monospace' }}>
              {application.aadharNumber || '—'}
            </td>
          </tr>
          <tr>
            <td className='label-cell'>PAN Number</td>
            <td className='value-cell' style={{ fontFamily: 'monospace' }}>
              {application.panNumber || '—'}
            </td>
            <td className='label-cell'>Current User</td>
            <td className='value-cell'>{application.currentUser?.username || '—'}</td>
          </tr>
          <tr>
            <td className='label-cell'>Acknowledgement Number</td>
            <td className='value-cell' style={{ fontFamily: 'monospace' }}>
              {application.acknowledgementNo || '—'}
            </td>
            <td className='label-cell'>Workflow Status</td>
            <td className='value-cell'>
              {application.workflowStatus?.name || application.workflowStatus || '—'}
            </td>
          </tr>
          <tr>
            <td className='label-cell'>Date & Time of Submission</td>
            <td className='value-cell' colSpan={4}>
              {formatDateTime(application.applicationDate)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* 2. License Details & 3. License History Side-by-Side in Table Grid */}
      <table className='print-form-table'>
        <thead>
          <tr>
            <th colSpan={2} className='section-header-row' style={{ width: '50%' }}>
              2. License Details
            </th>
            <th colSpan={2} className='section-header-row' style={{ width: '50%' }}>
              3. License History
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className='label-cell' style={{ width: '20%' }}>
              Need for License
            </td>
            <td className='value-cell' style={{ width: '30%' }}>
              {license.needForLicense || '—'}
            </td>
            <td className='label-cell' style={{ width: '20%' }}>
              Previously Applied
            </td>
            <td className='value-cell' style={{ width: '30%' }}>
              {history.hasAppliedBefore !== undefined
                ? history.hasAppliedBefore
                  ? 'Yes'
                  : 'No'
                : '—'}
            </td>
          </tr>
          <tr>
            <td className='label-cell'>Arms Category</td>
            <td className='value-cell'>{license.armsCategory || '—'}</td>
            <td className='label-cell'>Previous Result</td>
            <td className='value-cell'>{history.previousResult || '—'}</td>
          </tr>
          <tr>
            <td className='label-cell'>Requested Weapons</td>
            <td className='value-cell'>{weaponsLabel || '—'}</td>
            <td className='label-cell'>Previous Authority</td>
            <td className='value-cell'>{history.previousAuthorityName || '—'}</td>
          </tr>
          <tr>
            <td className='label-cell'>Area of Validity</td>
            <td className='value-cell'>{license.areaOfValidity || '—'}</td>
            <td className='label-cell'>License Suspended</td>
            <td className='value-cell'>
              {history.hasLicenceSuspended !== undefined
                ? history.hasLicenceSuspended
                  ? 'Yes'
                  : 'No'
                : '—'}
            </td>
          </tr>
          <tr>
            <td className='label-cell'>Licence Place / Area</td>
            <td className='value-cell'>{license.licencePlaceArea || '—'}</td>
            <td className='label-cell'>Suspension Reason</td>
            <td className='value-cell'>{history.suspensionReason || '—'}</td>
          </tr>
          <tr>
            <td className='label-cell'>Ammunition Description</td>
            <td className='value-cell'>{license.ammunitionDescription || '—'}</td>
            <td className='label-cell'>Family License</td>
            <td className='value-cell'>
              {history.hasFamilyLicence !== undefined
                ? history.hasFamilyLicence
                  ? 'Yes'
                  : 'No'
                : '—'}
            </td>
          </tr>
          <tr>
            <td className='label-cell'>Special Consideration Reason</td>
            <td className='value-cell'>{license.specialConsiderationReason || '—'}</td>
            <td className='label-cell'>Family Member Name</td>
            <td className='value-cell'>{history.familyMemberName || '—'}</td>
          </tr>
          <tr>
            <td className='label-cell'>Wild Beasts Specification</td>
            <td className='value-cell'>{license.wildBeastsSpecification || '—'}</td>
            <td className='label-cell'>Family License Number</td>
            <td className='value-cell'>{history.familyLicenceNumber || '—'}</td>
          </tr>
          {familyWeapons && (
            <tr>
              <td colSpan={2}></td>
              <td className='label-cell'>Family Weapons Endorsed</td>
              <td className='value-cell'>{familyWeapons}</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* 4. Address Details & 5. Occupation & Business Details */}
      <table className='print-form-table'>
        <thead>
          <tr>
            <th colSpan={3} className='section-header-row' style={{ width: '60%' }}>
              4. Address Details
            </th>
            <th colSpan={2} className='section-header-row' style={{ width: '40%' }}>
              5. Occupation & Business Details
            </th>
          </tr>
          <tr>
            <th style={{ width: '20%' }}>Fields</th>
            <th style={{ width: '20%' }}>Present Address</th>
            <th style={{ width: '20%' }}>Permanent Address</th>
            <th style={{ width: '15%' }}>Fields</th>
            <th style={{ width: '25%' }}>Values</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className='label-cell'>Address</td>
            <td className='value-cell'>{present.addressLine || '—'}</td>
            <td className='value-cell'>{permanent.addressLine || '—'}</td>
            <td className='label-cell'>Occupation</td>
            <td className='value-cell'>{occ.occupation || '—'}</td>
          </tr>
          <tr>
            <td className='label-cell'>State</td>
            <td className='value-cell'>{presentState || '—'}</td>
            <td className='value-cell'>{permanentState || '—'}</td>
            <td className='label-cell'>Office Address</td>
            <td className='value-cell'>{occ.officeAddress || '—'}</td>
          </tr>
          <tr>
            <td className='label-cell'>District</td>
            <td className='value-cell'>{presentDistrict || '—'}</td>
            <td className='value-cell'>{permanentDistrict || '—'}</td>
            <td className='label-cell'>State</td>
            <td className='value-cell'>{occ.state?.name || '—'}</td>
          </tr>
          <tr>
            <td className='label-cell'>Zone</td>
            <td className='value-cell'>{present.zone?.name || '—'}</td>
            <td className='value-cell'>{permanent.zone?.name || '—'}</td>
            <td className='label-cell'>District</td>
            <td className='value-cell'>{occ.district?.name || '—'}</td>
          </tr>
          <tr>
            <td className='label-cell'>Division</td>
            <td className='value-cell'>{present.division?.name || '—'}</td>
            <td className='value-cell'>{permanent.division?.name || '—'}</td>
            <td className='label-cell'>Crop Location</td>
            <td className='value-cell'>{occ.cropLocation || '—'}</td>
          </tr>
          <tr>
            <td className='label-cell'>Police Station</td>
            <td className='value-cell'>{present.policeStation?.name || '—'}</td>
            <td className='value-cell'>{permanent.policeStation?.name || '—'}</td>
            <td className='label-cell'>Area Under Cultivation</td>
            <td className='value-cell'>{occ.areaUnderCultivation || '—'}</td>
          </tr>
          <tr>
            <td className='label-cell'>Residing Since</td>
            <td className='value-cell'>{formatDate(present.sinceResiding)}</td>
            <td className='value-cell'>{formatDate(permanent.sinceResiding)}</td>
            <td colSpan={2}></td>
          </tr>
        </tbody>
      </table>

      {/* 6. Criminal History */}
      <table className='print-form-table'>
        <thead>
          <tr>
            <th colSpan={4} className='section-header-row'>
              6. Criminal History
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className='label-cell'>Convicted</td>
            <td className='value-cell'>
              {criminal.isConvicted !== undefined ? (criminal.isConvicted ? 'Yes' : 'No') : '—'}
            </td>
            <td className='label-cell'>Prohibited</td>
            <td className='value-cell'>
              {criminal.isProhibited !== undefined ? (criminal.isProhibited ? 'Yes' : 'No') : '—'}
            </td>
          </tr>
          <tr>
            <td className='label-cell'>Bond Executed</td>
            <td className='value-cell'>
              {criminal.isBondExecuted !== undefined
                ? criminal.isBondExecuted
                  ? 'Yes'
                  : 'No'
                : '—'}
            </td>
            <td className='label-cell'>FIR Number</td>
            <td className='value-cell'>{firDetails[0]?.firNumber || '—'}</td>
          </tr>
          <tr>
            <td className='label-cell'>Bond Date</td>
            <td className='value-cell'>{formatDate(criminal.bondDate)}</td>
            <td className='label-cell'>Sentence Date</td>
            <td className='value-cell'>{firDetails[0]?.DateOfSentence || '—'}</td>
          </tr>
        </tbody>
      </table>

      {/* 7. FIR Details */}
      {firDetails.length > 0 && (
        <table className='print-form-table'>
          <thead>
            <tr>
              <th colSpan={6} className='section-header-row'>
                7. FIR Details
              </th>
            </tr>
            <tr>
              <th style={{ width: '15%' }}>FIR Number</th>
              <th style={{ width: '15%' }}>Police Station</th>
              <th style={{ width: '15%' }}>District</th>
              <th style={{ width: '20%' }}>Under Section</th>
              <th style={{ width: '20%' }}>Offence</th>
              <th style={{ width: '15%' }}>Sentence Date</th>
            </tr>
          </thead>
          <tbody>
            {firDetails.map((fir: any, firIdx: number) => (
              <tr key={firIdx}>
                <td className='value-cell'>{fir.firNumber || '—'}</td>
                <td className='value-cell'>{fir.policeStation || '—'}</td>
                <td className='value-cell'>{fir.District || '—'}</td>
                <td className='value-cell'>{fir.underSection || '—'}</td>
                <td className='value-cell'>{fir.offence || '—'}</td>
                <td className='value-cell'>{fir.DateOfSentence || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* 8. Uploaded Documents Section with Previews */}
      {application.documents && application.documents.length > 0 && (
        <div style={{ marginTop: '12px' }}>
          <div
            className='section-header-row'
            style={{
              border: '1px solid #111',
              padding: '5px 8px',
              fontSize: '10px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            8. Uploaded Documents
          </div>
          <div className='print-documents-grid'>
            {application.documents.map((doc: any, idx: number) => {
              const name = doc?.name || doc?.fileName || `Document-${idx + 1}`;
              const type = doc?.type || doc?.category || 'Attachment';
              const url = doc?.url || doc?.path || doc?.downloadUrl;
              const isImage =
                /\.(png|jpe?g|gif|svg)$/i.test(name) || /image/i.test(doc?.contentType);
              const isPdf = /\.pdf$/i.test(name) || /pdf/i.test(doc?.contentType);

              return (
                <div key={idx} className='print-doc-card'>
                  <div className='print-doc-title'>{type}</div>
                  <div className='print-doc-preview-container'>
                    {isImage && url ? (
                      <img src={url} alt={name} className='print-doc-preview-image' />
                    ) : isPdf && url ? (
                      <PDFPreview url={url} name={name} />
                    ) : (
                      <div className='print-doc-placeholder'>Document Preview Not Available</div>
                    )}
                  </div>
                  <div className='print-doc-name'>{name}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 9. Application History Section */}
      {(() => {
        const rawHistories = Array.isArray(application.workflowHistories)
          ? application.workflowHistories
          : Array.isArray(application.history)
            ? application.history
            : [];
        const workflowHistories = [...rawHistories].sort(
          (a: any, b: any) =>
            new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
        );

        if (workflowHistories.length === 0) return null;

        return (
          <div
            style={{
              marginTop: '16px',
              pageBreakBefore: workflowHistories.length > 5 ? 'always' : 'auto',
            }}
          >
            <div
              className='section-header-row'
              style={{
                border: '1px solid #111',
                padding: '5px 8px',
                fontSize: '10px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                marginBottom: '6px',
              }}
            >
              9. Application History
            </div>
            <table
              className='print-form-table'
              style={{ pageBreakBefore: 'auto', pageBreakInside: 'auto' }}
            >
              <thead>
                <tr>
                  <th style={{ width: '5%' }}>#</th>
                  <th style={{ width: '18%' }}>User / Officer</th>
                  <th style={{ width: '16%' }}>Designation</th>
                  <th style={{ width: '14%' }}>Action</th>
                  <th style={{ width: '16%' }}>Forwarded To</th>
                  <th style={{ width: '16%' }}>Date & Time</th>
                  <th style={{ width: '15%' }}>Attachments</th>
                </tr>
              </thead>
              <tbody>
                {workflowHistories.map((entry: any, idx: number) => {
                  // Support both WorkflowHistory (new) and history (old) formats
                  const userName =
                    entry.previousUserName || entry.by?.split('(')[0]?.trim() || 'Unknown';
                  const roleName =
                    entry.previousRoleName ||
                    (entry.by ? entry.by.match(/\(([^)]+)\)/)?.[1] || '' : '') ||
                    '—';
                  const actionTaken = entry.actionTaken || entry.action || '—';
                  const isSameUser =
                    entry.previousUserId &&
                    entry.nextUserId &&
                    Number(entry.previousUserId) === Number(entry.nextUserId);
                  const forwardedTo =
                    entry.nextUserName && !isSameUser
                      ? `${entry.nextUserName}${entry.nextRoleName ? ` (${entry.nextRoleName})` : ''}`
                      : '—';
                  const rawRemarks = entry.remarks || entry.comments || '';
                  const hasRemarks = !!rawRemarks;
                  const formattedRemarks = hasRemarks ? htmlToPlainText(rawRemarks) : '';
                  const attachments = entry.attachments;
                  const hasAttachments = Array.isArray(attachments) && attachments.length > 0;
                  const dateTime = entry.createdAt
                    ? (() => {
                        try {
                          const d = new Date(entry.createdAt);
                          return (
                            d.toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            }) +
                            ' ' +
                            d.toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          );
                        } catch {
                          return entry.createdAt;
                        }
                      })()
                    : entry.date && entry.time
                      ? `${entry.date} ${entry.time}`
                      : '—';

                  return (
                    <React.Fragment key={entry.id || idx}>
                      <tr>
                        <td
                          style={{
                            textAlign: 'center',
                            fontWeight: 'normal',
                            fontSize: '8px',
                            border: '1px solid #111',
                            padding: '3px 4px',
                            verticalAlign: 'top',
                          }}
                        >
                          {idx + 1}
                        </td>
                        <td
                          style={{
                            fontWeight: 'normal',
                            fontSize: '8px',
                            border: '1px solid #111',
                            padding: '3px 4px',
                            verticalAlign: 'top',
                          }}
                        >
                          {userName}
                        </td>
                        <td
                          style={{
                            fontWeight: 'normal',
                            fontSize: '8px',
                            border: '1px solid #111',
                            padding: '3px 4px',
                            verticalAlign: 'top',
                          }}
                        >
                          {roleName}
                        </td>
                        <td
                          style={{
                            fontWeight: 'normal',
                            fontSize: '8px',
                            border: '1px solid #111',
                            padding: '3px 4px',
                            verticalAlign: 'top',
                          }}
                        >
                          {actionTaken}
                        </td>
                        <td
                          style={{
                            fontWeight: 'normal',
                            fontSize: '8px',
                            border: '1px solid #111',
                            padding: '3px 4px',
                            verticalAlign: 'top',
                          }}
                        >
                          {forwardedTo}
                        </td>
                        <td
                          style={{
                            fontWeight: 'normal',
                            fontSize: '8px',
                            border: '1px solid #111',
                            padding: '3px 4px',
                            verticalAlign: 'top',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {dateTime}
                        </td>
                        <td
                          style={{
                            fontWeight: 'normal',
                            fontSize: '8px',
                            border: '1px solid #111',
                            padding: '3px 4px',
                            verticalAlign: 'top',
                            textAlign: 'center',
                          }}
                        >
                          {hasAttachments ? `${attachments.length} file(s)` : '—'}
                        </td>
                      </tr>
                      {(hasRemarks || hasAttachments) && (
                        <tr>
                          <td
                            colSpan={7}
                            style={{
                              border: '1px solid #111',
                              borderTop: 'none',
                              padding: '5px 8px 5px 16px',
                              fontSize: '8px',
                              lineHeight: '1.4',
                              verticalAlign: 'top',
                              backgroundColor: '#fafafa',
                              wordWrap: 'break-word',
                              overflowWrap: 'break-word',
                              whiteSpace: 'pre-wrap',
                            }}
                          >
                            {hasRemarks && (
                              <div style={{ marginBottom: hasAttachments ? '6px' : '0' }}>
                                <span style={{ fontWeight: 'bold', marginRight: '4px' }}>
                                  Remarks:
                                </span>
                                {formattedRemarks || '—'}
                              </div>
                            )}
                            {hasAttachments && (
                              <div style={{ marginTop: '8px' }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>
                                  Attachments:
                                </div>
                                <div
                                  style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
                                >
                                  {attachments.map((att: any, attIdx: number) => {
                                    const name =
                                      att?.name || att?.fileName || `Attachment-${attIdx + 1}`;
                                    const url = att?.url || att?.path || att?.downloadUrl;
                                    const isImage =
                                      /\.(png|jpe?g|gif|svg)$/i.test(name) ||
                                      /image/i.test(att?.contentType);
                                    const isPdf =
                                      /\.pdf$/i.test(name) || /pdf/i.test(att?.contentType);

                                    return (
                                      <div
                                        key={attIdx}
                                        style={{
                                          border: '1px solid #111',
                                          padding: '10px',
                                          backgroundColor: '#fff',
                                          maxWidth: '100%',
                                          pageBreakInside: 'avoid',
                                          breakInside: 'avoid',
                                          marginTop: '6px',
                                        }}
                                      >
                                        <div
                                          style={{
                                            fontSize: '9px',
                                            fontFamily: 'monospace',
                                            fontWeight: 'bold',
                                            borderBottom: '1px solid #111',
                                            paddingBottom: '5px',
                                            marginBottom: '6px',
                                          }}
                                        >
                                          {name}
                                        </div>
                                        <div
                                          style={{
                                            width: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            border: '1px solid #eee',
                                            backgroundColor: '#fff',
                                            padding: '10px',
                                            boxSizing: 'border-box',
                                          }}
                                        >
                                          {isImage && url ? (
                                            <img
                                              src={url}
                                              alt={name}
                                              style={{
                                                width: '100%',
                                                height: 'auto',
                                                maxWidth: '100%',
                                                objectFit: 'contain',
                                              }}
                                            />
                                          ) : isPdf && url ? (
                                            <PDFPreview url={url} name={name} />
                                          ) : (
                                            <div
                                              style={{
                                                fontSize: '9px',
                                                color: '#888',
                                                padding: '20px',
                                              }}
                                            >
                                              Preview not available
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
            <div
              style={{
                fontSize: '7px',
                color: '#555',
                marginTop: '4px',
                textAlign: 'right',
                fontStyle: 'italic',
              }}
            >
              Total entries: {workflowHistories.length}
            </div>
          </div>
        );
      })()}

      {/* Footer Area with Print Date and Signature Line */}
      <div
        className='flex justify-between items-end mt-4 pt-4 text-[9px] font-serif'
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginTop: '16px',
        }}
      >
        <div>Date of Print: {formatDate(new Date())}</div>
        <div style={{ textAlign: 'right' }}>Authorized Signature: ___________________________</div>
      </div>
      <div className='print-footer-page-number' />
    </div>
  );
}
