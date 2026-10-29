import React from 'react';

interface FormSkeletonProps {
  title?: string;
  rows?: number;
}

export const FormSkeleton: React.FC<FormSkeletonProps> = ({ title, rows = 4 }) => {
  return (
    <div className="space-y-6">
      {title ? (
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h2>
            <div className="h-3.5 w-48 rounded flag-skeleton-shimmer" />
          </div>
          <div className="h-6 w-24 rounded-full flag-skeleton-shimmer" />
        </div>
      ) : (
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flag-skeleton-shimmer" />
            <div className="space-y-1">
              <div className="h-5 w-44 rounded-md flag-skeleton-shimmer" />
              <div className="h-3 w-32 rounded flag-skeleton-shimmer opacity-70" />
            </div>
          </div>
          <div className="h-6 w-20 rounded-full flag-skeleton-shimmer" />
        </div>
      )}

      {/* Info notice strip */}
      <div className="p-3.5 rounded-xl border border-blue-100/80 bg-blue-50/40 flex items-center gap-3">
        <div className="h-5 w-5 rounded-md flag-skeleton-shimmer shrink-0" />
        <div className="h-3.5 flex-1 rounded flag-skeleton-shimmer" />
      </div>

      {/* Form Fields Grid */}
      <div className="space-y-5 pt-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <div className="h-3.5 w-28 rounded flag-skeleton-shimmer" />
              <div className="h-10 w-full rounded-xl flag-skeleton-shimmer" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3.5 w-32 rounded flag-skeleton-shimmer" />
              <div className="h-10 w-full rounded-xl flag-skeleton-shimmer" />
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
        <div className="h-10 w-24 rounded-xl flag-skeleton-shimmer" />
        <div className="flex items-center gap-3">
          <div className="h-10 w-28 rounded-xl flag-skeleton-shimmer" />
          <div className="h-10 w-36 rounded-xl flag-skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
};
