'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Select from 'react-select';

// Type assertion for react-select to fix React 18 compatibility
const SelectFixed = Select as any;
import styles from './ProceedingsForm.module.css';
import { fetchData, postData, setAuthToken } from '../api/axiosConfig';
import { TiptapRichTextEditor } from './TiptapRichTextEditor';
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

// Type representing actions fetched from backend Actiones table
type BackendAction = {
  id: number;
  code: string; // e.g., FORWARD, REJECT, DISPOSE, RED_FLAG, etc.
  name?: string;
  description?: string;
  isActive?: boolean;
};

// Option used by react-select for Action Type
type ActionOption = { value: number; label: string; code: string };

// Fallback actions used when backend fetch fails or in dev without auth
const FALLBACK_ACTIONS: ActionOption[] = [
  { value: -1, label: 'Forward', code: 'FORWARD' },
  { value: -2, label: 'Reject', code: 'REJECT' },
  { value: -3, label: 'Dispose', code: 'DISPOSE' },
  { value: -4, label: 'Red Flag', code: 'RED_FLAG' },
  { value: -5, label: 'Request More Info', code: 'REQUEST_MORE_INFO' },
];

// Loading Spinner Component
function LoadingSpinner({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: styles.loadingSpinnerSmall,
    md: styles.loadingSpinnerMedium,
    lg: styles.loadingSpinnerLarge,
  };

  return <div className={`${styles.loadingSpinner} ${sizeClasses[size]}`}></div>;
}

// Success Message Component
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

// Error Message Component
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

