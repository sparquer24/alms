import React from 'react';

interface FeatureUnavailableProps {
  title: string;
  description?: string;
}

/**
 * Honest placeholder for admin screens that aren't backed by a real API yet.
 * Used in place of pages that previously rendered hardcoded mock data and
 * dead-end Create/Edit/View buttons as if the feature were live.
 */
export function FeatureUnavailable({ title, description }: FeatureUnavailableProps) {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
          <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-500 max-w-md mx-auto">
          {description || 'This section is not connected to a backend yet, so no changes made here would be saved. It is disabled until that work is done.'}
        </p>
      </div>
    </div>
  );
}
