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
      className="bg-white rounded-lg p-6 border border-gray-200"
      style={{ minHeight: height }}
    >
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`bg-gray-200 rounded animate-pulse mb-4 ${i === 0 ? 'h-7' : 'h-4'} ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  );
};
