import React from 'react';

interface AdminSectionSkeletonProps {
  lines?: number;
  height?: string;
}

export const AdminSectionSkeleton: React.FC<AdminSectionSkeletonProps> = ({
  lines = 5,
  height = '400px',
}) => {
  return (
    <div
      className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4"
      style={{ minHeight: height }}
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-6">
        <div className="h-5 w-44 rounded-md flag-skeleton-shimmer" />
        <div className="h-5 w-20 rounded-full flag-skeleton-shimmer" />
      </div>

      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`rounded flag-skeleton-shimmer ${
            i === 0 ? 'h-5 w-1/3 mb-4' : 'h-4'
          } ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  );
};
