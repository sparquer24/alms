import React from 'react';
import AppShellSkeleton from './AppShellSkeleton';

// Base Skeleton Component with Indian Flag Tricolor Light Air-Wave Shimmer
export const Skeleton: React.FC<{ className?: string; children?: React.ReactNode }> = ({ 
  className = '', 
  children 
}) => (
  <div className={`flag-skeleton-shimmer rounded-lg ${className}`}>
    {children}
  </div>
);

// Login Page Skeleton with National Tricolor Accents (Simple, Minimal, No Header, No Helpline)
export const LoginSkeleton: React.FC = () => (
  <div className="min-h-screen bg-[#071527] flex flex-col justify-center relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
    {/* Indian National Tricolor Apex Ribbon */}
    <div className="absolute top-0 inset-x-0 h-[3px] flex shadow-sm z-20">
      <div className="w-1/3 bg-[#FF9933]" />
      <div className="w-1/3 bg-[#FFFFFF]" />
      <div className="w-1/3 bg-[#138808]" />
    </div>

    <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
      <div className="relative bg-white/10 p-8 sm:p-10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl border border-white/20">
        {/* Card Top Flag Ribbon */}
        <div className="absolute top-0 inset-x-0 h-1.5 flex shadow-sm">
          <div className="w-1/3 bg-[#FF9933]" />
          <div className="w-1/3 bg-[#FFFFFF]" />
          <div className="w-1/3 bg-[#138808]" />
        </div>

        <div className="flex flex-col items-center">
          {/* Emblem Skeleton */}
          <div className="h-20 w-20 rounded-full flag-skeleton-dark border border-white/20 mb-4" />
          
          {/* Title Skeleton */}
          <div className="h-6 w-56 rounded flag-skeleton-dark mb-2" />
          <div className="h-4 w-40 rounded flag-skeleton-dark mb-4" />

          {/* Hairline Tricolor Accent */}
          <div className="h-[2px] w-24 rounded-full bg-gradient-to-r from-[#FF9933] via-white to-[#138808] mb-6" />
        </div>

        {/* Form Fields Skeleton */}
        <div className="space-y-4">
          <div>
            <div className="h-3 w-28 rounded flag-skeleton-dark mb-2" />
            <div className="h-11 w-full rounded-xl flag-skeleton-dark" />
          </div>
          
          <div>
            <div className="h-3 w-20 rounded flag-skeleton-dark mb-2" />
            <div className="h-11 w-full rounded-xl flag-skeleton-dark" />
          </div>

          {/* Submit Button Skeleton */}
          <div className="h-12 w-full rounded-xl flag-skeleton-dark mt-2" />
        </div>

        {/* Footer Skeleton */}
        <div className="mt-6 pt-4 border-t border-white/15 flex flex-col items-center gap-2">
          <div className="h-3 w-32 rounded flag-skeleton-dark" />
        </div>
      </div>
    </div>
  </div>
);

