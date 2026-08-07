'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { formatGender, formatApplicationType } from '../../../utils/formatters';

interface PrintApplicationFormProps {
  application: any;
  applicantName: string;
  // Correctly-fetched workflow history (same source the on-screen timeline uses).
  // Falls back to application.workflowHistories / application.history when omitted.
  workflowHistory?: any[];
  // Called whenever the "is every async preview finished rendering" state changes,
  // so the caller can hold off calling window.print() until content is actually painted.
  onReadyChange?: (ready: boolean) => void;
}

const isImageFile = (name: string, contentType?: string) =>
  /\.(png|jpe?g|gif|svg)$/i.test(name) || /image/i.test(contentType || '');

const isPdfFile = (name: string, contentType?: string) =>
  /\.pdf$/i.test(name) || /pdf/i.test(contentType || '');

// Resolve the applicant's headshot the same way sidebarApiCalls.ts and
// applicationFormatters.ts already do for the fresh/renewal fetch paths.
// The "Original License Details" tab feeds print a raw License-API object
// that has neither a normalized `photoUrl` nor `documents`, just whatever
// file relations the backend included — so fall back to fileUploads,
// biometricData, and (for the origin tab) the raw documents array too.
const resolvePhotoUrl = (d: any): string | undefined => {
  if (!d) return undefined;
  try {
    const bioRoot = d.biometricData || d.biometric_data || null;
    let bio = bioRoot;
    if (bio && bio.biometricData) bio = bio.biometricData;
    if (bio && bio.photo && typeof bio.photo.url === 'string' && bio.photo.url.trim()) {
      return bio.photo.url.trim();
    }

    if (typeof d.photoUrl === 'string' && d.photoUrl.trim()) return d.photoUrl.trim();
    if (typeof d.photo === 'string' && d.photo.trim()) return d.photo.trim();

    const isPhotoEntry = (f: any) => {
      const type = ((f?.fileType || f?.type || '') + '').toUpperCase();
      const name = ((f?.fileName || f?.name || '') + '').toLowerCase();
      return type.includes('PHOTOGRAPH') || /(photo|photograph|passport)/.test(name);
    };
    const urlOf = (f: any) => (f?.fileUrl || f?.url || '').toString();

    const sources = [d.fileUploads, d.file_uploads, d.documents].filter(Array.isArray);
    for (const uploads of sources) {
      const match = uploads.find((f: any) => isPhotoEntry(f) && urlOf(f));
      if (match) return urlOf(match);
    }

    return undefined;
  } catch {
    return undefined;
  }
};

