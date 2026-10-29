import React from 'react';

interface AdminCardSkeletonProps {
  count?: number;
}

export const AdminCardSkeleton: React.FC<AdminCardSkeletonProps> = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs ${
            i < count - 1 ? 'mb-4' : ''
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div className="h-5 w-1/3 rounded-md flag-skeleton-shimmer" />
            <div className="h-5 w-20 rounded-full flag-skeleton-shimmer" />
          </div>

          {/* Content lines */}
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, j) => (
              <div
                key={j}
                className={`h-4 rounded flag-skeleton-shimmer ${
                  j === 2 ? 'w-4/5' : 'w-full'
                }`}
              />
            ))}
          </div>
        </div>
      ))}
    </>
  );
};
