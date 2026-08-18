'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams, usePathname } from 'next/navigation';
import CancelRequestDetail from '@/components/cancelForm/CancelRequestDetail';
import ProceedingsForm from '@/components/ProceedingsForm';
import CancelService from '@/api/cancelService';
import { useAuth } from '@/hooks/useAuth';
import { useLayout } from '@/config/layoutContext';
import { getStatusStyle } from '@/utils/statusColors';
import { formatStatusLabel } from '@/utils/formatters';
import { truncateFilename } from '@/utils/string';
import { openAttachment } from '@/utils/attachmentViewer';
import { RichTextDisplay } from '@/components/RichTextDisplay';
import { History, Clock, ChevronDown, FileText, Shield, Home } from 'lucide-react';

const ClockIcon = Clock as any;
const ChevronDownIcon = ChevronDown as any;

const hexToRgba = (hex: string, alpha: number): string => {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export default function CancelFormDetailClient() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const id = params?.id as string;
  const { user, userRole } = useAuth();
  const { setHeaderOptions } = useLayout();

  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedHistory, setExpandedHistory] = useState<Record<number, boolean>>({});

  const [cancelInfoLoading, setCancelInfoLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<'info' | 'original'>('info');

  // Tracks which tabs have already triggered their one-time fetch to prevent
  // duplicate API calls caused by re-renders or repeated state updates.
  const loadedTabs = React.useRef<{ info?: boolean; original?: boolean }>({});

  const [dividerPosition, setDividerPosition] = useState(66.66); // Left section percentage
  const [isDragging, setIsDragging] = useState(false);
  const dividerRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

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

  // Fetch the Cancellation Info data from GET /api/cancel-forms/:id.
  // This ONLY calls the Cancellation API. The linked license (Original tab)
  // is fetched separately and lazily when that tab is opened, using the
  // licenseId returned by this response.
  const fetchCancelInfo = async (options?: { replaceRequestOnly?: boolean }) => {
    try {
      setCancelInfoLoading(true);
      const res = await CancelService.getCancelRequestById(Number(id));
      // Backend wraps response as { success, message, data }
      const reqData = res?.data || res;
      // Guard: only set request state if we actually got a record with a valid id
      if (!reqData || !reqData.id) {
        if (!options?.replaceRequestOnly) setError(`Cancel request #${id} not found.`);
        return;
      }
      setRequest({
        ...reqData,
        applicationType: 'CancelFormRequest',
      });
    } catch (err) {
      console.error('Fetch error:', err);
      if (!options?.replaceRequestOnly) {
        setError(`Cancel request #${id} was not found or could not be loaded.`);
      }
    } finally {
      setCancelInfoLoading(false);
    }
  };

  // Initial load: fetch the Cancellation Info (GET /api/cancel-forms/:id) once.
  // The response is needed for both tabs (the Original tab reads licenseId from it).
  useEffect(() => {
    if (id) {
      setLoading(true);
      loadedTabs.current.info = true;
      fetchCancelInfo().finally(() => setLoading(false));
    }
  }, [id]);

  // Lazy load the Original License Details tab (GET /api/licenses/:licenseId).
  // Called only once, and only when the Original tab is opened, using the
  // licenseId returned by the Cancellation API. No Fresh Application API is used.
  const [originalLoaded, setOriginalLoaded] = useState(false);
  useEffect(() => {
    if (activeTab === 'original' && request?.licenseId && !loadedTabs.current.original) {
      loadedTabs.current.original = true;
      setOriginalLoaded(true);
    }
  }, [activeTab, request?.licenseId]);

  useEffect(() => {
    const tab = searchParams?.get('tab');
    setActiveTab(tab === 'original' ? 'original' : 'info');
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    const nextTab = tab === 'Original License Details' ? 'original' : 'info';
    setActiveTab(nextTab);
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('tab', nextTab);
    router.replace(`${pathname}?${params.toString()}`);
  };

  useEffect(() => {
    if (!id) return;

    setHeaderOptions({
      breadcrumbs: [
        { label: 'Home', onClick: () => router.push('/') },
        { label: `Cancellation Request #${id}` },
      ],
      applicationTypeLabel: 'Cancellation Request',
      statusBadge: request
        ? {
            label: formatStatusLabel(request.status || request.workflowStatus || request.status_id),
            style: (() => {
              const style = getStatusStyle(
                request.workflowStatus?.name ||
                  request.workflowStatus?.code ||
                  request.status ||
                  request.status_id
              );
              return {
                backgroundColor: style.bg,
                color: style.text,
                borderColor: style.border,
              };
            })(),
          }
        : undefined,
      hidePrint: true,
      hideCreateForm: true,
    });

    return () => {
      setHeaderOptions(undefined);
    };
  }, [id, request, router, setHeaderOptions]);

  const handleProceedingsSuccess = (message?: string) => {
    fetchCancelInfo({ replaceRequestOnly: true }); // Reload details
    // Give the user a moment to see the success confirmation before returning Home
    setTimeout(() => {
      router.push('/');
    }, 1500);
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-slate-50 flex items-center justify-center px-4'>
        <div className='rounded-2xl bg-white px-8 py-10 shadow-lg border border-slate-200 text-center'>
          <div className='mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-700' />
          <p className='text-slate-600'>Loading cancellation request…</p>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className='min-h-screen bg-slate-50 flex items-center justify-center px-4'>
        <div className='max-w-md rounded-2xl bg-white p-8 shadow-lg border border-slate-200 text-center'>
          <h1 className='text-2xl font-bold text-slate-900'>Cancellation Request Not Found</h1>
          <p className='mt-3 text-slate-600'>
            {error || 'The selected cancellation request could not be loaded.'}
          </p>
          <div className='mt-6 flex flex-wrap justify-center gap-3'>
            <button
              type='button'
              onClick={() => router.back()}
              className='flex items-center gap-2 rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white shadow-md transition hover:bg-blue-800'
            >
              <Home size={16} />
              Go Back
            </button>
            <button
              type='button'
              onClick={() => router.push('/inbox?type=all')}
              className='rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800'
            >
              Back to Applications
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Authorization check matching ApplicationDetailClient.tsx
  const currentUserId = user?.id ? Number(user.id) : null;
  const requestUserId = request?.currentUserId ? Number(request.currentUserId) : null;
  const isClosed = request?.status === 'CLOSE' || request?.workflowStatus?.code === 'CLOSE';
  const canTakeAction =
    currentUserId !== null &&
    requestUserId !== null &&
    currentUserId === requestUserId &&
    !isClosed;
  const showApplicationProcessingSection = activeTab === 'info';

  return (
    <div className='min-h-screen bg-slate-50 font-[family-name:var(--font-geist-sans)] print:min-h-0 print:bg-white'>
      <main className='w-full'>
        <div className='w-full'>
          <div className='space-y-6'>
            <CancelRequestDetail
              request={request}
              licenseId={request.licenseId}
              licenseNumber={request.licenseNumber}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              loading={cancelInfoLoading}
              loadOriginal={originalLoaded}
            />

            {activeTab === 'info' && (
            <div className='rounded-3xl bg-white shadow-xl border border-slate-200 overflow-hidden print:hidden'>
              <div className='p-4 lg:p-4 border-t border-gray-100'>
                <div
                  ref={containerRef}
                  className='flex h-[600px] items-stretch gap-0 relative w-full overflow-hidden'
                  style={{
                    display: 'flex',
                  }}
                >
                  {showApplicationProcessingSection && (
                    <>
                      <div
                        className='flex flex-col h-full overflow-hidden pr-4'
                        style={{
                          width: `${dividerPosition}%`,
                          transition: isDragging ? 'none' : 'width 0.1s ease',
                        }}
                      >
                          <div className='pb-4 border-b border-gray-100 mb-4'>
                            <h3 className='text-xl font-bold text-gray-900 flex items-center'>
                              <div className='w-1 h-6 bg-red-600 rounded-full mr-3'></div>
                              Application Processing
                            </h3>
                          </div>
                          {(() => {
                          // Check for final/closed status first — if final, show only a status message
                          const finalStatuses = ['REJECTED', 'CANCELLED', 'DISPOSED', 'CLOSE'];
                          const rawStatusCode = request?.workflowStatus?.code || request?.status || '';
                          const rawStatusName = request?.workflowStatus?.name || rawStatusCode;
                          const isFinalStatus = finalStatuses.some(s => 
                            String(rawStatusCode).toUpperCase() === s || 
                            String(rawStatusName).toUpperCase() === s
                          );
                          if (isFinalStatus) {
                            const displayStatus = String(rawStatusName).charAt(0).toUpperCase() + String(rawStatusName).slice(1).toLowerCase();
                            const isClosedStatus = String(rawStatusCode).toUpperCase() === 'CLOSE' || String(rawStatusName).toUpperCase() === 'CLOSE';
                            return (
                              <div className='bg-amber-50 border-2 border-amber-400 rounded-xl p-4 flex items-start gap-3 shadow-sm'>
                                <div className='p-1.5 rounded-full bg-amber-100 text-amber-600 flex-shrink-0'>
                                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' />
                                  </svg>
                                </div>
                                <div>
                                  <p className='text-sm font-semibold text-amber-900'>
                                    {isClosedStatus ? (
                                      <>Your application has been <span className='uppercase font-bold'>Closed</span>. No further processing is allowed.</>
                                    ) : (
                                      <>Your application has been <span className='uppercase font-bold'>{displayStatus}</span>. No further processing is allowed.</>
                                    )}
                                  </p>
                                </div>
                              </div>
                            );
                          }
                          return canTakeAction ? (
                            <div className='flex-1 bg-white overflow-y-auto'>
                              <ProceedingsForm
                                applicationId={String(id)}
                                onSuccess={handleProceedingsSuccess}
                                userRole={userRole}
                                applicationData={request}
                              />
                            </div>
                          ) : (
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
                                  {isClosed ? 'Request Closed / Processed' : 'Action Not Available'}
                                </h4>
                                <p className='text-sm text-yellow-700 leading-relaxed'>
                                  {isClosed
                                    ? 'This cancellation request has been completed. No further actions can be taken.'
                                    : 'At this point, you cannot take action on this request. This request is currently assigned to another user.'}
                                </p>
                                {!isClosed && request?.currentUser && (
                                  <p className='text-sm text-yellow-700 mt-2 font-medium'>
                                    <span>Current handler:</span> {request.currentUser.username}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );})()}
                      </div>

                      <div
                        ref={dividerRef}
                        onMouseDown={handleDividerMouseDown}
                        className='w-1 bg-gradient-to-b from-transparent via-gray-300 to-transparent hover:bg-gradient-to-b hover:from-transparent hover:via-red-400 hover:to-transparent cursor-col-resize transition-all duration-200 group relative'
                        style={{
                          cursor: 'col-resize',
                          userSelect: 'none',
                        }}
                      >
                        <div className='absolute inset-y-0 -left-1 -right-1 group-hover:bg-red-400/10 transition-colors duration-200'></div>
                      </div>
                    </>
                  )}

                  <div
                    className={`flex flex-col h-full overflow-hidden ${showApplicationProcessingSection ? 'pl-4' : ''}`}
                    style={{
                      width: showApplicationProcessingSection
                        ? `${100 - dividerPosition}%`
                        : '100%',
                      transition: isDragging ? 'none' : 'width 0.1s ease',
                    }}
                  >
                    <div className='flex items-center justify-between mb-4'>
                      <h3 className='text-lg font-semibold text-gray-900 flex items-center'>
                        <div className='w-1 h-5 bg-red-600 rounded-full mr-3'></div>
                        Application History
                      </h3>
                    </div>

                    <div className='flex-1 bg-white rounded-xl border border-gray-200 shadow-sm h-full overflow-hidden'>
                      <div className='overflow-y-auto p-6 custom-scrollbar h-full'>
                        {request.cancelWorkflowHistories &&
                        request.cancelWorkflowHistories.length > 0 ? (
                          <div className='space-y-5'>
                            {request.cancelWorkflowHistories.map((h: any, idx: number) => {
                              const actionTaken = h?.actionTaken || 'Processed';
                              const statusStyle = getStatusStyle(actionTaken);
                              const borderColor = statusStyle.border;
                              const backgroundColor = hexToRgba(borderColor, 0.05);
                              const attachmentsArr = h.attachments || [];
                              const hasAttachments =
                                Array.isArray(attachmentsArr) && attachmentsArr.length > 0;
                              const hasRemarks = !!h.remarks;
                              const hasDetails = hasAttachments || hasRemarks;
                              const isExpanded = !!expandedHistory[idx];
                              const historyDate = h.createdAt ? new Date(h.createdAt) : new Date();
                              const formattedDate = historyDate.toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              });
                              const formattedTime = historyDate.toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              });

                              const previousUserName = h.previousUser?.username || 'Initiator';
                              const previousRoleName = h.previousRole?.name || 'Role';
                              const nextUserName = h.nextUser?.username;
                              const nextRoleName = h.nextRole?.name;

                              return (
                                <div
                                  key={h.id}
                                  className='border-l-4 pl-4 pr-4 py-3 rounded-r-lg transition-all duration-200 hover:shadow-sm'
                                  style={{
                                    borderLeftColor: borderColor,
                                    backgroundColor: backgroundColor,
                                  }}
                                >
                                  <div className='flex items-start justify-between'>
                                    <div className='flex-1'>
                                      <p className='font-semibold text-gray-900 text-sm'>
                                        {previousUserName}
                                      </p>
                                      <p className='text-xs text-gray-600 mt-0.5'>
                                        {previousRoleName}
                                      </p>
                                      <p className='text-sm text-gray-700 font-medium mt-1'>
                                        {actionTaken}
                                      </p>
                                      {nextUserName &&
                                        !(
                                          h.previousUserId &&
                                          h.nextUserId &&
                                          Number(h.previousUserId) === Number(h.nextUserId)
                                        ) && (
                                          <p className='text-xs text-gray-600 mt-1'>
                                            → Forwarded to:{' '}
                                            <span className='font-medium'>{nextUserName}</span> (
                                            {nextRoleName})
                                          </p>
                                        )}
                                      <p className='text-xs text-gray-500 mt-1 flex items-center'>
                                        <ClockIcon className='w-3 h-3 mr-1' />
                                        {formattedDate} {formattedTime}
                                      </p>
                                    </div>
                                    {hasDetails && (
                                      <button
                                        type='button'
                                        onClick={() => {
                                          setExpandedHistory(prev => ({
                                            ...prev,
                                            [idx]: !prev[idx],
                                          }));
                                        }}
                                        className={`ml-4 text-sm font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 flex items-center group relative ${
                                          isExpanded
                                            ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700'
                                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                        }`}
                                      >
                                        <ChevronDownIcon
                                          className={`w-4 h-4 mr-2 transform transition-all duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                                        />
                                        {isExpanded ? 'Hide' : 'Show more'}
                                      </button>
                                    )}
                                  </div>
                                  {hasRemarks && isExpanded && (
                                    <div className='mt-3 p-4 bg-white rounded-lg border border-gray-200 shadow-sm'>
                                      <div className='text-base font-semibold text-gray-800 mb-3'>
                                        Remarks
                                      </div>
                                      <div className='flex text-sm text-gray-700 leading-relaxed whitespace-pre-line'>
                                        <RichTextDisplay content={h.remarks} />
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
                                          const displayName = truncateFilename(
                                            att?.name || 'Attachment',
                                            10
                                          );
                                          return (
                                            <div
                                              key={aidx}
                                              className='flex items-center text-xs text-blue-700 min-w-0'
                                            >
                                              <button
                                                onClick={() => openAttachment(att)}
                                                className='hover:underline font-medium text-left truncate flex items-center gap-1.5'
                                              >
                                                <FileText className='w-4 h-4 text-rose-500' />
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
                          <div className='flex flex-col items-center justify-center h-full text-center py-8'>
                            <History className='w-12 h-12 text-gray-300 mb-4' />
                            <p className='text-gray-500 text-sm font-medium'>
                              No history available
                            </p>
                            <p className='text-gray-400 text-xs mt-1'>
                              Cancellation history will appear here when actions are taken
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
