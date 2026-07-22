import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { Input, TextArea } from '../../elements/Input';
import { Select } from '../../elements/Select';
import { Button } from '../../elements/Button';
import { FileUpload } from '../../elements/FileUpload';
import { openDocumentFile } from '../../../../services/fileHandler';
import {
  deleteRenewalDocument,
  getDocumentUploadMeta,
  uploadRenewalDocument,
} from '../../../../utils/renewalFileUpload';

type ErrorsMap = Record<string, string | undefined>;

type WeaponItem = {
  id: string;
  value: string;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const LicenseHistory = forwardRef(function LicenseHistory(
  props: {
    formData: any;
    onChange: (e: any) => void;
    errors?: ErrorsMap;
    renewalId?: string;
    onPatch?: (patch: Record<string, unknown>) => void;
    onError?: (message: string) => void;
    onStatus?: (message: string | null) => void;
    isReadOnly?: boolean;
  },
  ref: any
) {
  const { formData, onChange, errors = {}, renewalId, onPatch, onError, onStatus, isReadOnly = false } = props;
  const [uploadingRejectionDoc, setUploadingRejectionDoc] = useState(false);
  const [deletingRejectionDocId, setDeletingRejectionDocId] = useState<number | null>(null);

  useImperativeHandle(ref, () => ({
    focusFirstInvalid: () => {
      const firstKey = Object.keys(errors).find(key => !!errors[key]);
      if (firstKey) {
        const el = document.getElementById(firstKey);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          try {
            (el as HTMLElement).focus();
          } catch {
            /* ignore */
          }
        }
      }
    },
  }));

  const yn = (name: string, value: boolean) => (
    <div className='flex items-center gap-6'>
      <label className='inline-flex items-center gap-2'>
        <input
          type='radio'
          name={name}
          checked={value === true}
          onChange={() => onChange({ target: { name, value: true } })}
        />
        <span className='text-sm font-medium'>Yes</span>
      </label>
      <label className='inline-flex items-center gap-2'>
        <input
          type='radio'
          name={name}
          checked={value === false}
          onChange={() => onChange({ target: { name, value: false } })}
        />
        <span className='text-sm font-medium'>No</span>
      </label>
    </div>
  );

  const weaponsRaw: any[] = Array.isArray(formData.weaponEndorsedList)
    ? formData.weaponEndorsedList
    : [];

  const weapons: WeaponItem[] = weaponsRaw.length
    ? weaponsRaw.map((w: any, index: number) =>
        typeof w === 'string'
          ? { id: `legacy-${index}-${w}`, value: w }
          : { id: w.id || `weapon-${index}`, value: w.value || '' }
      )
    : [{ id: `weapon-${Date.now()}`, value: '' }];

  const updateWeapon = (id: string, value: string) => {
    const next = weapons.map(w => (w.id === id ? { ...w, value } : w));
    onChange({ target: { name: 'weaponEndorsedList', value: next } });
  };

  const addWeapon = () => {
    onChange({
      target: {
        name: 'weaponEndorsedList',
        value: [...weapons, { id: `weapon-${Date.now()}`, value: '' }],
      },
    });
  };

  const removeWeapon = (id: string) => {
    const next = weapons.filter(w => w.id !== id);
    onChange({ target: { name: 'weaponEndorsedList', value: next } });
  };

  // --- Rejection Document Upload Handlers ---
  const rejectionDocMeta = getDocumentUploadMeta(formData?.rejectionDocUploaded);
  const isRejectionUploading = uploadingRejectionDoc;
  const isRejectionDeleting = Boolean(rejectionDocMeta.id && deletingRejectionDocId === rejectionDocMeta.id);
  const showRejectionDoc = Boolean((rejectionDocMeta.uploaded || rejectionDocMeta.id) && rejectionDocMeta.fileName);

  const handleRejectionDocUpload = async (file: File) => {
    if (isReadOnly) return;
    if (!renewalId) {
      onError?.('Save the renewal draft first so a renewal ID is available for uploads.');
      return;
    }

    // File size validation
    if (file.size > MAX_FILE_SIZE) {
      onError?.(`File size (${formatFileSize(file.size)}) exceeds the maximum allowed size of 10 MB.`);
      return;
    }

    setUploadingRejectionDoc(true);
    onStatus?.('Uploading rejection document...');

    try {
      // Delete existing document first if present
      if (rejectionDocMeta.id) {
        try {
          await deleteRenewalDocument(rejectionDocMeta.id);
        } catch (err) {
          console.error('Failed to delete existing rejection document:', err);
        }
      }

      const meta = await uploadRenewalDocument(renewalId, 'rejectionDocUploaded', file);
      onPatch?.({ rejectionDocUploaded: meta });
      onStatus?.('Rejection document uploaded successfully.');
    } catch (err: any) {
      onError?.(err?.message || 'Failed to upload rejection document.');
    } finally {
      setUploadingRejectionDoc(false);
    }
  };

  const handleRejectionDocDelete = async () => {
    if (!rejectionDocMeta.id) {
      onPatch?.({ rejectionDocUploaded: null });
      return;
    }

    const confirmed = window.confirm('Are you sure you want to delete this document? This action cannot be undone.');
    if (!confirmed) return;

    setDeletingRejectionDocId(rejectionDocMeta.id);
    onStatus?.('Removing rejection document...');

    try {
      await deleteRenewalDocument(rejectionDocMeta.id);
      onPatch?.({ rejectionDocUploaded: null });
      onStatus?.('Rejection document removed.');
    } catch (err: any) {
      onError?.(err?.message || 'Failed to delete rejection document.');
    } finally {
      setDeletingRejectionDocId(null);
    }
  };

  return (
    <div className='space-y-4'>
      <div className='space-y-5'>
        <div>
          <p className='text-sm font-medium'>Whether the applicant has applied for -</p>
          <p className='text-sm mt-2'>(a) Arms License before?</p>
          {yn('hasAppliedBefore', Boolean(formData.hasAppliedBefore))}
          {formData.hasAppliedBefore && (
            <div className='mt-3 grid grid-cols-1 md:grid-cols-2 gap-4'>
              <Input
                label='Date of Application'
                type='date'
                name='applicationDate'
                value={formData.applicationDate || ''}
                onChange={onChange}
                required
                error={errors['applicationDate']}
              />
              <Input
                label='To which authority'
                name='authorityAppliedTo'
                value={formData.authorityAppliedTo || ''}
                onChange={onChange}
                placeholder='Enter authority'
                required
                error={errors['authorityAppliedTo']}
              />
              <Select
                label='Result'
                name='applicationResult'
                value={formData.applicationResult || ''}
                onChange={onChange}
                placeholder='Select Result'
                options={[
                  { value: 'approved', label: 'Approved' },
                  { value: 'rejected', label: 'Rejected' },
                  { value: 'pending', label: 'Pending' },
                ]}
                required
                error={errors['applicationResult']}
              />
            </div>
          )}

          {/* Rejection Document Upload — shown only when Result = Rejected */}
          {formData.hasAppliedBefore && String(formData.applicationResult || '').toLowerCase() === 'rejected' && (
            <div className='mt-4'>
              {isRejectionUploading && (
                <div className='mb-2 flex items-center gap-2 text-xs text-blue-600'>
                  <svg
                    className='animate-spin h-4 w-4'
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                  >
                    <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                    <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
                  </svg>
                  <span>Uploading rejection document...</span>
                </div>
              )}
              <FileUpload
                label='Rejection Document (Upload proof of rejection)'
                name='rejectionDocUploaded'
                required
                variant='browseCard'
                hintText='PDF, DOC, DOCX, JPG, PNG up to 10 MB each'
                onFileSelect={isReadOnly ? () => {} : handleRejectionDocUpload}
                uploaded={showRejectionDoc}
                fileName={
                  isRejectionUploading
                    ? 'Uploading...'
                    : showRejectionDoc
                    ? rejectionDocMeta.fileName
                    : undefined
                }
                disabled={!renewalId || isReadOnly || isRejectionUploading}
              />
              {errors['rejectionDocUploaded'] && (
                <p className='text-red-500 text-xs mt-1'>{errors['rejectionDocUploaded']}</p>
              )}
              {showRejectionDoc && (
                <div className='mt-2 space-y-2 text-xs'>
                  {rejectionDocMeta.fileName && <p className='text-gray-600'>File name: {rejectionDocMeta.fileName}</p>}
                  {rejectionDocMeta.fileType && <p className='text-gray-600'>File type: {rejectionDocMeta.fileType}</p>}
                  {rejectionDocMeta.fileUrl && (
                    <div className='flex flex-wrap items-center gap-3'>
                      <button
                        type='button'
                        className='text-blue-600 underline hover:text-blue-800 inline-flex items-center gap-1'
                        onClick={() => openDocumentFile(rejectionDocMeta.fileUrl!, rejectionDocMeta.fileName)}
                        disabled={isRejectionUploading || isRejectionDeleting}
                      >
                        <svg xmlns='http://www.w3.org/2000/svg' className='h-3.5 w-3.5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
                        </svg>
                        View
                      </button>
                      {!isReadOnly && (
                        <button
                          type='button'
                          className='text-red-600 underline hover:text-red-800 disabled:opacity-50 inline-flex items-center gap-1'
                          onClick={handleRejectionDocDelete}
                          disabled={isRejectionUploading || isRejectionDeleting || !renewalId}
                        >
                          <svg xmlns='http://www.w3.org/2000/svg' className='h-3.5 w-3.5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                          </svg>
                          {isRejectionDeleting ? 'Deleting...' : 'Delete'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <p className='text-sm'>(b) License been revoked or suspended</p>
          {yn('licenseRevokedOrSuspended', Boolean(formData.licenseRevokedOrSuspended))}
          {formData.licenseRevokedOrSuspended && (
            <div className='mt-3 grid grid-cols-1 md:grid-cols-2 gap-4'>
              <Input
                label='By which authority'
                name='revokedByAuthority'
                value={formData.revokedByAuthority || ''}
                onChange={onChange}
                placeholder='Enter authority'
                required
                error={errors['revokedByAuthority']}
              />
              <Input
                label='Reason'
                name='revokedReason'
                value={formData.revokedReason || ''}
                onChange={onChange}
                placeholder='Enter reason'
                required
                error={errors['revokedReason']}
              />
            </div>
          )}
        </div>

        <div>
          <p className='text-sm'>(c) Any member of the family holds a license</p>
          {yn('familyMemberHasLicense', Boolean(formData.familyMemberHasLicense))}
          {formData.familyMemberHasLicense && (
            <div className='mt-3 grid grid-cols-1 md:grid-cols-2 gap-4'>
              <Input
                label='Name'
                name='familyMemberName'
                value={formData.familyMemberName || ''}
                onChange={onChange}
                placeholder='Enter name'
                required
                error={errors['familyMemberName']}
              />
              <Input
                label='License Number'
                name='familyLicenseNumber'
                value={formData.familyLicenseNumber || ''}
                onChange={onChange}
                placeholder='Enter license number'
                required
                error={errors['familyLicenseNumber']}
              />
            </div>
          )}
          {formData.familyMemberHasLicense && (
            <div className='mt-3 space-y-3'>
              <p className='text-sm font-medium mb-2'>Weapons Endorsed</p>
              {weapons.map((weapon, index) => (
                <div key={weapon.id} className='flex flex-col gap-2 md:flex-row md:items-end'>
                  <div className='flex-1'>
                    <Input
                      label={`Weapon ${index + 1}`}
                      name={`weaponEndorsed-${weapon.id}`}
                      value={weapon.value}
                      onChange={e => updateWeapon(weapon.id, e.target.value)}
                      placeholder='Enter weapon'
                      required
                      error={index === 0 ? errors['weaponEndorsedList'] : undefined}
                    />
                  </div>
                  <div className='flex gap-2'>
                    {weapons.length > 1 && (
                      <Button
                        type='button'
                        size='sm'
                        className='h-[38px] px-3'
                        onClick={() => removeWeapon(weapon.id)}
                      >
                        Remove
                      </Button>
                    )}
                    {index === weapons.length - 1 && (
                      <Button type='button' size='sm' className='h-[38px] px-3' onClick={addWeapon}>
                        +
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className='text-sm'>
            (d) The applicant has a safe place to keep the arms and ammunition
          </p>
          {yn('hasSafeCustody', Boolean(formData.hasSafeCustody))}
          {formData.hasSafeCustody && (
            <TextArea
              label='If Yes details thereof'
              name='safeCustodyDetails'
              value={formData.safeCustodyDetails || ''}
              onChange={onChange}
              rows={3}
              placeholder='Enter details'
              required
              error={errors['safeCustodyDetails']}
            />
          )}
        </div>

        <div>
          <p className='text-sm'>
            (e) The applicant has undergone training as specified under rule 10
          </p>
          {yn('hasTrainingUnderRule10', Boolean(formData.hasTrainingUnderRule10))}
          {formData.hasTrainingUnderRule10 && (
            <TextArea
              label='If Yes details thereof'
              name='trainingDetails'
              value={formData.trainingDetails || ''}
              onChange={onChange}
              rows={3}
              placeholder='Enter details'
              required
              error={errors['trainingDetails']}
            />
          )}
        </div>
      </div>
    </div>
  );
});

export default LicenseHistory;
