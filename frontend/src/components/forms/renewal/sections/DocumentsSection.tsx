import React, { forwardRef, useImperativeHandle, useMemo, useState } from 'react';
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

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

const SUPPORTED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const FILE_EXTENSION_TO_TYPE: Record<string, string> = {
  pdf: 'PDF',
  jpg: 'JPG',
  jpeg: 'JPEG',
  png: 'PNG',
  doc: 'DOC',
  docx: 'DOCX',
};

const DOCUMENT_FIELDS: { key: string; label: string; required?: boolean }[] = [
  { key: 'idProofUploaded', label: 'Aadhar Card', required: true },
  { key: 'panCardUploaded', label: 'PAN Card', required: true },
  { key: 'trainingCertificateUploaded', label: 'Training certificate' },
  { key: 'medicalCertificateUploaded', label: 'Medical Certificate', required: true },
  { key: 'otherStateLicenseUploaded', label: 'Other state Arms License (optional)' },
  { key: 'existingArmsLicenseUploaded', label: 'Existing Arms License (optional)' },
  { key: 'safeCustodyUploaded', label: 'Safe custody (optional)' },
];

/**
 * Determine the file type label from the file object.
 * Unsupported types are saved as "Other".
 */
const resolveFileTypeLabel = (file: File): string => {
  // Try to detect from extension first
  const nameParts = file.name.split('.');
  const ext = nameParts.length > 1 ? nameParts.pop()?.toLowerCase() : '';
  if (ext && FILE_EXTENSION_TO_TYPE[ext]) {
    return FILE_EXTENSION_TO_TYPE[ext];
  }
  // Fallback to MIME type
  if (SUPPORTED_FILE_TYPES.includes(file.type)) {
    const mimeExt = file.type.split('/')[1]?.toUpperCase();
    return mimeExt || 'Other';
  }
  return 'Other';
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

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
  const [fileSizeErrors, setFileSizeErrors] = useState<Record<string, string>>({});

  // Combined errors: parent errors + local file size errors
  const combinedErrors = useMemo(() => {
    const merged: Record<string, string | undefined> = { ...errors };
    for (const [key, msg] of Object.entries(fileSizeErrors)) {
      if (msg) merged[key] = msg;
    }
    return merged;
  }, [errors, fileSizeErrors]);

  useImperativeHandle(ref, () => ({
    focusFirstInvalid: () => {
      const firstKey = Object.keys(combinedErrors).find((key) => !!combinedErrors[key]);
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

    // --- File size validation ---
    if (file.size > MAX_FILE_SIZE) {
      const sizeMsg = `File size (${formatFileSize(file.size)}) exceeds the maximum allowed size of 10 MB.`;
      setFileSizeErrors((prev) => ({ ...prev, [fieldKey]: sizeMsg }));
      onError?.(sizeMsg);
      return;
    }

    // Clear any previous file size error for this field
    setFileSizeErrors((prev) => {
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });

    // --- Resolve file type: unsupported types saved as "Other" ---
    const fileTypeLabel = resolveFileTypeLabel(file);

    const existing = getDocumentUploadMeta(formData?.[fieldKey]);
    setUploadingField(fieldKey);
    onStatus?.('Uploading document...');

    try {
      const meta = await uploadRenewalDocument(renewalId, fieldKey, file, existing.id);
      // Attach resolved file type
      const metaWithType = { ...meta, fileType: meta.fileType || fileTypeLabel };
      onPatch({ [fieldKey]: metaWithType });
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
      if (onReload) {
        await onReload();
      }
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
          // Display uploaded files only after a successful upload (has id) or when already uploaded
          const showUploaded = Boolean((meta.uploaded || meta.id) && meta.fileName);
          const canDeleteViaApi = Boolean(meta.id && renewalId);
          const fieldError = combinedErrors[key];

          return (
            <div key={key} id={key}>
              {/* Upload loading state: show spinner indicator */}
              {isUploading && (
                <div className='mb-2 flex items-center gap-2 text-xs text-blue-600'>
                  <svg
                    className='animate-spin h-4 w-4'
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                  >
                    <circle
                      className='opacity-25'
                      cx='12'
                      cy='12'
                      r='10'
                      stroke='currentColor'
                      strokeWidth='4'
                    />
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                    />
                  </svg>
                  <span>Uploading... Please wait.</span>
                </div>
              )}

              <FileUpload
                label={label}
                name={key}
                required={required}
                variant='browseCard'
                onFileSelect={isReadOnly ? () => {} : handleSelect(key)}
                uploaded={showUploaded}
                fileName={
                  isFieldSyncing
                    ? 'Uploading prefilled file...'
                    : isUploading
                    ? 'Uploading...'
                    : showUploaded
                    ? meta.fileName
                    : undefined
                }
                disabled={!renewalId || isReadOnly || isUploading}
              />
              {fieldError && !isUploading && (
                <p className='text-red-500 text-xs mt-1'>{fieldError}</p>
              )}
              {/* Display uploaded files only after a successful upload */}
              {showUploaded && (
                <div className='mt-2 space-y-2 text-xs'>
                  {meta.fileName && <p className='text-gray-600'>File name: {meta.fileName}</p>}
                  {meta.fileType && <p className='text-gray-600'>File type: {meta.fileType}</p>}
                  {meta.fileUrl && (
                    <div className='flex flex-wrap items-center gap-3'>
                      <button
                        type='button'
                        className='text-blue-600 underline hover:text-blue-800 inline-flex items-center gap-1'
                        onClick={() => openDocumentFile(meta.fileUrl!, meta.fileName)}
                        disabled={isUploading || isDeleting}
                      >
                        <svg xmlns='http://www.w3.org/2000/svg' className='h-3.5 w-3.5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
                        </svg>
                        View document
                      </button>
                      {!isReadOnly && (canDeleteViaApi || (meta.fileUrl && !meta.id)) && (
                        <button
                          type='button'
                          className='text-red-600 underline hover:text-red-800 disabled:opacity-50 inline-flex items-center gap-1'
                          onClick={handleDelete(key, meta.id)}
                          disabled={isUploading || isDeleting || !renewalId}
                        >
                          <svg xmlns='http://www.w3.org/2000/svg' className='h-3.5 w-3.5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                          </svg>
                          {isDeleting ? 'Deleting...' : 'Delete'}
                        </button>
                      )}
                    </div>
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