// Modern Table Skeleton (Matches ApplicationTable & AdminDataTable UI)
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 7, 
  columns = 5 
}) => (
  <div className="flex flex-col flex-1 min-h-0 bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
    {/* Search & Filter Toolbar Header */}
    <div className="p-4 border-b border-slate-200/80 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-center gap-3 w-full sm:w-auto">
        {/* Search input placeholder */}
        <div className="h-9 w-full sm:w-72 rounded-lg flag-skeleton-shimmer" />
        {/* Filter dropdown placeholder */}
        <div className="h-9 w-36 rounded-lg flag-skeleton-shimmer hidden sm:block" />
      </div>
      <div className="flex items-center gap-2 self-end sm:self-auto">
        <div className="h-9 w-28 rounded-lg flag-skeleton-shimmer" />
        <div className="h-9 w-24 rounded-lg flag-skeleton-shimmer" />
      </div>
    </div>

    {/* Table Grid */}
    <div className="overflow-x-auto flex-1">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            {Array.from({ length: columns }).map((_, index) => (
              <th key={index} className="px-5 py-3.5">
                <div className={`h-3.5 rounded flag-skeleton-shimmer ${index === 0 ? 'w-24' : index === 1 ? 'w-36' : 'w-20'}`} />
              </th>
            ))}
            <th className="px-5 py-3.5 text-right w-24">
              <div className="h-3.5 w-16 rounded flag-skeleton-shimmer ml-auto" />
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className={`hover:bg-slate-50/50 ${rowIndex % 2 === 1 ? 'bg-[#fafbfc]' : 'bg-white'}`}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="px-5 py-3.5">
                  {colIndex === 0 ? (
                    <div className="h-4 w-28 rounded-md flag-skeleton-shimmer" />
                  ) : colIndex === 1 ? (
                    <div className="space-y-1.5">
                      <div className="h-4 w-40 rounded-md flag-skeleton-shimmer" />
                      <div className="h-3 w-24 rounded flag-skeleton-shimmer opacity-70" />
                    </div>
                  ) : colIndex === 2 ? (
                    <div className="h-5 w-20 rounded-full flag-skeleton-shimmer" />
                  ) : colIndex === 3 ? (
                    <div className="h-5 w-24 rounded-full flag-skeleton-shimmer" />
                  ) : (
                    <div className="h-3.5 w-24 rounded flag-skeleton-shimmer" />
                  )}
                </td>
              ))}
              <td className="px-5 py-3.5 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <div className="h-7 w-7 rounded-lg flag-skeleton-shimmer" />
                  <div className="h-7 w-7 rounded-lg flag-skeleton-shimmer" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Modern Table Footer with Pagination Controls */}
    <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="h-3.5 w-48 rounded flag-skeleton-shimmer" />
      <div className="flex items-center gap-1.5">
        <div className="h-8 w-8 rounded-lg flag-skeleton-shimmer" />
        <div className="h-8 w-8 rounded-lg flag-skeleton-shimmer" />
        <div className="h-8 w-8 rounded-lg flag-skeleton-shimmer" />
        <div className="h-8 w-8 rounded-lg flag-skeleton-shimmer" />
      </div>
    </div>
  </div>
);

