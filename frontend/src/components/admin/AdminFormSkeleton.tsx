import React from 'react';

interface AdminFormSkeletonProps {
  fields?: number;
  showButton?: boolean;
}

export const AdminFormSkeleton: React.FC<AdminFormSkeletonProps> = ({
  fields = 5,
  showButton = true,
}) => {
  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="mb-4">
          {/* Label skeleton */}
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2" />
          {/* Input skeleton */}
          <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
        </div>
      ))}

      {showButton && (
        <div className="flex gap-4 mt-6">
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
      )}
    </div>
  );
};
