import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { toast } from 'react-toastify';
import { FileUpload } from '../../elements/FileUpload';
import { openDocumentFile } from '../../../../services/fileHandler';
import {
  deleteRenewalDocument,
  getDocumentUploadMeta,
  uploadRenewalDocument,
} from '../../../../utils/renewalFileUpload';
import { usePrefilledDocumentSync } from '../../../../hooks/usePrefilledDocumentSync';

type ErrorsMap = Record<string, string | undefined>;

const DOCUMENT_FIELDS: { key: string; label: string; required?: boolean }[] = [
  { key: 'idProofUploaded', label: 'Aadhar Card', required: true },
  { key: 'panCardUploaded', label: 'PAN Card', required: true },
  { key: 'trainingCertificateUploaded', label: 'Training certificate' },
  { key: 'medicalCertificateUploaded', label: 'Medical Certificate', required: true },
  { key: 'otherStateLicenseUploaded', label: 'Other state Arms License (optional)' },
  { key: 'existingArmsLicenseUploaded', label: 'Existing Arms License (optional)' },
  { key: 'safeCustodyUploaded', label: 'Safe custody (optional)' },
];

const DocumentsSection = forwardRef(function DocumentsSection(
  props: {
    formData: any;
    renewalId: string;
    onPatch: (patch: Record<string, unknown>) => void;
    onError?: (message: string) => void;
    onStatus?: (message: string | null) => void;
    errors?: ErrorsMap;
    isReadOnly?: boolean;
    onReload?: () => Promise<void>;
  },
  ref: any,
) {
  const { formData, renewalId, onPatch, onError, onStatus, errors = {}, isReadOnly = false, onReload } = props;
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [deletingFileId, setDeletingFileId] = useState<number | null>(null);

  useImperativeHandle(ref, () => ({
    focusFirstInvalid: () => {
      const firstKey = Object.keys(errors).find((key) => !!errors[key]);
      if (firstKey) {
        const el = document.getElementById(firstKey);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          try { (el as HTMLElement).focus(); } catch { /* ignore */ }
        }
      }
    },
  }));

  const { isSyncingPrefilled } = usePrefilledDocumentSync(
    renewalId,
    formData,
    onPatch,
    onError,
    onStatus,
    'documents',
  );

  const handleSelect = (fieldKey: string) => async (file: File) => {
    if (!renewalId) {
      toast.error('Save the renewal draft first so a renewal ID is available for uploads.');
      return;
    }

    const existing = getDocumentUploadMeta(formData?.[fieldKey]);
    setUploadingField(fieldKey);
    onStatus?.('Uploading document...');

    try {
      const meta = await uploadRenewalDocument(renewalId, fieldKey, file, existing.id);
      onPatch({ [fieldKey]: meta });
      onStatus?.('Document uploaded successfully.');
    } catch (err: any) {
      onError?.(err?.message || 'Failed to upload document.');
    } finally {
      setUploadingField(null);
    }
  };

  const handleDelete = (fieldKey: string, fileId?: number) => async () => {
    if (!fileId) {
      onPatch({ [fieldKey]: null });
      return;
    }

    const confirmed = window.confirm('Are you sure you want to delete this document? This action cannot be undone.');
    if (!confirmed) return;

    setDeletingFileId(fileId);
    onStatus?.('Removing document...');

    try {
      await deleteRenewalDocument(fileId);
      onPatch({ [fieldKey]: null });
      onStatus?.('Document removed.');
      toast.success('Document deleted successfully.');
    } catch (err: any) {
      const errMsg = err?.response?.data?.error || err?.message || 'Failed to delete document.';
      onError?.(errMsg);
      toast.error(errMsg);
    } finally {
      setDeletingFileId(null);
    }
  };

  return (
    <div className='space-y-4'>
      <p className='text-sm font-medium'>Claims for special consideration for obtaining the license, if any</p>
      <p className='text-xs text-gray-500'>(attach documentary evidence)</p>

      {!renewalId && (
        <p className='text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2'>
          Uploads are available after the renewal application is created (renewal ID required).
        </p>
      )}
      {renewalId && isSyncingPrefilled && (
        <p className='text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-md px-3 py-2'>
          Saving prefilled documents via upload-file API&hellip;
        </p>
      )}

      <div className='mt-3 grid grid-cols-1 md:grid-cols-2 gap-4'>
        {DOCUMENT_FIELDS.map(({ key, label, required }) => {
          const meta = getDocumentUploadMeta(formData?.[key]);
          const isFieldSyncing =
            isSyncingPrefilled && Boolean(meta.fileUrl && !meta.id);
          const isUploading = uploadingField === key || isFieldSyncing;
          const isDeleting = Boolean(meta.id && deletingFileId === meta.id);
          const showUploaded = Boolean(meta.uploaded || meta.fileUrl || meta.fileName || meta.id || isFieldSyncing);
          const canDeleteViaApi = Boolean(meta.id && renewalId);

          return (
            <div key={key} id={key} className={errors[key] ? 'rounded-md border border-red-200 bg-red-50 p-2' : ''}>
                {isUploading ? (
                  <div className='flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-md bg-gray-50 h-[92px]'>
                    <svg className='animate-spin h-6 w-6 text-blue-600 mb-2' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
                      <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                      <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                    </svg>
                    <span className='text-sm text-gray-600 font-medium'>
                      {isFieldSyncing ? 'Uploading prefilled file...' : 'Uploading...'}
                    </span>
                  </div>
                ) : (
                  <FileUpload
                    label={label}
                    name={key}
                    required={required}
                    variant='browseCard'
                    onFileSelect={isReadOnly ? () => {} : handleSelect(key)}
                    uploaded={showUploaded}
                    fileName={meta.fileName}
                    disabled={!renewalId || isReadOnly}
                  />
                )}
                {errors[key] && !isUploading && (
                  <p className='text-red-500 text-xs mt-1'>{errors[key]}</p>
                )}
              {showUploaded && (
                <div className='mt-2 space-y-2 text-xs'>
                  {isDeleting ? (
                    <div className='flex items-center gap-2 py-2 text-red-600'>
                      <svg className='animate-spin h-4 w-4' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
                        <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                        <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                      </svg>
                      <span className='font-medium'>Deleting document...</span>
                    </div>
                  ) : (
                    <>
                      {meta.fileName && <p className='text-gray-600'>File name: {meta.fileName}</p>}
                      {meta.fileType && <p className='text-gray-600'>File type: {meta.fileType}</p>}
                      <div className='flex flex-wrap items-center gap-3'>
                        {meta.fileUrl && (
                          <button
                            type='button'
                            className='text-blue-600 underline hover:text-blue-800'
                            onClick={() => openDocumentFile(meta.fileUrl!, meta.fileName)}
                            disabled={isUploading}
                          >
                            View document
                          </button>
                        )}
                        {!isReadOnly && (canDeleteViaApi || (meta.fileUrl && !meta.id)) && (
                          <button
                            type='button'
                            className='text-red-600 underline hover:text-red-800 disabled:opacity-50'
                            onClick={handleDelete(key, meta.id)}
                            disabled={isUploading || !renewalId}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

DocumentsSection.displayName = 'DocumentsSection';

export default DocumentsSection;