// PDF Thumbnail generator component
function PDFPreview({
  url,
  name,
  onSettled,
}: {
  url: string;
  name: string;
  onSettled?: () => void;
}) {
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
        onSettled?.();
      }
    };

    if (url) {
      loadPdf();
    } else {
      onSettled?.();
    }
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // Block layout, not flex: a flex container's children don't reliably
      // fragment across printed pages in Chromium, which would otherwise
      // trap every page of a multi-page PDF on a single printed page (and
      // clip whatever didn't fit) instead of letting them flow naturally.
      <div style={{ width: '100%', position: 'relative' }}>
        {imgSrcs.map((src, index) => (
          <div
            key={index}
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
              marginBottom: index < imgSrcs.length - 1 ? '20px' : 0,
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
  workflowHistory,
  onReadyChange,
}: PrintApplicationFormProps) {
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

  const photoUrl = resolvePhotoUrl(application);

  // Determine if this is a renewal application
  const isRenewal =
    application?.applicationType === 'Renewal' ||
    application?.renewalId ||
    application?.isRenewal === true;

  // Dynamic header based on application type
  const headerText = isRenewal ? 'Renewal Details' : 'Fresh Details';

  // Prefer the explicitly supplied workflow history (the same data source the
  // on-screen timeline uses). application.workflowHistories / application.history
  // can be empty depending on how the application was fetched (e.g. renewals),
  // which is why "Application History" was missing from the printout.
  const workflowHistories = useMemo(() => {
    const source =
      Array.isArray(workflowHistory) && workflowHistory.length > 0
        ? workflowHistory
        : Array.isArray(application?.workflowHistories) && application.workflowHistories.length > 0
          ? application.workflowHistories
          : Array.isArray(application?.history)
            ? application.history
            : [];
    return [...source].sort(
      (a: any, b: any) =>
        new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
    );
  }, [workflowHistory, application]);

  // Track every async image/PDF preview so printing can wait until they've
  // actually painted instead of firing window.print() while thumbnails are
  // still loading (which prints blank/placeholder boxes).
  const previewKeys = useMemo(() => {
    const keys: string[] = [];
    (application?.documents || []).forEach((doc: any, idx: number) => {
      const name = doc?.name || doc?.fileName || `Document-${idx + 1}`;
      const url = doc?.url || doc?.fileUrl || doc?.path || doc?.downloadUrl;
      if (url && (isImageFile(name, doc?.contentType) || isPdfFile(name, doc?.contentType))) {
        keys.push(`doc-${idx}`);
      }
    });
    workflowHistories.forEach((entry: any, idx: number) => {
      const attachments = Array.isArray(entry.attachments) ? entry.attachments : [];
      attachments.forEach((att: any, attIdx: number) => {
        const name = att?.name || att?.fileName || `Attachment-${attIdx + 1}`;
        const url = att?.url || att?.path || att?.downloadUrl;
        if (url && (isImageFile(name, att?.contentType) || isPdfFile(name, att?.contentType))) {
          keys.push(`hist-${idx}-att-${attIdx}`);
        }
      });
    });
    return keys;
  }, [application, workflowHistories]);

  const [settledPreviews, setSettledPreviews] = useState<Set<string>>(new Set());
  const markSettled = useCallback((key: string) => {
    setSettledPreviews(prev => (prev.has(key) ? prev : new Set(prev).add(key)));
  }, []);

  useEffect(() => {
    onReadyChange?.(previewKeys.every(key => settledPreviews.has(key)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewKeys, settledPreviews]);

  if (!application) return null;

  return (
    <div className='print-form-container font-serif text-black p-4 w-[210mm] max-w-[210mm] mx-auto bg-white box-border'>
      <style jsx global>{`
        @media print {
          html,
          body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            /* The app shell sets html/body to overflow: hidden/auto for its
               fixed-viewport layout; left in place during print, Chromium's
               print engine treats body as a single fixed-size scroll box and
               ignores page breaks past page 1, clipping everything after. */
            overflow: visible !important;
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
          /* Deliberately block layout, not flex/grid: Chromium's print/PDF
             fragmentation engine does not reliably honor break-before/
             break-after on children of a flex or grid container, which was
             causing the forced page-break-before on .print-doc-card to be
             silently ignored and documents to bleed across page boundaries
             mid-image instead of starting cleanly on their own page. */
          display: block;
          width: 100%;
          box-sizing: border-box;
        }

        .print-doc-card {
          border: 1px solid #111;
          background: #fff;
          padding: 10px;
          margin-bottom: 20px;
          /* Block, not flex: a flex container establishes its own
             fragmentation context in Chromium's print engine, which both
             suppresses break-before on flex items (documents wouldn't start
             on a fresh page at all) and stops taller-than-one-page content
             from flowing across pages (it gets clipped instead). Block
             layout lets both the forced page break and natural pagination
             work correctly. */
          display: block;
          box-sizing: border-box;
          page-break-before: always;
          break-before: page;
          /* Intentionally no page-break-inside/break-inside: avoid here — a
             multi-page PDF preview is legitimately taller than one printable
             page, and forcing "avoid" on something that can't fit on one page
             causes browsers to clip it instead of flowing it onto the next
             page. Each individual preview image below is capped to fit
             within one page and marked break-inside: avoid on its own. */
          min-height: 260mm;
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
          /* Block, not flex: a flex container establishes its own
             fragmentation context, which stops Chromium's print engine from
             breaking a taller-than-one-page child (e.g. a multi-page PDF
             preview) across pages — it gets clipped instead. */
          display: block;
          text-align: center;
          background-color: #fff;
          box-sizing: border-box;
          margin-bottom: 10px;
          padding: 10px;
        }

        .print-doc-preview-image {
          width: 100%;
          height: auto;
          max-width: 100%;
          /* Cap so a tall/portrait photo (or a single PDF page render) can
             never exceed one printable page (~277mm usable height after
             margins) and get clipped mid-image; it now scales down instead. */
          max-height: 230mm;
          object-fit: contain;
          page-break-inside: avoid;
          break-inside: avoid;
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
              const type = doc?.type || doc?.fileType || doc?.category || 'Attachment';
              const url = doc?.url || doc?.fileUrl || doc?.path || doc?.downloadUrl;
              const isImage = isImageFile(name, doc?.contentType);
              const isPdf = isPdfFile(name, doc?.contentType);
              const previewKey = `doc-${idx}`;

              return (
                <div key={idx} className='print-doc-card'>
                  <div className='print-doc-title'>{type}</div>
                  <div className='print-doc-preview-container'>
                    {isImage && url ? (
                      <img
                        src={url}
                        alt={name}
                        className='print-doc-preview-image'
                        onLoad={() => markSettled(previewKey)}
                        onError={() => markSettled(previewKey)}
                      />
                    ) : isPdf && url ? (
                      <PDFPreview url={url} name={name} onSettled={() => markSettled(previewKey)} />
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
                  // Support the flattened (Fresh) shape, the nested (Renewal /
                  // workflow-history-endpoint) shape, and the legacy "history" shape.
                  const previousUserId = entry.previousUserId ?? entry.previousUser?.id;
                  const nextUserId = entry.nextUserId ?? entry.nextUser?.id;
                  const userName =
                    entry.previousUserName ||
                    entry.previousUser?.username ||
                    entry.by?.split('(')[0]?.trim() ||
                    'Unknown';
                  const roleName =
                    entry.previousRoleName ||
                    entry.previousUser?.role?.name ||
                    entry.previousRole?.name ||
                    (entry.by ? entry.by.match(/\(([^)]+)\)/)?.[1] || '' : '') ||
                    '—';
                  const actionTaken =
                    entry.actionTaken || entry.action || entry.actiones?.name || '—';
                  const isSameUser =
                    previousUserId && nextUserId && Number(previousUserId) === Number(nextUserId);
                  const nextUserName = entry.nextUserName || entry.nextUser?.username;
                  const nextRoleName =
                    entry.nextRoleName || entry.nextUser?.role?.name || entry.nextRole?.name;
                  const forwardedTo =
                    nextUserName && !isSameUser
                      ? `${nextUserName}${nextRoleName ? ` (${nextRoleName})` : ''}`
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
                                <div>
                                  {attachments.map((att: any, attIdx: number) => {
                                    const name =
                                      att?.name || att?.fileName || `Attachment-${attIdx + 1}`;
                                    const url = att?.url || att?.path || att?.downloadUrl;
                                    const isImage = isImageFile(name, att?.contentType);
                                    const isPdf = isPdfFile(name, att?.contentType);
                                    const previewKey = `hist-${idx}-att-${attIdx}`;

                                    return (
                                      <div
                                        key={attIdx}
                                        style={{
                                          border: '1px solid #111',
                                          padding: '10px',
                                          backgroundColor: '#fff',
                                          maxWidth: '100%',
                                          // No break-inside: avoid here — a multi-page PDF
                                          // attachment must be allowed to flow across pages
                                          // instead of being clipped. The image/PDF page
                                          // previews below are individually capped and
                                          // marked break-inside: avoid instead.
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
                                              className='print-doc-preview-image'
                                              style={{
                                                width: '100%',
                                                height: 'auto',
                                                maxWidth: '100%',
                                                objectFit: 'contain',
                                              }}
                                              onLoad={() => markSettled(previewKey)}
                                              onError={() => markSettled(previewKey)}
                                            />
                                          ) : isPdf && url ? (
                                            <PDFPreview
                                              url={url}
                                              name={name}
                                              onSettled={() => markSettled(previewKey)}
                                            />
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
