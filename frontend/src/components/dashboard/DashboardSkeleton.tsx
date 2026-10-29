'use client';

import React from 'react';

// Base Shimmer Placeholder
export const SkeletonShimmer: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flag-skeleton-shimmer rounded ${className}`} />
);

// 0. Left Sidebar Skeleton (matching ALMS Sidebar style)
export const DashboardSidebarSkeleton: React.FC = () => (
  <aside className="hidden md:flex z-40 w-60 h-[calc(100vh-2rem)] bg-white border border-gray-200/90 fixed left-4 top-4 bottom-4 flex-col shadow-lg rounded-2xl overflow-hidden">
    {/* Logo Header */}
    <div className="p-3.5 flex items-center gap-3 border-b border-gray-100 bg-white">
      <div className="w-9 h-9 rounded-xl flag-skeleton-shimmer shrink-0" />
      <div className="space-y-1 flex-1">
        <div className="h-3.5 w-24 rounded flag-skeleton-shimmer" />
        <div className="h-2.5 w-16 rounded flag-skeleton-shimmer opacity-70" />
      </div>
    </div>

    {/* Top Nav item / Dashboard */}
    <div className="p-2 border-b border-gray-100">
      <div className="h-9 w-full rounded-xl bg-[#001F54]/10 flex items-center px-3 gap-2">
        <div className="w-4 h-4 rounded flag-skeleton-shimmer" />
        <div className="h-3.5 w-24 rounded flag-skeleton-shimmer" />
      </div>
    </div>

    {/* Nav Menu Items */}
    <div className="p-2.5 space-y-1.5 flex-1 overflow-y-auto">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-xl">
          <div className="w-4 h-4 rounded flag-skeleton-shimmer shrink-0" />
          <div className="h-3 w-28 rounded flag-skeleton-shimmer flex-1" />
        </div>
      ))}
    </div>

    {/* Bottom User Profile Badge */}
    <div className="p-3 border-t border-gray-100 bg-slate-50 flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-full flag-skeleton-shimmer shrink-0" />
      <div className="space-y-1 flex-1">
        <div className="h-3 w-20 rounded flag-skeleton-shimmer" />
        <div className="h-2 w-14 rounded flag-skeleton-shimmer opacity-70" />
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
        className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between h-[154px]"
      >
        <div>
          {/* Card Top Title & Icon Box */}
          <div className="flex items-center justify-between">
            <div className="h-3 w-24 rounded flag-skeleton-shimmer" />
            <div className="w-8 h-8 rounded-xl flag-skeleton-shimmer" />
          </div>
          {/* Large Number */}
          <div className="mt-3.5 h-7 w-20 rounded-md flag-skeleton-shimmer" />
          {/* Trend/Subtitle */}
          <div className="mt-1.5 h-3 w-28 rounded flag-skeleton-shimmer opacity-70" />
        </div>
        {/* Bottom Split Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="h-2.5 w-16 rounded flag-skeleton-shimmer" />
          <div className="h-2.5 w-14 rounded flag-skeleton-shimmer" />
        </div>
      </div>
    ))}
  </div>
);

// 2. Interactive Charts Section Skeleton
export const DashboardChartsSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    {/* Main Trend Chart Skeleton (2 Cols) */}
    <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between min-h-[380px]">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div className="space-y-1.5">
            <div className="h-4 w-48 rounded-md flag-skeleton-shimmer" />
            <div className="h-3 w-64 rounded flag-skeleton-shimmer opacity-70" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-7 w-20 rounded-lg flag-skeleton-shimmer" />
            <div className="h-7 w-20 rounded-lg flag-skeleton-shimmer" />
          </div>
        </div>

        {/* Chart Canvas Simulated Bars */}
        <div className="mt-8 flex items-end justify-between h-[220px] pt-6 px-4 gap-2 border-b border-slate-100">
          {[40, 65, 30, 85, 55, 90, 70, 45, 80, 60, 95, 75].map((val, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-full max-w-[28px] rounded-t-md flag-skeleton-shimmer"
                style={{ height: `${val}%` }}
              />
              <div className="h-2.5 w-6 rounded flag-skeleton-shimmer" />
            </div>
          ))}
        </div>
      </div>

      {/* Chart Footer Benchmarks */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="h-3 w-36 rounded flag-skeleton-shimmer" />
        <div className="h-3 w-28 rounded flag-skeleton-shimmer" />
      </div>
    </div>

    {/* Pie & Ratio Breakdown Skeleton (1 Col) */}
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between min-h-[380px]">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="space-y-1">
            <div className="h-4 w-36 rounded-md flag-skeleton-shimmer" />
            <div className="h-3 w-48 rounded flag-skeleton-shimmer opacity-70" />
          </div>
          <div className="w-6 h-6 rounded-lg flag-skeleton-shimmer" />
        </div>

        {/* Circular Donut Skeleton */}
        <div className="py-6 flex justify-center items-center">
          <div className="w-36 h-36 rounded-full border-[14px] border-slate-200/80 flex items-center justify-center">
            <div className="h-4 w-12 rounded flag-skeleton-shimmer" />
          </div>
        </div>

        {/* Breakdown Legend Items */}
        <div className="space-y-2.5 mt-2">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flag-skeleton-shimmer" />
                <div className="h-3 w-24 rounded flag-skeleton-shimmer" />
              </div>
              <div className="h-3 w-12 rounded flag-skeleton-shimmer" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// 3. Drill-Down Workbench Skeleton
export const DashboardDrillDownSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
    {/* Section Header */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
      <div className="space-y-1.5">
        <div className="h-4 w-56 rounded-md flag-skeleton-shimmer" />
        <div className="h-3 w-80 rounded flag-skeleton-shimmer opacity-70" />
      </div>
      <div className="h-8 w-36 rounded-xl flag-skeleton-shimmer" />
    </div>

    {/* Tab Pills Bar */}
    <div className="flex items-center gap-2 py-2 border-b border-slate-100 overflow-x-auto">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div key={idx} className="h-7 w-28 rounded-lg flag-skeleton-shimmer shrink-0" />
      ))}
    </div>

    {/* Table Rows Skeleton */}
    <div className="overflow-x-auto pt-2">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-200">
            {Array.from({ length: 7 }).map((_, i) => (
              <th key={i} className="py-3 px-4">
                <div className="h-3.5 w-16 rounded flag-skeleton-shimmer" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {Array.from({ length: 5 }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              <td className="py-3.5 px-4"><div className="h-3 w-6 rounded flag-skeleton-shimmer" /></td>
              <td className="py-3.5 px-4"><div className="h-3.5 w-28 rounded-md flag-skeleton-shimmer" /></td>
              <td className="py-3.5 px-4"><div className="h-3.5 w-32 rounded-md flag-skeleton-shimmer" /></td>
              <td className="py-3.5 px-4"><div className="h-5 w-20 rounded-full flag-skeleton-shimmer" /></td>
              <td className="py-3.5 px-4"><div className="h-5 w-24 rounded-full flag-skeleton-shimmer" /></td>
              <td className="py-3.5 px-4"><div className="h-3.5 w-24 rounded flag-skeleton-shimmer" /></td>
              <td className="py-3.5 px-4 text-right"><div className="h-6 w-16 rounded-lg flag-skeleton-shimmer ml-auto" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// 4. District Distribution Cards Skeleton
export const DashboardDistrictsSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
      <div className="space-y-1">
        <div className="h-4 w-48 rounded-md flag-skeleton-shimmer" />
        <div className="h-3 w-64 rounded flag-skeleton-shimmer opacity-70" />
      </div>
      <div className="h-6 w-24 rounded-full flag-skeleton-shimmer" />
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-4 w-24 rounded-md flag-skeleton-shimmer" />
            <div className="h-4 w-12 rounded-full flag-skeleton-shimmer" />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <div className="h-3 w-16 rounded flag-skeleton-shimmer" />
              <div className="h-3 w-8 rounded flag-skeleton-shimmer" />
            </div>
            <div className="w-full h-2 rounded-full flag-skeleton-shimmer" />
          </div>
          <div className="pt-2 border-t border-slate-200/60 flex justify-between text-xs">
            <div className="h-2.5 w-16 rounded flag-skeleton-shimmer" />
            <div className="h-2.5 w-12 rounded flag-skeleton-shimmer" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// 5. Activity Feed Skeleton
export const DashboardActivitySkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
      <div className="h-4 w-52 rounded-md flag-skeleton-shimmer" />
      <div className="h-3 w-28 rounded flag-skeleton-shimmer opacity-70" />
    </div>

    <div className="divide-y divide-slate-100 space-y-1">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="py-3 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl flag-skeleton-shimmer shrink-0" />
            <div className="space-y-1.5">
              <div className="h-3.5 w-44 rounded-md flag-skeleton-shimmer" />
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-20 rounded flag-skeleton-shimmer" />
                <div className="h-2.5 w-16 rounded flag-skeleton-shimmer" />
                <div className="h-2.5 w-24 rounded flag-skeleton-shimmer" />
              </div>
            </div>
          </div>
          <div className="h-3 w-14 rounded flag-skeleton-shimmer shrink-0" />
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
