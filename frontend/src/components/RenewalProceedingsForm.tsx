'use client';

import React, { useState, useEffect, useRef } from 'react';
import Select from 'react-select';
import { useRenewalWorkflow } from '../hooks/useRenewalWorkflow';
import styles from './ProceedingsForm.module.css';
import { TiptapRichTextEditor } from './TiptapRichTextEditor';
import { getCookie } from 'cookies-next';
import { ApplicationData } from '../types';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import { fetchData, setAuthToken } from '../api/axiosConfig';

const SelectFixed = Select as any;

interface UserOption {
  value: string;
  label: string;
}

interface RenewalProceedingsFormProps {
  applicationId: string;
  onSuccess?: () => void;
  userRole?: string;
  applicationData?: ApplicationData;
}

type ActionOption = { value: number; label: string; code: string };

function LoadingSpinner({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: styles.loadingSpinnerSmall,
    md: styles.loadingSpinnerMedium,
    lg: styles.loadingSpinnerLarge,
  };

  return <div className={`${styles.loadingSpinner} ${sizeClasses[size]}`}></div>;
}

function SuccessMessage({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className={`${styles.statusMessage} ${styles.successMessage}`} role='alert'>
      <div className={styles.statusIcon}>
        <svg className='h-5 w-5 text-green-400' viewBox='0 0 20 20' fill='currentColor'>
          <path
            fillRule='evenodd'
            d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
            clipRule='evenodd'
          />
        </svg>
      </div>
      <div className={styles.statusContent}>
        <p>{message}</p>
      </div>
      <button
        onClick={onDismiss}
        className={styles.dismissButton}
        aria-label='Dismiss success message'
      >
        <svg className='h-5 w-5' viewBox='0 0 20 20' fill='currentColor'>
          <path
            fillRule='evenodd'
            d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
            clipRule='evenodd'
          />
        </svg>
      </button>
    </div>
  );
}

function ErrorMessage({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 8000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className={`${styles.statusMessage} ${styles.errorMessage}`} role='alert'>
      <div className={styles.statusIcon}>
        <svg className='h-5 w-5 text-red-400' viewBox='0 0 20 20' fill='currentColor'>
          <path
            fillRule='evenodd'
            d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
            clipRule='evenodd'
          />
        </svg>
      </div>
      <div className={styles.statusContent}>
        <p>{message}</p>
      </div>
      <button
        onClick={onDismiss}
        className={styles.dismissButton}
        aria-label='Dismiss error message'
      >
        <svg className='h-5 w-5' viewBox='0 0 20 20' fill='currentColor'>
          <path
            fillRule='evenodd'
            d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
            clipRule='evenodd'
          />
        </svg>
      </button>
    </div>
  );
}