export default function ProceedingsForm({
  applicationId,
  onSuccess,
  applicationData,
  userRole,
}: ProceedingsFormProps) {
  // Dynamic actions state
  const [actionOptions, setActionOptions] = useState<ActionOption[]>([]);
  const [actionsLoading, setActionsLoading] = useState<boolean>(true);
  const [actionsError, setActionsError] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<ActionOption | null>(null);
  // Legacy derived string (for conditional UI messages)
  const actionType = selectedAction?.code?.toLowerCase() || '';

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
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  // Refs for scrolling to invalid fields
  const actionRef = useRef<HTMLDivElement | null>(null);
  const remarksRef = useRef<HTMLDivElement | null>(null);
  const draftRef = useRef<HTMLDivElement | null>(null);
  const nextUserRef = useRef<HTMLDivElement | null>(null);
  const formContainerRef = useRef<HTMLDivElement | null>(null);

  // Track missing fields to show inline messages
  const [missingFields, setMissingFields] = useState<Record<string, string>>({});

  const scrollToFirstError = (errors: Record<string, any>) => {
    // Priority: action -> remarks -> draftLetter
    if (errors.action && actionRef.current) {
      actionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const el = actionRef.current.querySelector('input,select,button');
      (el as HTMLElement | null)?.focus?.();
      return;
    }
    if (errors.remarks && remarksRef.current) {
      remarksRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Focus Tiptap editor's editable content area
      const editable = remarksRef.current.querySelector('[contenteditable], .tiptap');
      (editable as HTMLElement | null)?.focus?.();
      return;
    }
    if (errors.draftLetter && draftRef.current) {
      draftRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const el = draftRef.current.querySelector('[contenteditable], .tiptap');
      (el as HTMLElement | null)?.focus?.();
      return;
    }
  };

  // Fetch actions from backend on mount
  useEffect(() => {
    let mounted = true;
    setActionsLoading(true);
    setActionsError(null);
    (async () => {
      try {
        // request would otherwise be unauthenticated (server returns all actions).
        try {
          const cookieAuth = getCookie('auth');
          if (cookieAuth) setAuthToken(cookieAuth);
          if (process.env.NODE_ENV !== 'production') {
            try {
              const t = String(cookieAuth || '');
              const masked = t.length > 8 ? `${t.slice(0, 4)}...${t.slice(-4)}` : t;
              // eslint-disable-next-line no-console
            } catch (e) {}
          }
        } catch (e) {}

        const data = await fetchData(
          `/actiones${applicationId ? `?applicationId=${applicationId}` : ''}`
        );
        // data is expected to be an array of BackendAction
        const humanizeCode = (c: string) =>
          String(c || '')
            .replace(/_/g, ' ')
            .toLowerCase()
            .replace(/\b\w/g, m => m.toUpperCase());

        const options: ActionOption[] = (Array.isArray(data) ? data : [])
          .filter((a: BackendAction) => a?.isActive !== false) // prefer active ones
          .map((a: BackendAction) => {
            const code = String(a.code || '').toUpperCase();
            // Use backend-provided name when available; otherwise humanize the code
            const label = a?.name && String(a.name).trim() ? String(a.name) : humanizeCode(code);
            return { value: Number(a.id), label, code };
          });
        if (mounted) {
          // Build a priority map from the raw `data` array; if none found, preserve server order.
          const priorityMap = new Map<string, number>();
          (Array.isArray(data) ? data : []).forEach((a: any, idx: number) => {
            const code = String(a?.code || '').toUpperCase();
            if (typeof a?.priority === 'number') priorityMap.set(code, a.priority);
            else if (typeof a?.order === 'number') priorityMap.set(code, a.order);
            else if (!priorityMap.has(code)) {
              // If backend didn't provide an explicit priority, use the server index to preserve order
              priorityMap.set(code, 100000 + idx);
            }
          });

          // If any real priorities were provided (values < 100000), sort by them; otherwise this keeps server order
          const hasRealPriorities = Array.from(priorityMap.values()).some(v => v < 100000);

          if (hasRealPriorities) {
            options.sort((x, y) => {
              const ix = priorityMap.get(x.code) ?? Number.MAX_SAFE_INTEGER;
              const iy = priorityMap.get(y.code) ?? Number.MAX_SAFE_INTEGER;
              return ix - iy;
            });
          }

          setActionOptions(options.length ? options : []);
        }
      } catch (e: any) {
        if (!mounted) return;
        setActionsError(e?.message || 'Failed to load actions');
        // Provide a client-side fallback so the form remains usable when the
        // actions endpoint cannot be reached (e.g., network/auth issues).
        setActionOptions(FALLBACK_ACTIONS);
      } finally {
        if (mounted) setActionsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

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

  // Load users from API endpoint when component mounts
  useEffect(() => {
    let mounted = true;
    setFetchingUsers(true);
    setError(null);

    (async () => {
      try {
        // Fetch users in hierarchy from API
        const response = await fetchData(`/application-form/users-in-hierarchy/${applicationId}`);

        if (mounted) {
          // Handle response - could be direct array or wrapped in data property
          const usersData = Array.isArray(response) ? response : response?.data || [];

          const formatted = usersData.map((u: any) => ({
            value: String(u.id),
            label: `${u.username || 'Unknown User'} (${u.roleCode || 'N/A'})`,
          }));

          setUserOptions(formatted);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || 'Failed to load users in hierarchy');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Clear previous missing fields
    setMissingFields({});

    // Validation: collect missing fields and show inline messages
    const errors: Record<string, string> = {};
    if (!selectedAction) errors.action = 'Please select an action type.';
    if (!remarks.trim()) errors.remarks = 'Please add remarks before submitting.';
    if (!nextUser) errors.nextUser = 'Please select the next proceeding officer.';
    if (roleFromCookie === 'SHO' && !draftLetter.trim())
      errors.draftLetter = 'Ground Report Letter is required for submission.';

    if (Object.keys(errors || {}).length > 0) {
      setMissingFields(errors);
      // scroll to the first invalid field
      setTimeout(() => scrollToFirstError(errors), 50);
      return;
    }

    // Build payload for /workflow/action
    const actionId = Number(selectedAction?.value);

    const payload: any = {
      applicationId: Number(applicationId),
      actionId,
      remarks: remarks.trim(),
      attachments: [],
    };

    // Add next user as next proceeding officer (if provided)
    if (nextUser?.value) {
      payload.nextUserId = Number(nextUser.value);
    }

    // Include ground report as PDF (Base64) for SHO
    if (roleFromCookie === 'SHO' && draftLetter.trim()) {
      try {
        // Strip HTML tags before generating PDF to avoid HTML tags in PDF
        const cleanedContent = htmlToPlainText(draftLetter.trim());
        const base64Pdf = generatePdfBase64(cleanedContent);
        const today = new Date().toISOString().split('T')[0];
        payload.attachments.push({
          name: `ground_report_${applicationId}_${today}.pdf`,
          type: 'GROUND_REPORT',
          contentType: 'application/pdf',
          url: `data:application/pdf;base64,${base64Pdf}`,
        });
        payload.isGroundReportGenerated = true;
      } catch (err) {
        // Fallback: send as text if PDF generation fails (still strip HTML)
        const cleanedContent = htmlToPlainText(draftLetter.trim());
        payload.attachments.push({
          name: `ground_report_${applicationId}_${new Date().toISOString().split('T')[0]}.txt`,
          type: 'GROUND_REPORT',
          contentType: 'text/plain',
          url: `data:text/plain;base64,${btoa(unescape(encodeURIComponent(cleanedContent)))}`,
        });
        payload.isGroundReportGenerated = true;
      }
    }

    // Include selected attachment files (as data URLs) into payload
    if (attachmentFiles.length > 0) {
      // Helper to read file as data URL
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
        setError('Failed to process selected attachments. Please try again.');
        return;
      }
    }
    setIsSubmitting(true);

    try {
      const result = await postData(`/workflow/action`, payload);
      setSuccess(result.message || 'Action completed successfully.');

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

  const handleDismissError = () => setError(null);
  const handleDismissSuccess = () => setSuccess(null);

  // Attachment handlers
  const onAttachmentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Clear previous attachment error
    setAttachmentError(null);

    // Basic validation: 4 files max, each <= 1MB
    const MAX_FILES = 4;
    const MAX_SIZE = 1 * 1024 * 1024; // 1MB

    const valid: File[] = [];
    for (const f of files) {
      if (f.size > MAX_SIZE) {
        setAttachmentError(`File too large: (max 1MB)`);
        e.target.value = '' as any;
        return;
      }
      valid.push(f);
    }

    const merged = [...attachmentFiles, ...valid];
    
    // Check if more than 4 files
    if (merged.length > MAX_FILES) {
      setAttachmentError(`You can only select up to ${MAX_FILES} files.`);
      e.target.value = '' as any;
      return;
    }

    // Check for duplicate file names
    const fileNames = merged.map(f => f.name);
    const uniqueNames = new Set(fileNames);
    if (fileNames.length !== uniqueNames.size) {
      setAttachmentError('Duplicate file names are not allowed. Please select files with unique names.');
      e.target.value = '' as any;
      return;
    }

    setAttachmentFiles(merged);
    // reset input value to allow re-selecting same file later
    e.target.value = '' as any;
  };

  const removeAttachment = (index: number) => {
    setAttachmentFiles(prev => prev.filter((_, i) => i !== index));
    // Clear attachment error when removing files
    setAttachmentError(null);
  };

  const openAttachmentInNewTab = (file: File) => {
    try {
      const url = URL.createObjectURL(file);
      window.open(url, '_blank', 'noopener');
      // Revoke after a short delay to allow the new tab to load
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (e) {
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

  // Helper: Strip HTML tags and decode HTML entities
  const stripHtmlTags = (html: string): string => {
    // Create a temporary element to use browser's HTML parser
    const temp = document.createElement('div');
    temp.innerHTML = html;
    // Get text content (removes all HTML tags)
    return temp.textContent || temp.innerText || '';
  };

  // Helper: Convert HTML content to plain text for PDF export
  const htmlToPlainText = (html: string): string => {
    // First, strip all HTML tags
    let text = stripHtmlTags(html);
    // Decode HTML entities
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

  const formatContentForExport = (content: string) => {
    // Check if content is already HTML (contains HTML tags)
    const isHtml = /<[^>]*>/.test(content);

    if (isHtml) {
      // Already HTML from Tiptap - convert to plain text then re-format for display
      const plainText = htmlToPlainText(content);
      return plainText
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/__(.*)__/g, '<u>$1</u>')
        .replace(/\n/g, '<br/>');
    } else {
      // Markdown-style content - convert to HTML
      return content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/__(.*)__/g, '<u>$1</u>')
        .replace(/\n/g, '<br/>');
    }
  };

  const downloadAsPDF = async (content: string, filename: string) => {
    try {
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        setError('Please allow popups to download as PDF');
        return;
      }

      // Use the HTML content directly from Tiptap editor (it's already formatted)
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
            * {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            body {
              font-family: 'Arial', 'Helvetica', sans-serif;
              font-size: 11pt;
              line-height: 1.6;
              color: #1f2937;
              background: white;
              margin: 0;
              padding: 0;
            }
            .content {
              font-family: inherit;
            }
            .content h1 {
              font-size: 24pt;
              font-weight: 700;
              margin: 1em 0 0.67em 0;
              line-height: 1.2;
              color: #1f2937;
            }
            .content h2 {
              font-size: 20pt;
              font-weight: 700;
              margin: 0.83em 0 0.67em 0;
              line-height: 1.2;
              color: #374151;
            }
            .content h3 {
              font-size: 16pt;
              font-weight: 700;
              margin: 1em 0 0.5em 0;
              line-height: 1.2;
              color: #4b5563;
            }
            .content h4, .content h5, .content h6 {
              font-size: 13pt;
              font-weight: 700;
              margin: 1em 0 0.5em 0;
              line-height: 1.2;
            }
            .content p {
              margin: 0.5em 0;
              line-height: 1.6;
            }
            .content ul {
              margin: 0.5em 0;
              padding-left: 2em;
            }
            .content ol {
              margin: 0.5em 0;
              padding-left: 2em;
            }
            .content li {
              margin: 0.25em 0;
              line-height: 1.6;
            }
            .content blockquote {
              margin: 1em 0;
              padding-left: 1em;
              border-left: 4px solid #d1d5db;
              color: #6b7280;
            }
            .content strong {
              font-weight: bold;
            }
            .content em {
              font-style: italic;
            }
            .content u {
              text-decoration: underline;
            }
            .content table {
              border-collapse: collapse;
              width: 100%;
              margin: 1em 0;
            }
            .content table td,
            .content table th {
              border: 1px solid #d1d5db;
              padding: 0.5em;
            }
            .content table th {
              background-color: #f3f4f6;
              font-weight: bold;
            }
            .content hr {
              border: none;
              border-top: 1px solid #d1d5db;
              margin: 1em 0;
            }
            .content div[style*="background"] {
              padding: 1em;
              margin: 0.5em 0;
              border-radius: 0.375rem;
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
          <div class="content">${content}</div>
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
      setError('Failed to generate PDF. Please try again.');
    }
  };

  const downloadAsWord = (content: string, filename: string) => {
    try {
      // Create proper Office Open XML format for Word
      const htmlContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
            xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
            xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
            xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"
            xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing">
<w:body>
<w:sectPr>
<w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
<w:pgSz w:w="12240" w:h="15840"/>
</w:sectPr>
</w:body>
</w:document>`;

      // Alternative: Use a simpler, more compatible HTML format
      const simpleHtmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="ProgId" content="Word.Document">
  <meta name="Generator" content="Microsoft Word 15">
  <meta name="Originator" content="Microsoft Word 15">
  <link rel="File-List" href="file:///C|/TEMP/filelist.xml">
  <link rel="themeColor" href="file:///C|/TEMP/themecolor.xml">
  <!--[if gte mso 9]><xml>
    <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:TargetScreenSize>1024x768</o:TargetScreenSize>
    </o:OfficeDocumentSettings>
  </xml><![endif]-->
  <style>
    body {
      font-family: Calibri, Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #1f2937;
      margin: 1in;
    }
    h1 {
      font-size: 26pt;
      font-weight: bold;
      margin: 12pt 0 6pt 0;
      color: #1f2937;
    }
    h2 {
      font-size: 20pt;
      font-weight: bold;
      margin: 10pt 0 6pt 0;
      color: #374151;
    }
    h3 {
      font-size: 16pt;
      font-weight: bold;
      margin: 10pt 0 6pt 0;
      color: #4b5563;
    }
    h4, h5, h6 {
      font-size: 13pt;
      font-weight: bold;
      margin: 10pt 0 6pt 0;
    }
    p {
      margin: 0 0 6pt 0;
      line-height: 1.5;
    }
    ul, ol {
      margin: 6pt 0 6pt 40pt;
    }
    li {
      margin: 3pt 0;
      line-height: 1.5;
    }
    blockquote {
      margin: 6pt 40pt;
      padding: 6pt;
      border-left: 4px solid #d1d5db;
      background-color: #f9fafb;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 6pt 0;
    }
    table td, table th {
      border: 1px solid #d1d5db;
      padding: 4pt;
    }
    table th {
      background-color: #f3f4f6;
      font-weight: bold;
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
    hr {
      border: none;
      border-top: 1px solid #d1d5db;
      margin: 12pt 0;
    }
  </style>
</head>
<body>
${content}
</body>
</html>`;

      const blob = new Blob([simpleHtmlContent], {
        type: 'application/msword',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.doc`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccess('Word document downloaded successfully!');
    } catch (error) {
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

    // Strip HTML tags from content for proper PDF text
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
        // Strip all formatting and HTML tags for plain text
        const plainText = htmlToPlainText(draftLetter)
          .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
          .replace(/\*(.*?)\*/g, '$1') // Remove italic
          .replace(/__(.*?)__/g, '$1'); // Remove underline

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
    // Render the Arms License Verification template from TiptapRichTextEditor
    return `<div style="font-family: Georgia, 'Times New Roman', serif; color: #1f2937; line-height: 1.8;">
  <div style="max-width: 8.5in; margin: 0 auto; padding: 2rem; background: white;">
    <div style="text-align: center; padding-bottom: 1.5rem; border-bottom: 2px solid #1f2937; margin-bottom: 2rem;">
      <p style="margin: 0; font-weight: bold; font-size: 0.9rem;">**[On Official Letterhead]**</p>
      <p style="margin: 0.75rem 0 0 0; font-weight: bold;">Police Station / Law Enforcement Agency</p>
      <p style="margin: 0.25rem 0 0 0; font-size: 0.85rem; color: #6b7280;">[Station Name & Address]</p>
    </div>

    <div style="margin-bottom: 2rem;">
      <p style="margin: 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
    </div>

    <div style="background: #f3f4f6; padding: 1.5rem; border-radius: 0.375rem; margin-bottom: 2rem; border-left: 4px solid #1f2937;">
      <p style="margin: 0; font-weight: 600; margin-bottom: 0.75rem;">To,</p>
      <p style="margin: 0.25rem 0; font-weight: 600;">The Station House Officer (SHO)</p>
      <p style="margin: 0.25rem 0;">[Police Station Name]</p>
      <p style="margin: 0.25rem 0;">[Full Address]</p>
      <p style="margin: 0.25rem 0;">[City, State]</p>
    </div>

    <div style="background: #fffbeb; padding: 1rem; border-left: 4px solid #d97706; border-radius: 0.375rem; margin-bottom: 2rem;">
      <p style="margin: 0;"><strong>Subject:</strong> Verification of Antecedents and Character for Arms License Application</p>
    </div>

    <p style="margin-bottom: 1.5rem;">Respected Sir/Madam,</p>

    <p style="margin-bottom: 1.5rem; text-align: justify;">In compliance with the instructions received from the ARMS Branch, this office has undertaken a detailed verification of the antecedents, character, and background of <strong>[Applicant Name]</strong>, who has applied for issuance/renewal of an arms license.</p>

    <div style="background: #ecfdf5; border-left: 4px solid #059669; padding: 1.5rem; border-radius: 0.375rem; margin-bottom: 1.5rem;">
      <h3 style="margin: 0 0 1rem 0; color: #065f46;">📋 Verification Summary</h3>
      <ol style="margin: 0; padding-left: 1.5rem; color: #047857;">
        <li style="margin-bottom: 0.75rem;"><strong>Personal & Residential Verification</strong><br/>The applicant is a permanent resident of the given address. Enquiries confirm continuous residence at the location for the past [X years], along with family members.</li>
        <li style="margin-bottom: 0.75rem;"><strong>Criminal Record Verification</strong><br/>A comprehensive check of the police station records, crime registers, and state crime bureau records reveals [findings].</li>
        <li style="margin-bottom: 0.75rem;"><strong>Neighborhood & Local Inquiry</strong><br/>A door-to-door inquiry was conducted with neighbors, shopkeepers, and other responsible members of the locality. [findings]</li>
        <li style="margin-bottom: 0.75rem;"><strong>Financial & Social Background</strong><br/>The applicant is reported to be financially [status], engaged in [occupation/profession].</li>
        <li style="margin-bottom: 0.75rem;"><strong>Risk Assessment</strong><br/>No intelligence input, local report, or community feedback suggests any risk concerns. [additional details]</li>
        <li style="margin-bottom: 0;"><strong>General Character</strong><br/>The applicant enjoys a [reputation] reputation in the society. [character assessment]</li>
      </ol>
    </div>

    <div style="background: #f0f9ff; border: 1px solid #0ea5e9; padding: 1.5rem; border-radius: 0.375rem; margin-bottom: 1.5rem;">
      <h3 style="margin: 0 0 1rem 0; color: #0c4a6e;">✓ Conclusion & Recommendation</h3>
      <p style="margin: 0; text-align: justify; color: #0c4a6e;">On the basis of the above inquiries and verification conducted by this police station, it is concluded that <strong>[recommendation]</strong>.</p>
    </div>

    <p style="margin-bottom: 2rem;">Thanking you,</p>

    <div style="margin-top: 3rem;">
      <p style="margin: 0; color: #6b7280;">Yours faithfully,</p>
      <p style="margin: 2rem 0 0 0; border-top: 1px solid #1f2937; padding-top: 0.5rem;">___________________________</p>
      <p style="margin: 0.25rem 0;"><strong>[Signature & Seal]</strong></p>
      <p style="margin: 0.25rem 0;"><strong>[Name & Designation]</strong></p>
      <p style="margin: 0.25rem 0;">[Police Station/Unit]</p>
      <p style="margin: 0.5rem 0 0 0; font-size: 0.85rem; color: #6b7280;">Date: ${new Date().toLocaleDateString()}</p>
    </div>
  </div>
</div>`;
  };

  return (
    <div className={`${styles.formContainer} thin-scrollbar`}>
      {/* Proceedings Form */}
      <div className={styles.scrollPanel}>
        <div className={styles.proceedingsPanel}>
          <form onSubmit={handleSubmit} className={styles.formContent}>
            {/* Top validation banner when there are missing fields */}
            {Object.keys(missingFields || {}).length > 0 && (
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
                  <p>Please fix the highlighted fields and try again.</p>
                </div>
              </div>
            )}
            {/* Status Messages */}
            {error && <ErrorMessage message={error} onDismiss={handleDismissError} />}
            {success && <SuccessMessage message={success} onDismiss={handleDismissSuccess} />}

            {/* Action Type Selection */}
            <div
              className={`${styles.formSection} ${missingFields.action ? styles.invalidField : ''}`}
              ref={actionRef}
            >
              <label className={styles.formLabel}>
                Action Type <span className={styles.required}>*</span>
              </label>
              <div className={styles.selectContainer}>
                <SelectFixed
                  options={actionOptions}
                  value={selectedAction}
                  onChange={(opt: any) => setSelectedAction((opt as ActionOption) || null)}
                  placeholder={actionsLoading ? 'Loading actions...' : 'Select action type'}
                  isLoading={actionsLoading}
                  isDisabled={isSubmitting || actionsLoading}
                  className='text-sm'
                  styles={{
                    control: (provided: any, state: any) => ({
                      ...provided,
                      borderColor: state.isFocused ? '#3B82F6' : '#D1D5DB',
                      boxShadow: state.isFocused ? '0 0 0 1px #3B82F6' : 'none',
                      '&:hover': {
                        borderColor: '#3B82F6',
                      },
                    }),
                  }}
                />
              </div>
              {actionsError && (
                <p className={styles.helpText}>
                  Failed to load actions from server. Using defaults. Error: {actionsError}
                </p>
              )}
              {missingFields.action && <p className={styles.fieldError}>{missingFields.action}</p>}
            </div>

            {/* Next User Selection */}
            <div
              className={`${styles.formSection} ${missingFields.nextUser ? styles.invalidField : ''}`}
            >
              <label className={styles.formLabel}>
                Forward To (Next User/Role)
                <span className={styles.required}>*</span>
              </label>
              <div className={styles.selectContainer} ref={nextUserRef}>
                <SelectFixed
                  options={userOptions}
                  value={nextUser}
                  onChange={setNextUser}
                  placeholder={
                    fetchingUsers ? 'Loading users...' : 'Select user (next proceeding officer)'
                  }
                  isLoading={fetchingUsers}
                  isDisabled={isSubmitting || fetchingUsers}
                  className='text-sm'
                  styles={{
                    control: (provided: any, state: any) => ({
                      ...provided,
                      borderColor: state.isFocused ? '#3B82F6' : '#D1D5DB',
                      boxShadow: state.isFocused ? '0 0 0 1px #3B82F6' : 'none',
                      '&:hover': {
                        borderColor: '#3B82F6',
                      },
                      backgroundColor: 'white',
                    }),
                  }}
                />
              </div>
              {fetchingUsers && (
                <div className={styles.loadingText}>
                  <LoadingSpinner size='sm' />
                  <span>Loading available users...</span>
                </div>
              )}
              {!fetchingUsers && userOptions.length === 0 && (
                <p className={styles.helpText}>
                  No users available. Please try refreshing the page.
                </p>
              )}
              {missingFields.nextUser && (
                <p className={styles.fieldError}>{missingFields.nextUser}</p>
              )}
            </div>

            {/* Remarks/Text Area */}
            <div
              className={`${styles.formSection} ${missingFields.remarks ? styles.invalidField : ''}`}
              ref={remarksRef}
            >
              <div className='flex items-center justify-between'>
                <label className={styles.formLabel}>
                  Remarks <span className={styles.required}>*</span>
                </label>
              </div>
              <div className={styles.richTextContainer} style={{ marginTop: '12px' }}>
                <TiptapRichTextEditor
                  value={remarks}
                  onChange={setRemarks}
                  placeholder='Enter your remarks here. You can add tables (paste from Excel/Word), formatted lists, and styled text...'
                  disabled={isSubmitting}
                  minHeight='300px'
                  maxHeight='600px'
                />
              </div>
              <p className={styles.helpText}>
                Advanced formatting: Bold, italic, underline, headings, bullet points, numbered
                lists, block quotes, code blocks, and tables. You can paste tables directly from
                Excel or Word.
              </p>
              {missingFields.remarks && (
                <p className={styles.fieldError}>{missingFields.remarks}</p>
              )}
            </div>

            {/* Ground Report Section within Proceedings - Only for SHO role (from cookie) */}

            {roleFromCookie === 'SHO' && (
              <div className='border-t pt-2'>
                <div className='flex justify-between items-center mb-2'>
                  <h4 className='text-md font-semibold text-gray-800'>
                    Ground Report Letter (Draft Letter Content)
                    <span className={styles.required}>*</span>
                  </h4>
                </div>

                {/* Ground Report Editor within Proceedings - always visible for SHO */}
                <div
                  className={`${styles.formSection} ${missingFields.draftLetter ? styles.invalidField : ''}`}
                  ref={draftRef}
                >
                  <TiptapRichTextEditor
                    value={draftLetter}
                    onChange={setDraftLetter}
                    placeholder='Draft letter will appear here...'
                    minHeight='300px'
                    maxHeight='700px'
                  />
                  <p className={styles.helpText}>
                    This letter is required. Edit as needed. Use the toolbar for formatting (bold,
                    italic, underline, headings, lists, etc.).
                  </p>
                </div>
                {missingFields.draftLetter && (
                  <p className={styles.fieldError}>{missingFields.draftLetter}</p>
                )}

                <div className='flex gap-3 justify-end mt-4 flex-wrap'>
                  <button
                    type='button'
                    onClick={() => {
                      navigator.clipboard.writeText(draftLetter);
                      setSuccess('Draft letter copied to clipboard!');
                    }}
                    className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 flex items-center text-sm'
                  >
                    <svg
                      className='w-4 h-4 mr-2'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z'
                      />
                    </svg>
                    Copy
                  </button>

                  {/* Download Dropdown */}
                  <div className='relative download-dropdown'>
                    <button
                      type='button'
                      onClick={() => setShowDownloadDropdown(!showDownloadDropdown)}
                      className='px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 flex items-center text-sm'
                    >
                      <svg
                        className='w-4 h-4 mr-2'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                        />
                      </svg>
                      Download
                      <svg
                        className='w-4 h-4 ml-2'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M19 9l-7 7-7-7'
                        />
                      </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {showDownloadDropdown && (
                      <div className='absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20'>
                        <div className='py-2'>
                          <button
                            type='button'
                            onClick={() => {
                              handleDownload('pdf');
                              setShowDownloadDropdown(false);
                            }}
                            className='w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center'
                          >
                            <svg
                              className='w-4 h-4 mr-3 text-red-600'
                              fill='currentColor'
                              viewBox='0 0 24 24'
                            >
                              <path d='M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z' />
                            </svg>
                            PDF (A4)
                          </button>
                          <button
                            type='button'
                            onClick={() => {
                              handleDownload('word');
                              setShowDownloadDropdown(false);
                            }}
                            className='w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center'
                          >
                            <svg
                              className='w-4 h-4 mr-3 text-blue-600'
                              fill='currentColor'
                              viewBox='0 0 24 24'
                            >
                              <path d='M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z' />
                            </svg>
                            Word (.doc)
                          </button>
                          <button
                            type='button'
                            onClick={() => {
                              handleDownload('txt');
                              setShowDownloadDropdown(false);
                            }}
                            className='w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center'
                          >
                            <svg
                              className='w-4 h-4 mr-3 text-gray-600'
                              fill='currentColor'
                              viewBox='0 0 24 24'
                            >
                              <path d='M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z' />
                            </svg>
                            Text (.txt)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type='button'
                    onClick={() => {
                      setDraftLetter(generateDraftLetter());
                      setSuccess('Template reset to default!');
                    }}
                    className='px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition duration-200 flex items-center text-sm'
                  >
                    <svg
                      className='w-4 h-4 mr-2'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                      />
                    </svg>
                    Reset
                  </button>
                </div>
              </div>
            )}

            {/* Attachment Section */}
            <div id='attachments-section' className='mt-8 border-t pt-6'>
              <div className='flex items-center justify-between mb-3'>
                <h4 className='text-md font-semibold text-gray-800'>Attachment</h4>
              </div>
              <div className='bg-gray-50 p-4 rounded-lg'>
                <div className='flex flex-col gap-3'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Upload documents
                    </label>
                    <input
                      type='file'
                      multiple
                      accept='.pdf,.jpg,.jpeg,.png,.doc,.docx,.txt,.csv,.xlsx,.xls,image/*,application/pdf'
                      onChange={onAttachmentSelect}
                      disabled={isSubmitting}
                      className='block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'
                    />
                    <p className={styles.helpText}>
                      Max 4 files, each up to 1MB. Allowed: PDF, images, Word.
                    </p>
                    {attachmentError && (
                      <p className='text-sm text-red-600 mt-2' role='alert'>
                        {attachmentError}
                      </p>
                    )}
                  </div>

                  {attachmentFiles.length > 0 ? (
                    <ul className='divide-y divide-gray-200 bg-white rounded-md border border-gray-200'>
                      {attachmentFiles.map((file, idx) => (
                        <li
                          key={idx}
                          className='flex items-center justify-between px-3 py-2 text-sm'
                        >
                          <div className='flex items-center min-w-0'>
                            <svg
                              className='w-4 h-4 text-gray-500 mr-2'
                              fill='none'
                              stroke='currentColor'
                              viewBox='0 0 24 24'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M7 7h10M7 11h10M7 15h10'
                              />
                            </svg>
                            <button
                              type='button'
                              onClick={() => openAttachmentInNewTab(file)}
                              className='truncate text-blue-600 hover:underline text-left'
                              title={file.name}
                            >
                              {file.name}
                            </button>
                            <span className='ml-2 text-gray-500'>
                              ({Math.round(file.size / 1024)} KB)
                            </span>
                          </div>
                          <button
                            type='button'
                            onClick={() => removeAttachment(idx)}
                            className='text-red-600 hover:text-red-700'
                            disabled={isSubmitting}
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className='text-xs text-gray-500'>No files selected.</p>
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
                    <LoadingSpinner size='sm' />
                    <span>Processing your request...</span>
                  </>
                )}
              </div>

              <button
                type='submit'
                disabled={isSubmitting || loading || fetchingUsers}
                className={styles.submitButton}
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size='sm' />
                    <span>Submitting...</span>
                  </>
                ) : (
                  'Submit Action'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Ground Report Editor */}
      {showGroundReportEditor && (
        <div>
          <div className='flex justify-between items-center mb-4'>
            <h3 className='text-lg font-semibold'>Ground Report Editor</h3>
            <button
              type='button'
              onClick={() => setShowGroundReportEditor(false)}
              className='text-gray-500 hover:text-gray-700 text-xl'
            >
              ← Back
            </button>
          </div>

          <div className={`${styles.formContent} ${styles.groundReportPanel}`}>
            {/* Status Messages */}
            {error && <ErrorMessage message={error} onDismiss={handleDismissError} />}
            {success && <SuccessMessage message={success} onDismiss={handleDismissSuccess} />}

            <div className={styles.formSection}>
              <TiptapRichTextEditor
                value={draftLetter}
                onChange={setDraftLetter}
                placeholder='Draft letter will appear here...'
                minHeight='400px'
                maxHeight='700px'
              />
              <p className={styles.helpText}>
                Edit the draft letter content as needed. Use the toolbar for formatting (bold,
                italic, underline, headings, lists, tables, etc.).
              </p>
            </div>

            <div className='flex gap-3 justify-end mt-6 flex-wrap'>
              <button
                type='button'
                onClick={() => {
                  navigator.clipboard.writeText(draftLetter);
                  setSuccess('Draft letter copied to clipboard!');
                }}
                className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 flex items-center text-sm'
              >
                <svg className='w-4 h-4 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z'
                  />
                </svg>
                Copy
              </button>

              {/* Download Dropdown */}
              <div className='relative download-dropdown'>
                <button
                  type='button'
                  onClick={() => setShowDownloadDropdown(!showDownloadDropdown)}
                  className='px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 flex items-center text-sm'
                >
                  <svg
                    className='w-4 h-4 mr-2'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                    />
                  </svg>
                  Download
                  <svg
                    className='w-4 h-4 ml-2'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M19 9l-7 7-7-7'
                    />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showDownloadDropdown && (
                  <div className='absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20'>
                    <div className='py-2'>
                      <button
                        type='button'
                        onClick={() => {
                          handleDownload('pdf');
                          setShowDownloadDropdown(false);
                        }}
                        className='w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center'
                      >
                        <svg
                          className='w-4 h-4 mr-3 text-red-600'
                          fill='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path d='M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z' />
                        </svg>
                        PDF (A4)
                      </button>
                      <button
                        type='button'
                        onClick={() => {
                          handleDownload('word');
                          setShowDownloadDropdown(false);
                        }}
                        className='w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center'
                      >
                        <svg
                          className='w-4 h-4 mr-3 text-blue-600'
                          fill='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path d='M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z' />
                        </svg>
                        Word (.doc)
                      </button>
                      <button
                        type='button'
                        onClick={() => {
                          handleDownload('txt');
                          setShowDownloadDropdown(false);
                        }}
                        className='w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center'
                      >
                        <svg
                          className='w-4 h-4 mr-3 text-gray-600'
                          fill='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path d='M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z' />
                        </svg>
                        Text (.txt)
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                type='button'
                onClick={() => {
                  setDraftLetter(generateDraftLetter());
                  setSuccess('Template reset to default!');
                }}
                className='px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition duration-200 flex items-center text-sm'
              >
                <svg className='w-4 h-4 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                  />
                </svg>
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
