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

const LicenseHistory = forwardRef(function LicenseHistory(
  props: { 
    formData: any; 
    onChange: (e: any) => void; 
    onPatch: (patch: Record<string, unknown>) => void;
    renewalId?: string;
    onError?: (msg: string) => void;
    onStatus?: (msg: string | null) => void;
    isReadOnly?: boolean;
    errors?: ErrorsMap 
  },
  ref: any
) {
  const { formData, onChange, onPatch, renewalId, onError, onStatus, isReadOnly = false, errors = {} } = props;

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
          disabled={isReadOnly}
        />
        <span className='text-sm font-medium'>Yes</span>
      </label>
      <label className='inline-flex items-center gap-2'>
        <input
          type='radio'
          name={name}
          checked={value === false}
          onChange={() => onChange({ target: { name, value: false } })}
          disabled={isReadOnly}
        />
        <span className='text-sm font-medium'>No</span>
      </label>
    </div>
  );

  const [uploadingRejectedDoc, setUploadingRejectedDoc] = useState(false);
  const [deletingRejectedDocId, setDeletingRejectedDocId] = useState<number | null>(null);

  const rejectedEvidenceFiles = Array.isArray(formData.rejectedApplicationEvidenceFiles)
    ? formData.rejectedApplicationEvidenceFiles
    : formData.rejectedApplicationEvidenceUploaded
      ? [formData.rejectedApplicationEvidenceUploaded]
      : [];

  const handleRejectedDocUpload = async (file: File) => {
    if (!renewalId) {
      onError?.('Save the renewal draft first so a renewal ID is available for uploads.');
      return;
    }

    setUploadingRejectedDoc(true);
    onStatus?.('Uploading document...');

    try {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png'
      ];
      const isUnsupported = !allowedTypes.includes(file.type);

      // Delete existing documents first
      if (rejectedEvidenceFiles && rejectedEvidenceFiles.length > 0) {
        for (const fileItem of rejectedEvidenceFiles) {
          const meta = getDocumentUploadMeta(fileItem);
          if (meta.id) {
            try {
              await deleteRenewalDocument(meta.id);
            } catch (err) {
              console.error('Failed to delete old document:', err);
            }
          }
        }
      }

      const meta = await uploadRenewalDocument(renewalId, 'rejectedApplicationEvidenceUploaded', file);
      
      if (isUnsupported) {
        meta.fileType = 'OTHER';
        import('react-toastify').then(({ toast }) => {
          toast.warning("Unsupported file type detected. File has been categorized as 'Other'.");
        });
      }

      const nextFiles = [meta];
      onPatch({
        rejectedApplicationEvidenceUploaded: meta,
        rejectedApplicationEvidenceFiles: nextFiles,
      });
      onStatus?.('Document uploaded successfully.');
    } catch (err: any) {
      onError?.(err?.message || 'Failed to upload document.');
    } finally {
      setUploadingRejectedDoc(false);
    }
  };

  const handleRejectedDocDelete = (fileId: number | undefined, index: number) => async () => {
    setDeletingRejectedDocId(fileId ?? -index);
    onStatus?.('Removing document...');

    try {
      if (fileId) {
        await deleteRenewalDocument(fileId);
      }
      onPatch({
        rejectedApplicationEvidenceUploaded: null,
        rejectedApplicationEvidenceFiles: [],
      });
      onStatus?.('Document removed.');
    } catch (err: any) {
      onError?.(err?.message || 'Failed to remove document.');
    } finally {
      setDeletingRejectedDocId(null);
    }
  };

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
              {formData.applicationResult === 'rejected' && (
                <div className='col-span-1 md:col-span-2'>
                  <FileUpload
                    className='mt-2'
                    label='Upload Rejection Document'
                    name='rejectedApplicationEvidenceUploaded'
                    required
                    error={errors['rejectedApplicationEvidenceUploaded']}
                    variant='browseCard'
                    hintText='PDF, DOC, DOCX, JPG, PNG up to 10 MB'
                    onFileSelect={handleRejectedDocUpload}
                    uploaded={rejectedEvidenceFiles.length > 0}
                    fileName={
                      rejectedEvidenceFiles.length === 1
                        ? getDocumentUploadMeta(rejectedEvidenceFiles[0]).fileName
                        : rejectedEvidenceFiles.length > 1
                          ? `${rejectedEvidenceFiles.length} files uploaded`
                          : undefined
                    }
                  />
                  {rejectedEvidenceFiles.map((file: any, index: number) => {
                    const meta = getDocumentUploadMeta(file);
                    const isDeleting = deletingRejectedDocId === (meta.id ?? -index);
                    const displayName = meta.fileName || `Document ${index + 1}`;

                    return (
                      <div key={`${displayName}-${meta.id ?? index}`} className='mt-1 space-y-1 text-xs'>
                        <div className='flex flex-wrap items-center gap-3'>
                          <span className='text-gray-600'>{displayName}</span>
                          {meta.fileType && <span className='text-gray-500'>({meta.fileType})</span>}
                        </div>
                        <div className='flex flex-wrap items-center gap-3'>
                          {meta.fileUrl && (
                            <button
                              type='button'
                              className='text-blue-600 underline hover:text-blue-800'
                              onClick={() => openDocumentFile(meta.fileUrl!, meta.fileName)}
                              disabled={isDeleting}
                            >
                              View
                            </button>
                          )}
                          {!isReadOnly && (
                            <button
                              type='button'
                              className='text-red-600 underline hover:text-red-800 disabled:opacity-50'
                              onClick={handleRejectedDocDelete(meta.id, index)}
                              disabled={uploadingRejectedDoc || isDeleting || !renewalId}
                            >
                              {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
