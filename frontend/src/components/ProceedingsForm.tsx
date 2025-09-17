
'use client';

import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import styles from './ProceedingsForm.module.css';
import { postData } from '../api/axiosConfig';
import { EnhancedTextEditor } from './RichTextEditor';
import { getCookie } from 'cookies-next';
import jsPDF from 'jspdf';

import { ApplicationData } from '../types';

interface UserOption {
  value: string;
  label: string;
}

interface ProceedingsFormProps {
  applicationId: string;
  onSuccess?: () => void;
  userRole?: string;
  applicationData?: ApplicationData;
}

const ACTION_OPTIONS = [
  { value: 'forward', label: 'Forward' },
  { value: 'return', label: 'Return' },
  { value: 'dispose', label: 'Dispose' },
  { value: 'red-flag', label: 'Red Flag' },
];

// Map UI actions to backend action IDs expected by /workflow/action
const ACTION_ID_MAP: Record<string, number> = {
  'forward': 1,
  'return': 2,
  'dispose': 3,
  'red-flag': 4,
};

// Simple TextArea Component as Rich Text Editor Replacement
function SimpleTextArea({ value, onChange, placeholder, disabled, dataTestId }: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  dataTestId?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      data-testid={dataTestId}
      className="w-full min-h-[120px] p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
      style={{ fontFamily: 'inherit', fontSize: '0.875rem' }}
    />
  );
}

// Loading Spinner Component
function LoadingSpinner({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: styles.loadingSpinnerSmall,
    md: styles.loadingSpinnerMedium,
    lg: styles.loadingSpinnerLarge
  };

  return (
    <div className={`${styles.loadingSpinner} ${sizeClasses[size]}`}></div>
  );
}

