import React from 'react';

// Base Skeleton Component
export const Skeleton: React.FC<{ className?: string; children?: React.ReactNode }> = ({ 
  className = '', 
  children 
}) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`}>
    {children}
  </div>
);

// Login Page Skeleton
export const LoginSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div className="sm:mx-auto sm:w-full sm:max-w-md">
      {/* Logo Skeleton */}
      <Skeleton className="mx-auto h-12 w-12 rounded-full" />
      
      {/* Title Skeleton */}
      <Skeleton className="mt-6 h-8 w-48 mx-auto" />
      <Skeleton className="mt-2 h-4 w-32 mx-auto" />
    </div>

    <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        {/* Form Fields Skeleton */}
        <div className="space-y-6">
          <div>
            <Skeleton className="h-4 w-16 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
          
          <div>
            <Skeleton className="h-4 w-16 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>

          {/* Submit Button Skeleton */}
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Links Skeleton */}
        <div className="mt-6 space-y-2">
          <Skeleton className="h-4 w-32 mx-auto" />
          <Skeleton className="h-4 w-24 mx-auto" />
        </div>
      </div>
    </div>
  </div>
);

// Table Skeleton
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 5, 
  columns = 4 
}) => (
  <div className="bg-white rounded-lg shadow">
    {/* Table Header Skeleton */}
    <div className="px-6 py-4 border-b border-gray-200">
      <div className="flex space-x-4">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} className="h-4 w-20" />
        ))}
      </div>
    </div>
    
    {/* Table Rows Skeleton */}
    <div className="divide-y divide-gray-200">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="px-6 py-4">
          <div className="flex space-x-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} className="h-4 w-24" />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Application Card Skeleton
export const ApplicationCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-start">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-5 w-16" />
      </div>
      
      {/* Content Lines */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      
      {/* Footer */}
      <div className="flex justify-between items-center pt-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  </div>
);

// Application Detail Skeleton (Matches redesigned UI layout)
export const ApplicationDetailSkeleton: React.FC = () => (
  <div className="flex-1 mt-[120px] p-6 pb-12 w-full">
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full max-w-full">
      <div className="p-6 lg:p-8 space-y-8 bg-slate-50/30">
        
        {/* Application Information Section Skeleton */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-6 w-48" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32 rounded-xl" />
              <Skeleton className="h-10 w-32 rounded-xl hidden sm:block" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 columns: Applicant Details */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className={`space-y-2 ${i === 0 ? 'md:col-span-2' : ''}`}>
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-48 max-w-full" />
                </div>
              ))}
            </div>

            {/* Right column: Photo & Quick Summary */}
            <div className="space-y-6">
              <Skeleton className="h-48 w-full rounded-2xl" />
              <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
          </div>
        </div>

        {/* Three-Column Row: License Details, License History, Criminal History */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 h-[400px]">
              <div className="flex items-center gap-3 mb-6">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-5 w-32" />
              </div>
              <div className="space-y-5">
                {[...Array(5)].map((_, j) => (
                  <div key={j} className="space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
      </div>
    </div>
  </div>
);

// Sidebar Skeleton
export const SidebarSkeleton: React.FC = () => (
  <div className="fixed left-0 top-0 h-full w-[80vw] max-w-xs md:w-[18%] bg-white shadow-lg border-r border-gray-200 z-40">
    {/* Logo & Brand Area */}
    <div className="p-4 flex items-center border-b border-gray-100">
      <Skeleton className="h-[52px] w-[52px] rounded mr-2" />
      <Skeleton className="h-5 w-24" />
    </div>
    
    {/* Role Badge */}
    <div className="bg-gray-100 p-4">
      <Skeleton className="h-5 w-5 inline-block mr-3" />
      <Skeleton className="h-4 w-28" />
    </div>
    
    {/* Menu Items */}
    <div className="p-3 space-y-1">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-center px-3 py-2">
          <Skeleton className="h-5 w-5 mr-3 flex-shrink-0" />
          <Skeleton className="h-4 flex-1 max-w-[100px]" />
        </div>
      ))}
    </div>
    
    {/* Logout */}
    <div className="p-3 border-t border-gray-200 mt-auto">
      <div className="flex items-center px-3 py-2">
        <Skeleton className="h-5 w-5 mr-3 flex-shrink-0" />
        <Skeleton className="h-4 w-14" />
      </div>
    </div>
  </div>
);

// Header Skeleton
export const HeaderSkeleton: React.FC = () => (
  <div className="fixed top-0 left-[80px] md:left-[18%] right-0 h-[64px] md:h-[70px] bg-white shadow-sm border-b border-gray-200 z-30">
    <div className="flex items-center justify-between h-full px-4 md:px-6">
      {/* Search Area */}
      <div className="flex items-center space-x-4 flex-1">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>
      
      {/* Right Side */}
      <div className="flex items-center space-x-4">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-6 w-20" />
      </div>
    </div>
  </div>
);

// Page Layout Skeleton (combines header, sidebar, and content)
export const PageLayoutSkeleton: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div className="flex h-screen w-full bg-gray-50">
    <SidebarSkeleton />
    <HeaderSkeleton />
  <main className="flex-1 p-8 overflow-y-auto ml-[80px] md:ml-[18%] mt-[64px] md:mt-[70px]">
      {children || (
        <div className="bg-white rounded-lg shadow p-6">
          <Skeleton className="h-8 w-48 mb-6" />
          <TableSkeleton />
        </div>
      )}
    </main>
  </div>
);

// Form Skeleton
export const FormSkeleton: React.FC<{ fields?: number }> = ({ fields = 6 }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <Skeleton className="h-8 w-48 mb-6" />
    
    <div className="space-y-6">
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index}>
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      
      {/* Buttons */}
      <div className="flex space-x-4 pt-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  </div>
);

// Dashboard Stats Skeleton
export const DashboardStatsSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    {Array.from({ length: 4 }).map((_, index) => (
      <div key={index} className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <Skeleton className="h-8 w-8 rounded" />
          <div className="ml-4 flex-1">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Message Skeleton
export const MessageSkeleton: React.FC = () => (
  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
    <Skeleton className="h-4 w-32 mb-2" />
    <Skeleton className="h-4 w-48" />
  </div>
);

// Application Form Skeleton
export const ApplicationFormSkeleton: React.FC = () => (
  <div className="fixed inset-0 bg-gray-50 z-[9999] overflow-y-auto">
    <div className="min-h-screen">
      {/* Header Skeleton */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-10 w-10 rounded" />
            <Skeleton className="h-6 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto p-6">
        {/* Form Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        {/* Form Sections */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-8">
          {/* Section 1 */}
          <div>
            <Skeleton className="h-6 w-48 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              ))}
            </div>
          </div>

          {/* Section 2 */}
          <div className="pt-6 border-t border-gray-200">
            <Skeleton className="h-6 w-48 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              ))}
            </div>
          </div>

          {/* Section 3 - Full width fields */}
          <div className="pt-6 border-t border-gray-200">
            <Skeleton className="h-6 w-48 mb-6" />
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              ))}
            </div>
          </div>

          {/* File Upload Section */}
          <div className="pt-6 border-t border-gray-200">
            <Skeleton className="h-6 w-48 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <Skeleton className="h-16 w-16 mx-auto mb-3 rounded" />
                  <Skeleton className="h-4 w-32 mx-auto mb-2" />
                  <Skeleton className="h-3 w-24 mx-auto" />
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 border-t border-gray-200 flex justify-between">
            <Skeleton className="h-12 w-32 rounded-lg" />
            <div className="flex space-x-4">
              <Skeleton className="h-12 w-24 rounded-lg" />
              <Skeleton className="h-12 w-32 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