// Modern Application Detail Skeleton (Accurately mirrors ApplicationDetailClient UI)
export const ApplicationDetailSkeleton: React.FC = () => (
  <div className="min-h-screen bg-[#F3F5F8] flex flex-col relative">
    {/* Indian National Tricolor Active Top Flag Loader */}
    <div className="fixed top-0 inset-x-0 h-[3px] z-50 pointer-events-none overflow-hidden bg-slate-200/50">
      <div className="absolute inset-0 flex opacity-40">
        <div className="w-1/3 bg-[#FF9933]" />
        <div className="w-1/3 bg-[#FFFFFF]" />
        <div className="w-1/3 bg-[#138808]" />
      </div>
      <div className="absolute inset-0 flag-runner-bar" />
    </div>

    {/* Header bar placeholder */}
    <div className="h-[58px] bg-[#0B1F3A] px-4 sm:px-6 lg:px-8 flex items-center justify-between z-30">
      <div className="flex items-center gap-3">
        <div className="h-7 w-7 rounded-lg bg-white/10" />
        <div className="h-4 w-48 rounded bg-white/20" />
        <div className="h-4 w-28 rounded bg-white/10 hidden sm:block" />
      </div>
      <div className="flex items-center gap-3">
        <div className="h-6 w-24 rounded-full bg-white/15" />
        <div className="h-8 w-8 rounded-full bg-white/20" />
      </div>
    </div>

    {/* Main Container */}
    <div className="flex-1 w-full max-w-7xl xl:max-w-[1700px] 2xl:max-w-[1900px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Workflow Assignment / Status Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full flag-skeleton-shimmer" />
          <div className="space-y-1">
            <div className="h-4 w-60 rounded flag-skeleton-shimmer" />
            <div className="h-3 w-36 rounded flag-skeleton-shimmer opacity-70" />
          </div>
        </div>
        <div className="h-9 w-32 rounded-xl flag-skeleton-shimmer" />
      </div>

      {/* Application Information Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flag-skeleton-shimmer" />
            <div className="space-y-1">
              <div className="h-5 w-52 rounded-md flag-skeleton-shimmer" />
              <div className="h-3 w-32 rounded flag-skeleton-shimmer opacity-70" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-28 rounded-xl flag-skeleton-shimmer" />
            <div className="h-9 w-28 rounded-xl flag-skeleton-shimmer hidden sm:block" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 columns: Applicant Details 8-field grid */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={`p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2 ${i === 0 ? 'md:col-span-2' : ''}`}>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded flag-skeleton-shimmer" />
                  <div className="h-3 w-28 rounded flag-skeleton-shimmer" />
                </div>
                <div className="h-5 w-44 rounded-md flag-skeleton-shimmer" />
              </div>
            ))}
          </div>

          {/* Right column: Applicant Photo & Verification Badges */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200/80 p-5 bg-slate-50/40 flex flex-col items-center text-center space-y-3">
              <div className="h-32 w-32 rounded-2xl flag-skeleton-shimmer shadow-inner" />
              <div className="h-5 w-32 rounded-full flag-skeleton-shimmer" />
              <div className="h-3.5 w-24 rounded flag-skeleton-shimmer opacity-70" />
            </div>
            <div className="rounded-2xl border border-slate-200/80 p-4 bg-white space-y-2.5">
              <div className="h-3.5 w-36 rounded flag-skeleton-shimmer" />
              <div className="h-2 w-full rounded-full flag-skeleton-shimmer" />
              <div className="flex justify-between">
                <div className="h-3 w-20 rounded flag-skeleton-shimmer" />
                <div className="h-3 w-12 rounded flag-skeleton-shimmer" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Three-Column Section Row (License Details, Antecedents, Biometric Status) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="h-9 w-9 rounded-xl flag-skeleton-shimmer" />
              <div className="h-4 w-36 rounded-md flag-skeleton-shimmer" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="space-y-1">
                  <div className="h-3 w-24 rounded flag-skeleton-shimmer" />
                  <div className="h-4 w-full rounded flag-skeleton-shimmer" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Documents / Audit Trail Table Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="h-5 w-44 rounded-md flag-skeleton-shimmer" />
          <div className="h-7 w-20 rounded-lg flag-skeleton-shimmer" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-3 rounded-xl border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg flag-skeleton-shimmer" />
                <div className="space-y-1">
                  <div className="h-4 w-40 rounded flag-skeleton-shimmer" />
                  <div className="h-3 w-20 rounded flag-skeleton-shimmer opacity-70" />
                </div>
              </div>
              <div className="h-7 w-20 rounded-lg flag-skeleton-shimmer" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Modern Sidebar Skeleton (Matches Sidebar.tsx Dimensions & Rounding)
export const SidebarSkeleton: React.FC = () => (
  <aside className="fixed left-0 top-0 md:left-4 md:top-4 md:bottom-4 z-40 w-[80vw] max-w-xs md:w-60 h-screen md:h-[calc(100vh-2rem)] bg-white border border-gray-200/90 flex flex-col shadow-xl md:shadow-md md:rounded-2xl overflow-hidden">
    {/* Brand Emblem Area */}
    <div className="p-3.5 flex items-center gap-3 border-b border-gray-100 bg-white">
      <div className="h-10 w-10 rounded-xl flag-skeleton-shimmer shrink-0" />
      <div className="space-y-1 flex-1">
        <div className="h-3.5 w-24 rounded flag-skeleton-shimmer" />
        <div className="h-2.5 w-16 rounded flag-skeleton-shimmer opacity-70" />
      </div>
    </div>

    {/* Officer Profile Badge */}
    <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2.5">
      <div className="h-8 w-8 rounded-full flag-skeleton-shimmer shrink-0" />
      <div className="space-y-1 flex-1 min-w-0">
        <div className="h-3 w-20 rounded flag-skeleton-shimmer" />
        <div className="h-2.5 w-14 rounded flag-skeleton-shimmer opacity-70" />
      </div>
    </div>
    
    {/* Nav Menu Items */}
    <div className="p-2.5 space-y-1.5 flex-1 overflow-y-auto">
      {Array.from({ length: 7 }).map((_, index) => (
        <div key={index} className="flex items-center justify-between px-3 py-2 rounded-xl">
          <div className="flex items-center gap-3 flex-1">
            <div className="h-5 w-5 rounded-lg flag-skeleton-shimmer shrink-0" />
            <div className="h-3.5 w-28 rounded flag-skeleton-shimmer" />
          </div>
          {index < 3 && <div className="h-4 w-6 rounded-full flag-skeleton-shimmer" />}
        </div>
      ))}
    </div>
    
    {/* Bottom Footer & Sign Out */}
    <div className="p-3 border-t border-gray-100 mt-auto bg-slate-50/50">
      <div className="flex items-center px-2 py-1.5 gap-3">
        <div className="h-5 w-5 rounded-lg flag-skeleton-shimmer shrink-0" />
        <div className="h-3.5 w-16 rounded flag-skeleton-shimmer" />
      </div>
    </div>
  </aside>
);

// Modern Header Skeleton (Matches Header.tsx)
export const HeaderSkeleton: React.FC<{ fullWidth?: boolean }> = ({ fullWidth = false }) => (
  <header
    className={`fixed top-0 right-0 ${
      fullWidth ? 'left-0' : 'left-0 md:left-64'
    } min-w-[200px] bg-[#0B1F3A] border-b border-white/10 h-[56px] md:h-[58px] px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-xs z-40`}
  >
    {/* Breadcrumbs / Page Title */}
    <div className="flex items-center gap-3 flex-1">
      <div className="h-7 w-7 rounded-lg bg-white/10" />
      <div className="h-4 w-44 rounded bg-white/20" />
      <div className="h-3.5 w-24 rounded bg-white/10 hidden sm:block" />
    </div>
    
    {/* Right-Side Badges & Profile */}
    <div className="flex items-center gap-3">
      <div className="h-6 w-24 rounded-full bg-white/15 hidden sm:block" />
      <div className="h-8 w-8 rounded-full bg-white/20" />
    </div>
  </header>
);

// Page Layout Skeleton (combines header, sidebar, and content)
export const PageLayoutSkeleton: React.FC<{ children?: React.ReactNode; sidebar?: boolean }> = ({
  children,
  sidebar = true,
}) => (
  <AppShellSkeleton
    sidebar={sidebar}
    sidebarFallback={<SidebarSkeleton />}
    headerFallback={<HeaderSkeleton fullWidth={!sidebar} />}
  >
    {children || <ContentSkeleton />}
  </AppShellSkeleton>
);

// Content-only skeleton for routes whose layout already renders the sidebar/header
export const ContentSkeleton: React.FC = () => (
  <div className="p-4 sm:p-6 lg:p-8 space-y-6">
    <TableSkeleton />
  </div>
);

// Form Skeleton
export const FormSkeleton: React.FC<{ fields?: number }> = ({ fields = 6 }) => (
  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
    <div className="h-6 w-48 rounded-md flag-skeleton-shimmer mb-6" />
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <div className="h-3.5 w-28 rounded flag-skeleton-shimmer" />
          <div className="h-10 w-full rounded-xl flag-skeleton-shimmer" />
        </div>
      ))}
    </div>
    
    {/* Action Buttons */}
    <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
      <div className="h-10 w-24 rounded-xl flag-skeleton-shimmer" />
      <div className="h-10 w-32 rounded-xl flag-skeleton-shimmer" />
    </div>
  </div>
);