// Success Message Component
function SuccessMessage({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className={`${styles.statusMessage} ${styles.successMessage}`} role="alert">
      <div className={styles.statusIcon}>
        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      </div>
      <div className={styles.statusContent}>
        <p>{message}</p>
      </div>
      <button
        onClick={onDismiss}
        className={styles.dismissButton}
        aria-label="Dismiss success message"
      >
        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}

// Error Message Component
function ErrorMessage({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 8000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className={`${styles.statusMessage} ${styles.errorMessage}`} role="alert">
      <div className={styles.statusIcon}>
        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      </div>
      <div className={styles.statusContent}>
        <p>{message}</p>
      </div>
      <button
        onClick={onDismiss}
        className={styles.dismissButton}
        aria-label="Dismiss error message"
      >
        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}

export default function ProceedingsForm({ applicationId, onSuccess, applicationData }: ProceedingsFormProps) {
  const [actionType, setActionType] = useState('');
  const [nextUser, setNextUser] = useState<UserOption | null>(null);
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [remarks, setRemarks] = useState('');
  const [remarksVisible, setRemarksVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftLetter, setDraftLetter] = useState('');
  const [showProceedingsForm, setShowProceedingsForm] = useState(true);
  const [showGroundReportEditor, setShowGroundReportEditor] = useState(false);
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);
  const [roleFromCookie, setRoleFromCookie] = useState<string | null>(null);
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);

  // Read role from cookies on mount and normalize
  useEffect(() => {
    try {
      const cookieVal = getCookie('role') as any;
      const str = cookieVal == null ? null : String(cookieVal).trim().toUpperCase();
      setRoleFromCookie(str);
    } catch (e) {
      // ignore cookie read errors; role remains null
    }
  }, []);

  // If user is SHO, ensure a default draft letter is available
  useEffect(() => {
    if (roleFromCookie === 'SHO' && !draftLetter.trim()) {
      setDraftLetter(generateDraftLetter());
    }
  }, [roleFromCookie]);

  // Load users when application data is available (not dependent on action type)
  useEffect(() => {
    if (applicationData?.usersInHierarchy) {
      setFetchingUsers(true);
      setError(null);

      const timer = setTimeout(() => {
        // Use real application data from usersInHierarchy
        const usersToUse = applicationData.usersInHierarchy || [];

        const formatted = usersToUse.map((u) => ({
          value: String(u.id),
          label: `${u.username || u.userName || 'Unknown User'} (${u.id})`,
        }));
        setUserOptions(formatted);
        setFetchingUsers(false);
      }, 300);

      return () => clearTimeout(timer);
    } else {
      setUserOptions([]);
      setFetchingUsers(false);
    }
  }, [applicationData?.usersInHierarchy]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submit button clicked - form submission started');
    setError(null);
    setSuccess(null);

    // Validation
    if (!actionType) {
      setError('Please select an action type.');
      return;
    }

    if (actionType === 'forward' && !nextUser) {
      setError('Please select a user to forward to.');
      return;
    }

    if (!remarks.trim()) {
      setError('Please add remarks before submitting.');
      return;
    }

    // Ground report letter is mandatory for SHO
    if (roleFromCookie === 'SHO' && !draftLetter.trim()) {
      setError('Ground Report Letter is required for submission.');
      return;
    }

    // Build payload for /workflow/action
    const actionId = ACTION_ID_MAP[actionType];
    if (!actionId) {
      setError('Unknown action type.');
      return;
    }

  const payload: any = {
      applicationId: Number(applicationId),
      actionId,
      remarks: remarks.trim(),
      attachments: [],
    };

    
    // Add next user if forwarding
    if (nextUser?.value) {
      payload.nextUserId = Number(nextUser.value);
    }

  // Include ground report as PDF (Base64) for SHO
  if (roleFromCookie === 'SHO' && draftLetter.trim()) {
      try {
        const base64Pdf = generatePdfBase64(draftLetter.trim());
        const today = new Date().toISOString().split('T')[0];
        payload.attachments.push({
          name: `ground_report_${applicationId}_${today}.pdf`,
          type: 'GROUND_REPORT',
          contentType: 'application/pdf',
          url: `data:application/pdf;base64,${base64Pdf}`,
        });
        payload.isGroundReportGenerated = true;
      } catch (err) {
        console.error('Failed to generate PDF, falling back to text:', err);
        payload.attachments.push({
          name: `ground_report_${applicationId}_${new Date().toISOString().split('T')[0]}.txt`,
          type: 'GROUND_REPORT',
          contentType: 'text/plain',
          url: `data:text/plain;base64,${btoa(unescape(encodeURIComponent(draftLetter.trim())))}`,
        });
        payload.isGroundReportGenerated = true;
      }
    }

    // Include selected attachment files (as data URLs) into payload
    if (attachmentFiles.length > 0) {
      // Helper to read file as data URL
      const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

      try {
        const fileUrls = await Promise.all(attachmentFiles.map(f => readFileAsDataUrl(f)));
        fileUrls.forEach((dataUrl, idx) => {
          const file = attachmentFiles[idx];
          // Best-effort content type from data URL or file.type
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
        console.error('Failed to attach selected files:', err);
        setError('Failed to process selected attachments. Please try again.');
        return;
      }
    }

    console.log('Payload to be sent:', payload);
    setIsSubmitting(true);

    try {
      console.log('Making API call to /workflow/action');
      const result = await postData(`/workflow/action`, payload);
      console.log('API response:', result);
      setSuccess(result.message || 'Action completed successfully.');
      
      // Reset form
      setActionType('');
      setNextUser(null);
      setRemarks('');
      
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to submit action. Please try again.');
      console.error('Error submitting form:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismissError = () => setError(null);
  const handleDismissSuccess = () => setSuccess(null);

  // Attachment handlers
  const onAttachmentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Basic validation: 10 files max, each <= 10MB
    const MAX_FILES = 10;
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB

    const valid: File[] = [];
    for (const f of files) {
      if (f.size > MAX_SIZE) {
        setError(`File too large: ${f.name} (max 10MB)`);
        continue;
      }
      valid.push(f);
    }

    const merged = [...attachmentFiles, ...valid].slice(0, MAX_FILES);
  setAttachmentFiles(merged);
    // reset input value to allow re-selecting same file later
    e.target.value = '' as any;
  };

  const removeAttachment = (index: number) => {
    setAttachmentFiles(prev => prev.filter((_, i) => i !== index));
  };

  const openAttachmentInNewTab = (file: File) => {
    try {
      const url = URL.createObjectURL(file);
      window.open(url, '_blank', 'noopener');
      // Revoke after a short delay to allow the new tab to load
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (e) {
      console.error('Failed to open file preview', e);
      setError('Unable to open file preview.');
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDownloadDropdown) {
        const target = event.target as Element;
        if (!target.closest('.download-dropdown')) {
          setShowDownloadDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDownloadDropdown]);

  const formatContentForExport = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/__(.*?)__/g, '<u>$1</u>')
      .replace(/\n/g, '<br/>');
  };

  const downloadAsPDF = async (content: string, filename: string) => {
    try {
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        setError('Please allow popups to download as PDF');
        return;
      }

      const formattedContent = formatContentForExport(content);

      // A4 paper CSS styling
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Ground Report</title>
          <meta charset="utf-8">
          <style>
            @page {
              size: A4;
              margin: 2.5cm 2cm 2cm 2cm;
            }
            body {
              font-family: 'Times New Roman', serif;
              font-size: 12pt;
              line-height: 1.6;
              color: #000;
              background: white;
              margin: 0;
              padding: 0;
            }
            .letterhead {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #000;
              padding-bottom: 15px;
            }
            .content {
              font-family: inherit;
            }
            .footer {
              margin-top: 40px;
              page-break-inside: avoid;
            }
            strong {
              font-weight: bold;
            }
            em {
              font-style: italic;
            }
            u {
              text-decoration: underline;
            }
            @media print {
              body { 
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="content">${formattedContent}</div>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Wait for content to load
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
        
        // Close window after printing
        setTimeout(() => {
          printWindow.close();
        }, 1000);
      };
      
      setSuccess('PDF download initiated - please check your downloads folder');
    } catch (error) {
      console.error('PDF generation error:', error);
      setError('Failed to generate PDF. Please try again.');
    }
  };

  const downloadAsWord = (content: string, filename: string) => {
    try {
      const formattedContent = formatContentForExport(content);
      
      // Create HTML content formatted for Word
      const htmlContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' 
              xmlns:w='urn:schemas-microsoft-com:office:word' 
              xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>Ground Report</title>
          <style>
            @page {
              size: 8.5in 11in;
              margin: 1in 0.8in 0.8in 0.8in;
            }
            body {
              font-family: 'Times New Roman', serif;
              font-size: 12pt;
              line-height: 1.6;
              margin: 0;
            }
            .content {
              font-family: inherit;
            }
            strong {
              font-weight: bold;
            }
            em {
              font-style: italic;
            }
            u {
              text-decoration: underline;
            }
          </style>
        </head>
        <body>
          <div class="content">${formattedContent}</div>
        </body>
        </html>
      `;
      
      const blob = new Blob([htmlContent], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.doc`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccess('Word document downloaded successfully!');
    } catch (error) {
      console.error('Word generation error:', error);
      setError('Failed to generate Word document. Please try again.');
    }
  };

  // Helper: Generate an A4 PDF from the draft letter and return Base64 (without prefix)
  const generatePdfBase64 = (content: string): string => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 56; // ~0.78in margins
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const usableWidth = pageWidth - margin * 2;

    const normalized = (content || '').replace(/\r/g, '').replace(/\t/g, '    ');
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

    const dataUrl = doc.output('datauristring'); // data:application/pdf;base64,....
    return dataUrl.split(',')[1] || '';
  };

  const handleDownload = (format: string) => {
    const timestamp = new Date().toISOString().split('T')[0];
    const baseFilename = `ground-report-${applicationId}-${timestamp}`;
    
    switch (format) {
      case 'pdf':
        downloadAsPDF(draftLetter, baseFilename);
        break;
      case 'word':
        downloadAsWord(draftLetter, baseFilename);
        break;
      case 'txt':
        // Strip formatting for plain text
        const plainText = draftLetter
          .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove bold
          .replace(/\*(.*?)\*/g, '$1')      // Remove italic
          .replace(/__(.*?)__/g, '$1');     // Remove underline
        
        const blob = new Blob([plainText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${baseFilename}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        setSuccess('Text file downloaded successfully!');
        break;
      default:
        setError('Unsupported download format');
    }
  };

  const generateDraftLetter = () => {
    const currentDate = new Date().toLocaleDateString('en-GB');
    return `**[On Official Letterhead]**

Date: ${currentDate}

To,
The Station House Officer (SHO)
[Police Station Name]
[Full Address]

Subject: Verification of Antecedents and Character for Arms License Application

Respected Sir/Madam,

In compliance with the instructions received from the ARMS Branch, this office has undertaken a detailed verification of the antecedents, character, and background of [Applicant Name], who has applied for issuance/renewal of an arms license.

1. Personal & Residential Verification

The applicant is a permanent resident of the given address. Enquiries confirm continuous residence at the location for the past [X years], along with family members.

2. Criminal Record Verification

A comprehensive check of the police station records, crime registers, and state crime bureau records reveals [findings].

3. Neighborhood & Local Inquiry

A door-to-door inquiry was conducted with neighbors, shopkeepers, and other responsible members of the locality. [findings]

4. Financial & Social Background

The applicant is reported to be financially [status], engaged in [occupation/profession].

5. Risk Assessment

No intelligence input, local report, or community feedback suggests any risk concerns. [additional details]

6. General Character

The applicant enjoys a [reputation] reputation in the society. [character assessment]

Conclusion & Recommendation

On the basis of the above inquiries and verification conducted by this police station, it is concluded that [recommendation].

Thanking you,

Yours faithfully,
[Signature & Seal]
[Name & Designation]
[Police Station/Unit]`;
  };

  return (
    <div className={styles.formContainer}>
      {/* Header */}
      <div className={styles.formHeader}>
        <h2>
          <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Application Processing
        </h2>
        <p>Process application #{applicationId}</p>
      </div>

      {/* Proceedings Form */}
      <div>
        <form onSubmit={handleSubmit} className={styles.formContent}>
          {/* Status Messages */}
          {error && <ErrorMessage message={error} onDismiss={handleDismissError} />}
          {success && <SuccessMessage message={success} onDismiss={handleDismissSuccess} />}

          {/* Action Type Selection */}
          <div className={styles.formSection}>
            <label className={styles.formLabel}>
              Action Type <span className={styles.required}>*</span>
            </label>
            <div className={styles.selectContainer}>
              <Select
                options={ACTION_OPTIONS}
                value={ACTION_OPTIONS.find(opt => opt.value === actionType) || null}
                onChange={opt => setActionType(opt?.value || '')}
                placeholder="Select action type"
                isDisabled={isSubmitting}
                className="text-sm"
                styles={{
                  control: (provided, state) => ({
                    ...provided,
                    borderColor: state.isFocused ? '#3B82F6' : '#D1D5DB',
                    boxShadow: state.isFocused ? '0 0 0 1px #3B82F6' : 'none',
                    '&:hover': {
                      borderColor: '#3B82F6'
                    }
                  })
                }}
              />
            </div>
          </div>

          {/* Next User Selection */}
          <div className={styles.formSection}>
            <label className={styles.formLabel}>
              Forward To (Next User/Role)
              {<span className={styles.required}>*</span>}
            </label>
            <div className={styles.selectContainer}>
              <Select
                options={userOptions}
                value={nextUser}
                onChange={setNextUser}
                placeholder={
                  fetchingUsers ? 'Loading users...' : 'Select user'
                }
                isLoading={fetchingUsers}
                isDisabled={isSubmitting || fetchingUsers}
                className="text-sm"
                styles={{
                  control: (provided, state) => ({
                    ...provided,
                    borderColor: state.isFocused ? '#3B82F6' : '#D1D5DB',
                    boxShadow: state.isFocused ? '0 0 0 1px #3B82F6' : 'none',
                    '&:hover': {
                      borderColor: '#3B82F6'
                    },
                    backgroundColor: 'white'
                  })
                }}
              />
            </div>
            {fetchingUsers && (
              <div className={styles.loadingText}>
                <LoadingSpinner size="sm" />
                <span>Loading available users...</span>
              </div>
            )}
            {!fetchingUsers && userOptions.length === 0 && (
              <p className={styles.helpText}>
                No users available. Please try refreshing the page.
              </p>
            )}
            {actionType && actionType !== 'forward' && (
              <p className={styles.helpText}>
                This field is only required when "Forward" action is selected.
              </p>
            )}
          </div>

          {/* Remarks/Text Area */}
          <div className={styles.formSection}>
            <div className="flex items-center justify-between">
              <label className={styles.formLabel}>
                Remarks <span className={styles.required}>*</span>
              </label>
              <button
                type="button"
                onClick={() => setRemarksVisible(v => !v)}
                className="ml-3 text-blue-600 hover:underline text-sm"
                aria-pressed={remarksVisible}
                aria-label={remarksVisible ? 'Hide' : 'Show'}
              >
                {remarksVisible ? 'Hide' : 'Show'}
              </button>
            </div>
            {remarksVisible && (
              <>
                <div className={styles.richTextContainer}>
                  <SimpleTextArea
                    value={remarks}
                    onChange={setRemarks}
                    placeholder="Enter your remarks here..."
                    disabled={isSubmitting}
                    dataTestId="rich-text-editor"
                  />
                </div>
                <p className={styles.helpText}>
                  Enter your detailed remarks about this action. You can use multiple lines for better formatting.
                </p>
              </>
            )}
              </div>
              
    {/* Ground Report Section within Proceedings - Only for SHO role (from cookie) */}

    {roleFromCookie === 'SHO' && (
            <div className="mt-8 border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-md font-semibold text-gray-800">
                  Ground Report Letter <span className={styles.required}>*</span>
                </h4>
              </div>

              {/* Ground Report Editor within Proceedings - always visible for SHO */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className={styles.formSection}>
                  <label className={styles.formLabel}>
                    Draft Letter Content <span className={styles.required}>*</span>
                  </label>
                  <EnhancedTextEditor
                    content={draftLetter}
                    onChange={setDraftLetter}
                    placeholder="Draft letter will appear here..."
                    className="min-h-[400px]"
                  />
                  <p className={styles.helpText}>
                    This letter is required. Edit as needed. Use **bold**, *italic*, __underline__ for formatting. Click Preview to see formatted output.
                  </p>
                </div>

                <div className="flex gap-3 justify-end mt-4 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(draftLetter);
                      setSuccess('Draft letter copied to clipboard!');
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 flex items-center text-sm"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </button>
                  
                  {/* Download Dropdown */}
                  <div className="relative download-dropdown">
                    <button
                      type="button"
                      onClick={() => setShowDownloadDropdown(!showDownloadDropdown)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 flex items-center text-sm"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {/* Dropdown Menu */}
                    {showDownloadDropdown && (
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                        <div className="py-2">
                          <button
                            type="button"
                            onClick={() => {
                              handleDownload('pdf');
                              setShowDownloadDropdown(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                          >
                            <svg className="w-4 h-4 mr-3 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                            </svg>
                            PDF (A4)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleDownload('word');
                              setShowDownloadDropdown(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                          >
                            <svg className="w-4 h-4 mr-3 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                            </svg>
                            Word (.doc)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleDownload('txt');
                              setShowDownloadDropdown(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                          >
                            <svg className="w-4 h-4 mr-3 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                            </svg>
                            Text (.txt)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setDraftLetter(generateDraftLetter());
                      setSuccess('Template reset to default!');
                    }}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition duration-200 flex items-center text-sm"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Reset
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Attachment Section */}
          <div id="attachments-section" className="mt-8 border-t pt-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-md font-semibold text-gray-800">Attachment</h4>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Upload documents</label>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt,.csv,.xlsx,.xls,image/*,application/pdf"
                    onChange={onAttachmentSelect}
                    disabled={isSubmitting}
                    className="block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className={styles.helpText}>Max 10 files, each up to 10MB. Allowed: PDF, images, Word.</p>
                </div>

                {attachmentFiles.length > 0 ? (
                  <ul className="divide-y divide-gray-200 bg-white rounded-md border border-gray-200">
                    {attachmentFiles.map((file, idx) => (
                      <li key={idx} className="flex items-center justify-between px-3 py-2 text-sm">
                        <div className="flex items-center min-w-0">
                          <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10M7 11h10M7 15h10" />
                          </svg>
                          <button
                            type="button"
                            onClick={() => openAttachmentInNewTab(file)}
                            className="truncate text-blue-600 hover:underline text-left"
                            title={file.name}
                          >
                            {file.name}
                          </button>
                          <span className="ml-2 text-gray-500">({Math.round(file.size / 1024)} KB)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(idx)}
                          className="text-red-600 hover:text-red-700"
                          disabled={isSubmitting}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-gray-500">No files selected.</p>
                )}

                {/* No separate upload button — attachments will be included when you Submit Action */}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className={styles.submitSection}>
            <div className={styles.loadingText}>
              {isSubmitting && (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Processing your request...</span>
                </>
              )}
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting || loading || fetchingUsers}
              className={styles.submitButton}
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Submitting...</span>
                </>
              ) : (
                'Submit Action'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Ground Report Editor */}
      {showGroundReportEditor && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Ground Report Editor</h3>
            <button
              type="button"
              onClick={() => setShowGroundReportEditor(false)}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ← Back
            </button>
          </div>

          <div className={styles.formContent}>
            {/* Status Messages */}
            {error && <ErrorMessage message={error} onDismiss={handleDismissError} />}
            {success && <SuccessMessage message={success} onDismiss={handleDismissSuccess} />}

            <div className={styles.formSection}>
              <label className={styles.formLabel}>
                Draft Letter Content
              </label>
              <EnhancedTextEditor
                content={draftLetter}
                onChange={setDraftLetter}
                placeholder="Draft letter will appear here..."
                className="min-h-[600px]"
              />
              <p className={styles.helpText}>
                Edit the draft letter content as needed. Use **bold**, *italic*, __underline__ for formatting. Click Preview to see formatted output.
              </p>
            </div>

            <div className="flex gap-3 justify-end mt-6 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(draftLetter);
                  setSuccess('Draft letter copied to clipboard!');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 flex items-center text-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </button>
              
              {/* Download Dropdown */}
              <div className="relative download-dropdown">
                <button
                  type="button"
                  onClick={() => setShowDownloadDropdown(!showDownloadDropdown)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 flex items-center text-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Dropdown Menu */}
                {showDownloadDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                    <div className="py-2">
                      <button
                        type="button"
                        onClick={() => {
                          handleDownload('pdf');
                          setShowDownloadDropdown(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <svg className="w-4 h-4 mr-3 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                        </svg>
                        PDF (A4)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleDownload('word');
                          setShowDownloadDropdown(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <svg className="w-4 h-4 mr-3 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                        </svg>
                        Word (.doc)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleDownload('txt');
                          setShowDownloadDropdown(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <svg className="w-4 h-4 mr-3 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                        </svg>
                        Text (.txt)
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <button
                type="button"
                onClick={() => {
                  setDraftLetter(generateDraftLetter());
                  setSuccess('Template reset to default!');
                }}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition duration-200 flex items-center text-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}