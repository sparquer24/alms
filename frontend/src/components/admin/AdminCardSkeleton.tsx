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
          className={`bg-white rounded-lg p-6 border border-gray-200 ${i < count - 1 ? 'mb-4' : ''}`}
        >
          {/* Title skeleton */}
          <div className="h-6 w-1/3 bg-gray-200 rounded animate-pulse mb-4" />

          {/* Content skeleton */}
          {Array.from({ length: 3 }).map((_, j) => (
            <div
              key={j}
              className={`h-4 bg-gray-200 rounded animate-pulse mb-3 ${j === 2 ? 'w-4/5' : 'w-full'}`}
            />
          ))}
        </div>
      ))}
    </>
  );
};
