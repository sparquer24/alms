import React from 'react';

export const AdminTableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 4,
}) => {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-xs">
      {/* Table Toolbar Placeholder */}
      <div className="p-4 border-b border-slate-200/80 flex items-center justify-between gap-3">
        <div className="h-9 w-64 rounded-lg flag-skeleton-shimmer" />
        <div className="flex items-center gap-2">
          <div className="h-9 w-24 rounded-lg flag-skeleton-shimmer" />
          <div className="h-9 w-28 rounded-lg flag-skeleton-shimmer" />
        </div>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="p-4 text-left">
                <div className="h-3.5 w-24 rounded flag-skeleton-shimmer" />
              </th>
            ))}
            <th className="p-4 text-right w-24">
              <div className="h-3.5 w-16 rounded flag-skeleton-shimmer ml-auto" />
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {Array.from({ length: rows }).map((_, rowI) => (
            <tr key={rowI} className={`hover:bg-slate-50/50 ${rowI % 2 === 1 ? 'bg-[#fafbfc]' : 'bg-white'}`}>
              {Array.from({ length: columns }).map((_, colI) => (
                <td key={colI} className="p-4">
                  {colI === columns - 1 ? (
                    <div className="h-5 w-20 rounded-full flag-skeleton-shimmer" />
                  ) : (
                    <div className="h-4 w-32 rounded-md flag-skeleton-shimmer" />
                  )}
                </td>
              ))}
              <td className="p-4 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <div className="h-7 w-7 rounded-lg flag-skeleton-shimmer" />
                  <div className="h-7 w-7 rounded-lg flag-skeleton-shimmer" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination Footer Placeholder */}
      <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-200/80 flex items-center justify-between">
        <div className="h-3.5 w-44 rounded flag-skeleton-shimmer" />
        <div className="flex items-center gap-1.5">
          <div className="h-8 w-8 rounded-lg flag-skeleton-shimmer" />
          <div className="h-8 w-8 rounded-lg flag-skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
};
