import React, { useEffect, useState } from 'react';
import { WeaponsService, Weapon } from '../../../../services/weapons';
import { getDocumentUploadMeta } from '../../../../utils/renewalFileUpload';
import { openDocumentFile } from '../../../../services/fileHandler';

const NOT_PROVIDED = 'Not Provided';

const yn = (v: any) => (v === true ? 'Yes' : v === false ? 'No' : NOT_PROVIDED);
const dash = (v: any) => (v === undefined || v === null || v === '' ? NOT_PROVIDED : String(v));

const fileMeta = (v: any) => getDocumentUploadMeta(v);
const fileLabel = (v: any) => {
  const meta = fileMeta(v);
  return meta?.fileName || (meta?.uploaded ? 'Uploaded' : NOT_PROVIDED);
};

const isImageFile = (fileName?: string, fileType?: string) => {
  if (fileType && fileType.startsWith('image/')) return true;
  if (!fileName) return false;
  const extension = fileName.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension || '');
};

const isPdfFile = (fileName?: string, fileType?: string) => {
  if (fileType === 'application/pdf') return true;
  if (!fileName) return false;
  const extension = fileName.split('.').pop()?.toLowerCase();
  return extension === 'pdf';
};

const GENDER_LABELS: Record<string, string> = { MALE: 'Male', FEMALE: 'Female', OTHER: 'Other' };
const WEAPON_REASON_LABELS: Record<string, string> = {
  self_defense: 'Self defense',
  crop_protection: 'Crop protection',
  sports: 'Sports / target shooting',
  business_security: 'Business security',
};
const APPLICATION_RESULT_LABELS: Record<string, string> = {
  approved: 'Approved',
  rejected: 'Rejected',
  pending: 'Pending',
};
const ARMS_OPTION_LABELS: Record<string, string> = {
  RESTRICTED: 'Restricted',
  PERMISSIBLE: 'Permissible',
};

const FALLBACK_WEAPONS: Weapon[] = [
  { id: 1, name: 'Revolver' } as Weapon,
  { id: 2, name: 'Pistol' } as Weapon,
  { id: 3, name: 'Rifle' } as Weapon,
  { id: 4, name: 'Shotgun' } as Weapon,
];

const EditIcon = () => (
  <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
    />
  </svg>
);

const Field: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => {
  const empty = value === NOT_PROVIDED;
  return (
    <div>
      <dt className='mb-1 text-xs font-semibold uppercase tracking-wide text-gray-600'>{label}</dt>
      <dd className={`text-sm leading-relaxed ${empty ? 'italic text-gray-400' : 'font-medium text-gray-800'}`}>
        {value}
      </dd>
    </div>
  );
};

const Section: React.FC<{ title: string; onEdit?: () => void; children: React.ReactNode }> = ({
  title,
  onEdit,
  children,
}) => (
  <div className='mb-6 rounded-lg border bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md'>
    <div className='mb-5 flex items-center justify-between'>
      <h3 className='flex items-center gap-2 text-xl font-semibold text-gray-800'>
        <span className='h-2 w-2 rounded-full bg-blue-500' />
        {title}
      </h3>
      {onEdit && (
        <button
          type='button'
          onClick={onEdit}
          className='flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-blue-600 transition-colors duration-200 hover:bg-blue-50 hover:text-blue-800'
          title={`Edit ${title}`}
        >
          <EditIcon />
          Edit
        </button>
      )}
    </div>
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>{children}</div>
  </div>
);

const SubGroup: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className='space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:col-span-2 lg:col-span-3'>
    <h4 className='mb-4 border-b pb-2 text-base font-medium text-gray-700'>{title}</h4>
    <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'>{children}</div>
  </div>
);

