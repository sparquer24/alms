'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { useLayout } from '@/config/layoutContext';
import { useAuth } from '@/hooks/useAuth';
import { PageLayoutSkeleton } from '@/components/Skeleton';
import {
  getCancellationApplication,
  createCancellationRequest,
} from '@/api/cancellationService';
import ProceedingsForm from '@/components/ProceedingsForm';
import { RichTextDisplay } from '@/components/RichTextDisplay';
import { truncateFilename } from '@/utils/string';

const SectionCard = ({
  title,
  icon,
  children,
  headerAction,
  className = '',
}: {
  title: string;
  icon?: React.ReactNode;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${className}`}
  >
    <div className="border-b border-gray-100 px-6 py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {icon && <span className="text-[#001F54]">{icon}</span>}
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        </div>
        {headerAction && <div>{headerAction}</div>}
      </div>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const InfoField = ({
  label,
  value,
  span = 1,
}: {
  label: string;
  value: any;
  span?: number;
}) => {
  const spanClass = span === 2 ? 'md:col-span-2' : span === 3 ? 'md:col-span-3' : '';
  return (
    <div className={spanClass}>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-1">
        {label}
      </p>
      <p className="text-sm text-gray-900 font-medium break-words">
        {value === null || value === undefined ? (
          <span className="text-gray-300">—</span>
        ) : typeof value === 'object' ? (
          <pre className="text-xs bg-gray-50 rounded-lg p-3 overflow-auto max-h-40 border border-gray-100">
            {JSON.stringify(value, null, 2)}
          </pre>
        ) : (
          String(value)
        )}
      </p>
    </div>
  );
};

function CancellationFormContent() {
  const searchParams = useSearchParams();
  const { setShowSidebar } = useLayout();
  const { isLoading: authLoading } = useAuth();
  const router = useRouter();

  const applicationType = searchParams.get('type') || '';
  const applicationId = searchParams.get('applicationId') || '';

  const [loading, setLoading] = useState(true);
  const [rawData, setRawData] = useState<any>(null);
  const [application, setApplication] = useState<any>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showRawResponse, setShowRawResponse] = useState(false);

  // Split-panel state (mirrors application/[id] page)
  const [dividerPosition, setDividerPosition] = useState(40);
  const [isDragging, setIsDragging] = useState(false);
  const dividerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [expandedHistory, setExpandedHistory] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setShowSidebar(true);
  }, [setShowSidebar]);

  useEffect(() => {
    if (!applicationType || !applicationId) {
      setError('Missing application type or application ID.');
      setLoading(false);
      return;
    }

    const loadApplication = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getCancellationApplication(applicationType, applicationId);
        setRawData(data);
        setApplication(data);
      } catch (err: any) {
        setError(err?.message || 'Failed to load application data.');
      } finally {
        setLoading(false);
      }
    };

    loadApplication();
  }, [applicationType, applicationId]);

  // Divider drag handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percent = Math.min(Math.max((x / rect.width) * 100, 20), 80);
      setDividerPosition(percent);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDragging]);

  const handleDividerMouseDown = () => {
    setIsDragging(true);
  };

  const openAttachment = (att: any) => {
    try {
      const rawUrl =
        typeof att?.url === 'string'
          ? att.url
          : typeof att?.fileUrl === 'string'
          ? att.fileUrl
          : '';
      const fileName = att?.name || att?.fileName || 'attachment';
      if (!rawUrl) return;

      const isHttpUrl = /^https?:\/\//i.test(rawUrl) || rawUrl.startsWith('/');
      const isDataUrl = rawUrl.startsWith('data:');
      let target = rawUrl;
      if (isDataUrl) {
        target = rawUrl;
      } else if (!isHttpUrl) {
        target = `data:${att?.contentType || 'application/octet-stream'};base64,${rawUrl}`;
      }
      window.open(target, '_blank', 'noopener');
    } catch {
      // Silently fail attachment open
    }
  };

  const flatten = (obj: any): Record<string, any> => {
    if (!obj || typeof obj !== 'object') return {};
    if (Array.isArray(obj)) {
      const out: Record<string, any> = {};
      obj.forEach((item, idx) => {
        Object.assign(out, flatten(item));
      });
      return out;
    }
    const out: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      if (key === 'id' || key === 'createdAt' || key === 'updatedAt') continue;
      const value = (obj as any)[key];
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(out, flatten(value));
      } else {
        out[key] = value;
      }
    }
    return out;
  };

  const flatFields = rawData ? Object.entries(flatten(rawData)) : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!application) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const normalizedType = applicationType.toLowerCase();
      const resolvedType = normalizedType.includes('renewal')
        ? 'RenewalForm'
        : 'FreshForm';

      const result = await createCancellationRequest({
        applicationId: Number(application.id),
        applicationType: resolvedType,
        cancellationReason,
        remarks: remarks || '',
      });

      setSuccess('Cancellation request submitted successfully. Redirecting...');
      setCancellationReason('');
      setRemarks('');

      setTimeout(() => {
        router.push('/forms/CancellationApplication/list');
      }, 2000);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit cancellation request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <Suspense fallback={<PageLayoutSkeleton />}>
        <PageLayoutSkeleton />
      </Suspense>
    );
  }

  return (
    <div className="flex h-screen w-full bg-gray-50 font-[family-name:var(--font-geist-sans)]">
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-6 py-8 lg:px-10">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                Cancellation Application
              </h1>
            </div>
            <p className="text-sm text-gray-500 ml-[52px]">
              Review the application details and submit a cancellation request.
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-5 py-4 text-red-800">
              <svg className="h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-emerald-800">
              <svg className="h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-medium">{success}</span>
            </div>
          )}

          {rawData && (
            <div className="space-y-6">
              {/* Application Details */}
              <SectionCard
                title="Application Details"
                icon={
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                }
                headerAction={
                  <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
                    Cancellation
                  </span>
                }
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {flatFields.slice(0, 20).map(([key, value]) => (
                    <InfoField key={key} label={key} value={value} />
                  ))}
                </div>

                {flatFields.length > 20 && (
                  <div className="mt-5">
                    <button
                      type="button"
                      onClick={() => setShowRawResponse(!showRawResponse)}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:border-[#001F54] hover:text-[#001F54]"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d={showRawResponse ? 'M19 9l-7 7-7-7' : 'M9 5l7 7-7 7'}
                        />
                      </svg>
                      {showRawResponse
                        ? 'Hide remaining fields'
                        : `View remaining ${flatFields.length - 20} fields`}
                    </button>
                    {showRawResponse && (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-5">
                        {flatFields.slice(20).map(([key, value]) => (
                          <InfoField key={key} label={key} value={value} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </SectionCard>

              {/* Application Processing & History Split Panel */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div
                  ref={containerRef}
                  className="flex"
                  style={{ height: '600px', position: 'relative' }}
                >
                  {/* Left Panel: Application Processing */}
                  <div
                    className="flex flex-col h-full overflow-hidden"
                    style={{
                      width: `${dividerPosition}%`,
                      transition: isDragging ? 'none' : 'width 0.1s ease',
                    }}
                  >
                    <div className="flex items-center justify-between px-6 pt-5 pb-3">
                      <h3 className="text-lg font-bold text-gray-900 flex items-center">
                        <div className="w-1 h-5 bg-blue-600 rounded-full mr-3"></div>
                        Application Processing
                      </h3>
                    </div>
                    <div className="flex flex-col gap-4 flex-1 overflow-hidden px-6 pb-6">
                      {(() => {
                        let user_data: any = null;
                        try {
                          if (typeof document !== 'undefined' && document.cookie) {
                            const cookie = document.cookie
                              .split(';')
                              .map(c => c.trim())
                              .find(c => c.startsWith('user='));
                            if (cookie) {
                              const raw = cookie.split('=')[1] || '';
                              const decoded = decodeURIComponent(raw);
                              user_data = decoded ? JSON.parse(decoded) : null;
                            }
                          }
                        } catch {
                          user_data = null;
                        }

                        const currentUserId = user_data?.id
                          ? Number(user_data.id)
                          : null;
                        const applicationUserId = Number(application?.currentUser?.id) || null;
                        const canTakeAction =
                          currentUserId && applicationUserId && currentUserId == applicationUserId;

                        return canTakeAction ? (
                          <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-full overflow-hidden flex flex-col">
                            <div className="p-4 bg-gray-50 flex-1 overflow-auto">
                              <ProceedingsForm
                                applicationId={applicationId}
                                onSuccess={() => {}}
                                applicationData={application || undefined}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg shadow-sm">
                            <div className="flex items-start">
                              <svg
                                className="w-6 h-6 text-yellow-600 mr-3 flex-shrink-0 mt-0.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                              </svg>
                              <div>
                                <h4 className="text-lg font-semibold text-yellow-800 mb-2">
                                  Action Not Available
                                </h4>
                                <p className="text-sm text-yellow-700 leading-relaxed">
                                  At this point, you cannot take action on this request. This
                                  application is currently assigned to another user.
                                </p>
                                {application?.currentUser && (
                                  <p className="text-sm text-yellow-700 mt-2">
                                    <span className="font-medium">Current handler:</span>{' '}
                                    {application.currentUser.username}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Resizable Divider */}
                  <div
                    ref={dividerRef}
                    onMouseDown={handleDividerMouseDown}
                    className="w-1 bg-gradient-to-b from-transparent via-gray-300 to-transparent hover:bg-gradient-to-b hover:from-transparent hover:via-blue-400 hover:to-transparent cursor-col-resize transition-all duration-200 group relative"
                    style={{
                      cursor: 'col-resize',
                      userSelect: 'none',
                    }}
                  >
                    <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-blue-400/10 transition-colors duration-200"></div>
                  </div>

                  {/* Right Panel: Application History */}
                  <div
                    className="flex flex-col h-full overflow-hidden"
                    style={{
                      width: `${100 - dividerPosition}%`,
                      transition: isDragging ? 'none' : 'width 0.1s ease',
                    }}
                  >
                    <div className="flex items-center justify-between px-6 pt-5 pb-3">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <div className="w-1 h-5 bg-green-600 rounded-full mr-3"></div>
                        Application History
                      </h3>
                    </div>

                    <div className="flex-1 px-6 pb-6">
                      <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-full overflow-hidden">
                        <div className="overflow-y-auto p-6 h-full custom-scrollbar">
                          {application &&
                          application.workflowHistories &&
                          application.workflowHistories.length > 0 ? (
                            <div className="space-y-5">
                              {application.workflowHistories.map((h: any, idx: number) => {
                                const actionTaken = h?.actionTaken || h?.action || 'Unknown Action';
                                const actionLower = String(actionTaken).toLowerCase();
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

                                const attachmentsArr = h.attachments || [];
                                const hasAttachments =
                                  Array.isArray(attachmentsArr) && attachmentsArr.length > 0;
                                const hasRemarks = !!(h.remarks || h.comment);
                                const hasDetails = hasAttachments || hasRemarks;
                                const createdAt = h.createdAt || h.date || h.timestamp;
                                const isExpanded = !!expandedHistory[idx];
                                const historyDate = createdAt ? new Date(createdAt) : new Date();
                                const formattedDate = historyDate.toLocaleDateString('en-IN', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                });
                                const formattedTime = historyDate.toLocaleTimeString('en-IN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                });

                                const previousUserName =
                                  h.previousUserName || h.previousUser?.username || 'Unknown User';
                                const previousRoleName =
                                  h.previousRoleName || h.previousRole?.name || 'Role';
                                const nextUserName = h.nextUserName || h.nextUser?.username;
                                const nextRoleName = h.nextRoleName || h.nextRole?.name;

                                return (
                                  <div
                                    key={h.id || idx}
                                    className={`border-l-4 ${color} ${bgColor} pl-4 pr-4 py-3 rounded-r-lg transition-all duration-200 hover:shadow-sm`}
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <p className="font-semibold text-gray-900 text-sm">
                                          {previousUserName}
                                        </p>
                                        <p className="text-xs text-gray-600 mt-0.5">
                                          {previousRoleName}
                                        </p>
                                        <p className="text-sm text-gray-700 font-medium mt-1">
                                          {actionTaken}
                                        </p>
                                        {nextUserName && (
                                          <p className="text-xs text-gray-600 mt-1">
                                            {'\u2192'} Forwarded to:{' '}
                                            <span className="font-medium">{nextUserName}</span> (
                                            {nextRoleName})
                                          </p>
                                        )}
                                        <p className="text-xs text-gray-500 mt-1 flex items-center">
                                          <svg
                                            className="w-3 h-3 mr-1"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                          </svg>
                                          {formattedDate} {formattedTime}
                                        </p>
                                      </div>
                                      {hasDetails && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setExpandedHistory(prev => ({
                                              ...prev,
                                              [idx]: !prev[idx],
                                            }));
                                          }}
                                          className={`ml-4 text-sm font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 flex items-center group relative ${
                                            isExpanded
                                              ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700 hover:shadow-lg'
                                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-800 hover:shadow-md'
                                          }`}
                                          aria-expanded={isExpanded}
                                        >
                                          <svg
                                            className={`w-4 h-4 mr-2 transform transition-all duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M19 9l-7 7-7-7"
                                            />
                                          </svg>
                                          {isExpanded ? 'Hide' : 'Show more'}

                                          <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap z-50">
                                            {isExpanded ? 'Click to hide' : 'Hover to view details'}
                                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                          </div>
                                        </button>
                                      )}
                                    </div>
                                    {hasRemarks && isExpanded && (
                                      <div
                                        id={`history-remarks-${idx}`}
                                        className="mt-3 p-4 bg-white rounded-lg border border-gray-200 shadow-sm"
                                      >
                                        <div className="text-sm font-semibold text-gray-800 mb-3">
                                          Remarks
                                        </div>
                                        <div className="flex">
                                          <svg
                                            className="w-5 h-5 mr-3 text-indigo-500 mt-0.5 flex-shrink-0"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                                            />
                                          </svg>
                                          <div className="flex-1 overflow-auto">
                                            <RichTextDisplay
                                              content={h.remarks || h.comment}
                                              className="text-sm text-gray-700"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    {hasAttachments && isExpanded && (
                                      <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                                        <div className="text-sm font-semibold text-gray-800 mb-2">
                                          Attachments
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                          {attachmentsArr.map((att: any, aidx: number) => {
                                            const displayName = truncateFilename(
                                              att?.name || 'Attachment',
                                              10
                                            );
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
                                                className="flex items-center text-xs text-blue-700 min-w-0"
                                              >
                                                <svg
                                                  className={`w-5 h-5 mr-2 ${iconColor}`}
                                                  fill="none"
                                                  stroke="currentColor"
                                                  viewBox="0 0 24 24"
                                                >
                                                  {isImage ? (
                                                    <path
                                                      strokeLinecap="round"
                                                      strokeLinejoin="round"
                                                      strokeWidth={2}
                                                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z"
                                                    />
                                                  ) : (
                                                    <path
                                                      strokeLinecap="round"
                                                      strokeLinejoin="round"
                                                      strokeWidth={2}
                                                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                    />
                                                  )}
                                                </svg>
                                                <button
                                                  type="button"
                                                  onClick={() => openAttachment(att)}
                                                  className="hover:underline truncate text-left text-blue-700"
                                                  title={att?.name}
                                                >
                                                  {displayName}
                                                </button>
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
                            <div className="flex flex-col items-center justify-center h-full text-center py-8">
                              <svg
                                className="w-12 h-12 text-gray-300 mb-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1}
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                              <p className="text-gray-500 text-sm font-medium">
                                No history available
                              </p>
                              <p className="text-gray-400 text-xs mt-1">
                                Application history will appear here when actions are taken
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cancellation Details */}
              <SectionCard
                title="Cancellation Details"
                icon={
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                }
              >
                <div className="grid grid-cols-1 gap-5">
                  <div>
                    <label
                      htmlFor="cancellationReason"
                      className="mb-1.5 block text-sm font-semibold text-gray-700"
                    >
                      Cancellation Reason <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="cancellationReason"
                      value={cancellationReason}
                      onChange={(e) => setCancellationReason(e.target.value)}
                      placeholder="Please provide the reason for cancellation..."
                      className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm shadow-sm transition focus:border-[#001F54] focus:bg-white focus:ring-4 focus:ring-[#001F54]/10"
                      rows={3}
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="remarks"
                      className="mb-1.5 block text-sm font-semibold text-gray-700"
                    >
                      Remarks
                    </label>
                    <textarea
                      id="remarks"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Additional comments or observations (optional)..."
                      className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm shadow-sm transition focus:border-[#001F54] focus:bg-white focus:ring-4 focus:ring-[#001F54]/10"
                      rows={3}
                    />
                  </div>
                </div>
              </SectionCard>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="rounded-xl border border-gray-200 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || !cancellationReason.trim()}
                  className="rounded-xl bg-[#001F54] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#012a73] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  className="rounded-xl bg-[#001F54] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#012a73] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Submitting...
                    </span>
                  ) : (
                    'Submit'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function CancellationFormPage() {
  return (
    <Suspense fallback={<PageLayoutSkeleton />}>
      <CancellationFormContent />
    </Suspense>
  );
}
