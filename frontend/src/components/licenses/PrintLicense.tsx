'use client';

import React from 'react';
import { formatDisplayDate, formatGender, humanize } from '@/utils/formatters';
import { areaOfValidityLabel } from '@/utils/areaOfValidity';

const maskAadhaar = (value?: string | null) => {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits.length >= 4 ? `XXXX XXXX ${digits.slice(-4)}` : '';
};

const resolvePhotoUrl = (license: any): string | null => {
  if (typeof license?.photoUrl === 'string' && license.photoUrl.trim()) return license.photoUrl.trim();
  const files = [license?.documents, license?.fileUploads].find(Array.isArray) || [];
  const photo = files.find(
    (f: any) => String(f?.fileType || f?.type || '').toUpperCase() === 'PHOTOGRAPH' && (f?.fileUrl || f?.url)
  );
  return photo ? photo.fileUrl || photo.url : null;
};

const joinAddress = (...parts: Array<string | null | undefined>) =>
  parts.map(p => (p ?? '').trim()).filter(Boolean).join(', ');

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <tr>
      <td className='lic-label'>{label}</td>
      <td className='lic-value'>{value || '—'}</td>
    </tr>
  );
}

/**
 * Print-only copy of a license record (rendered inside a `hidden print:block`
 * container). Hides the app shell while printing.
 */
