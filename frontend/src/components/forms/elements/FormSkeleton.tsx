import React from 'react';
import { Spinner } from './Spinner';

interface FormSkeletonProps {
  title?: string;
  rows?: number;
}

export const FormSkeleton: React.FC<FormSkeletonProps> = ({ title, rows = 4 }) => {
  return (
    <div className="p-6 animate-pulse">
      {title && <h2 className="text-xl font-bold mb-6 text-gray-800">{title}</h2>}
      
      <div className="mb-4 p-3 bg-gray-100 border border-gray-200 rounded h-16 w-full max-w-md"></div>
      
      <div className="space-y-6 mt-8">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-10 bg-gray-100 border-b-2 border-gray-200 w-full"></div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-100 border-b-2 border-gray-200 w-full"></div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-center items-center py-12">
        <div className="flex flex-col items-center gap-4 text-gray-500">
          <Spinner size="lg" color="text-blue-600" />
          <span className="text-sm font-medium">Loading form data...</span>
        </div>
      </div>
    </div>
  );
};