// Dashboard Stats Skeleton (4 Modern Metric Cards)
export const DashboardStatsSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    {Array.from({ length: 4 }).map((_, index) => (
      <div key={index} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between h-[150px]">
        <div className="flex items-center justify-between">
          <div className="h-3.5 w-24 rounded flag-skeleton-shimmer" />
          <div className="h-9 w-9 rounded-xl flag-skeleton-shimmer" />
        </div>
        <div className="space-y-1.5 my-auto">
          <div className="h-7 w-20 rounded-md flag-skeleton-shimmer" />
          <div className="h-3 w-28 rounded flag-skeleton-shimmer opacity-70" />
        </div>
        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
          <div className="h-2.5 w-16 rounded flag-skeleton-shimmer" />
          <div className="h-2.5 w-12 rounded flag-skeleton-shimmer" />
        </div>
      </div>
    ))}
  </div>
);

// Renewal Application wizard skeleton — mirrors StepHeader + RenewalSummary + Section Card
export const RenewalFormSkeleton: React.FC = () => (
  <div
    className="relative min-h-screen flex flex-col bg-[#eef2f9]"
    style={{
      backgroundImage: 'url(/backgroundIMGALMS.jpeg)',
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
    }}
  >
    {/* Soft veil overlay */}
    <div className="fixed inset-0 bg-white/70 pointer-events-none z-0" />

    {/* Indian National Tricolor Apex Ribbon with Active Flag Loader Runner */}
    <div className="fixed top-0 inset-x-0 h-[3px] z-50 pointer-events-none overflow-hidden bg-slate-200/50">
      <div className="absolute inset-0 flex opacity-40">
        <div className="w-1/3 bg-[#FF9933]" />
        <div className="w-1/3 bg-[#FFFFFF]" />
        <div className="w-1/3 bg-[#138808]" />
      </div>
      <div className="absolute inset-0 flag-runner-bar" />
    </div>

    <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl xl:max-w-[1700px] 2xl:max-w-[1900px] flex-col px-4 py-4 sm:px-6 lg:px-8">
      {/* Title Badge with Navy Blue & Gold styling */}
      <div className="w-full flex items-center justify-center mt-3 mb-2">
        <div className="inline-flex items-center gap-2.5 px-6 py-1.5 rounded-full bg-[#0B1F3A] text-white shadow-md border border-[#1D3C68]">
          <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
          <span className="text-xs sm:text-sm font-black tracking-widest uppercase text-white">
            RENEWAL APPLICATION FORM
          </span>
        </div>
      </div>

      {/* Main Navy Blue Step Navigation Bar */}
      <div className="w-full rounded-2xl shadow-lg px-3 py-2 bg-[#0B1F3A] border-2 border-[#15325B] mb-3 flex items-center gap-3 overflow-x-auto">
        <div className="h-8 w-8 rounded-full bg-white/20 shrink-0" />
        <div className="flex items-center gap-3 flex-1 justify-center min-w-[600px]">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className={`h-6 w-6 rounded-full ${i === 0 ? 'bg-[#D4AF37]' : 'bg-white/20'}`} />
              <div className="h-2 w-16 rounded bg-white/25" />
            </div>
          ))}
        </div>
      </div>

      {/* Renewal Summary Strip */}
      <div className="mb-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="h-2.5 w-16 rounded flag-skeleton-shimmer" />
              <div className="h-4 w-24 rounded flag-skeleton-shimmer" />
            </div>
          ))}
        </div>
      </div>

      {/* Main Step Form Card */}
      <div className="rounded-2xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-xl flex-1 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flag-skeleton-shimmer" />
            <div className="h-5 w-48 rounded-md flag-skeleton-shimmer" />
          </div>
          <div className="h-6 w-24 rounded-full flag-skeleton-shimmer" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3.5 w-28 rounded flag-skeleton-shimmer" />
              <div className="h-10 w-full rounded-xl flag-skeleton-shimmer" />
            </div>
          ))}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-4 flex justify-between items-center py-2">
        <div className="h-10 w-28 rounded-xl flag-skeleton-shimmer" />
        <div className="flex items-center gap-3">
          <div className="h-10 w-28 rounded-xl flag-skeleton-shimmer" />
          <div className="h-10 w-36 rounded-xl flag-skeleton-shimmer" />
        </div>
      </div>
    </div>
  </div>
);

