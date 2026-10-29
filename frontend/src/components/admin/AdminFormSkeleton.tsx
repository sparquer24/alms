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
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="h-5 w-40 rounded-md flag-skeleton-shimmer" />
        <div className="h-5 w-16 rounded-full flag-skeleton-shimmer" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            {/* Label skeleton */}
            <div className="h-3.5 w-32 rounded flag-skeleton-shimmer" />
            {/* Input skeleton */}
            <div className="h-10 w-full rounded-xl flag-skeleton-shimmer" />
          </div>
        ))}
      </div>

      {showButton && (
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
          <div className="h-10 w-28 rounded-xl flag-skeleton-shimmer" />
          <div className="h-10 w-32 rounded-xl flag-skeleton-shimmer" />
        </div>
      )}
    </div>
  );
};
