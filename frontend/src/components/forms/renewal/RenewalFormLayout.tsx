'use client';

import React, { ReactNode, useState } from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import { useRenewalForm } from './RenewalFormContext';

interface RenewalFormLayoutProps {
  children: ReactNode;
  title?: string;
}

const RefreshCwIcon = FiRefreshCw as any;

const RenewalFormLayout: React.FC<RenewalFormLayoutProps> = ({
  children,
  title
}) => {
  const { state, invokeRefresh } = useRenewalForm();
  const [showDebug, setShowDebug] = useState(false);
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Stepper removed: showing full form without step navigation */}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {title && (
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              {state.applicantId && (
                <span className="text-sm text-blue-600 font-semibold">Application ID: {state.applicantId}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { void (invokeRefresh && invokeRefresh()); }}
                className="p-2 rounded hover:bg-gray-100"
                aria-label="Refresh data"
                title="Refresh data"
              >
                {state.isLoading ? (
                  <RefreshCwIcon className="w-6 h-6 text-blue-600 animate-spin" />
                ) : (
                  <RefreshCwIcon className="w-6 h-6 text-blue-600" />
                )}
              </button>

              <button
                type="button"
                onClick={() => { setShowDebug(prev => !prev); console.debug('Renewal form data:', state.formData); }}
                className="p-2 rounded hover:bg-gray-100 text-sm text-gray-600"
                aria-label="Toggle debug panel"
                title="Toggle debug panel"
              >
                Debug
              </button>
            </div>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {children}

          {/* Debug panel - collapsible */}
          {showDebug && (
            <div className="p-4 border-t bg-gray-50">
              <div className="flex justify-end mb-2 gap-2">
                <button
                  type="button"
                  onClick={() => { navigator.clipboard?.writeText(JSON.stringify(state.formData, null, 2)); }}
                  className="text-xs px-2 py-1 bg-blue-600 text-white rounded"
                >
                  Copy
                </button>
                <button
                  type="button"
                  onClick={() => { console.debug('Renewal form data:', state.formData); }}
                  className="text-xs px-2 py-1 bg-gray-200 rounded"
                >
                  Log
                </button>
              </div>
              <pre className="text-xs overflow-auto max-h-72 whitespace-pre-wrap bg-white p-2 rounded border">
                {JSON.stringify(state.formData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RenewalFormLayout;