export default function RenewalProceedingsForm({
  applicationId,
  onSuccess,
  applicationData,
  userRole,
}: RenewalProceedingsFormProps) {
  const { statuses, actions, loading: workflowLoading, performAction } = useRenewalWorkflow();

  const [selectedAction, setSelectedAction] = useState<ActionOption | null>(null);
  const [nextUser, setNextUser] = useState<UserOption | null>(null);
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftLetter, setDraftLetter] = useState('');
  const [roleFromCookie, setRoleFromCookie] = useState<string | null>(null);
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [missingFields, setMissingFields] = useState<Record<string, string>>({});

  const actionRef = useRef<HTMLDivElement | null>(null);
  const remarksRef = useRef<HTMLDivElement | null>(null);
  const draftRef = useRef<HTMLDivElement | null>(null);
  const nextUserRef = useRef<HTMLDivElement | null>(null);

  // Convert workflow actions to action options
  const actionOptions: ActionOption[] = actions.map(action => ({
    value: action.id,
    label: action.name,
    code: action.code,
  }));

  // Read role from cookies
  useEffect(() => {
    try {
      const cookieVal = getCookie('role') as any;
      const str = cookieVal == null ? null : String(cookieVal).trim().toUpperCase();
      setRoleFromCookie(str);
    } catch (e) {
      //
    }
  }, []);

  // Generate default draft letter for SHO
  useEffect(() => {
    if (roleFromCookie === 'SHO' && !draftLetter.trim()) {
      const defaultLetter = `Dear Sir/Madam,

This is to certify that the renewal application for firearm license has been reviewed.

Date: ${new Date().toLocaleDateString('en-IN')}

Regards,`;
      setDraftLetter(defaultLetter);
    }
  }, [roleFromCookie]);

  // Fetch users from hierarchy API
  useEffect(() => {
    let mounted = true;
    setFetchingUsers(true);

    (async () => {
      try {
        // Set auth token if available
        try {
          const cookieAuth = getCookie('auth');
          if (cookieAuth) setAuthToken(cookieAuth);
        } catch (e) {
          // ignore cookie errors
        }

        // Fetch users in hierarchy from API
        const response = await fetchData(
          `/users-in-hierarchy/${applicationId}?applicationType=RenewalApplicationForm`
        );

        if (mounted) {
          // Handle response - could be direct array or wrapped in data property
          const usersData = Array.isArray(response) ? response : response?.data || [];

          const formatted: UserOption[] = usersData.map((u: any) => ({
            value: String(u.id),
            label: `${u.username || 'Unknown User'} (${u.roleCode || 'N/A'})`,
          }));

          setUserOptions(formatted);
        }
      } catch (err: any) {
        if (mounted) {
          console.error('Error fetching users:', err);
          setUserOptions([]);
        }
      } finally {
        if (mounted) setFetchingUsers(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [applicationId]);

  const scrollToFirstError = (errors: Record<string, any>) => {
    if (errors.action && actionRef.current) {
      actionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (errors.remarks && remarksRef.current) {
      remarksRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (errors.draftLetter && draftRef.current) {
      draftRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
  };

  const stripHtmlTags = (html: string): string => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  };

  const htmlToPlainText = (html: string): string => {
    let text = stripHtmlTags(html);
    text = text
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x2F;/g, '/');
    return text;
  };

  const generatePdfBase64 = (content: string): string => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 56;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const usableWidth = pageWidth - margin * 2;

    const plainText = htmlToPlainText(content);
    const normalized = (plainText || '').replace(/\r/g, '').replace(/\t/g, '    ');
    const paragraphs = normalized.split('\n');

    doc.setFont('Times', 'Normal');
    doc.setFontSize(12);
    const lineHeight = 18;
    let y = margin;

    const addPageIfNeeded = () => {
      if (y > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
    };

    paragraphs.forEach((p, idx) => {
      const lines = doc.splitTextToSize(p || ' ', usableWidth);
      lines.forEach((ln: string) => {
        addPageIfNeeded();
        doc.text(ln, margin, y);
        y += lineHeight;
      });
      if (idx < paragraphs.length - 1) y += 6;
    });

    const dataUrl = doc.output('datauristring');
    return dataUrl.split(',')[1] || '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setMissingFields({});

    // Validation
    const errors: Record<string, string> = {};
    if (!selectedAction) errors.action = 'Please select an action type.';
    if (!remarks.trim()) errors.remarks = 'Please add remarks before submitting.';
    if (!nextUser) errors.nextUser = 'Please select the next proceeding officer.';
    if (roleFromCookie === 'SHO' && !draftLetter.trim())
      errors.draftLetter = 'Ground Report Letter is required for submission.';

    if (Object.keys(errors).length > 0) {
      setMissingFields(errors);
      setTimeout(() => scrollToFirstError(errors), 50);
      return;
    }

    // Build payload - same structure as fresh application
    const payload: any = {
      applicationId: Number(applicationId),
      actionId: Number(selectedAction?.value),
      remarks: remarks.trim(),
      applicationType: 'RenewalApplicationForm',
      attachments: [],
    };

    if (nextUser?.value) {
      payload.nextUserId = Number(nextUser.value);
    }

    // Include ground report as PDF for SHO
    if (roleFromCookie === 'SHO' && draftLetter.trim()) {
      try {
        const cleanedContent = htmlToPlainText(draftLetter.trim());
        const base64Pdf = generatePdfBase64(cleanedContent);
        const today = new Date().toISOString().split('T')[0];
        payload.attachments.push({
          name: `renewal_ground_report_${applicationId}_${today}.pdf`,
          type: 'GROUND_REPORT',
          contentType: 'application/pdf',
          url: `data:application/pdf;base64,${base64Pdf}`,
        });
        payload.isGroundReportGenerated = true;
      } catch (err) {
        const cleanedContent = htmlToPlainText(draftLetter.trim());
        payload.attachments.push({
          name: `renewal_ground_report_${applicationId}_${new Date().toISOString().split('T')[0]}.txt`,
          type: 'GROUND_REPORT',
          contentType: 'text/plain',
          url: `data:text/plain;base64,${btoa(unescape(encodeURIComponent(cleanedContent)))}`,
        });
        payload.isGroundReportGenerated = true;
      }
    }

    // Include attachment files
    if (attachmentFiles.length > 0) {
      const readFileAsDataUrl = (file: File) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });

      try {
        const fileUrls = await Promise.all(attachmentFiles.map(f => readFileAsDataUrl(f)));
        fileUrls.forEach((dataUrl, idx) => {
          const file = attachmentFiles[idx];
          const mimeMatch = /^data:([^;]+);base64,/.exec(dataUrl || '');
          const contentType = mimeMatch?.[1] || file.type || 'application/octet-stream';
          payload.attachments.push({
            name: file.name,
            type: 'OTHER',
            contentType,
            url: dataUrl,
          });
        });
      } catch (err) {
        setError('Failed to process attachments. Please try again.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Use the workflow action from the hook
      await performAction(payload);
      setSuccess('Action completed successfully.');

      // Reset form
      setSelectedAction(null);
      setNextUser(null);
      setRemarks('');

      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to submit action. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxSize = 10 * 1024 * 1024; // 10MB
    const invalidFiles = files.filter(f => f.size > maxSize);

    if (invalidFiles.length > 0) {
      setAttachmentError(`File size must be less than 10MB. ${invalidFiles.length} file(s) exceeded the limit.`);
      return;
    }

    setAttachmentFiles([...attachmentFiles, ...files]);
    setAttachmentError(null);
  };

  const handleRemoveFile = (index: number) => {
    setAttachmentFiles(attachmentFiles.filter((_, i) => i !== index));
  };

  if (workflowLoading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  return (
    <div className={styles.proceedingsContainer}>
      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
      {success && <SuccessMessage message={success} onDismiss={() => setSuccess(null)} />}

      <form onSubmit={handleSubmit} className={styles.formContent}>
        {/* Action Type */}
        <div ref={actionRef} className='mb-6'>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Action Type <span className='text-red-500'>*</span>
          </label>
          <SelectFixed
            options={actionOptions}
            value={selectedAction}
            onChange={setSelectedAction}
            isDisabled={isSubmitting}
            placeholder='Select action type...'
            classNamePrefix='react-select'
            styles={{
              control: (base: any) => ({
                ...base,
                borderColor: missingFields.action ? '#ef4444' : base.borderColor,
                boxShadow: missingFields.action ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : base.boxShadow,
              }),
            }}
          />
          {missingFields.action && (
            <p className='text-red-500 text-sm mt-1'>{missingFields.action}</p>
          )}
        </div>

        {/* Next User */}
        <div ref={nextUserRef} className='mb-6'>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Next Officer <span className='text-red-500'>*</span>
          </label>
          {fetchingUsers ? (
            <div className='flex items-center justify-center p-4'>
              <LoadingSpinner size='sm' />
            </div>
          ) : (
            <SelectFixed
              options={userOptions}
              value={nextUser}
              onChange={setNextUser}
              isDisabled={isSubmitting || fetchingUsers}
              placeholder='Select next proceeding officer...'
              classNamePrefix='react-select'
              styles={{
                control: (base: any) => ({
                  ...base,
                  borderColor: missingFields.nextUser ? '#ef4444' : base.borderColor,
                  boxShadow: missingFields.nextUser ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : base.boxShadow,
                }),
              }}
            />
          )}
          {missingFields.nextUser && (
            <p className='text-red-500 text-sm mt-1'>{missingFields.nextUser}</p>
          )}
        </div>

        {/* Remarks */}
        <div ref={remarksRef} className='mb-6'>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Remarks <span className='text-red-500'>*</span>
          </label>
          <TiptapRichTextEditor
            content={remarks}
            onChange={setRemarks}
            placeholder='Enter your remarks here...'
            disabled={isSubmitting}
          />
          {missingFields.remarks && (
            <p className='text-red-500 text-sm mt-1'>{missingFields.remarks}</p>
          )}
        </div>

        {/* Ground Report for SHO */}
        {roleFromCookie === 'SHO' && (
          <div ref={draftRef} className='mb-6'>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Ground Report <span className='text-red-500'>*</span>
            </label>
            <TiptapRichTextEditor
              content={draftLetter}
              onChange={setDraftLetter}
              placeholder='Enter ground report here...'
              disabled={isSubmitting}
            />
            {missingFields.draftLetter && (
              <p className='text-red-500 text-sm mt-1'>{missingFields.draftLetter}</p>
            )}
          </div>
        )}

        {/* Attachments */}
        <div className='mb-6'>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Additional Attachments
          </label>
          <input
            type='file'
            multiple
            onChange={handleFileSelect}
            disabled={isSubmitting}
            className='block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'
          />
          {attachmentError && (
            <p className='text-red-500 text-sm mt-1'>{attachmentError}</p>
          )}

          {attachmentFiles.length > 0 && (
            <div className='mt-4 space-y-2'>
              {attachmentFiles.map((file, idx) => (
                <div key={idx} className='flex items-center justify-between bg-gray-50 p-3 rounded'>
                  <span className='text-sm text-gray-600'>{file.name}</span>
                  <button
                    type='button'
                    onClick={() => handleRemoveFile(idx)}
                    disabled={isSubmitting}
                    className='text-red-500 hover:text-red-700 disabled:text-gray-400'
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className='flex gap-4'>
          <button
            type='submit'
            disabled={isSubmitting || workflowLoading}
            className='flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded transition'
          >
            {isSubmitting ? (
              <span className='flex items-center justify-center gap-2'>
                <LoadingSpinner size='sm' /> Submitting...
              </span>
            ) : (
              'Submit Action'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
