'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '../../../components/Sidebar';
import Header from '../../../components/Header';
import { useAuthSync } from '../../../hooks/useAuthSync';
import { useLayout } from '../../../config/layoutContext';
import { ApplicationApi } from '../../../config/APIClient';
import { ApplicationData } from '../../../types';
import ProcessApplicationModal from '../../../components/ProcessApplicationModal';
import ForwardApplicationModal from '../../../components/ForwardApplicationModal';
import ConfirmationModal from '../../../components/ConfirmationModal';
import EnhancedApplicationTimeline from '../../../components/EnhancedApplicationTimeline';
import { PageLayoutSkeleton, ApplicationCardSkeleton } from '../../../components/Skeleton';
import ProceedingsForm from '../../../components/ProceedingsForm';
import { RichTextDisplay } from '../../../components/RichTextDisplay';
import { getApplicationByApplicationId } from '../../../services/sidebarApiCalls';
import { truncateFilename } from '../../../utils/string';
import { useSidebarCounts } from '../../../hooks/useSidebarCounts';
import QRCodeDisplay from '../../../components/QRCodeDisplay';
import { useGlobalAction } from '../../../context/GlobalActionContext';

// --- Small UI formatting helpers to present user-readable data ---
const humanize = (val?: any) => {
  if (val === null || val === undefined) return '—';
  const s = String(val);
  if (!s) return '—';
  return s
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

const formatGender = (g?: string) => {
  if (!g) return '—';
  const s = String(g).trim().toLowerCase();
  if (s === 'm' || s === 'male') return 'Male';
  if (s === 'f' || s === 'female') return 'Female';
  if (s === 'o' || s === 'other') return 'Other';
  return humanize(s);
};

const formatStatusLabel = (statusOrObj?: any) => {
  if (!statusOrObj) return '—';
  if (typeof statusOrObj === 'string' || typeof statusOrObj === 'number')
    return humanize(statusOrObj);
  // If object with name property (workflowStatus), use that
  if (statusOrObj.name) return humanize(statusOrObj.name);
  return humanize(JSON.stringify(statusOrObj));
};

const formatApplicationType = (t?: any) => {
  if (!t) return 'Fresh License';
  const map: Record<string, string> = {
    fresh: 'Fresh License',
    renewal: 'Renewal',
    duplicate: 'Duplicate',
  };
  const key = String(t).trim().toLowerCase();
  return map[key] || humanize(key);
};

const formatPhone = (p?: string) => {
  if (!p) return '—';
  const digits = String(p).replace(/[^0-9+]/g, '');
  if (digits.length >= 10 && digits.length <= 13) {
    return digits.replace(/(\+?\d{0,3})(\d{3})(\d{3})(\d{2,4})/, (m, c1, a, b, c) => {
      return [c1, a, b, c].filter(Boolean).join(' ');
    });
  }
  return p;
};

interface ApplicationDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ApplicationDetailPage({ params }: ApplicationDetailPageProps) {
  const { isAuthenticated, user, userRole, isLoading: authLoading } = useAuthSync();
  const router = useRouter();
  const { setShowHeader, setShowSidebar } = useLayout();
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isForwarding, setIsForwarding] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const [selectedAction, setSelectedAction] = useState<
    | 'approve'
    | 'reject'
    | 'return'
    | 'flag'
    | 'dispose'
    | 'recommend'
    | 'not-recommend'
    | 're-enquiry'
  >('approve');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationDetails, setConfirmationDetails] = useState({
    title: '',
    message: '',
    actionButtonText: '',
    actionButtonColor: '',
    onConfirm: () => {},
  });

  const [showProceedingsModal, setShowProceedingsModal] = useState(false);
  const [showProceedingsForm, setShowProceedingsForm] = useState(true);
  const [showTimelineDetails, setShowTimelineDetails] = useState(false);
  const [timelineDetails, setTimelineDetails] = useState({
    user1: false,
    user2: false,
    user3: false,
  });
  const [expandedHistory, setExpandedHistory] = useState<Record<number, boolean>>({});
  const printRef = useRef<HTMLDivElement>(null);
  const [dividerPosition, setDividerPosition] = useState(66.66); // Left section percentage (2 of 3 columns)
  const [isDragging, setIsDragging] = useState(false);
  const dividerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use sidebar counts hook here so we can trigger an immediate refresh
  // after actions that move an application between inbox buckets.
  const { refreshCounts } = useSidebarCounts(true);
  const { executeAction, setActiveNavigationPath } = useGlobalAction();

  // Open attachments from history with a robust viewer (PDF/image) in a new tab
  const openAttachment = (att: any) => {
    try {
      const rawUrl = typeof att?.url === 'string' ? att.url : '';
      const fileName = att?.name || 'attachment';
      if (!rawUrl) return;

      const isHttpUrl = /^https?:\/\//i.test(rawUrl) || rawUrl.startsWith('/');
      const isDataUrl = rawUrl.startsWith('data:');

      // Helper: open a blob/content in a simple viewer HTML
      const openInViewer = (objectUrl: string, contentType: string) => {
        const viewer = window.open('', '_blank');
        if (!viewer) {
          // Popup blocked -> download
          const a = document.createElement('a');
          a.href = objectUrl;
          a.download = fileName;
          a.rel = 'noopener';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          return;
        }
        const isPdf = /pdf/i.test(contentType);
        const isImage = /^image\//i.test(contentType);
        const isHtml = /html|text\//i.test(contentType) || fileName.toLowerCase().endsWith('.html');
        const safeTitle = fileName.replace(/</g, '&lt;').replace(/>/g, '&gt;');

        let body = '';
        if (isPdf) {
          body =
            `<object data="${objectUrl}" type="application/pdf" style="width:100%;height:100vh;">` +
            `<p>PDF preview unavailable. <a href="${objectUrl}" target="_self" download="${safeTitle}">Download ${safeTitle}</a></p>` +
            `</object>`;
        } else if (isImage) {
          body = `<img src="${objectUrl}" alt="${safeTitle}" style="max-width:100%;height:auto;display:block;margin:0 auto;padding:16px;" />`;
        } else if (isHtml || contentType.includes('plain')) {
          // For ground reports and HTML content, try to render as iframe
          body = `<iframe src="${objectUrl}" style="width:100%;height:100vh;border:none;"></iframe>
                  <div style="position:fixed;bottom:20px;right:20px;">
                    <a href="${objectUrl}" target="_self" download="${safeTitle}" style="padding:10px 20px;background:#3b82f6;color:white;text-decoration:none;border-radius:6px;">Download</a>
                  </div>`;
        } else {
          body = `<div style="padding:16px;font-family:system-ui,Segoe UI,Arial;">
             <p>Preview not supported for this file type (${contentType}).</p>
             <a href="${objectUrl}" target="_self" download="${safeTitle}">Download ${safeTitle}</a>
           </div>`;
        }

        viewer.document.open();
        viewer.document.write(
          `<!DOCTYPE html><html><head><meta charset="utf-8" /><title>${safeTitle}</title><style>body{margin:0;padding:0;}</style></head><body style="margin:0;">${body}</body></html>`
        );
        viewer.document.close();
      };

      if (isHttpUrl) {
        // Let browser handle http(s) directly (respecting Content-Disposition)
        const win = window.open(rawUrl, '_blank', 'noopener');
        if (!win) {
          const a = document.createElement('a');
          a.href = rawUrl;
          a.download = fileName;
          a.rel = 'noopener';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
        return;
      }

      // Build Blob from data URL or bare base64
      let base64Data = '';
      // Infer content type from name if not provided
      let contentType =
        att?.contentType ||
        (() => {
          const lower = (fileName || '').toLowerCase();
          if (lower.endsWith('.pdf')) return 'application/pdf';
          if (lower.endsWith('.png')) return 'image/png';
          if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
          if (lower.endsWith('.gif')) return 'image/gif';
          if (lower.endsWith('.svg')) return 'image/svg+xml';
          if (lower.endsWith('.txt')) return 'text/plain';
          return 'application/octet-stream';
        })();
      if (isDataUrl) {
        const match = rawUrl.match(/^data:([^;]+);base64,(.*)$/i);
        if (match) {
          contentType = match[1] || contentType;
          base64Data = match[2] || '';
        } else {
          // Non-base64 data URL; open as-is
          const win = window.open(rawUrl, '_blank', 'noopener');
          if (!win) {
            const a = document.createElement('a');
            a.href = rawUrl;
            a.download = fileName;
            a.rel = 'noopener';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }
          return;
        }
      } else {
        // Bare base64 string; normalize URL-safe base64 and pad
        base64Data = rawUrl;
      }

      // Normalize base64 (URL-safe -> standard) and remove whitespace
      let normalized = (base64Data || '').replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
      const padding = normalized.length % 4;
      if (padding) normalized += '='.repeat(4 - padding);

      // Decode base64 to Blob
      const byteChars = atob(normalized);
      const len = byteChars.length;
      const u8 = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        u8[i] = byteChars.charCodeAt(i);
      }
      const blob = new Blob([u8.buffer], { type: contentType });
      const blobUrl = URL.createObjectURL(blob);
      openInViewer(blobUrl, contentType);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (e) {
      // Last-resort message
      alert('Unable to preview file. It may still be downloadable from the history.');
    }
  };

  // Handle params Promise for React 18 compatibility
  useEffect(() => {
    params.then(resolvedParams => {
      setApplicationId(resolvedParams.id);
    });
  }, [params]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Show header and sidebar like other pages (Settings, etc.)
  useEffect(() => {
    setShowHeader(true);
    setShowSidebar(false); // Hide sidebar on Application Details page

    // Cleanup: reset sidebar visibility when leaving this page
    return () => {
      setShowSidebar(true);
    };
  }, [setShowHeader, setShowSidebar]);

  useEffect(() => {
    // Fetch application using shared service which maps workflow history correctly
    const fetchApplication = async () => {
      setLoading(true);
      try {
        const result = await getApplicationByApplicationId(applicationId!);
        if (result) {
          setApplication(result as ApplicationData);
        } else {
          setApplication(null);
        }
      } catch (error) {
        setApplication(null);
      } finally {
        setLoading(false);
      }
    };

    if (applicationId) {
      fetchApplication();
    }
  }, [applicationId]);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Clear error message after 5 seconds
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const handleSearch = (query: string) => {
    // Navigate back to main page with search query
    router.push(`/?search=${encodeURIComponent(query)}`);
  };

  const handleDateFilter = (startDate: string, endDate: string) => {
    // Navigate back to main page with date filters
    router.push(`/?startDate=${startDate}&endDate=${endDate}`);
  };
  const handleReset = () => {
    // Navigate back to main page with no filters
    router.push('/');
  };

  // Accepts either a status string or a numeric statusId and returns
  // Tailwind classes for the badge. We coerce the input to string to
  // make the helper robust when application stores numeric status ids.
  const getStatusBadgeClass = (status?: string | number) => {
    const raw = status ?? '';
    const s = String(raw).toLowerCase();
    switch (s) {
      case 'forwarded':
      case 'forwarded'.toString():
        return 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm';
      case 'approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm';
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200 shadow-sm';
      case 'returned':
        return 'bg-orange-50 text-orange-700 border-orange-200 shadow-sm';
      case 'red-flagged':
      case 'redflagged':
      case 'red_flagged':
        return 'bg-red-50 text-red-700 border-red-200 shadow-sm';
      case 'disposed':
        return 'bg-slate-50 text-slate-700 border-slate-200 shadow-sm';
      default:
        // Unknown status (including numeric ids we don't explicitly map)
        // fall back to neutral styling.
        return 'bg-slate-50 text-slate-700 border-slate-200 shadow-sm';
    }
  };
  const handleProcessApplication = async (action: string, reason: string) => {
    if (!application) return;

    const actionId = `process-application-${application.id}`;

    const result = await executeAction(actionId, async () => {
      setIsProcessing(true);

      try {
        // In a real app, this would be an API call
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // For now, we'll just update the local state to simulate the change
        const updatedApplication = { ...application };

        switch (action) {
          case 'approve':
            updatedApplication.status = 'approved';
            setSuccessMessage('Application has been approved successfully');
            break;
          case 'reject':
            updatedApplication.status = 'rejected';
            setSuccessMessage('Application has been rejected');
            break;
          case 'return':
            updatedApplication.status = 'returned';
            updatedApplication.returnReason = reason;
            setSuccessMessage('Application has been returned to the applicant');
            break;
          case 'flag':
            updatedApplication.status = 'red-flagged';
            updatedApplication.flagReason = reason;
            setSuccessMessage('Application has been red-flagged');
            break;
          case 'dispose':
            updatedApplication.status = 'disposed';
            updatedApplication.disposalReason = reason;
            setSuccessMessage('Application has been disposed');
            break;
          case 'recommend':
            // In a real app, this would change the status differently based on the role
            updatedApplication.status = 'pending';
            setSuccessMessage('Application has been recommended for approval');
            break;
          case 'not-recommend':
            // In a real app, this would change the status differently based on the role
            updatedApplication.status = 'pending';
            setSuccessMessage('Application has been marked as not recommended');
            break;
          case 're-enquiry':
            updatedApplication.status = 'pending';
            setSuccessMessage('Application has been marked for re-enquiry');
            break;
        }

        updatedApplication.lastUpdated = new Date().toISOString().split('T')[0];
        setApplication(updatedApplication);
        setIsProcessModalOpen(false);

        // Trigger an immediate sidebar counts refresh so the UI updates
        try {
          refreshCounts(true);
        } catch (e) {
          /* ignore */
        }

        // Navigate to inbox/forwarded after successful processing
        setActiveNavigationPath('/inbox/forwarded');
        await router.push('/inbox/forwarded');
      } catch (error) {
        setErrorMessage('Failed to process application. Please try again.');
        throw error;
      } finally {
        setIsProcessing(false);
      }
    });

    if (result === null) return; // action was blocked as duplicate
  };
  const handleForwardApplication = async (recipient: string, comments: string) => {
    if (!application) return;

    const actionId = `forward-application-${application.id}`;

    const result = await executeAction(actionId, async () => {
      setIsForwarding(true);

      try {
        // In a real app, this would be an API call
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        const updatedApplication = { ...application };
        updatedApplication.forwardedFrom = userRole;
        updatedApplication.forwardedTo = recipient;
        updatedApplication.forwardComments = comments; // Store comments
        updatedApplication.lastUpdated = new Date().toISOString().split('T')[0];

        setApplication(updatedApplication);
        setIsForwardModalOpen(false);
        setSuccessMessage(`Application has been forwarded to ${recipient}`);
        // Trigger an immediate sidebar counts refresh so the UI updates
        try {
          refreshCounts(true);
        } catch (e) {
          /* ignore */
        }

        // Navigate to inbox/forwarded after successful forwarding
        setActiveNavigationPath('/inbox/forwarded');
        await router.push('/inbox/forwarded');
      } catch (error) {
        setErrorMessage('Failed to forward application. Please try again.');
        throw error;
      } finally {
        setIsForwarding(false);
      }
    });

    if (result === null) return; // action was blocked as duplicate
  };

  // Enhanced print function using our PDF utility
  const handleExportPDF = async () => {
    if (!application) return;

    try {
      setIsPrinting(true);
      // Generate and download the PDF
      // TODO: Fix PDF generation with correct ApplicationData interface
      // await generateApplicationPDF(application);
      setSuccessMessage('PDF generation feature temporarily disabled');
    } catch (error) {
      setErrorMessage('Failed to generate PDF. Please try again.');
    } finally {
      setIsPrinting(false);
      setShowPrintOptions(false);
    }
  };

  // Print attached documents (not UI chrome). Excludes processing UI; includes application history.
  const handleBrowserPrint = () => {
    if (!application) {
      alert('No application loaded to print.');
      return;
    }

    try {
      // Collect attachments from top-level `documents` (UI) and workflow histories
      const attachments: Array<any> = [];
      if ((application as any).documents && Array.isArray((application as any).documents)) {
        attachments.push(...(application as any).documents);
      }
      // Backwards-compat: accept `attachments` field if present
      if ((application as any).attachments && Array.isArray((application as any).attachments)) {
        attachments.push(...(application as any).attachments);
      }
      if (
        (application as any).workflowHistories &&
        Array.isArray((application as any).workflowHistories)
      ) {
        (application as any).workflowHistories.forEach((h: any) => {
          if (h.attachments && Array.isArray(h.attachments)) attachments.push(...h.attachments);
        });
      }

      if (attachments.length === 0) {
        // If there are no attachments, still provide history-only printable document
        if (!confirm('No attached documents found. Print application history only?')) {
          setShowPrintOptions(false);
          return;
        }
      }

      // Build application header
      const appTitle = `Application ${String(application.id)}`;
      const applicantName =
        (application as any).applicantName || (application as any).fullName || '';

      // Build history HTML
      let historyHtml = '';
      if (
        (application as any).workflowHistories &&
        Array.isArray((application as any).workflowHistories)
      ) {
        historyHtml += `<section class="history"><h2>Application History</h2>`;
        historyHtml += `<ol class="history-list">`;
        (application as any).workflowHistories.forEach((h: any) => {
          const when = h?.createdAt || h?.date || '';
          const who = h?.performedBy || h?.user || h?.actor || '';
          const action = h?.action || h?.status || '';
          const comment = h?.comments || h?.comment || h?.notes || '';
          historyHtml += `<li class="history-item"><div class="meta"><div class="when">${String(when)}</div><div class="who">${String(who)}</div><div class="action">${String(action)}</div></div>`;
          if (comment) historyHtml += `<div class="comment">${String(comment)}</div>`;
          historyHtml += `</li>`;
        });
        historyHtml += `</ol></section>`;
      }

      // Build attachments HTML — each attachment on its own page-break block
      let attachmentsHtml = '';
      attachments.forEach((att: any, idx: number) => {
        const name = att?.name || att?.fileName || `attachment-${idx + 1}`;
        const url = att?.url || att?.path || att?.downloadUrl;
        const type = att?.contentType || att?.mime || '';
        if (!url) return;

        // Normalize a human friendly label for the document type/category
        const label = (att?.type || att?.category || '').toString();
        attachmentsHtml += `<section class="doc-block" data-attachment-index="${idx}">
            <h3 class="doc-title">${String(name)}</h3>
            ${label ? `<div class="doc-label" style="font-size:12px;color:#374151;margin-bottom:6px;">${label.toUpperCase()}</div>` : ''}`;

        // Embed PDFs and other embeddable types using object/iframe; images with img tag
        if (/pdf/i.test(type) || name.toLowerCase().endsWith('.pdf')) {
          attachmentsHtml += `<object data="${url}" type="application/pdf" class="embedded-doc">`;
          attachmentsHtml += `<p>Unable to display PDF. <a href="${url}" target="_blank" rel="noopener">Open or download</a></p>`;
          attachmentsHtml += `</object>`;
        } else if (/^image\//i.test(type) || /\.(png|jpe?g|gif|svg)$/i.test(name)) {
          attachmentsHtml += `<img src="${url}" alt="${String(name)}" class="embedded-image" />`;
        } else {
          // Fallback: provide a download link and attempt iframe
          attachmentsHtml += `<iframe src="${url}" class="embedded-doc-iframe"></iframe>`;
          attachmentsHtml += `<p><a href="${url}" target="_blank" rel="noopener">Open ${String(name)}</a></p>`;
        }

        attachmentsHtml += `</section>`;
      });

      // Compose full HTML for the print window — styled to match the public application page
      const statusLabel = formatStatusLabel(
        (application as any).workflowStatus || (application as any).status
      );
      const html = `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <title>${appTitle} - Documents</title>
          <style>
            html,body{height:100%;}
            body{font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial; color:#111; margin:0; background:#f8fafc}
            .page{max-width:900px;margin:24px auto;background:#fff;border:1px solid #e6eef8;border-radius:10px;overflow:hidden}
            .print-header{background:#001F54;color:#fff;padding:20px 24px;display:flex;justify-content:space-between;align-items:center}
            .brand{display:flex;gap:12px;align-items:center}
            .brand .logo{width:44px;height:44px;background:rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:center;border-radius:8px}
            .brand h1{margin:0;font-size:18px}
            .brand p{margin:0;font-size:12px;opacity:0.9}
            .status-badge{background:#fff;color:#001F54;padding:6px 12px;border-radius:999px;font-weight:600;font-size:13px}
            .content{padding:20px 28px}
            .card{background:#fff;padding:18px;border-radius:8px;border:1px solid #eef2f7;margin-bottom:18px}
            .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
            .photo{width:140px;height:180px;object-fit:cover;border:1px solid #e6eef8;border-radius:6px}
            h2{font-size:16px;margin:0 0 8px}
            .muted{color:#6b7280;font-size:13px}
            .label{font-size:12px;color:#6b7280}
            .value{font-weight:600;color:#111}
            .documents{margin-top:8px}
            .doc-item{padding:12px;border:1px solid #eef2f7;border-radius:8px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center}
            .doc-meta{display:flex;gap:12px;align-items:center}
            .doc-type{font-size:12px;color:#065f46;font-weight:700}
            .doc-name{font-size:13px;color:#0f172a}
            .doc-actions button{margin-left:8px;padding:8px 12px;border-radius:6px;border:1px solid #e6eef8;background:#fff;cursor:pointer}
            .history{margin-top:12px}
            .history-item{padding:12px;border-left:4px solid #e6eef8;background:#fbfdff;margin-bottom:8px;border-radius:4px}
            .history-meta{display:flex;gap:12px;color:#374151;font-size:13px}
            @media print{ body{background:#fff} .print-header{page-break-after:avoid} .doc-item{page-break-inside:avoid} .history-item{page-break-inside:avoid} }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="print-header">
              <div class="brand">
                <div class="logo">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C7.03 2 3 6.03 3 11c0 5.86 5.06 10.48 9 11 3.94-.52 9-5.14 9-11 0-4.97-4.03-9-9-9z" stroke="#fff" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </div>
                <div>
                  <h1>Arms License Application</h1>
                  <p>Public / Official Printout</p>
                </div>
              </div>
              <div class="status-badge">${String(statusLabel).toUpperCase()}</div>
            </div>

            <div class="content">
              <div class="card">
                <div style="display:flex;gap:18px;align-items:flex-start">
                  <div style="flex:1">
                    <div style="display:flex;justify-content:space-between;align-items:center">
                      <div>
                        <div class="label">Application ID</div>
                        <div class="value">${String((application as any).id || applicationId || (application as any).applicationId || '')}</div>
                      </div>
                      <div style="text-align:right">
                        ${(application as any).acknowledgementNo || (application as any).acknowledgement_no ? `<div class="label">Acknowledgement No.</div><div class="value">${String((application as any).acknowledgementNo || (application as any).acknowledgement_no)}</div>` : ''}
                      </div>
                    </div>

                    <h2 style="margin-top:12px">Applicant Information</h2>
                    <div class="grid" style="grid-template-columns:2fr 140px;">
                      <div>
                        <div class="label">Full Name</div>
                        <div class="value">${String(applicantName || (application as any).applicantName || '')}</div>
                        <div style="height:8px"></div>
                        <div class="label">Date of Birth</div>
                        <div class="value">${String((application as any).dateOfBirth || (application as any).dob || '')}</div>
                        <div style="height:8px"></div>
                        <div class="label">Gender</div>
                        <div class="value">${String((application as any).sex || (application as any).gender || '')}</div>
                      </div>
                      <div style="text-align:right">
                        ${(application as any).photoUrl || (application as any).photo ? `<img src="${(application as any).photoUrl || (application as any).photo}" class="photo"/>` : `<div class="photo" style="display:flex;align-items:center;justify-content:center;color:#9ca3af;background:#f3f4f6">No Photo</div>`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="card">
                <h2>Documents Uploaded</h2>
                <div class="documents">
                  ${attachmentsHtml || '<div class="muted">No documents uploaded</div>'}
                </div>
              </div>

              <div class="card">
                <h2>Application History</h2>
                <div class="history">
                  ${historyHtml || '<div class="muted">No history available</div>'}
                </div>
              </div>

              <div style="text-align:center;margin-top:12px;color:#6b7280;font-size:12px">Generated: ${new Date().toLocaleString()}</div>

              <div style="margin-top:18px;text-align:center;">
                <button onclick="window.print();" style="padding:8px 14px;margin-right:8px;border-radius:6px;border:1px solid #e6eef8;background:#fff">Print</button>
                <button onclick="window.close();" style="padding:8px 14px;border-radius:6px;border:1px solid #e6eef8;background:#fff">Close</button>
              </div>
            </div>
          </div>
          <script>
            function tryPrint(){ try{ window.focus(); window.print(); }catch(e){} }
            window.addEventListener('load', function(){ setTimeout(tryPrint, 500); });
          </script>
        </body>
      </html>`;

      const w = window.open('', '_blank');
      if (!w) {
        alert('Popup blocked. Please allow popups for this site to print documents.');
        setShowPrintOptions(false);
        return;
      }

      w.document.open();
      w.document.write(html);
      w.document.close();

      setShowPrintOptions(false);
    } catch (err) {
      console.error('Print failed', err);
      // Fallback: inform user and do not print the UI
      alert('Unable to produce printable document. Please try downloading attachments manually.');
      setShowPrintOptions(false);
    }
  };

  // Handle divider drag start
  const handleDividerMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };

  // Handle divider dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const newPosition = ((e.clientX - rect.left) / rect.width) * 100;

      // Constrain position between 40% and 80%
      if (newPosition >= 40 && newPosition <= 80) {
        setDividerPosition(newPosition);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleProceedingsSuccess = (message?: string) => {
    setShowProceedingsForm(false);
    setSuccessMessage(message || 'Proceedings action completed successfully');

    // Reload the application data to get the latest workflow history
    if (applicationId) {
      getApplicationByApplicationId(applicationId!)
        .then(result => {
          if (result) {
            setApplication(result as ApplicationData);
          }
        })
        .catch(error => {
          // Error reloading application
        });
    }
    // Refresh sidebar counts as proceedings may change bucket counts
    try {
      refreshCounts(true);
    } catch (e) {
      /* ignore */
    }

    // Redirect to inbox/forwarded after successful proceedings action
    setTimeout(() => {
      router.push('/inbox/forwarded');
    }, 2000);
  };

  // Show skeleton loading while authenticating or loading data
  if (authLoading || loading) {
    return <PageLayoutSkeleton />;
  }
  if (!isAuthenticated) {
    // Optionally, you can return null or a redirect message
    return null;
  }

  return (
    <div className='flex flex-col min-h-screen w-full bg-gray-50 font-[family-name:var(--font-geist-sans)]'>
      {/* Custom Header with Breadcrumb, Title and Status */}
      <header className='fixed top-0 left-0 right-0 bg-[#001F54] shadow-lg z-10'>
        <div className='px-6 py-4'>
          {/* Title and Status Row */}
          <div className='flex items-center justify-between'>
            <nav className='mb-2' aria-label='Breadcrumb'>
              <ol className='flex items-center space-x-2 text-sm'>
                <li>
                  <button
                    onClick={() => router.push('/inbox/forwarded')}
                    className='text-white text-opacity-70 hover:text-opacity-100 transition-colors'
                  >
                    Home
                  </button>
                </li>
                <li className='text-white text-opacity-50'>/</li>
                <li>
                  <span className='text-white text-opacity-70'>Application Details</span>
                </li>
                <li className='text-white text-opacity-50'>/</li>
                <li>
                  <span className='font-medium text-white'>
                    Application ID: {applicationId || '...'}
                  </span>
                </li>
              </ol>
            </nav>
            {/* Current Status */}
            <div className='flex items-center space-x-3'>
              <div className='flex items-center space-x-2 bg-white bg-opacity-10 rounded-lg px-4 py-2'>
                <div className='w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center'>
                  <svg
                    className='w-5 h-5 text-white'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                </div>
                <div>
                  <span
                    className={`inline-block px-3 py-1 text-sm font-semibold rounded-full border ${getStatusBadgeClass(
                      application ? (application.status ?? application.status_id) : undefined
                    )}`}
                  >
                    {application
                      ? formatStatusLabel(
                          application.workflowStatus || application.status || application.status_id
                        )
                      : 'Loading'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className='flex-1 p-6 overflow-y-auto mt-[120px]'>
        <div className='bg-white rounded-lg shadow'>
          {/* Success Message - Fixed Position at Top */}
          {successMessage && (
            <div className='fixed top-4 right-4 z-50 max-w-md animate-slide-in'>
              <div className='p-4 bg-emerald-50 border-2 border-emerald-500 rounded-xl shadow-lg'>
                <div className='flex items-start'>
                  <div className='flex-shrink-0'>
                    <svg
                      className='w-6 h-6 text-emerald-500'
                      fill='currentColor'
                      viewBox='0 0 20 20'
                    >
                      <path
                        fillRule='evenodd'
                        d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                        clipRule='evenodd'
                      />
                    </svg>
                  </div>
                  <div className='ml-3 flex-1'>
                    <h3 className='text-sm font-bold text-emerald-900'>Success!</h3>
                    <p className='text-sm font-medium text-emerald-800 mt-1'>{successMessage}</p>
                  </div>
                  <button
                    onClick={() => setSuccessMessage(null)}
                    className='ml-3 flex-shrink-0 text-emerald-500 hover:text-emerald-700'
                  >
                    <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
                      <path
                        fillRule='evenodd'
                        d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
                        clipRule='evenodd'
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error Message - Fixed Position at Top */}
          {errorMessage && (
            <div className='fixed top-4 right-4 z-50 max-w-md animate-slide-in'>
              <div className='p-4 bg-red-50 border-2 border-red-500 rounded-xl shadow-lg'>
                <div className='flex items-start'>
                  <div className='flex-shrink-0'>
                    <svg className='w-6 h-6 text-red-500' fill='currentColor' viewBox='0 0 20 20'>
                      <path
                        fillRule='evenodd'
                        d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                        clipRule='evenodd'
                      />
                    </svg>
                  </div>
                  <div className='ml-3 flex-1'>
                    <h3 className='text-sm font-bold text-red-900'>Error!</h3>
                    <p className='text-sm font-medium text-red-800 mt-1'>{errorMessage}</p>
                  </div>
                  <button
                    onClick={() => setErrorMessage(null)}
                    className='ml-3 flex-shrink-0 text-red-500 hover:text-red-700'
                  >
                    <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
                      <path
                        fillRule='evenodd'
                        d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
                        clipRule='evenodd'
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Application Content Card */}
        <div
          data-printable='application-card'
          className='bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden avoid-break'
        >
          {(() => {
            return application;
          })() ? (
            <>
              {/* Applicant Information Block */}
              <div className='p-6 lg:p-8' ref={printRef}>
                <div className='mb-8'>
                  <h2 className='text-xl font-bold text-gray-900 mb-6 flex items-center justify-between'>
                    <span className='flex items-center'>
                      <div className='w-1 h-6 bg-blue-600 rounded-full mr-3'></div>
                      Applicant Information
                    </span>
                    <div className='flex items-center space-x-2'>
                      <button
                        type='button'
                        onClick={() => handleBrowserPrint()}
                        className='inline-flex items-center px-3 py-1.5 bg-white text-[#001F54] border border-gray-200 rounded-md shadow-sm text-sm hover:bg-gray-50'
                        title='Print application details'
                      >
                        Print
                      </button>
                    </div>
                  </h2>

                  <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                    {/* Main details - left (spans 2/3) */}
                    <div className='lg:col-span-2'>
                      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6'>
                        {/* Full Name - Spans full width of this column set */}
                        <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow md:col-span-2'>
                          <p className='text-sm text-gray-500 font-medium mb-1'>Full Name</p>
                          <p className='font-semibold text-gray-900'>
                            {[
                              application?.firstName,
                              application?.middleName,
                              application?.lastName,
                            ]
                              .filter(Boolean)
                              .join(' ') ||
                              application?.applicantName ||
                              'N/A'}
                          </p>
                        </div>

                        {application?.parentOrSpouseName && (
                          <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow'>
                            <p className='text-sm text-gray-500 font-medium mb-1'>
                              Parent/Spouse Name
                            </p>
                            <p className='font-semibold text-gray-900'>
                              {application.parentOrSpouseName}
                            </p>
                          </div>
                        )}

                        {application?.sex && (
                          <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow'>
                            <p className='text-sm text-gray-500 font-medium mb-1'>Gender</p>
                            <p className='font-semibold text-gray-900'>
                              {formatGender(application.sex)}
                            </p>
                          </div>
                        )}

                        {application?.placeOfBirth && (
                          <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow'>
                            <p className='text-sm text-gray-500 font-medium mb-1'>Place of Birth</p>
                            <p className='font-semibold text-gray-900'>
                              {application.placeOfBirth}
                            </p>
                          </div>
                        )}

                        {(application?.dateOfBirth || application?.dob) && (
                          <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow md:col-span-2'>
                            <p className='text-sm text-gray-500 font-medium mb-1'>Date of Birth</p>
                            <p className='font-semibold text-gray-900'>
                              {application?.dateOfBirth
                                ? new Date(application.dateOfBirth).toLocaleDateString('en-IN', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                  })
                                : application?.dob
                                  ? new Date(application.dob).toLocaleDateString('en-IN', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                    })
                                  : 'N/A'}
                            </p>
                            {application?.dobInWords && (
                              <p className='text-xs text-gray-500 mt-1 italic'>
                                {application.dobInWords}
                              </p>
                            )}
                          </div>
                        )}

                        {application?.panNumber && (
                          <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow'>
                            <p className='text-sm text-gray-500 font-medium mb-1'>PAN Number</p>
                            <p className='font-semibold text-gray-900 font-mono'>
                              {application.panNumber}
                            </p>
                          </div>
                        )}

                        {application?.aadharNumber && (
                          <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow'>
                            <p className='text-sm text-gray-500 font-medium mb-1'>Aadhar Number</p>
                            <p className='font-semibold text-gray-900 font-mono'>
                              {application.aadharNumber}
                            </p>
                          </div>
                        )}

                        {application?.acknowledgementNo && (
                          <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow md:col-span-2'>
                            <p className='text-sm text-gray-500 font-medium mb-1'>
                              Acknowledgement Number
                            </p>
                            <p className='font-semibold text-gray-900 font-mono'>
                              {application.acknowledgementNo}
                            </p>
                          </div>
                        )}

                        {application?.currentUser && (
                          <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow md:col-span-2'>
                            <p className='text-sm text-gray-500 font-medium mb-1'>Current User</p>
                            <p className='font-semibold text-gray-900'>
                              {application.currentUser.username}
                            </p>
                          </div>
                        )}

                        {application?.workflowStatus && (
                          <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow md:col-span-2'>
                            <p className='text-sm text-gray-500 font-medium mb-1'>
                              Workflow Status
                            </p>
                            <p className='font-semibold text-gray-900'>
                              {formatStatusLabel(application.workflowStatus)}
                            </p>
                          </div>
                        )}

                        <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow md:col-span-2'>
                          <p className='text-sm text-gray-500 font-medium mb-1'>Application Type</p>
                          <p className='font-semibold text-gray-900'>
                            {formatApplicationType(application?.applicationType)}
                          </p>
                        </div>

                        <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow md:col-span-2'>
                          <p className='text-sm text-gray-500 font-medium mb-1'>
                            Date & Time of Submission
                          </p>
                          <p className='font-semibold text-gray-900'>
                            {application?.applicationDate
                              ? new Date(application.applicationDate).toLocaleString('en-IN', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right-side card - photo in top-right and form-like summary */}
                    <aside className='lg:col-span-1 border border-gray-200 rounded-xl p-4 bg-gray-50 shadow-sm h-fit'>
                      <div className='ml-2 '>
                        <img
                          src={(application as any)?.photoUrl as string}
                          alt='Applicant Photo'
                          className='w-60 h-60 object-cover rounded-md border'
                        />
                      </div>

                      {/* QR Code Section - Only visible to ZS role */}
                      {application && (
                        <div className='mt-4'>
                          <QRCodeDisplay applicationId={application.id} userRole={userRole} />
                        </div>
                      )}

                      {/* Profile summary - compact, printable */}
                      <div className='mt-6 bg-white rounded-lg p-4 border border-gray-100'>
                        <h3 className='text-sm font-semibold text-gray-700 mb-3'>Profile</h3>
                        <dl className='grid grid-cols-1 gap-y-2 text-sm text-gray-700'>
                          <div className='flex justify-between'>
                            <dt className='text-gray-500'>Application ID</dt>
                            <dd className='font-medium'>
                              {application?.id || applicationId || '—'}
                            </dd>
                          </div>
                          <div className='flex justify-between'>
                            <dt className='text-gray-500'>Name</dt>
                            <dd className='font-medium'>
                              {[
                                application?.firstName,
                                application?.middleName,
                                application?.lastName,
                              ]
                                .filter(Boolean)
                                .join(' ') ||
                                application?.applicantName ||
                                '—'}
                            </dd>
                          </div>
                          {application?.parentOrSpouseName && (
                            <div className='flex justify-between'>
                              <dt className='text-gray-500'>Parent / Spouse</dt>
                              <dd className='font-medium'>{application.parentOrSpouseName}</dd>
                            </div>
                          )}
                          {application?.mobileNumber && (
                            <div className='flex justify-between'>
                              <dt className='text-gray-500'>Mobile</dt>
                              <dd className='font-medium'>
                                {formatPhone(application.mobileNumber)}
                              </dd>
                            </div>
                          )}
                          {application?.email && (
                            <div className='flex justify-between'>
                              <dt className='text-gray-500'>Email</dt>
                              <dd className='font-medium truncate'>{application.email}</dd>
                            </div>
                          )}
                          {(application?.dateOfBirth || application?.dob) && (
                            <div className='flex justify-between'>
                              <dt className='text-gray-500'>DOB</dt>
                              <dd className='font-medium'>
                                {application?.dateOfBirth
                                  ? new Date(application.dateOfBirth).toLocaleDateString('en-IN')
                                  : application?.dob
                                    ? new Date(application.dob).toLocaleDateString('en-IN')
                                    : '—'}
                              </dd>
                            </div>
                          )}
                          {application?.sex && (
                            <div className='flex justify-between'>
                              <dt className='text-gray-500'>Gender</dt>
                              <dd className='font-medium'>{formatGender(application.sex)}</dd>
                            </div>
                          )}
                          {application?.aadharNumber && (
                            <div className='flex justify-between'>
                              <dt className='text-gray-500'>Aadhar</dt>
                              <dd className='font-medium font-mono'>{application.aadharNumber}</dd>
                            </div>
                          )}
                          {application?.panNumber && (
                            <div className='flex justify-between'>
                              <dt className='text-gray-500'>PAN</dt>
                              <dd className='font-medium font-mono'>{application.panNumber}</dd>
                            </div>
                          )}
                          {application?.presentAddress?.addressLine && (
                            <div className='flex justify-between'>
                              <dt className='text-gray-500'>Present Address</dt>
                              <dd className='font-medium text-right max-w-[220px] truncate'>
                                {application.presentAddress.addressLine}
                              </dd>
                            </div>
                          )}
                          {application?.permanentAddress?.addressLine && (
                            <div className='flex justify-between'>
                              <dt className='text-gray-500'>Permanent Address</dt>
                              <dd className='font-medium text-right max-w-[220px] truncate'>
                                {application.permanentAddress.addressLine}
                              </dd>
                            </div>
                          )}
                          {application?.occupationAndBusiness?.occupation && (
                            <div className='flex justify-between'>
                              <dt className='text-gray-500'>Occupation</dt>
                              <dd className='font-medium'>
                                {application.occupationAndBusiness.occupation}
                              </dd>
                            </div>
                          )}
                          {application?.applicationType && (
                            <div className='flex justify-between'>
                              <dt className='text-gray-500'>Application Type</dt>
                              <dd className='font-medium'>
                                {formatApplicationType(application.applicationType)}
                              </dd>
                            </div>
                          )}
                          {application?.applicationDate && (
                            <div className='flex justify-between'>
                              <dt className='text-gray-500'>Submitted</dt>
                              <dd className='font-medium'>
                                {new Date(application.applicationDate).toLocaleString('en-IN', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </dd>
                            </div>
                          )}
                          {application?.currentUser && (
                            <div className='flex justify-between'>
                              <dt className='text-gray-500'>Current Handler</dt>
                              <dd className='font-medium'>{application.currentUser.username}</dd>
                            </div>
                          )}
                          {application?.workflowStatus?.name && (
                            <div className='flex justify-between'>
                              <dt className='text-gray-500'>Status</dt>
                              <dd className='font-medium'>
                                {formatStatusLabel(application.workflowStatus)}
                              </dd>
                            </div>
                          )}
                        </dl>
                      </div>
                    </aside>
                  </div>
                </div>

                {/* Biometric section removed - photo moved to right-side summary card */}

                {/* Present Address Section */}
                {application?.presentAddress && (
                  <div className='mb-8'>
                    <h2 className='text-xl font-bold text-gray-900 mb-6 flex items-center'>
                      <div className='w-1 h-6 bg-purple-600 rounded-full mr-3'></div>
                      Present Address
                    </h2>
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
                      {application.presentAddress.addressLine && (
                        <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow md:col-span-2 lg:col-span-4'>
                          <p className='text-sm text-gray-500 font-medium mb-1'>Address</p>
                          <p className='font-semibold text-gray-900'>
                            {application.presentAddress.addressLine}
                          </p>
                        </div>
                      )}

                      {application.presentAddress.state && (
                        <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow'>
                          <p className='text-sm text-gray-500 font-medium mb-1'>State</p>
                          <p className='font-semibold text-gray-900'>
                            {application.presentAddress.state}
                          </p>
                        </div>
                      )}

                      {application.presentAddress.district && (
                        <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow'>
                          <p className='text-sm text-gray-500 font-medium mb-1'>District</p>
                          <p className='font-semibold text-gray-900'>
                            {application.presentAddress.district}
                          </p>
                        </div>
                      )}

                      {application.presentAddress.zone && (
                        <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow'>
                          <p className='text-sm text-gray-500 font-medium mb-1'>Zone</p>
                          <p className='font-semibold text-gray-900'>
                            {application.presentAddress.zone.name}
                          </p>
                        </div>
                      )}

                      {application.presentAddress.division && (
                        <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow'>
                          <p className='text-sm text-gray-500 font-medium mb-1'>Division</p>
                          <p className='font-semibold text-gray-900'>
                            {application.presentAddress.division.name}
                          </p>
                        </div>
                      )}

                      {application.presentAddress.policeStation && (
                        <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow md:col-span-2'>
                          <p className='text-sm text-gray-500 font-medium mb-1'>Police Station</p>
                          <p className='font-semibold text-gray-900'>
                            {application.presentAddress.policeStation.name}
                          </p>
                        </div>
                      )}

                      {application.presentAddress.sinceResiding && (
                        <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow md:col-span-2'>
                          <p className='text-sm text-gray-500 font-medium mb-1'>Residing Since</p>
                          <p className='font-semibold text-gray-900'>
                            {new Date(application.presentAddress.sinceResiding).toLocaleDateString(
                              'en-IN',
                              {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              }
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Permanent Address Section */}
                {application?.permanentAddress && (
                  <div className='mb-8'>
                    <h2 className='text-xl font-bold text-gray-900 mb-6 flex items-center'>
                      <div className='w-1 h-6 bg-indigo-600 rounded-full mr-3'></div>
                      Permanent Address
                    </h2>
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
                      {application.permanentAddress.addressLine && (
                        <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow md:col-span-2 lg:col-span-4'>
                          <p className='text-sm text-gray-500 font-medium mb-1'>Address</p>
                          <p className='font-semibold text-gray-900'>
                            {application.permanentAddress.addressLine}
                          </p>
                        </div>
                      )}

                      {application.permanentAddress.state && (
                        <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow'>
                          <p className='text-sm text-gray-500 font-medium mb-1'>State</p>
                          <p className='font-semibold text-gray-900'>
                            {application.permanentAddress.state}
                          </p>
                        </div>
                      )}

                      {application.permanentAddress.district && (
                        <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow'>
                          <p className='text-sm text-gray-500 font-medium mb-1'>District</p>
                          <p className='font-semibold text-gray-900'>
                            {application.permanentAddress.district}
                          </p>
                        </div>
                      )}

                      {application.permanentAddress.zone && (
                        <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow'>
                          <p className='text-sm text-gray-500 font-medium mb-1'>Zone</p>
                          <p className='font-semibold text-gray-900'>
                            {application.permanentAddress.zone.name}
                          </p>
                        </div>
                      )}

                      {application.permanentAddress.division && (
                        <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow'>
                          <p className='text-sm text-gray-500 font-medium mb-1'>Division</p>
                          <p className='font-semibold text-gray-900'>
                            {application.permanentAddress.division.name}
                          </p>
                        </div>
                      )}

                      {application.permanentAddress.policeStation && (
                        <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow md:col-span-2'>
                          <p className='text-sm text-gray-500 font-medium mb-1'>Police Station</p>
                          <p className='font-semibold text-gray-900'>
                            {application.permanentAddress.policeStation.name}
                          </p>
                        </div>
                      )}

                      {application.permanentAddress.sinceResiding && (
                        <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow md:col-span-2'>
                          <p className='text-sm text-gray-500 font-medium mb-1'>Residing Since</p>
                          <p className='font-semibold text-gray-900'>
                            {new Date(
                              application.permanentAddress.sinceResiding
                            ).toLocaleDateString('en-IN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Occupation & Business Section */}
                {application?.occupationAndBusiness && (
                  <div className='mb-8'>
                    <h2 className='text-xl font-bold text-gray-900 mb-6 flex items-center'>
                      <div className='w-1 h-6 bg-teal-600 rounded-full mr-3'></div>
                      Occupation & Business Details
                    </h2>
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
                      {application.occupationAndBusiness.occupation && (
                        <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow md:col-span-2'>
                          <p className='text-sm text-gray-500 font-medium mb-1'>Occupation</p>
                          <p className='font-semibold text-gray-900'>
                            {application.occupationAndBusiness.occupation}
                          </p>
                        </div>
                      )}

                      {application.occupationAndBusiness.officeAddress && (
                        <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow md:col-span-2'>
                          <p className='text-sm text-gray-500 font-medium mb-1'>Office Address</p>
                          <p className='font-semibold text-gray-900'>
                            {application.occupationAndBusiness.officeAddress}
                          </p>
                        </div>
                      )}

                      {application.occupationAndBusiness.state && (
                        <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow'>
                          <p className='text-sm text-gray-500 font-medium mb-1'>State</p>
                          <p className='font-semibold text-gray-900'>
                            {application.occupationAndBusiness.state.name}
                          </p>
                        </div>
                      )}

                      {application.occupationAndBusiness.district && (
                        <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow'>
                          <p className='text-sm text-gray-500 font-medium mb-1'>District</p>
                          <p className='font-semibold text-gray-900'>
                            {application.occupationAndBusiness.district.name}
                          </p>
                        </div>
                      )}

                      {application.occupationAndBusiness.cropLocation && (
                        <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow md:col-span-2'>
                          <p className='text-sm text-gray-500 font-medium mb-1'>Crop Location</p>
                          <p className='font-semibold text-gray-900'>
                            {application.occupationAndBusiness.cropLocation}
                          </p>
                        </div>
                      )}

                      {application.occupationAndBusiness.areaUnderCultivation && (
                        <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow md:col-span-2'>
                          <p className='text-sm text-gray-500 font-medium mb-1'>
                            Area Under Cultivation
                          </p>
                          <p className='font-semibold text-gray-900'>
                            {application.occupationAndBusiness.areaUnderCultivation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* License History Section */}
                {application?.licenseHistories && application.licenseHistories.length > 0 && (
                  <div className='mb-8'>
                    <h3 className='text-lg font-bold text-gray-900 mb-4 flex items-center'>
                      <div className='w-1 h-5 bg-cyan-600 rounded-full mr-3'></div>
                      License History
                    </h3>
                    <div className='space-y-4'>
                      {application.licenseHistories.map((license: any, idx: number) => (
                        <div
                          key={idx}
                          className='bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl p-6 shadow-sm'
                        >
                          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                            {license.hasAppliedBefore !== undefined && (
                              <div className='bg-white rounded-lg p-3'>
                                <p className='text-sm text-gray-500 font-medium mb-1'>
                                  Previously Applied
                                </p>
                                <p className='font-semibold text-gray-900'>
                                  {license.hasAppliedBefore ? 'Yes' : 'No'}
                                </p>
                              </div>
                            )}
                            {license.previousResult && (
                              <div className='bg-white rounded-lg p-3'>
                                <p className='text-sm text-gray-500 font-medium mb-1'>
                                  Previous Result
                                </p>
                                <p
                                  className={`font-semibold ${
                                    license.previousResult === 'APPROVED'
                                      ? 'text-green-600'
                                      : license.previousResult === 'REJECTED'
                                        ? 'text-red-600'
                                        : 'text-gray-900'
                                  }`}
                                >
                                  {license.previousResult}
                                </p>
                              </div>
                            )}
                            {license.previousAuthorityName && (
                              <div className='bg-white rounded-lg p-3 md:col-span-2'>
                                <p className='text-sm text-gray-500 font-medium mb-1'>
                                  Previous Authority
                                </p>
                                <p className='font-semibold text-gray-900'>
                                  {license.previousAuthorityName}
                                </p>
                              </div>
                            )}
                            {license.hasLicenceSuspended !== undefined && (
                              <div className='bg-white rounded-lg p-3'>
                                <p className='text-sm text-gray-500 font-medium mb-1'>
                                  License Suspended
                                </p>
                                <p className='font-semibold text-gray-900'>
                                  {license.hasLicenceSuspended ? 'Yes' : 'No'}
                                </p>
                              </div>
                            )}
                            {license.suspensionReason && (
                              <div className='bg-white rounded-lg p-3 md:col-span-2'>
                                <p className='text-sm text-gray-500 font-medium mb-1'>
                                  Suspension Reason
                                </p>
                                <p className='font-semibold text-gray-900'>
                                  {license.suspensionReason}
                                </p>
                              </div>
                            )}
                            {license.hasFamilyLicence !== undefined && (
                              <div className='bg-white rounded-lg p-3'>
                                <p className='text-sm text-gray-500 font-medium mb-1'>
                                  Family License
                                </p>
                                <p className='font-semibold text-gray-900'>
                                  {license.hasFamilyLicence ? 'Yes' : 'No'}
                                </p>
                              </div>
                            )}
                            {license.familyMemberName && (
                              <div className='bg-white rounded-lg p-3'>
                                <p className='text-sm text-gray-500 font-medium mb-1'>
                                  Family Member Name
                                </p>
                                <p className='font-semibold text-gray-900'>
                                  {license.familyMemberName}
                                </p>
                              </div>
                            )}
                            {license.familyLicenceNumber && (
                              <div className='bg-white rounded-lg p-3 md:col-span-2'>
                                <p className='text-sm text-gray-500 font-medium mb-1'>
                                  Family License Number
                                </p>
                                <p className='font-semibold text-gray-900'>
                                  {license.familyLicenceNumber}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Criminal History Section */}
                {application?.criminalHistories && application.criminalHistories.length > 0 && (
                  <div className='mb-8'>
                    <h3 className='text-lg font-bold text-gray-900 mb-4 flex items-center'>
                      <div className='w-1 h-5 bg-red-600 rounded-full mr-3'></div>
                      Criminal History
                    </h3>
                    <div className='space-y-4'>
                      {application.criminalHistories.map((criminal: any, idx: number) => (
                        <div
                          key={idx}
                          className='bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-xl p-6 shadow-sm'
                        >
                          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4'>
                            {criminal.isConvicted !== undefined && (
                              <div className='bg-white rounded-lg p-3'>
                                <p className='text-sm text-gray-500 font-medium mb-1'>Convicted</p>
                                <p
                                  className={`font-semibold ${criminal.isConvicted ? 'text-red-600' : 'text-green-600'}`}
                                >
                                  {criminal.isConvicted ? 'Yes' : 'No'}
                                </p>
                              </div>
                            )}
                            {criminal.isBondExecuted !== undefined && (
                              <div className='bg-white rounded-lg p-3'>
                                <p className='text-sm text-gray-500 font-medium mb-1'>
                                  Bond Executed
                                </p>
                                <p className='font-semibold text-gray-900'>
                                  {criminal.isBondExecuted ? 'Yes' : 'No'}
                                </p>
                              </div>
                            )}
                            {criminal.bondDate && (
                              <div className='bg-white rounded-lg p-3'>
                                <p className='text-sm text-gray-500 font-medium mb-1'>Bond Date</p>
                                <p className='font-semibold text-gray-900'>
                                  {new Date(criminal.bondDate).toLocaleDateString('en-IN')}
                                </p>
                              </div>
                            )}
                            {criminal.isProhibited !== undefined && (
                              <div className='bg-white rounded-lg p-3'>
                                <p className='text-sm text-gray-500 font-medium mb-1'>Prohibited</p>
                                <p className='font-semibold text-gray-900'>
                                  {criminal.isProhibited ? 'Yes' : 'No'}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* FIR Details */}
                          {criminal.firDetails && criminal.firDetails.length > 0 && (
                            <div className='mt-4'>
                              <h4 className='text-sm font-bold text-gray-700 mb-3'>FIR Details</h4>
                              <div className='space-y-3'>
                                {criminal.firDetails.map((fir: any, firIdx: number) => (
                                  <div
                                    key={firIdx}
                                    className='bg-white rounded-lg p-4 border border-gray-200'
                                  >
                                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
                                      {fir.firNumber && (
                                        <div>
                                          <p className='text-xs text-gray-500 font-medium'>
                                            FIR Number
                                          </p>
                                          <p className='font-semibold text-gray-900 text-sm'>
                                            {fir.firNumber}
                                          </p>
                                        </div>
                                      )}
                                      {fir.District && (
                                        <div>
                                          <p className='text-xs text-gray-500 font-medium'>
                                            District
                                          </p>
                                          <p className='font-semibold text-gray-900 text-sm'>
                                            {fir.District}
                                          </p>
                                        </div>
                                      )}
                                      {fir.policeStation && (
                                        <div>
                                          <p className='text-xs text-gray-500 font-medium'>
                                            Police Station
                                          </p>
                                          <p className='font-semibold text-gray-900 text-sm'>
                                            {fir.policeStation}
                                          </p>
                                        </div>
                                      )}
                                      {fir.offence && (
                                        <div className='md:col-span-2'>
                                          <p className='text-xs text-gray-500 font-medium'>
                                            Offence
                                          </p>
                                          <p className='font-semibold text-gray-900 text-sm'>
                                            {fir.offence}
                                          </p>
                                        </div>
                                      )}
                                      {fir.underSection && (
                                        <div>
                                          <p className='text-xs text-gray-500 font-medium'>
                                            Under Section
                                          </p>
                                          <p className='font-semibold text-gray-900 text-sm'>
                                            {fir.underSection}
                                          </p>
                                        </div>
                                      )}
                                      {fir.DateOfSentence && (
                                        <div>
                                          <p className='text-xs text-gray-500 font-medium'>
                                            Date of Sentence
                                          </p>
                                          <p className='font-semibold text-gray-900 text-sm'>
                                            {fir.DateOfSentence}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status-specific information */}
                {(application?.returnReason ||
                  application?.flagReason ||
                  application?.disposalReason) && (
                  <div className='mb-8'>
                    <h3 className='text-lg font-bold text-gray-900 mb-4 flex items-center'>
                      <div className='w-1 h-5 bg-orange-500 rounded-full mr-3'></div>
                      Additional Information
                    </h3>

                    {application.returnReason && (
                      <div className='p-4 bg-orange-50 border border-orange-200 rounded-xl mb-4'>
                        <h4 className='font-bold text-orange-800 mb-2 flex items-center'>
                          <svg className='w-4 h-4 mr-2' fill='currentColor' viewBox='0 0 20 20'>
                            <path
                              fillRule='evenodd'
                              d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                              clipRule='evenodd'
                            />
                          </svg>
                          Return Reason
                        </h4>
                        <p className='text-gray-900'>{application.returnReason}</p>
                      </div>
                    )}

                    {application.flagReason && (
                      <div className='p-4 bg-red-50 border border-red-200 rounded-xl mb-4'>
                        <h4 className='font-bold text-red-800 mb-2 flex items-center'>
                          <svg className='w-4 h-4 mr-2' fill='currentColor' viewBox='0 0 20 20'>
                            <path
                              fillRule='evenodd'
                              d='M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z'
                              clipRule='evenodd'
                            />
                          </svg>
                          Red Flag Reason
                        </h4>
                        <p className='text-gray-900'>{application.flagReason}</p>
                      </div>
                    )}

                    {application.disposalReason && (
                      <div className='p-4 bg-gray-50 border border-gray-200 rounded-xl'>
                        <h4 className='font-bold text-gray-800 mb-2 flex items-center'>
                          <svg className='w-4 h-4 mr-2' fill='currentColor' viewBox='0 0 20 20'>
                            <path
                              fillRule='evenodd'
                              d='M9 2a1 1 0 000 2h2a1 1 0 100-2H9z'
                              clipRule='evenodd'
                            />
                            <path
                              fillRule='evenodd'
                              d='M4 5a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 2a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z'
                              clipRule='evenodd'
                            />
                          </svg>
                          Disposal Reason
                        </h4>
                        <p className='text-gray-900'>{application.disposalReason}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Documents Section */}
                <div className='mb-8'>
                  <h2 className='text-xl font-bold text-gray-900 mb-6 flex items-center'>
                    <div className='w-1 h-6 bg-green-600 rounded-full mr-3'></div>
                    Documents Uploaded
                  </h2>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    {/* If documents are available in application data, use them */}
                    {application?.documents && application.documents.length > 0 ? (
                      application.documents.map((doc, index) => (
                        <div
                          key={index}
                          className='bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200'
                        >
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center'>
                              <div
                                className={`p-2 rounded-lg mr-3 ${
                                  String(doc.type || '')
                                    .toLowerCase()
                                    .includes('image')
                                    ? 'bg-green-100 text-green-600'
                                    : String(doc.type || '')
                                          .toLowerCase()
                                          .includes('pdf')
                                      ? 'bg-red-100 text-red-600'
                                      : 'bg-blue-100 text-blue-600'
                                }`}
                              >
                                <svg
                                  xmlns='http://www.w3.org/2000/svg'
                                  className='h-6 w-6'
                                  fill='none'
                                  viewBox='0 0 24 24'
                                  stroke='currentColor'
                                >
                                  {String(doc.type || '')
                                    .toLowerCase()
                                    .includes('image') ? (
                                    <path
                                      strokeLinecap='round'
                                      strokeLinejoin='round'
                                      strokeWidth={1}
                                      d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
                                    />
                                  ) : (
                                    <path
                                      strokeLinecap='round'
                                      strokeLinejoin='round'
                                      strokeWidth={1}
                                      d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                                    />
                                  )}
                                </svg>
                              </div>
                              <div>
                                <span className='font-medium text-gray-900'>
                                  {String(doc.type || '').toUpperCase() || 'DOCUMENT'}
                                </span>
                                <p className='text-xs text-gray-500 mt-1 break-words'>
                                  {String(doc.name || 'file')}
                                </p>
                              </div>
                            </div>
                            <div className='flex space-x-2'>
                              <button
                                onClick={() => openAttachment(doc)}
                                className='text-blue-600 hover:text-blue-800 font-medium text-sm px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors'
                              >
                                View
                              </button>
                              <button
                                onClick={() => {
                                  const a = document.createElement('a');
                                  a.href = doc.url;
                                  a.download = doc.name || 'download';
                                  a.rel = 'noopener';
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                }}
                                className='text-gray-600 hover:text-gray-800 font-medium text-sm px-3 py-1 rounded-lg hover:bg-gray-50 transition-colors'
                              >
                                Download
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className='col-span-full flex flex-col items-center justify-center py-12 text-center'>
                        <svg
                          className='w-16 h-16 text-gray-300 mb-4'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={1}
                            d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                          />
                        </svg>
                        <p className='text-gray-500 text-sm font-medium'>No documents uploaded</p>
                        <p className='text-gray-400 text-xs mt-1'>
                          Documents will appear here once uploaded
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons and Timeline Section - Only show if NOT Draft */}
              {application?.workflowStatus?.name?.toLowerCase() !== 'draft' && (
                <div
                  className='p-6 lg:p-8 border-t border-gray-100 bg-white max-h-[calc(100vh-2
                0px)]'
                >
                  <div
                    ref={containerRef}
                    className='flex h-screen items-stretch gap-0 relative'
                    style={{
                      display: 'flex',
                    }}
                  >
                    {/* Action Buttons - Full Width Editor (2 columns) */}
                    <div
                      className='flex flex-col h-screen overflow-hidden'
                      style={{
                        width: `${dividerPosition}%`,
                        transition: isDragging ? 'none' : 'width 0.1s ease',
                      }}
                    >
                      <div className='flex items-center justify-between mb-4'>
                        <div>
                          <h3 className='text-2xl font-bold text-gray-900 flex items-center'>
                            <div className='w-1 h-6 bg-blue-600 rounded-full mr-3'></div>
                            Application Processing
                          </h3>
                        </div>
                      </div>
                      <div className='flex flex-col gap-4 flex-1 overflow-hidden'>
                        {/* Check if current logged-in user can take action */}
                        {(() => {
                          // Read `user_data` from cookies (if present) and parse it safely.
                          let user_data: any = null;
                          try {
                            if (typeof document !== 'undefined' && document.cookie) {
                              const cookie = document.cookie
                                .split(';')
                                .map(c => c.trim())
                                .find(c => c.startsWith('user='));
                              if (cookie) {
                                const raw = cookie.split('=')[1] || '';
                                // Cookies are URL-encoded; decode and parse JSON if possible
                                const decoded = decodeURIComponent(raw);
                                user_data = decoded ? JSON.parse(decoded) : null;
                              }
                            }
                          } catch (e) {
                            // ignore parsing errors and fall back to auth user
                            user_data = null;
                          }

                          // Prefer cookie `user_data` id, otherwise fall back to auth `user?.id` from useAuthSync
                          const currentUserId = user_data?.id
                            ? Number(user_data.id)
                            : user?.id
                              ? Number(user.id)
                              : null;
                          // Try multiple possible field names for application's current user ID
                          const appData = application as any;
                          const applicationUserId = Number(application?.currentUser?.id) || null;
                          // Helpful debug info (kept minimal)
                          const canTakeAction =
                            currentUserId &&
                            applicationUserId &&
                            currentUserId == applicationUserId;

                          return canTakeAction;
                        })() ? (
                          <>
                            {/* Proceedings Form - Always Open */}
                            <div className='bg-white rounded-xl border border-gray-200 shadow-sm h-full overflow-hidden flex flex-col'>
                              <div className='p-2 bg-gray-50 flex-1 overflow-auto'>
                                <div className='p-2 h-full'>
                                  <ProceedingsForm
                                    applicationId={applicationId!}
                                    onSuccess={handleProceedingsSuccess}
                                    userRole={userRole}
                                    applicationData={application || undefined}
                                  />
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          /* Show message if user is not authorized */
                          <div className='bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg shadow-sm'>
                            <div className='flex items-start'>
                              <svg
                                className='w-6 h-6 text-yellow-600 mr-3 flex-shrink-0 mt-0.5'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                              >
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  strokeWidth={2}
                                  d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                                />
                              </svg>
                              <div>
                                <h4 className='text-lg font-semibold text-yellow-800 mb-2'>
                                  Action Not Available
                                </h4>
                                <p className='text-sm text-yellow-700 leading-relaxed'>
                                  At this point, you cannot take action on this request. This
                                  application is currently assigned to another user.
                                </p>
                                {application?.currentUser && (
                                  <p className='text-sm text-yellow-700 mt-2'>
                                    <span className='font-medium'>Current handler:</span>{' '}
                                    {application.currentUser.username}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Resizable Divider */}
                    <div
                      ref={dividerRef}
                      onMouseDown={handleDividerMouseDown}
                      className='w-1 bg-gradient-to-b from-transparent via-gray-300 to-transparent hover:bg-gradient-to-b hover:from-transparent hover:via-blue-400 hover:to-transparent cursor-col-resize transition-all duration-200 group relative'
                      style={{
                        cursor: 'col-resize',
                        userSelect: 'none',
                      }}
                    >
                      {/* Hover indicator */}
                      <div className='absolute inset-y-0 -left-1 -right-1 group-hover:bg-blue-400/10 transition-colors duration-200'></div>
                    </div>

                    {/* Application Timeline/History - Right Side with Scroll */}
                    <div
                      className='flex flex-col h-screen overflow-hidden'
                      style={{
                        width: `${100 - dividerPosition}%`,
                        transition: isDragging ? 'none' : 'width 0.1s ease',
                      }}
                    >
                      <div className='flex items-center justify-between mb-4'>
                        <h3 className='text-lg font-semibold text-gray-900 flex items-center'>
                          <div className='w-1 h-5 bg-green-600 rounded-full mr-3'></div>
                          Application History
                        </h3>
                      </div>

                      <div className='flex-1 bg-white rounded-xl border border-gray-200 shadow-sm h-full overflow-hidden'>
                        <div className='overflow-y-auto p-6 custom-scrollbar h-full'>
                          {application &&
                          application.workflowHistories &&
                          application.workflowHistories.length > 0 ? (
                            <div className='space-y-5'>
                              {application.workflowHistories.map((h, idx) => {
                                const actionLower = h.actionTaken.toLowerCase();
                                const color = actionLower.includes('forward')
                                  ? 'border-orange-500'
                                  : actionLower.includes('approve')
                                    ? 'border-green-500'
                                    : actionLower.includes('reject') ||
                                        actionLower.includes('return')
                                      ? 'border-red-500'
                                      : 'border-blue-500';

                                const bgColor = actionLower.includes('forward')
                                  ? 'bg-orange-50'
                                  : actionLower.includes('approve')
                                    ? 'bg-green-50'
                                    : actionLower.includes('reject') ||
                                        actionLower.includes('return')
                                      ? 'bg-red-50'
                                      : 'bg-blue-50';
                                const attachmentsArr = h.attachments;
                                const hasAttachments =
                                  Array.isArray(attachmentsArr) && attachmentsArr.length > 0;
                                const hasRemarks = !!h.remarks;
                                const hasDetails = hasAttachments || hasRemarks;
                                const isExpanded = !!expandedHistory[idx];
                                const historyDate = new Date(h.createdAt);
                                const formattedDate = historyDate.toLocaleDateString('en-IN', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                });
                                const formattedTime = historyDate.toLocaleTimeString('en-IN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                });

                                return (
                                  <div
                                    key={h.id}
                                    className={`border-l-4 ${color} ${bgColor} pl-4 pr-4 py-3 rounded-r-lg transition-all duration-200 hover:shadow-sm`}
                                  >
                                    <div className='flex items-start justify-between'>
                                      <div className='flex-1'>
                                        <p className='font-semibold text-gray-900 text-sm'>
                                          {h.previousUserName || 'Unknown User'}
                                        </p>
                                        <p className='text-xs text-gray-600 mt-0.5'>
                                          {h.previousRoleName || 'Role'}
                                        </p>
                                        <p className='text-sm text-gray-700 font-medium mt-1'>
                                          {h.actionTaken}
                                        </p>
                                        {h.nextUserName && (
                                          <p className='text-xs text-gray-600 mt-1'>
                                            → Forwarded to:{' '}
                                            <span className='font-medium'>{h.nextUserName}</span> (
                                            {h.nextRoleName})
                                          </p>
                                        )}
                                        <p className='text-xs text-gray-500 mt-1 flex items-center'>
                                          <svg
                                            className='w-3 h-3 mr-1'
                                            fill='none'
                                            stroke='currentColor'
                                            viewBox='0 0 24 24'
                                          >
                                            <path
                                              strokeLinecap='round'
                                              strokeLinejoin='round'
                                              strokeWidth={2}
                                              d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                                            />
                                          </svg>
                                          {formattedDate} {formattedTime}
                                        </p>
                                        {/* Attachments are now rendered below the header row to match remarks width */}
                                      </div>
                                      {hasDetails && (
                                        <button
                                          type='button'
                                          onMouseEnter={() => {
                                            if (!isExpanded) {
                                              setExpandedHistory(prev => ({
                                                ...prev,
                                                [idx]: true,
                                              }));
                                            }
                                          }}
                                          className={`ml-4 text-sm font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 flex items-center group relative ${
                                            isExpanded
                                              ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700 hover:shadow-lg'
                                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-800 hover:shadow-md'
                                          }`}
                                          aria-expanded={isExpanded}
                                          aria-controls={`history-remarks-${idx}`}
                                          aria-label={isExpanded ? 'Hide details' : 'Show details'}
                                        >
                                          <svg
                                            className={`w-4 h-4 mr-2 transform transition-all duration-300 ${isExpanded ? 'rotate-180' : ''}`}
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
                                          {isExpanded ? 'Hide' : 'Show more'}

                                          {/* Tooltip on hover */}
                                          <div className='absolute right-0 bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap z-50'>
                                            {isExpanded ? 'Click to hide' : 'Hover to view details'}
                                            <div className='absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900'></div>
                                          </div>
                                        </button>
                                      )}
                                    </div>
                                    {hasRemarks && isExpanded && (
                                      <div
                                        id={`history-remarks-${idx}`}
                                        className='mt-3 p-4 bg-white rounded-lg border border-gray-200 shadow-sm'
                                      >
                                        <div className='text-base font-semibold text-gray-800 mb-3'>
                                          Remarks
                                        </div>
                                        <div className='flex'>
                                          <svg
                                            className='w-5 h-5 mr-3 text-indigo-500 mt-0.5 flex-shrink-0'
                                            fill='none'
                                            stroke='currentColor'
                                            viewBox='0 0 24 24'
                                          >
                                            <path
                                              strokeLinecap='round'
                                              strokeLinejoin='round'
                                              strokeWidth={2}
                                              d='M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z'
                                            />
                                          </svg>
                                          <div className='flex-1 overflow-auto'>
                                            <RichTextDisplay
                                              content={h.remarks}
                                              className='text-sm text-gray-700'
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    {hasAttachments && isExpanded && (
                                      <div className='mt-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm'>
                                        <div className='text-base font-semibold text-gray-800 mb-2'>
                                          Attachments
                                        </div>
                                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
                                          {attachmentsArr.map((att: any, aidx: number) => {
                                            const isGroundReport = String(att?.type || '')
                                              .toUpperCase()
                                              .includes('GROUND');
                                            const displayName = isGroundReport
                                              ? truncateFilename(att?.name || '', 10)
                                              : att?.name || 'Attachment';
                                            const contentType = String(
                                              att?.contentType || ''
                                            ).toLowerCase();
                                            const fileLower = String(att?.name || '').toLowerCase();
                                            const isPdf =
                                              contentType.includes('pdf') ||
                                              fileLower.endsWith('.pdf');
                                            const isImage =
                                              contentType.startsWith('image/') ||
                                              /\.(png|jpe?g|gif|svg|webp)$/.test(fileLower);
                                            const iconColor = isPdf
                                              ? 'text-red-500'
                                              : isImage
                                                ? 'text-emerald-500'
                                                : 'text-blue-500';
                                            return (
                                              <div
                                                key={aidx}
                                                className='flex items-center text-xs text-blue-700 min-w-0'
                                              >
                                                <svg
                                                  className={`w-5 h-5 mr-2 ${iconColor}`}
                                                  fill='none'
                                                  stroke='currentColor'
                                                  viewBox='0 0 24 24'
                                                >
                                                  {isImage ? (
                                                    // Image icon
                                                    <path
                                                      strokeLinecap='round'
                                                      strokeLinejoin='round'
                                                      strokeWidth={2}
                                                      d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
                                                    />
                                                  ) : (
                                                    // File/PDF icon
                                                    <path
                                                      strokeLinecap='round'
                                                      strokeLinejoin='round'
                                                      strokeWidth={2}
                                                      d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                                                    />
                                                  )}
                                                </svg>
                                                <button
                                                  type='button'
                                                  onClick={() => openAttachment(att)}
                                                  className='hover:underline truncate text-left text-blue-700'
                                                  title={att?.name}
                                                >
                                                  {displayName}
                                                </button>
                                                {att?.contentType && (
                                                  <span className='ml-2 text-gray-500'>
                                                    ({att.contentType})
                                                  </span>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className='flex flex-col items-center justify-center h-full text-center py-8'>
                              <svg
                                className='w-12 h-12 text-gray-300 mb-4'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                              >
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  strokeWidth={1}
                                  d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                                />
                              </svg>
                              <p className='text-gray-500 text-sm font-medium'>
                                No history available
                              </p>
                              <p className='text-gray-400 text-xs mt-1'>
                                Application history will appear here when actions are taken
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Process Application Modal */}
                  {application && (
                    <ProcessApplicationModal
                      application={application}
                      isOpen={isProcessModalOpen}
                      onClose={() => setIsProcessModalOpen(false)}
                      onProcess={handleProcessApplication}
                      initialAction={selectedAction}
                      isLoading={isProcessing}
                    />
                  )}

                  {/* Forward Application Modal */}
                  {application && (
                    <ForwardApplicationModal
                      application={application}
                      isOpen={isForwardModalOpen}
                      onClose={() => setIsForwardModalOpen(false)}
                      onForward={handleForwardApplication}
                      isLoading={isForwarding}
                    />
                  )}

                  {/* Print Options Modal */}
                  {application && showPrintOptions && (
                    <div className='fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm'>
                      <div className='bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 lg:p-8 border border-gray-100'>
                        <div className='flex justify-between items-center mb-6'>
                          <div className='flex items-center'>
                            <div className='w-2 h-6 bg-blue-600 rounded-full mr-3'></div>
                            <h3 className='text-xl font-bold text-gray-900'>Print Options</h3>
                          </div>
                          <button
                            onClick={() => setShowPrintOptions(false)}
                            className='p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200'
                          >
                            <svg
                              className='w-5 h-5'
                              fill='none'
                              stroke='currentColor'
                              viewBox='0 0 24 24'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth='2'
                                d='M6 18L18 6M6 6l12 12'
                              />
                            </svg>
                          </button>
                        </div>

                        <div className='space-y-4'>
                          <div
                            className='p-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:shadow-sm cursor-pointer transition-all duration-200'
                            onClick={handleBrowserPrint}
                          >
                            <div className='flex items-center'>
                              <div className='bg-blue-100 p-3 rounded-xl mr-4'>
                                <svg
                                  xmlns='http://www.w3.org/2000/svg'
                                  className='h-6 w-6 text-blue-600'
                                  fill='none'
                                  viewBox='0 0 24 24'
                                  stroke='currentColor'
                                >
                                  <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2z'
                                  />
                                </svg>
                              </div>
                              <div>
                                <h4 className='font-semibold text-gray-900'>Print using browser</h4>
                                <p className='text-sm text-gray-600 mt-1'>
                                  Opens a printable view in a new window
                                </p>
                              </div>
                            </div>
                          </div>

                          <div
                            className='p-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:shadow-sm cursor-pointer transition-all duration-200'
                            onClick={handleExportPDF}
                          >
                            <div className='flex items-center'>
                              <div className='bg-green-100 p-3 rounded-xl mr-4'>
                                <svg
                                  xmlns='http://www.w3.org/2000/svg'
                                  className='h-6 w-6 text-green-600'
                                  fill='none'
                                  viewBox='0 0 24 24'
                                  stroke='currentColor'
                                >
                                  <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                                  />
                                </svg>
                              </div>
                              <div>
                                <h4 className='font-semibold text-gray-900'>Export as PDF</h4>
                                <p className='text-sm text-gray-600 mt-1'>
                                  Download application as a PDF document
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Loading indicator while PDF is being generated */}
                        {isPrinting && (
                          <div className='mt-6 flex items-center justify-center text-blue-600 bg-blue-50 rounded-xl p-4'>
                            <svg
                              className='animate-spin -ml-1 mr-3 h-5 w-5'
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
                              ></circle>
                              <path
                                className='opacity-75'
                                fill='currentColor'
                                d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                              ></path>
                            </svg>
                            <span className='font-medium'>Generating PDF...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Confirmation Modal */}
                  <ConfirmationModal
                    isOpen={showConfirmation}
                    onClose={() => setShowConfirmation(false)}
                    onConfirm={confirmationDetails.onConfirm}
                    title={confirmationDetails.title}
                    message={confirmationDetails.message}
                    actionButtonText={confirmationDetails.actionButtonText}
                    actionButtonColor={confirmationDetails.actionButtonColor}
                  />
                  {showProceedingsModal && (
                    <div className='fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm'>
                      <div className='bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-100'>
                        <div className='flex justify-between items-center p-6 lg:p-8 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50'>
                          <div className='flex items-center'>
                            <div className='w-2 h-8 bg-blue-600 rounded-full mr-4'></div>
                            <div>
                              <h2 className='text-2xl font-bold text-gray-900'>Proceedings</h2>
                              <p className='text-gray-600 mt-1'>
                                Process application #{applicationId!}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setShowProceedingsModal(false)}
                            className='p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                          >
                            <svg
                              className='w-6 h-6'
                              fill='none'
                              stroke='currentColor'
                              viewBox='0 0 24 24'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M6 18L18 6M6 6l12 12'
                              />
                            </svg>
                          </button>
                        </div>
                        <div className='p-6 lg:p-8'>
                          <ProceedingsForm
                            applicationId={applicationId!}
                            onSuccess={handleProceedingsSuccess}
                            userRole={userRole}
                            applicationData={application || undefined}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className='p-6 lg:p-8'>
              <div className='text-center py-8'>
                <p className='text-gray-500'>Application not found</p>
                <button
                  onClick={() => router.push('/')}
                  className='mt-4 px-4 py-2 text-[#6366F1] border border-[#6366F1] rounded-md hover:bg-[#EEF2FF]'
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Loading Overlay */}
      {(isProcessing || isForwarding) && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm'>
          <div className='bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 border border-gray-100'>
            <div className='flex flex-col items-center'>
              <div className='animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4'></div>
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                {isProcessing ? 'Processing Application...' : 'Forwarding Application...'}
              </h3>
              <p className='text-gray-600 text-center'>
                {isProcessing
                  ? 'Please wait while we process your request.'
                  : 'Please wait while we forward the application.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
