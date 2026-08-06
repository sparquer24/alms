'use client';

import React from 'react';
import SubmitCancelForm from '@/components/cancelForm/SubmitCancelForm';

export default function NewCancelFormPage() {
  return (
    <div className='w-full min-h-screen bg-gray-50 p-6'>
      <div className='mb-6'>
        <button
          onClick={() => window.history.back()}
          className='flex items-center text-sm font-medium text-gray-600 hover:text-red-600 transition-colors'
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Go Back
        </button>
      </div>
      <SubmitCancelForm />
    </div>
  );
}