// Modern Fresh Application Form Skeleton (Matches StepHeader + Layout)
export const ApplicationFormSkeleton: React.FC = () => (
  <div
    className="relative min-h-screen flex flex-col bg-[#eef2f9]"
    style={{
      backgroundImage: 'url(/backgroundIMGALMS.jpeg)',
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
    }}
  >
    {/* Soft veil overlay */}
    <div className="fixed inset-0 bg-white/70 pointer-events-none z-0" />

    {/* Indian National Tricolor Apex Ribbon with Active Flag Loader Runner */}
    <div className="fixed top-0 inset-x-0 h-[3px] z-50 pointer-events-none overflow-hidden bg-slate-200/50">
      <div className="absolute inset-0 flex opacity-40">
        <div className="w-1/3 bg-[#FF9933]" />
        <div className="w-1/3 bg-[#FFFFFF]" />
        <div className="w-1/3 bg-[#138808]" />
      </div>
      <div className="absolute inset-0 flag-runner-bar" />
    </div>

    <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl xl:max-w-[1700px] 2xl:max-w-[1900px] flex-col px-4 py-4 sm:px-6 lg:px-8">
      {/* Title Badge with Navy Blue & Gold styling */}
      <div className="w-full flex items-center justify-center mt-3 mb-2">
        <div className="inline-flex items-center gap-2.5 px-6 py-1.5 rounded-full bg-[#0B1F3A] text-white shadow-md border border-[#1D3C68]">
          <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
          <span className="text-xs sm:text-sm font-black tracking-widest uppercase text-white">
            FRESH APPLICATION FORM
          </span>
        </div>
      </div>

      {/* Main Navy Blue Navigation Bar */}
      <div className="w-full rounded-2xl shadow-lg px-3 py-2 bg-[#0B1F3A] border-2 border-[#15325B] mb-4 flex items-center gap-3 overflow-x-auto">
        <div className="h-8 w-8 rounded-full bg-white/20 shrink-0" />
        <div className="flex items-center gap-4 flex-1 justify-center min-w-[700px]">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className={`h-6 w-6 rounded-full ${i === 0 ? 'bg-[#D4AF37]' : 'bg-white/20'}`} />
              <div className="h-2 w-14 rounded bg-white/25" />
            </div>
          ))}
        </div>
      </div>

      {/* Main Form Content Card */}
      <div className="rounded-2xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-xl flex-1 space-y-8">
        {/* Step Section Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flag-skeleton-shimmer" />
            <div className="space-y-1">
              <div className="h-5 w-48 rounded-md flag-skeleton-shimmer" />
              <div className="h-3 w-32 rounded flag-skeleton-shimmer opacity-70" />
            </div>
          </div>
          <div className="h-6 w-24 rounded-full flag-skeleton-shimmer" />
        </div>

        {/* Form Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3.5 w-32 rounded flag-skeleton-shimmer" />
              <div className="h-10 w-full rounded-xl flag-skeleton-shimmer" />
            </div>
          ))}
        </div>

        {/* Secondary Section / Address or Details */}
        <div className="pt-6 border-t border-slate-100">
          <div className="h-4 w-36 rounded-md flag-skeleton-shimmer mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3.5 w-28 rounded flag-skeleton-shimmer" />
                <div className="h-10 w-full rounded-xl flag-skeleton-shimmer" />
              </div>
            ))}
          </div>
        </div>

        {/* Upload Dropzones */}
        <div className="pt-6 border-t border-slate-100">
          <div className="h-4 w-40 rounded-md flag-skeleton-shimmer mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-2">
                <div className="h-12 w-12 rounded-xl flag-skeleton-shimmer" />
                <div className="h-3.5 w-36 rounded flag-skeleton-shimmer" />
                <div className="h-2.5 w-24 rounded flag-skeleton-shimmer opacity-70" />
              </div>
            ))}
          </div>
        </div>

        {/* Sticky / Bottom Action Buttons */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
          <div className="h-11 w-28 rounded-xl flag-skeleton-shimmer" />
          <div className="flex items-center gap-3">
            <div className="h-11 w-28 rounded-xl flag-skeleton-shimmer" />
            <div className="h-11 w-36 rounded-xl flag-skeleton-shimmer" />
          </div>
        </div>
      </div>
    </div>
  </div>
);
