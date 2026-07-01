'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import CancelRequestDetail from '@/components/cancelForm/CancelRequestDetail';
import ProceedingsForm from '@/components/ProceedingsForm';
import CancelService from '@/api/cancelService';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

const LoaderFixed = Loader2 as any;

export default function CancelFormDetailClient() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { userRole } = useAuth();
  
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [dividerPosition, setDividerPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchRequest = async () => {
    try {
      setLoading(true);
      const res = await CancelService.getCancelRequestById(Number(id));
      const reqData = res?.data || res;
      // Synthesize workflowHistory for ProceedingsForm compatibility if needed
      // Actually ProceedingsForm just needs `applicationData.applicationType` and `applicationData.id`
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

  const handleDividerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      if (newWidth >= 20 && newWidth <= 80) {
        setDividerPosition(newWidth);
      }
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoaderFixed className="w-8 h-8 animate-spin text-red-600 mr-3" />
        <span className="text-xl font-medium text-gray-700">Loading request...</span>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="p-8">
        <div className="bg-red-50 text-red-700 p-6 rounded-lg text-center font-medium max-w-2xl mx-auto shadow-sm border border-red-100">
          {error || 'Request not found'}
        </div>
      </div>
    );
  }

  // Determine if action panel should be shown (if PENDING/not final state)
  // Usually this relies on workflow logic, we show ProceedingsForm unconditionally if user role is valid.
  const isPending = request.status === 'PENDING' || request.workflowStatus?.code?.toUpperCase() !== 'APPROVED';

  return (
    <div className='flex flex-col h-full -m-6 md:-m-8'>
      {/* Header Back Button */}
      <div className='p-4 bg-white border-b border-gray-200 flex justify-between items-center shadow-sm'>
        <button
          onClick={() => router.back()}
          className='flex items-center text-sm font-medium text-gray-600 hover:text-red-600 transition-colors'
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
      </div>

      <div className='flex-1 overflow-hidden' ref={containerRef} style={{ display: 'flex' }}>
        {/* Left Side - Application Details */}
        <div 
          className='h-full overflow-y-auto p-6 transition-all'
          style={{ width: `${dividerPosition}%` }}
        >
          <CancelRequestDetail request={request} />
        </div>

        {/* Resizer */}
        <div
          onMouseDown={handleDividerMouseDown}
          className='w-1 bg-gray-200 hover:bg-red-400 cursor-col-resize transition-colors'
        />

        {/* Right Side - Proceedings/Action Panel */}
        <div 
          className='h-full flex flex-col bg-white border-l border-gray-200 transition-all'
          style={{ width: `${100 - dividerPosition}%` }}
        >
          <div className='p-4 border-b border-gray-100 bg-gray-50'>
            <h3 className='font-bold text-gray-800 flex items-center'>
              <div className='w-1 h-5 bg-red-600 rounded mr-2'></div>
              Workflow & Actions
            </h3>
          </div>
          <div className='flex-1 overflow-hidden bg-white'>
            <ProceedingsForm
              applicationId={String(id)}
              onSuccess={handleProceedingsSuccess}
              userRole={userRole}
              applicationData={request}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
