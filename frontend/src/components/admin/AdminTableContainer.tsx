'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationConfig {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

interface AdminTableContainerProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  subtitle?: React.ReactNode;
  className?: string;
  pagination?: PaginationConfig;
}

export function AdminTableContainer({
  children,
  title,
  description,
  subtitle,
  className = '',
  pagination,
}: AdminTableContainerProps) {
  return (
    <div className={`bg-white rounded-lg shadow-xs border border-gray-200/80 overflow-hidden flex flex-col ${className}`}>
      {/* Header Section */}
      {(title || description) && (
        <div className='border-b border-gray-200 px-6 py-4 bg-gray-50'>
          {title && <h3 className='text-lg font-semibold text-gray-900'>{title}</h3>}
          {description && <p className='text-sm text-gray-600 mt-1'>{description}</p>}
          {subtitle && <div className='mt-3 text-sm text-gray-500'>{subtitle}</div>}
        </div>
      )}

      {/* Table Content */}
      <div className='overflow-x-auto flex-1'>
        {children}
      </div>

      {/* Pagination Footer */}
      {pagination && (
        <div className='border-t border-gray-200 px-6 py-4 bg-white flex items-center justify-between flex-shrink-0'>
          <div className='text-sm text-gray-600'>
            Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} to{' '}
            {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
            {pagination.totalItems} items
          </div>
          <div className='flex items-center gap-2'>
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className='p-2 text-gray-600 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              title='Previous page'
            >
              <ChevronLeft className='w-5 h-5' />
            </button>

            <div className='flex items-center gap-1'>
              {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                let pageNum = i + 1;
                if (pagination.totalPages > 5) {
                  if (pagination.currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.currentPage >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.currentPage - 2 + i;
                  }
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => pagination.onPageChange(pageNum)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      pageNum === pagination.currentPage
                        ? 'bg-[#001F54] text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages}
              className='p-2 text-gray-600 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              title='Next page'
            >
              <ChevronRight className='w-5 h-5' />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface AdminTableProps {
  className?: string;
}

/**
 * Standard table element to be used inside AdminTableContainer
 * Ensures consistent styling across all admin tables
 */
export function AdminTableElement({ className = '' }: AdminTableProps) {
  return (
    <table className={`w-full border-collapse ${className}`}>
      {/* thead and tbody should be provided as children */}
    </table>
  );
}
