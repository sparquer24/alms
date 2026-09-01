import React, { forwardRef, useImperativeHandle, useEffect, useState } from 'react';
import { Input, TextArea } from '../../elements/Input';
import { Select } from '../../elements/Select';
import { Checkbox } from '../../elements/Checkbox';
import { FileUpload } from '../../elements/FileUpload';
import { WeaponsService, Weapon } from '../../../../services/weapons';
import { openDocumentFile } from '../../../../services/fileHandler';
import {
  deleteRenewalDocument,
  getDocumentUploadMeta,
  uploadRenewalDocument,
} from '../../../../utils/renewalFileUpload';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

type ErrorsMap = Record<string, string | undefined>;

const weaponNameToSelectValue = (name?: string) => {
  const lower = String(name || '').toLowerCase();
  if (lower.includes('revolver')) return 'revolver';
  if (lower.includes('pistol')) return 'pistol';
  if (lower.includes('rifle')) return 'rifle';
  if (lower.includes('shotgun')) return 'shotgun';
  return lower;
};

const LicenseDetailsSection = forwardRef(function LicenseDetailsSection(
  props: {
    formData: any;
    renewalId: string;
    isSyncingPrefilled?: boolean;
    onChange: (e: any) => void;
    onPatch: (patch: Record<string, unknown>) => void;
    onError?: (message: string) => void;
    onStatus?: (message: string | null) => void;
    errors?: ErrorsMap;
    isReadOnly?: boolean;
  },
  ref: any
) {
  const {
    formData,
    renewalId,
    isSyncingPrefilled = false,
    onChange,
    onPatch,
    onError,
    onStatus,
    errors = {},
    isReadOnly = false,
  } = props;
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [loadingWeapons, setLoadingWeapons] = useState(false);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [deletingFileId, setDeletingFileId] = useState<number | null>(null);

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

  const loadWeapons = async () => {
    if (weapons.length > 0 || loadingWeapons) return;
    try {
      setLoadingWeapons(true);
      const list = await WeaponsService.getAll();
      setWeapons(list.length ? list : []);
    } catch {
      setWeapons([
        { id: 1, name: 'Revolver' },
        { id: 2, name: 'Pistol' },
        { id: 3, name: 'Rifle' },
        { id: 4, name: 'Shotgun' },
      ]);
    } finally {
      setLoadingWeapons(false);
    }
  };

  const selectedWeaponIds: number[] = Array.isArray(formData.requestedWeaponIds)
    ? formData.requestedWeaponIds
    : formData.weaponId
      ? [Number(formData.weaponId)].filter(id => !Number.isNaN(id))
      : [];
  useEffect(() => {
    if (selectedWeaponIds.length > 0 && weapons.length === 0) {
      loadWeapons();
    }
  }, [selectedWeaponIds, weapons.length, loadWeapons]);
  const specialEvidenceFiles: any[] = Array.isArray(formData.specialEvidenceFiles)
    ? formData.specialEvidenceFiles
    : formData.specialEvidenceUploaded
      ? [formData.specialEvidenceUploaded]
      : [];

  const handleWeaponAdd = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const weaponId = Number(e.target.value);
    if (!weaponId) return;

    const nextIds = selectedWeaponIds.includes(weaponId)
      ? selectedWeaponIds.filter(id => id !== weaponId)
      : [...selectedWeaponIds, weaponId];

    const firstWeapon = weapons.find(w => w.id === nextIds[0]);

    onChange({ target: { name: 'requestedWeaponIds', value: nextIds } });
    onChange({ target: { name: 'weaponId', value: nextIds[0] ? String(nextIds[0]) : '' } });
    onChange({
      target: {
        name: 'weaponType',
        value: firstWeapon ? weaponNameToSelectValue(firstWeapon.name) : '',
      },
    });

    e.target.value = '';
  };

  const removeWeapon = (weaponId: number) => {
    const nextIds = selectedWeaponIds.filter(id => id !== weaponId);
    const firstWeapon = weapons.find(w => w.id === nextIds[0]);

    onChange({ target: { name: 'requestedWeaponIds', value: nextIds } });
    onChange({ target: { name: 'weaponId', value: nextIds[0] ? String(nextIds[0]) : '' } });
    onChange({
      target: {
        name: 'weaponType',
        value: firstWeapon ? weaponNameToSelectValue(firstWeapon.name) : '',
      },
    });
  };

  const handleEvidenceUpload = async (file: File) => {
    if (isReadOnly) return;
    if (!renewalId) {
      onError?.('Save the renewal draft first so a renewal ID is available for uploads.');
      return;
    }

    // --- File size validation ---
    if (file.size > MAX_FILE_SIZE) {
      onError?.(`File size (${formatFileSize(file.size)}) exceeds the maximum allowed size of 10 MB.`);
      return;
    }

    setUploadingEvidence(true);
    onStatus?.('Uploading documentary evidence...');

    try {
      // Delete existing documents first
      if (specialEvidenceFiles && specialEvidenceFiles.length > 0) {
        for (const fileItem of specialEvidenceFiles) {
          const meta = getDocumentUploadMeta(fileItem);
          if (meta.id) {
            try {
              await deleteRenewalDocument(meta.id);
            } catch (err) {
              console.error('Failed to delete old special evidence document:', err);
            }
          }
        }
      }

      const meta = await uploadRenewalDocument(renewalId, 'specialEvidenceUploaded', file);
      const nextFiles = [meta];
      onPatch({
        specialEvidenceUploaded: meta,
        specialEvidenceFiles: nextFiles,
      });
      onStatus?.('Document uploaded successfully.');
    } catch (err: any) {
      onError?.(err?.message || 'Failed to upload documentary evidence.');
    } finally {
      setUploadingEvidence(false);
    }
  };

  const handleEvidenceDelete = (fileId: number | undefined, index: number) => async () => {
    setDeletingFileId(fileId ?? -index);
    onStatus?.('Removing document...');

    try {
      if (fileId) {
        await deleteRenewalDocument(fileId);
      }
      const nextFiles = specialEvidenceFiles.filter((_, i) => i !== index);
      onPatch({
        specialEvidenceFiles: nextFiles,
        specialEvidenceUploaded: nextFiles.length ? nextFiles[nextFiles.length - 1] : null,
      });
      onStatus?.('Document removed.');
    } catch (err: any) {
      onError?.(err?.message || 'Failed to delete document.');
    } finally {
      setDeletingFileId(null);
    }
  };

  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <Select
          label='Need for license (see note 1 below)'
          name='weaponReason'
          value={formData.weaponReason || ''}
          onChange={onChange}
          placeholder='Select reason'
          required
          error={errors['weaponReason']}
          options={[
            { value: 'self_defense', label: 'Self defense' },
            { value: 'crop_protection', label: 'Crop protection' },
            { value: 'sports', label: 'Sports / target shooting' },
            { value: 'business_security', label: 'Business security' },
          ]}
        />

        <div>
          <p className='block text-sm font-medium text-gray-700 mb-1'>
            Areas within which applicant wishes to carry arms{' '}
            <span className='text-red-500 ml-1'>*</span>
          </p>
          <p className='text-xs text-gray-500 mb-2'>Tick any of the options</p>
          {errors['carryAreaDistrict'] &&
            !formData.carryAreaDistrict &&
            !formData.carryAreaState &&
            !formData.carryAreaIndia && (
              <p className='text-red-500 text-xs mb-2'>{errors['carryAreaDistrict']}</p>
            )}
          <div className='flex flex-wrap items-center gap-4'>
            <Checkbox
              label='District'
              name='carryAreaDistrict'
              checked={Boolean(formData.carryAreaDistrict)}
              onChange={v => onChange({ target: { name: 'carryAreaDistrict', value: v } })}
            />
            <Checkbox
              label='State'
              name='carryAreaState'
              checked={Boolean(formData.carryAreaState)}
              onChange={v => onChange({ target: { name: 'carryAreaState', value: v } })}
            />
            <Checkbox
              label='Throughout India'
              name='carryAreaIndia'
              checked={Boolean(formData.carryAreaIndia)}
              onChange={v => onChange({ target: { name: 'carryAreaIndia', value: v } })}
            />
          </div>
        </div>

        <div>
          <p className='block text-sm font-medium text-gray-700 mb-1'>
            Description of arms for which license is being sought{' '}
            <span className='text-red-500 ml-1'>*</span>
          </p>
          <p className='text-sm mb-1'>
            (a) Select any of the options <span className='text-red-500 ml-1'>*</span>
          </p>
          <div>
            <div className='flex items-center gap-4 mb-2'>
              <label className='inline-flex items-center gap-2'>
                <input
                  type='radio'
                  name='armsOptionType'
                  value='RESTRICTED'
                  checked={String(formData.armsOptionType || '').toUpperCase() === 'RESTRICTED'}
                  onChange={onChange}
                />
                <span className='text-sm'>Restricted</span>
              </label>
              <label className='inline-flex items-center gap-2'>
                <input
                  type='radio'
                  name='armsOptionType'
                  value='PERMISSIBLE'
                  checked={String(formData.armsOptionType || '').toUpperCase() === 'PERMISSIBLE'}
                  onChange={onChange}
                />
                <span className='text-sm'>Permissible</span>
              </label>
            </div>
            {errors['armsOptionType'] && (
              <p id='armsOptionType' className='text-red-500 text-xs'>
                {errors['armsOptionType']}
              </p>
            )}
          </div>
          <Select
            label='(b) Select weapon types (multiple allowed)'
            name='weaponType'
            value=''
            onChange={handleWeaponAdd}
            onFocus={loadWeapons}
            required
            error={errors['weaponType']}
            placeholder={loadingWeapons ? 'Loading weapons...' : 'Select weapon type to add'}
            options={weapons.map(weapon => ({
              value: String(weapon.id),
              label: weapon.name,
            }))}
          />
          {selectedWeaponIds.length > 0 && (
            <div className='mt-2'>
              <p className='text-sm font-medium text-gray-700 mb-1'>Selected weapons</p>
              <div className='flex flex-wrap gap-2'>
                {selectedWeaponIds.map(weaponId => {
                  const weapon = weapons.find(w => w.id === weaponId);
                  return (
                    <span
                      key={weaponId}
                      className='inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800'
                    >
                      {weapon?.name || `Weapon #${weaponId}`}
                      <button
                        type='button'
                        className='text-blue-700 hover:text-blue-900'
                        onClick={() => removeWeapon(weaponId)}
                        aria-label={`Remove ${weapon?.name || 'weapon'}`}
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
          {errors['requestedWeaponIds'] && selectedWeaponIds.length === 0 && (
            <p id='requestedWeaponIds' className='text-red-500 text-xs mt-1'>
              {errors['requestedWeaponIds']}
            </p>
          )}
        </div>

        <Input
          label='Ammunition Description'
          name='ammunitionDescription'
          value={formData.ammunitionDescription || ''}
          onChange={onChange}
          required
          error={errors['ammunitionDescription']}
          placeholder='e.g., 50 rounds of .32 ammunition'
        />

        <div>
          <TextArea
            label='Claims for special consideration for obtaining the licence, if any'
            name='specialConsiderationClaim'
            value={formData.specialConsiderationClaim || ''}
            onChange={onChange}
            rows={2}
            required
            error={errors['specialConsiderationClaim']}
            placeholder='Enter your claim (if any)'
          />
          <FileUpload
            className='mt-2'
            label='Upload documentary evidence'
            name='specialEvidenceUploaded'
            required
            error={errors['specialEvidenceUploaded']}
            variant='browseCard'
            hintText='PDF, DOC, DOCX, JPG, PNG up to 10 MB each'
            onFileSelect={isReadOnly ? () => {} : handleEvidenceUpload}
            uploaded={specialEvidenceFiles.length > 0}
            disabled={!renewalId || uploadingEvidence || isReadOnly}
            fileName={
              uploadingEvidence
                ? 'Uploading...'
                : isSyncingPrefilled &&
                    specialEvidenceFiles.some(f => {
                      const m = getDocumentUploadMeta(f);
                      return m.fileUrl && !m.id;
                    })
                  ? 'Uploading prefilled file...'
                  : specialEvidenceFiles.length === 1
                    ? getDocumentUploadMeta(specialEvidenceFiles[0]).fileName
                    : specialEvidenceFiles.length > 1
                      ? `${specialEvidenceFiles.length} files uploaded`
                      : undefined
            }
          />
          {specialEvidenceFiles.map((file, index) => {
            const meta = getDocumentUploadMeta(file);
            const isDeleting = deletingFileId === (meta.id ?? -index);
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
                      disabled={isDeleting || uploadingEvidence}
                    >
                      View
                    </button>
                  )}
                  {!isReadOnly && (
                    <button
                      type='button'
                      className='text-red-600 underline hover:text-red-800 disabled:opacity-50'
                      onClick={handleEvidenceDelete(meta.id, index)}
                      disabled={isDeleting || uploadingEvidence || !renewalId}
                    >
                      {isDeleting ? 'Removing...' : 'Remove'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div>
          <p className='block text-sm font-medium text-gray-700 mb-1'>
            Details for an application for license in Form IV{' '}
            <span className='text-red-500 ml-1'>*</span>
          </p>
          <Input
            label='(a) Place or area for which the licence is sought'
            name='formIVPlaceArea'
            value={formData.formIVPlaceArea || ''}
            onChange={onChange}
            required
            error={errors['formIVPlaceArea']}
            placeholder='Enter place or area'
          />
          <TextArea
            className='mt-2'
            label='(b) Specification of the wild beasts which are permitted to be destroyed as per the permit granted under the Wild life (Protection) Act, 1972'
            name='formIVWildBeastsSpec'
            value={formData.formIVWildBeastsSpec || ''}
            onChange={onChange}
            rows={2}
            required
            error={errors['formIVWildBeastsSpec']}
            placeholder='Enter specification of wild beasts permitted to be destroyed'
          />
        </div>
      </div>
    </div>
  );
});

LicenseDetailsSection.displayName = 'LicenseDetailsSection';

export default LicenseDetailsSection;
