'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import CancelRequestDetail from '@/components/cancelForm/CancelRequestDetail';
import ProceedingsForm from '@/components/ProceedingsForm';
import CancelService from '@/api/cancelService';
import { useAuth } from '@/hooks/useAuth';
import { getStatusStyle } from '@/utils/statusColors';
import { truncateFilename } from '@/utils/string';
import { openAttachment } from '@/utils/attachmentViewer';
import { RichTextDisplay } from '@/components/RichTextDisplay';
import { Loader2, History, Clock, ChevronDown, FileText } from 'lucide-react';

const LoaderFixed = Loader2 as any;
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
  const id = params?.id as string;
  const { user, userRole } = useAuth();
  
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedHistory, setExpandedHistory] = useState<Record<number, boolean>>({});
  
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

  const fetchRequest = async () => {
    try {
      setLoading(true);
      const res = await CancelService.getCancelRequestById(Number(id));
      const reqData = res?.data || res;
      setRequest({
        ...reqData,
        applicationType: 'CancelFormRequest',
      });
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load cancel request details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchRequest();
  }, [id]);

  const handleProceedingsSuccess = (message?: string) => {
    fetchRequest(); // Reload details
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50">
        <LoaderFixed className="w-8 h-8 animate-spin text-red-600 mr-3" />
        <span className="text-xl font-medium text-gray-700">Loading request...</span>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="p-8 bg-slate-50 min-h-screen">
        <div className="bg-red-50 text-red-700 p-6 rounded-lg text-center font-medium max-w-2xl mx-auto shadow-sm border border-red-100">
          {error || 'Request not found'}
        </div>
      </div>
    );
  }

  // Authorization check matching ApplicationDetailClient.tsx
  const currentUserId = user?.id ? Number(user.id) : null;
  const requestUserId = request?.currentUserId ? Number(request.currentUserId) : null;
  const isClosed = request?.status === 'APPROVED' || request?.status === 'REJECTED';
  const canTakeAction = currentUserId !== null && requestUserId !== null && currentUserId === requestUserId && !isClosed;

  return (
    <div className='p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full bg-slate-50/50 min-h-screen font-[family-name:var(--font-geist-sans)]'>
      {/* Header Back Button */}
      <div className='flex justify-between items-center pb-4 border-b border-gray-200'>
        <button
          onClick={() => router.back()}
          className='flex items-center text-sm font-medium text-gray-600 hover:text-red-600 transition-colors bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm'
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
      </div>

      {/* Details Section */}
      <CancelRequestDetail request={request} />

      {/* Workflow & Actions and Cancellation History - Premium Resizable Split Layout */}
      <div
        className='p-6 lg:p-8 border-t border-gray-100 bg-white overflow-hidden print:hidden rounded-xl border border-gray-200 shadow-sm'
      >
        <div
          ref={containerRef}
          className='flex h-[600px] items-stretch gap-0 relative w-full overflow-hidden'
          style={{
            display: 'flex',
          }}
        >
          {/* Action Buttons - Left Side */}
          <div
            className='flex flex-col h-full overflow-hidden pr-4'
            style={{
              width: `${dividerPosition}%`,
              transition: isDragging ? 'none' : 'width 0.1s ease',
            }}
          >
            {canTakeAction ? (
              <div className='flex flex-col h-full overflow-hidden'>
                <div className='pb-4 border-b border-gray-100 mb-4'>
                  <h3 className='text-xl font-bold text-gray-900 flex items-center'>
                    <div className='w-1 h-6 bg-red-600 rounded-full mr-3'></div>
                    Workflow & Actions
                  </h3>
                </div>
                <div className="flex-1 bg-white overflow-y-auto">
                  <ProceedingsForm
                    applicationId={String(id)}
                    onSuccess={handleProceedingsSuccess}
                    userRole={userRole}
                    applicationData={request}
                  />
                </div>
              </div>
            ) : (
              <div className='bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg shadow-sm'>
                <div className='flex items-start'>
                  <svg className='w-6 h-6 text-yellow-600 mr-3 flex-shrink-0 mt-0.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' />
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
            )}
          </div>

          {/* Resizable Divider */}
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

          {/* Cancellation History - Right Side */}
          <div
            className='flex flex-col h-full overflow-hidden pl-4'
            style={{
              width: `${100 - dividerPosition}%`,
              transition: isDragging ? 'none' : 'width 0.1s ease',
            }}
          >
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold text-gray-900 flex items-center'>
                <div className='w-1 h-5 bg-red-600 rounded-full mr-3'></div>
                Cancellation History
              </h3>
            </div>

            <div className='flex-1 bg-white rounded-xl border border-gray-200 shadow-sm h-full overflow-hidden'>
              <div className='overflow-y-auto p-6 custom-scrollbar h-full'>
                {request.cancelWorkflowHistories && request.cancelWorkflowHistories.length > 0 ? (
                  <div className='space-y-5'>
                    {request.cancelWorkflowHistories.map((h: any, idx: number) => {
                      const actionTaken = h?.actionTaken || 'Processed';
                      const statusStyle = getStatusStyle(actionTaken);
                      const borderColor = statusStyle.border;
                      const backgroundColor = hexToRgba(borderColor, 0.05);
                      const attachmentsArr = h.attachments || [];
                      const hasAttachments = Array.isArray(attachmentsArr) && attachmentsArr.length > 0;
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
                              {nextUserName && !(h.previousUserId && h.nextUserId && Number(h.previousUserId) === Number(h.nextUserId)) && (
                                <p className='text-xs text-gray-600 mt-1'>
                                  → Forwarded to:{' '}
                                  <span className='font-medium'>{nextUserName}</span> ({nextRoleName})
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
                                <ChevronDownIcon className={`w-4 h-4 mr-2 transform transition-all duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
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
                                  const displayName = truncateFilename(att?.name || 'Attachment', 10);
                                  return (
                                    <div key={aidx} className='flex items-center text-xs text-blue-700 min-w-0'>
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
                    <p className='text-gray-500 text-sm font-medium'>No history available</p>
                    <p className='text-gray-400 text-xs mt-1'>Cancellation history will appear here when actions are taken</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
