'use client';

import React from 'react';

// Base Shimmer Placeholder
export const SkeletonShimmer: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200/80 rounded ${className}`} />
);

// 0. Left Sidebar Skeleton (matching ALMS Sidebar style)
export const DashboardSidebarSkeleton: React.FC = () => (
  <aside className="hidden md:flex z-40 w-60 h-[calc(100vh-2rem)] bg-white border border-gray-200 fixed left-4 top-4 bottom-4 flex-col shadow-lg rounded-2xl overflow-hidden animate-pulse">
    {/* Logo Header */}
    <div className="p-3 flex items-center gap-2 border-b border-gray-100">
      <div className="w-9 h-9 rounded-lg bg-gray-200"></div>
      <div className="space-y-1">
        <div className="h-3.5 w-24 bg-gray-300 rounded"></div>
        <div className="h-2.5 w-16 bg-gray-200 rounded"></div>
      </div>
    </div>

    {/* Top Nav item / Dashboard */}
    <div className="p-2 border-b border-gray-100">
      <div className="h-9 w-full rounded-lg bg-[#001F54]/15 flex items-center px-3 gap-2">
        <div className="w-4 h-4 bg-gray-300 rounded"></div>
        <div className="h-3 w-24 bg-gray-300 rounded"></div>
      </div>
    </div>

    {/* Nav Menu Items */}
    <div className="p-3 space-y-3 flex-1 overflow-y-auto">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg">
          <div className="w-4 h-4 rounded bg-gray-200 shrink-0"></div>
          <div className="h-3 w-28 bg-gray-200 rounded flex-1"></div>
        </div>
      ))}
    </div>

    {/* Bottom User Profile Badge */}
    <div className="p-3 border-t border-gray-100 bg-gray-50 flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0"></div>
      <div className="space-y-1 flex-1">
        <div className="h-3 w-20 bg-gray-300 rounded"></div>
        <div className="h-2 w-14 bg-gray-200 rounded"></div>
      </div>
    </div>
  </aside>
);

// 1. KPI Cards Skeleton (6 Cards Grid)
export const DashboardKpiCardsSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
    {Array.from({ length: 6 }).map((_, i) => (
      <div
        key={i}
        className="bg-white rounded-xl p-5 border border-gray-200/80 shadow-xs flex flex-col justify-between h-[154px] animate-pulse"
      >
        <div>
          {/* Card Top Title & Icon Box */}
          <div className="flex items-center justify-between">
            <div className="h-3 w-24 bg-gray-200 rounded"></div>
            <div className="w-8 h-8 rounded-lg bg-gray-200"></div>
          </div>
          {/* Large Number */}
          <div className="mt-3 h-7 w-20 bg-gray-300 rounded"></div>
          {/* Trend/Subtitle */}
          <div className="mt-1.5 h-3 w-28 bg-gray-200 rounded"></div>
        </div>
        {/* Bottom Split Footer */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
          <div className="h-2.5 w-16 bg-gray-200 rounded"></div>
          <div className="h-2.5 w-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    ))}
  </div>
);

// 2. Interactive Charts Section Skeleton
export const DashboardChartsSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
    {/* Main Trend Chart Skeleton (2 Cols) */}
    <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-200/80 shadow-xs flex flex-col justify-between min-h-[380px]">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
          <div className="space-y-1.5">
            <div className="h-4 w-48 bg-gray-300 rounded"></div>
            <div className="h-3 w-64 bg-gray-200 rounded"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-7 w-20 bg-gray-200 rounded-lg"></div>
            <div className="h-7 w-20 bg-gray-200 rounded-lg"></div>
          </div>
        </div>

        {/* Chart Canvas Simulated Bars/Curves */}
        <div className="mt-8 flex items-end justify-between h-[220px] pt-6 px-4 gap-2 border-b border-gray-100">
          {[40, 65, 30, 85, 55, 90, 70, 45, 80, 60, 95, 75].map((val, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-full max-w-[28px] bg-gradient-to-t from-gray-300/80 to-gray-200/60 rounded-t-md"
                style={{ height: `${val}%` }}
              ></div>
              <div className="h-2.5 w-6 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart Footer Benchmarks */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
        <div className="h-3 w-36 bg-gray-200 rounded"></div>
        <div className="h-3 w-28 bg-gray-200 rounded"></div>
      </div>
    </div>

    {/* Pie & Ratio Breakdown Skeleton (1 Col) */}
    <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-xs flex flex-col justify-between min-h-[380px]">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="space-y-1">
            <div className="h-4 w-36 bg-gray-300 rounded"></div>
            <div className="h-3 w-48 bg-gray-200 rounded"></div>
          </div>
          <div className="w-6 h-6 rounded bg-gray-200"></div>
        </div>

        {/* Circular Donut Skeleton */}
        <div className="py-6 flex justify-center items-center">
          <div className="w-36 h-36 rounded-full border-[14px] border-gray-200/90 flex items-center justify-center">
            <div className="h-4 w-12 bg-gray-300 rounded"></div>
          </div>
        </div>

        {/* Breakdown Legend Items */}
        <div className="space-y-2.5 mt-2">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                <div className="h-3 w-24 bg-gray-200 rounded"></div>
              </div>
              <div className="h-3 w-12 bg-gray-300 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// 3. Drill-Down Workbench Skeleton
export const DashboardDrillDownSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200/80 shadow-xs animate-pulse space-y-4">
    {/* Section Header */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
      <div className="space-y-1.5">
        <div className="h-4 w-56 bg-gray-300 rounded"></div>
        <div className="h-3 w-80 bg-gray-200 rounded"></div>
      </div>
      <div className="h-8 w-36 bg-gray-200 rounded-lg"></div>
    </div>

    {/* Tab Pills Bar */}
    <div className="flex items-center gap-2 py-2 border-b border-gray-100 overflow-x-auto">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div key={idx} className="h-7 w-28 bg-gray-200 rounded-lg shrink-0"></div>
      ))}
    </div>

    {/* Table Rows Skeleton */}
    <div className="overflow-x-auto pt-2">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-gray-200">
            {Array.from({ length: 7 }).map((_, i) => (
              <th key={i} className="py-3 px-4"><div className="h-3.5 w-16 bg-gray-200 rounded"></div></th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {Array.from({ length: 5 }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              <td className="py-3.5 px-4"><div className="h-3 w-6 bg-gray-200 rounded"></div></td>
              <td className="py-3.5 px-4"><div className="h-3.5 w-28 bg-gray-200 rounded"></div></td>
              <td className="py-3.5 px-4"><div className="h-3.5 w-32 bg-gray-200 rounded"></div></td>
              <td className="py-3.5 px-4"><div className="h-4 w-20 bg-gray-200 rounded-full"></div></td>
              <td className="py-3.5 px-4"><div className="h-4 w-24 bg-gray-200 rounded-full"></div></td>
              <td className="py-3.5 px-4"><div className="h-3.5 w-24 bg-gray-200 rounded"></div></td>
              <td className="py-3.5 px-4 text-right"><div className="h-6 w-16 bg-gray-200 rounded ml-auto"></div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// 4. District Distribution Cards Skeleton
export const DashboardDistrictsSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-xs animate-pulse space-y-4">
    <div className="flex items-center justify-between pb-4 border-b border-gray-100">
      <div className="space-y-1">
        <div className="h-4 w-48 bg-gray-300 rounded"></div>
        <div className="h-3 w-64 bg-gray-200 rounded"></div>
      </div>
      <div className="h-6 w-24 bg-gray-200 rounded-full"></div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="p-4 rounded-xl border border-gray-200/80 bg-gray-50/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-4 w-24 bg-gray-300 rounded"></div>
            <div className="h-4 w-12 bg-gray-200 rounded-full"></div>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <div className="h-3 w-16 bg-gray-200 rounded"></div>
              <div className="h-3 w-8 bg-gray-300 rounded"></div>
            </div>
            <div className="w-full bg-gray-200 h-2 rounded-full"></div>
          </div>
          <div className="pt-2 border-t border-gray-200/60 flex justify-between text-xs">
            <div className="h-2.5 w-16 bg-gray-200 rounded"></div>
            <div className="h-2.5 w-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// 5. Activity Feed Skeleton
export const DashboardActivitySkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-xs animate-pulse space-y-4">
    <div className="flex items-center justify-between pb-4 border-b border-gray-100">
      <div className="h-4 w-52 bg-gray-300 rounded"></div>
      <div className="h-3 w-28 bg-gray-200 rounded"></div>
    </div>

    <div className="divide-y divide-gray-100 space-y-1">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="py-3 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-gray-200 shrink-0"></div>
            <div className="space-y-1.5">
              <div className="h-3.5 w-44 bg-gray-300 rounded"></div>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-20 bg-gray-200 rounded"></div>
                <div className="h-2.5 w-16 bg-gray-200 rounded"></div>
                <div className="h-2.5 w-24 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
          <div className="h-3 w-14 bg-gray-200 rounded shrink-0"></div>
        </div>
      ))}
    </div>
  </div>
);

// 6. Complete Full-Page Dashboard Skeleton Layout
export const DashboardFullSkeleton: React.FC = () => (
  <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
    {/* Section 1: KPI Cards */}
    <DashboardKpiCardsSkeleton />

    {/* Section 2: Drill-Down Workbench */}
    <DashboardDrillDownSkeleton />

    {/* Section 3: Charts & Analytics */}
    <DashboardChartsSkeleton />

    {/* Section 4: Top Jurisdictions */}
    <DashboardDistrictsSkeleton />

    {/* Section 5: Activity Feed */}
    <DashboardActivitySkeleton />
  </div>
);

export default DashboardFullSkeleton;