const FileThumbnail: React.FC<{ fileUrl: string; fileName?: string; fileType?: string }> = ({
  fileUrl,
  fileName,
  fileType,
}) => (
  <div className='mb-3 flex justify-center'>
    <div className='h-32 w-32 overflow-hidden rounded-lg border-2 border-gray-200 bg-white shadow-sm'>
      {isImageFile(fileName, fileType) ? (
        <img
          src={fileUrl}
          alt={fileName || 'preview'}
          className='h-full w-full cursor-pointer object-cover transition-opacity hover:opacity-80'
          onClick={() => openDocumentFile(fileUrl, fileName)}
          title='Click to view full size'
        />
      ) : isPdfFile(fileName, fileType) ? (
        <div
          className='flex h-full w-full cursor-pointer flex-col items-center justify-center bg-red-50 transition-colors hover:bg-red-100'
          onClick={() => openDocumentFile(fileUrl, fileName)}
          title='Click to open PDF'
        >
          <svg className='h-16 w-16 text-red-600' fill='currentColor' viewBox='0 0 24 24'>
            <path d='M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18.5,9H13V3.5L18.5,9M6,20V4H12V10H18V20H6Z' />
          </svg>
          <span className='mt-1 text-xs font-semibold text-red-700'>PDF</span>
        </div>
      ) : (
        <div
          className='flex h-full w-full cursor-pointer flex-col items-center justify-center bg-gray-100 transition-colors hover:bg-gray-200'
          onClick={() => openDocumentFile(fileUrl, fileName)}
          title='Click to open file'
        >
          <svg className='h-16 w-16 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
            />
          </svg>
          <span className='mt-1 text-xs font-semibold text-gray-500'>File</span>
        </div>
      )}
    </div>
  </div>
);

const DocumentCard: React.FC<{ label: string; value: any }> = ({ label, value }) => {
  const meta = fileMeta(value);
  const hasFile = !!meta?.fileUrl;
  return (
    <div className='flex flex-col items-center rounded-lg border border-gray-200 bg-gray-50 p-4'>
      <span className='mb-2 self-start text-sm font-semibold uppercase text-gray-900'>{label}</span>
      {hasFile ? (
        <>
          <FileThumbnail fileUrl={meta.fileUrl} fileName={meta.fileName} fileType={meta.fileType} />
          <button
            type='button'
            onClick={() => openDocumentFile(meta.fileUrl, meta.fileName)}
            className='cursor-pointer break-words border-none bg-none p-0 text-center text-sm text-blue-600 underline hover:text-blue-800'
            title='Click to view file'
          >
            {meta.fileName && meta.fileName.length > 30 ? `${meta.fileName.slice(0, 30)}...` : meta.fileName || 'View file'}
          </button>
        </>
      ) : (
        <span className='text-sm italic text-gray-400'>{NOT_PROVIDED}</span>
      )}
    </div>
  );
};

