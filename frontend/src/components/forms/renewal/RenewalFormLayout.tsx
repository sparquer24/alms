'use client';

import React, { ReactNode } from 'react';
import { RefreshCw } from 'react-icons/fi';
import RenewalStepper from './RenewalStepper';

interface RenewalFormLayoutProps {
  children: ReactNode;
  showStepper?: boolean;
  title?: string;
}

const RefreshCwIcon = RefreshCw as any;

const RenewalFormLayout: React.FC<RenewalFormLayoutProps> = ({
  children,
  showStepper = true,
  title
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {showStepper && (
        <div className="sticky top-0 z-40">
          <RenewalStepper showLabels={true} orientation="horizontal" />
        </div>
      )}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {title && (
          <div className="mb-6 flex items-center gap-3">
            <RefreshCwIcon className="w-7 h-7 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {children}
        </div>
      </div>
    </div>
  );
};

export default RenewalFormLayout;