'use client';
import React, { useState, useEffect } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';
import { useRenewalForm } from './RenewalFormContext';
import { getNextRenewalRoute, getPreviousRenewalRoute } from './renewalRoutes';

type UploadedFile = {
  file: File;
  uploading?: boolean;
  uploaded?: boolean;
  uploadId?: string | number;
  serverSize?: number;
  error?: string;
};

const documentTypes = [
  'Aadhar Card',
  'PAN Card',
  'Training certificate',
  'Medical Reports',
  'Other state Arms License',
  'Existing Arms License',
  'Safe custody'
];

const requiredDocuments = ['Aadhar Card'];

const DocumentsUploadRenewal: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, updateFormData, setIsSubmitting, setSubmitError, setSubmitSuccess, registerRefresh } = useRenewalForm();
  const applicantId = state.applicantId;
  const [files, setFiles] = useState<{ [key: string]: UploadedFile[] }>({});
  const [fileError, setFileError] = useState<{ [key: string]: string }>({});

  // Initialize files from context if present
  useEffect(() => {
    const existing = state.formData?.documentsUpload as any;
    if (existing && Object.keys(existing).length > 0) {
      setFiles(existing);
    }
  }, [state.formData.documentsUpload]);

  useEffect(() => {
    if (applicantId) {
      setSubmitSuccess('Documents data loaded');
      setTimeout(() => setSubmitSuccess(null), 3000);
    }
  }, [applicantId]);

  const handleRefreshData = async () => {
    if (!applicantId) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const { FormDataLoader } = await import('../../../utils/formDataLoader');
      const data = await FormDataLoader.loadAllSections(applicantId);
      if (data.documentsUpload) {
        setFiles(data.documentsUpload as any);
        updateFormData('documentsUpload', data.documentsUpload);
        setSubmitSuccess('Data refreshed');
        setTimeout(() => setSubmitSuccess(null), 3000);
      }
    } catch (err: any) {
      setSubmitError('Failed to refresh data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  React.useEffect(() => {
    if (registerRefresh) registerRefresh(handleRefreshData);
    return () => { if (registerRefresh) registerRefresh(null); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicantId]);

  const handleFileChange = (docType: string) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files as FileList);
      
      for (const file of newFiles) {
        if (file.size > 10 * 1024 * 1024) {
          setFileError(prev => ({ ...prev, [docType]: 'File size must be less than 10MB' }));
          continue;
        }

        const validTypes = ['.jpg', '.jpeg', '.png', '.pdf'];
        const fileExt = file.name.toLowerCase(). substring(file.name.lastIndexOf('.'));
        if (!validTypes.includes(fileExt)) {
          setFileError(prev => ({ ...prev, [docType]: 'Invalid file type' }));
          continue;
        }

        setFileError(prev => ({ ...prev, [docType]: '' }));

        const uploadedFile: UploadedFile = {
          file,
          uploading: true,
          uploaded: false,
        };

        setFiles((prev) => ({
          ...prev,
          [docType]: [...(prev[docType] || []), uploadedFile],
        }));

        setTimeout(() => {
          setFiles((prev) => ({
            ...prev,
            [docType]: prev[docType].map((f) =>
              f.file === file
                ? { ...f, uploading: false, uploaded: true, uploadId: Math.random() }
                : f
            ),
          }));
        }, 1500);
      }
    }
  };

  const removeFile = (docType: string, idx: number) => {
    setFiles((prev) => ({
      ...prev,
      [docType]: prev[docType].filter((_, i) => i !== idx),
    }));
  };

  const handleSaveToDraft = async () => {
    setIsSubmitting(true);
    updateFormData('documentsUpload', files);
    setSubmitSuccess('Documents saved');
    setTimeout(() => setSubmitSuccess(null), 3000);
    setIsSubmitting(false);
  };

  const handleNext = () => {
    for (const req of requiredDocuments) {
      const docFiles = files[req] || [];
      const uploadedCount = docFiles.filter(f => f.uploaded).length;
      if (uploadedCount === 0) {
        setFileError(prev => ({ ...prev, [req]: 'This document is required before proceeding.' }));
        return;
      }
    }

    updateFormData('documentsUpload', files);
    const nextRoute = getNextRenewalRoute('/forms/renewal/documents-upload');
    router.push(`${nextRoute}${applicantId ? `?id=${applicantId}` : ''}`);
  };

  const handlePrevious = () => {
    const prevRoute = getPreviousRenewalRoute('/forms/renewal/documents-upload');
    router.push(`${prevRoute}${applicantId ? `?id=${applicantId}` : ''}`);
  };

  return (
    <form className="">
      <h2 className="text-xl font-bold mb-4">Documents Upload</h2>

      {/* Application ID and refresh moved to layout header */}

      {state.submitSuccess && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">{state.submitSuccess}</div>
      )}
      {state.submitError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{state.submitError}</div>
      )}

      {Object.keys(files).length > 0 && (
        <div className="mb-4 p-3 bg-gray-100 border border-gray-300 rounded">
          <div className="text-sm font-medium text-gray-700 mb-2">Upload Summary:</div>
          {documentTypes.map((docType) => {
            const docFiles = files[docType] || [];
            const uploadedCount = docFiles.filter(f => f.uploaded).length;
            const uploadingCount = docFiles.filter(f => f.uploading).length;
            const errorCount = docFiles.filter(f => f.error).length;
            
            if (docFiles.length === 0) return null;
            
            return (
              <div key={docType} className="text-xs text-gray-600 flex justify-between">
                <span>{docType}:</span>
                <span>
                  {uploadedCount > 0 && <span className="text-green-600">{uploadedCount} uploaded</span>}
                  {uploadingCount > 0 && <span className="text-blue-600 ml-2">{uploadingCount} uploading</span>}
                  {errorCount > 0 && <span className="text-red-600 ml-2">{errorCount} failed</span>}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="mb-6">
        <div className="font-medium mb-2">18. Claims for special consideration for obtaining the license, if any</div>
        <div className="text-xs mb-2">(attach documentary evidence)</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {documentTypes.map((docType) => (
            <div key={docType} className="mb-2 border-2 border-dashed border-blue-300 rounded-lg p-2">
              <div className="font-semibold mb-1">
                {docType}
                {requiredDocuments.includes(docType) ? (
                  <span className="ml-1 text-xs text-red-600 align-middle">(required)</span>
                ) : (
                  ['Other state Arms License', 'Existing Arms License', 'Safe custody'].includes(docType) && (
                    <span className="ml-1 text-xs text-gray-400 align-middle">(optional)</span>
                  )
                )}
              </div>
              <div className="flex flex-col items-center mb-1">
                <span className="text-blue-500 text-xl mb-1">📤</span>
                <label className="text-blue-700 underline cursor-pointer">
                  Browse
                  <input
                    type="file"
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.pdf"
                    multiple
                    onChange={handleFileChange(docType)}
                  />
                </label>
                <span className="text-xs text-gray-500">Max 10 MB per file</span>
                {fileError[docType] && (
                  <span className="text-xs text-red-500">{fileError[docType]}</span>
                )}
              </div>
              <div className="text-xs text-gray-500 mb-1">Supported formats: .jpg, .jpeg, .png, .pdf</div>
              <div className="bg-white rounded-lg p-1">
                {(files[docType] || []).map((uploadedFile, idx) => (
                  <div key={idx} className="flex items-center gap-2 border-b py-1">
                    <div className="flex items-center gap-2">
                      {uploadedFile.uploading ? (
                        <span className="text-xl animate-spin">⏳</span>
                      ) : uploadedFile.uploaded ? (
                        <span className="text-xl text-green-500">✅</span>
                      ) : uploadedFile.error ? (
                        <span className="text-xl text-red-500">❌</span>
                      ) : (
                        <span className="text-xl">📁</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <span className="text-xs">{uploadedFile.file.name}</span>
                      <span className="text-gray-400 ml-2 text-xs">
                        {Math.round(((uploadedFile.serverSize ?? uploadedFile.file.size) || 0) / 1024)}kb
                      </span>
                      {uploadedFile.uploading && (
                        <span className="text-blue-500 ml-2 text-xs">Uploading...</span>
                      )}
                      {uploadedFile.uploaded && (
                        <span className="text-green-500 ml-2 text-xs">Uploaded</span>
                      )}
                      {uploadedFile.error && (
                        <span className="text-red-500 ml-2 text-xs">{uploadedFile.error}</span>
                      )}
                    </div>
                    <button 
                      type="button" 
                      className="text-gray-400 hover:text-red-600" 
                      onClick={() => removeFile(docType, idx)}
                      disabled={uploadedFile.uploading}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

    </form>
  );
};

export default DocumentsUploadRenewal;