const PreviewSection: React.FC<{ formData: any; onEditStep?: (index: number) => void }> = ({
  formData,
  onEditStep,
}) => {
  const data = formData || {};
  const [weapons, setWeapons] = useState<Weapon[]>(FALLBACK_WEAPONS);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const list = await WeaponsService.getAll();
        if (active && list?.length) setWeapons(list);
      } catch {
        // keep fallback list
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const weaponName = (id: any) => weapons.find(w => String(w.id) === String(id))?.name || `#${id}`;
  const editStep = (index: number) => (onEditStep ? () => onEditStep(index) : undefined);

  const firRows: any[] =
    Array.isArray(data.firDetailsList) && data.firDetailsList.length > 0
      ? data.firDetailsList
      : data.firNumber ||
          data.underSection ||
          data.policeStationCriminal ||
          data.criminalUnit ||
          data.criminalDistrict ||
          data.criminalState ||
          data.offence ||
          data.sentence ||
          data.sentenceDate
        ? [
            {
              firNumber: data.firNumber,
              underSection: data.underSection,
              policeStation: data.policeStationCriminal,
              unit: data.criminalUnit,
              district: data.criminalDistrict,
              state: data.criminalState,
              offence: data.offence,
              sentence: data.sentence,
              sentenceDate: data.sentenceDate,
            },
          ]
        : [];

  const weaponEndorsedRows: any[] = Array.isArray(data.weaponEndorsedList) ? data.weaponEndorsedList : [];
  const requestedWeaponIds: any[] = Array.isArray(data.requestedWeaponIds) ? data.requestedWeaponIds : [];
  const specialEvidenceFiles: any[] = Array.isArray(data.specialEvidenceFiles) ? data.specialEvidenceFiles : [];

  const getStatusLabel = () => {
    if (data.workflowStatus?.name) return data.workflowStatus.name;
    if (data.workflowStatus?.code) return data.workflowStatus.code;
    if (data.isSubmit === true) return 'Submitted';
    return 'Draft';
  };

  return (
    <div>
      {/* Application Overview */}
      <div className='mb-6 rounded-lg border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 p-5 shadow-sm'>
        <h3 className='mb-4 flex items-center gap-2 text-xl font-semibold text-blue-800'>
          <span className='h-2 w-2 rounded-full bg-blue-600' />
          Application Overview
        </h3>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
          <div className='rounded-lg bg-white p-3 shadow-sm'>
            <span className='text-xs font-medium uppercase tracking-wide text-gray-500'>License ID</span>
            <div className='mt-1 text-lg font-semibold text-gray-800'>{dash(data.licenseId)}</div>
          </div>
          <div className='rounded-lg bg-white p-3 shadow-sm'>
            <span className='text-xs font-medium uppercase tracking-wide text-gray-500'>
              Acknowledgement No
            </span>
            <div className='mt-1 text-lg font-semibold text-gray-800'>{dash(data.acknowledgementNo)}</div>
          </div>
          <div className='rounded-lg bg-white p-3 shadow-sm'>
            <span className='text-xs font-medium uppercase tracking-wide text-gray-500'>Applicant</span>
            <div className='mt-1 text-lg font-semibold text-gray-800'>{dash(data.applicantName)}</div>
          </div>
          <div className='rounded-lg bg-white p-3 shadow-sm'>
            <span className='text-xs font-medium uppercase tracking-wide text-gray-500'>License No</span>
            <div className='mt-1 text-lg font-semibold text-gray-800'>{dash(data.licenseNumber)}</div>
          </div>
          <div className='rounded-lg bg-white p-3 shadow-sm'>
            <span className='text-xs font-medium uppercase tracking-wide text-gray-500'>Status</span>
            <div className='mt-1 text-lg font-semibold text-blue-600'>{getStatusLabel()}</div>
          </div>
        </div>
      </div>

      <Section title='Personal Information' onEdit={editStep(0)}>
        <Field label='Applicant First Name' value={dash(data.applicantName)} />
        <Field label='Applicant Middle Name' value={dash(data.applicantMiddleName)} />
        <Field label='Applicant Last Name' value={dash(data.applicantLastName)} />
        <Field label='Application filled by (ZS name)' value={dash(data.filledBy)} />
        <Field label='Parent / Spouse Name' value={dash(data.fatherName)} />
        <Field label='Sex' value={GENDER_LABELS[data.applicantGender] || dash(data.applicantGender)} />
        <Field label='Place of Birth' value={dash(data.placeOfBirth)} />
        <Field label='Date of Birth' value={dash(data.applicantDateOfBirth)} />
        <Field label='PAN' value={dash(data.panNumber)} />
        <Field label='Aadhar Number' value={dash(data.aadharNumber)} />
        <Field label='Date of Birth in Words' value={dash(data.dobInWords)} />
      </Section>

      <Section title='Address Details' onEdit={editStep(1)}>
        <Field label='Present Address' value={dash(data.presentAddress)} />
        <Field label='State' value={dash(data.presentStateName || data.presentState)} />
        <Field label='District' value={dash(data.presentDistrictName || data.presentDistrict)} />
        <Field label='Range Office' value={dash(data.presentRangeOfficeName || data.presentRangeOffice)} />
        <Field label='Zone' value={dash(data.presentZoneName || data.presentZone)} />
        <Field label='Division' value={dash(data.presentDivisionName || data.presentDivision)} />
        <Field
          label='Jurisdiction Police Station'
          value={dash(data.presentPoliceStationName || data.presentPoliceStation)}
        />
        <Field label='Residing Since' value={dash(data.residingSince)} />
        <Field label='Permanent address same as present' value={yn(data.sameAsPresent)} />
        {!data.sameAsPresent && (
          <SubGroup title='Permanent Address'>
            <Field label='Permanent Address' value={dash(data.permanentAddress)} />
            <Field label='State' value={dash(data.permanentStateName || data.permanentState)} />
            <Field label='District' value={dash(data.permanentDistrictName || data.permanentDistrict)} />
            <Field
              label='Range Office'
              value={dash(data.permanentRangeOfficeName || data.permanentRangeOffice)}
            />
            <Field label='Zone' value={dash(data.permanentZoneName || data.permanentZone)} />
            <Field label='Division' value={dash(data.permanentDivisionName || data.permanentDivision)} />
            <Field
              label='Jurisdiction Police Station'
              value={dash(data.permanentPoliceStationName || data.permanentPoliceStation)}
            />
          </SubGroup>
        )}
        <Field label='Office Phone' value={dash(data.officePhone)} />
        <Field label='Residence Phone' value={dash(data.residencePhone)} />
        <Field label='Office Mobile' value={dash(data.officeMobile)} />
        <Field label='Alternative Mobile' value={dash(data.alternativeMobile)} />
      </Section>

      <Section title='Occupation / Business' onEdit={editStep(2)}>
        <Field label='Occupation' value={dash(data.occupation)} />
        <Field label='Office/Business Address' value={dash(data.officeBusinessAddress)} />
        <Field label='State' value={dash(data.officeBusinessStateName || data.officeBusinessState)} />
        <Field label='District' value={dash(data.officeBusinessDistrictName || data.officeBusinessDistrict)} />
        <Field label='Location (crop protection, rule 35)' value={dash(data.cropProtectionLocation)} />
        <Field label='Area of land under cultivation' value={dash(data.cultivatedArea)} />
      </Section>

      <Section title='Criminal History' onEdit={editStep(3)}>
        <Field label='Convicted' value={yn(data.convictedStatus)} />
        <Field label='Bound to execute a bond' value={yn(data.bondStatus)} />
        {data.bondStatus && (
          <>
            <Field label='Date of Sentence (bond)' value={dash(data.bondSentenceDate)} />
            <Field label='Period of bond' value={dash(data.bondPeriod)} />
          </>
        )}
        <Field label='Prohibited under the Arms Act' value={yn(data.prohibitedStatus)} />
        {data.prohibitedStatus && (
          <>
            <Field label='Date of Sentence (prohibited)' value={dash(data.prohibitedSentenceDate)} />
            <Field label='Period of prohibition' value={dash(data.prohibitedPeriod)} />
          </>
        )}
        {data.convictedStatus && firRows.length > 0 && (
          <SubGroup title='FIR Details'>
            {firRows.map((row, i) => (
              <React.Fragment key={row.id || i}>
                <Field label='FIR Number' value={dash(row.firNumber)} />
                <Field label='Under Section' value={dash(row.underSection)} />
                <Field label='Police Station' value={dash(row.policeStation)} />
                <Field label='Unit' value={dash(row.unit)} />
                <Field label='District' value={dash(row.district)} />
                <Field label='State' value={dash(row.state)} />
                <Field label='Offence' value={dash(row.offence)} />
                <Field label='Sentence' value={dash(row.sentence)} />
                <Field label='Date of Sentence' value={dash(row.sentenceDate)} />
              </React.Fragment>
            ))}
          </SubGroup>
        )}
      </Section>

      <Section title='License Details' onEdit={editStep(4)}>
        <Field label='Need for license' value={WEAPON_REASON_LABELS[data.weaponReason] || dash(data.weaponReason)} />
        <Field
          label='Areas to carry arms'
          value={
            [
              data.carryAreaDistrict && 'District',
              data.carryAreaState && 'State',
              data.carryAreaIndia && 'Throughout India',
            ]
              .filter(Boolean)
              .join(', ') || NOT_PROVIDED
          }
        />
        <Field
          label='Restricted / Permissible'
          value={ARMS_OPTION_LABELS[data.armsOptionType] || dash(data.armsOptionType)}
        />
        <Field
          label='Weapon types requested'
          value={requestedWeaponIds.length ? requestedWeaponIds.map(weaponName).join(', ') : dash(data.weaponType)}
        />
        <Field label='Ammunition Description' value={dash(data.ammunitionDescription)} />
        <Field label='Claim for special consideration' value={dash(data.specialConsiderationClaim)} />
        <Field
          label='Documentary evidence'
          value={
            specialEvidenceFiles.length
              ? specialEvidenceFiles.map((f, i) => fileLabel(f)).join(', ')
              : fileLabel(data.specialEvidenceUploaded)
          }
        />
        <Field label='Place/area sought (Form IV)' value={dash(data.formIVPlaceArea)} />
        <Field label='Wild beasts specification (Form IV)' value={dash(data.formIVWildBeastsSpec)} />
      </Section>

      <Section title='License History' onEdit={editStep(5)}>
        <Field label='Applied for arms license before' value={yn(data.hasAppliedBefore)} />
        {data.hasAppliedBefore && (
          <>
            <Field label='Date of Application' value={dash(data.applicationDate)} />
            <Field label='Authority applied to' value={dash(data.authorityAppliedTo)} />
            <Field
              label='Result'
              value={APPLICATION_RESULT_LABELS[data.applicationResult] || dash(data.applicationResult)}
            />
            {String(data.applicationResult).toLowerCase() === 'rejected' && (
              <Field label='Rejection Document' value={fileLabel(data.rejectionDocUploaded)} />
            )}
          </>
        )}
        <Field label='License revoked or suspended' value={yn(data.licenseRevokedOrSuspended)} />
        {data.licenseRevokedOrSuspended && (
          <>
            <Field label='Revoked by authority' value={dash(data.revokedByAuthority)} />
            <Field label='Reason' value={dash(data.revokedReason)} />
          </>
        )}
        <Field label='Family member holds a license' value={yn(data.familyMemberHasLicense)} />
        {data.familyMemberHasLicense && (
          <>
            <Field label='Family member name' value={dash(data.familyMemberName)} />
            <Field label='Family license number' value={dash(data.familyLicenseNumber)} />
            <Field
              label='Weapons endorsed'
              value={weaponEndorsedRows.length ? weaponEndorsedRows.map(w => w.value).join(', ') : NOT_PROVIDED}
            />
          </>
        )}
        <Field label='Has safe place for custody' value={yn(data.hasSafeCustody)} />
        {data.hasSafeCustody && <Field label='Safe custody details' value={dash(data.safeCustodyDetails)} />}
        <Field label='Undergone training under rule 10' value={yn(data.hasTrainingUnderRule10)} />
        {data.hasTrainingUnderRule10 && <Field label='Training details' value={dash(data.trainingDetails)} />}
      </Section>

      <Section title='Biometric Information' onEdit={editStep(6)}>
        {(() => {
          const meta = fileMeta(data.photographUploaded);
          return (
            <div className='flex flex-col items-center'>
              <span className='mb-2 self-start text-xs font-semibold uppercase tracking-wide text-gray-600'>
                Photograph
              </span>
              {meta?.fileUrl ? (
                <>
                  <FileThumbnail fileUrl={meta.fileUrl} fileName={meta.fileName} fileType={meta.fileType} />
                  <button
                    type='button'
                    onClick={() => openDocumentFile(meta.fileUrl, meta.fileName)}
                    className='cursor-pointer break-words border-none bg-none p-0 text-center text-sm text-blue-600 underline hover:text-blue-800'
                    title='Click to view file'
                  >
                    {meta.fileName || 'View file'}
                  </button>
                </>
              ) : (
                <span className='text-sm italic text-gray-400'>{NOT_PROVIDED}</span>
              )}
            </div>
          );
        })()}
      </Section>

      <div className='mb-6 rounded-lg border bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md'>
        <div className='mb-5 flex items-center justify-between'>
          <h3 className='flex items-center gap-2 text-xl font-semibold text-gray-800'>
            <span className='h-2 w-2 rounded-full bg-blue-500' />
            Uploaded Documents
          </h3>
          {onEditStep && (
            <button
              type='button'
              onClick={editStep(7)}
              className='flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-blue-600 transition-colors duration-200 hover:bg-blue-50 hover:text-blue-800'
              title='Edit Uploaded Documents'
            >
              <EditIcon />
              Edit
            </button>
          )}
        </div>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          <DocumentCard label='Aadhar Card' value={data.idProofUploaded} />
          <DocumentCard label='PAN Card' value={data.panCardUploaded} />
          <DocumentCard label='Training Certificate' value={data.trainingCertificateUploaded} />
          <DocumentCard label='Medical Certificate' value={data.medicalCertificateUploaded} />
          <DocumentCard label='Other State Arms License' value={data.otherStateLicenseUploaded} />
          <DocumentCard label='Existing Arms License' value={data.existingArmsLicenseUploaded} />
          <DocumentCard label='Safe Custody' value={data.safeCustodyUploaded} />
        </div>
      </div>
    </div>
  );
};

export default PreviewSection;