export default function PrintLicense({ license }: { license: any }) {
  const photoUrl = resolvePhotoUrl(license);
  const holderName = [license?.firstName, license?.middleName, license?.lastName].filter(Boolean).join(' ');
  const weapons = Array.isArray(license?.endorsedWeapons)
    ? license.endorsedWeapons.map((w: any) => w?.name).filter(Boolean).join(', ')
    : '';

  return (
    <div className='lic-print'>
      <style jsx global>{`
        @media print {
          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            color: #000 !important;
            height: auto !important;
            overflow: visible !important;
          }
          /* Hide the app shell; only the license copy prints (Tailwind's
             print:block shows the copy's own container). */
          .flex.h-screen,
          header,
          aside,
          nav,
          footer {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
          }
        }
        .lic-print {
          font-family: 'Times New Roman', serif;
          font-size: 12px;
          color: #000;
        }
        .lic-print table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 10px;
          page-break-inside: avoid;
        }
        .lic-print th.lic-section {
          text-align: left;
          background: #f1f1f1 !important;
          border: 1px solid #000;
          padding: 4px 8px;
          font-size: 12px;
          text-transform: uppercase;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .lic-print td {
          border: 1px solid #000;
          padding: 4px 8px;
          vertical-align: top;
        }
        .lic-print td.lic-label {
          width: 32%;
          font-weight: bold;
        }
      `}</style>

      <div style={{ textAlign: 'center', border: '2px solid #000', padding: '8px', marginBottom: '12px' }}>
        <div style={{ fontSize: '18px', fontWeight: 'bold', letterSpacing: '2px' }}>ARMS LICENCE</div>
        <div style={{ fontSize: '13px', marginTop: '2px' }}>
          Licence No. <strong>{license?.licenseNumber || '—'}</strong>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th className='lic-section' colSpan={3}>
              1. Licence Holder
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className='lic-label'>Name</td>
            <td className='lic-value'>{holderName || '—'}</td>
            <td rowSpan={6} style={{ width: '110px', textAlign: 'center', verticalAlign: 'middle' }}>
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt='Licence holder'
                  style={{ width: '90px', height: '110px', objectFit: 'cover', border: '1px solid #000' }}
                />
              ) : (
                <div
                  style={{
                    width: '90px',
                    height: '110px',
                    border: '1px dashed #000',
                    margin: '0 auto',
                    fontSize: '9px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  Photograph
                </div>
              )}
            </td>
          </tr>
          <tr>
            <td className='lic-label'>Father / Mother / Spouse</td>
            <td className='lic-value'>{license?.parentOrSpouseName || '—'}</td>
          </tr>
          <tr>
            <td className='lic-label'>Gender</td>
            <td className='lic-value'>{license?.sex ? formatGender(license.sex) : '—'}</td>
          </tr>
          <tr>
            <td className='lic-label'>Date of Birth</td>
            <td className='lic-value'>{formatDisplayDate(license?.dateOfBirth) || '—'}</td>
          </tr>
          <tr>
            <td className='lic-label'>Place of Birth</td>
            <td className='lic-value'>{license?.placeOfBirth || '—'}</td>
          </tr>
          <tr>
            <td className='lic-label'>Aadhaar / PAN</td>
            <td className='lic-value'>
              {[maskAadhaar(license?.aadharNumber), license?.panNumber].filter(Boolean).join(' / ') || '—'}
            </td>
          </tr>
        </tbody>
      </table>

      <table>
        <thead>
          <tr>
            <th className='lic-section' colSpan={2}>
              2. Address
            </th>
          </tr>
        </thead>
        <tbody>
          <Row
            label='Present Address'
            value={joinAddress(
              license?.presentAddressLine,
              license?.presentPoliceStationName && `PS ${license.presentPoliceStationName}`,
              license?.presentDistrictName,
              license?.presentStateName
            )}
          />
          <Row
            label='Permanent Address'
            value={joinAddress(
              license?.permanentAddressLine,
              license?.permanentPoliceStationName && `PS ${license.permanentPoliceStationName}`,
              license?.permanentDistrictName,
              license?.permanentStateName
            )}
          />
        </tbody>
      </table>

      <table>
        <thead>
          <tr>
            <th className='lic-section' colSpan={2}>
              3. Licence Particulars
            </th>
          </tr>
        </thead>
        <tbody>
          <Row label='Category of Arms' value={license?.armsCategory ? humanize(license.armsCategory) : ''} />
          <Row label='Arms Endorsed' value={weapons} />
          <Row label='Ammunition' value={license?.ammunitionDescription} />
          <Row label='Purpose' value={license?.needForLicense ? humanize(license.needForLicense) : ''} />
          <Row label='Area of Validity' value={areaOfValidityLabel(license?.areaOfValidity) || license?.areaOfValidity} />
          <Row label='Place / Area' value={license?.licencePlaceArea} />
          <Row label='Date of Issue' value={formatDisplayDate(license?.issueDate || license?.validFrom)} />
          <Row
            label='Valid From – Valid Till'
            value={[formatDisplayDate(license?.validFrom), formatDisplayDate(license?.validTill)]
              .map(d => d || '—')
              .join('  –  ')}
          />
          <Row
            label='Last Renewed'
            value={
              license?.lastRenewedDate
                ? `${formatDisplayDate(license.lastRenewedDate)}${
                    license?.renewalCount ? ` (renewed ${license.renewalCount} time${license.renewalCount === 1 ? '' : 's'})` : ''
                  }`
                : ''
            }
          />
          <Row label='Status' value={license?.status ? humanize(license.status) : ''} />
        </tbody>
      </table>

      <table style={{ marginTop: '28px' }}>
        <tbody>
          <tr>
            <td style={{ border: 'none', width: '50%', verticalAlign: 'bottom' }}>
              <div style={{ width: '110px', height: '70px', border: '1px dashed #000', fontSize: '9px', textAlign: 'center', paddingTop: '28px' }}>
                Seal
              </div>
            </td>
            <td style={{ border: 'none', textAlign: 'right', verticalAlign: 'bottom' }}>
              <div style={{ borderTop: '1px solid #000', display: 'inline-block', paddingTop: '4px', minWidth: '220px', textAlign: 'center' }}>
                Signature of Licensing Authority
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <p style={{ fontSize: '10px', marginTop: '16px', borderTop: '1px solid #999', paddingTop: '4px' }}>
        Computer-generated copy of the licence record · Printed on {formatDisplayDate(new Date())}
      </p>
    </div>
  );
}
