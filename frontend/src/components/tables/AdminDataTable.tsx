"use client";

import { useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface AdminDataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
  };
  filters?: {
    searchQuery: string;
    onSearchChange: (query: string) => void;
  };
  rowActions?: {
    label: string | React.ReactNode | ((row: T) => React.ReactNode);
    onClick: (row: T) => void;
    variant?: 'primary' | 'secondary' | 'danger';
    disabled?: (row: T) => boolean;
  }[];
  selectable?: boolean;
  onSelectionChange?: (selectedRows: T[]) => void;
  emptyMessage?: string;
  searchPlaceholder?: string;
  className?: string;
}

export function AdminDataTable<T extends { id?: string | number }>({
  data,
  columns,
  loading = false,
  pagination,
  filters,
  rowActions,
  selectable = false,
  onSelectionChange,
  emptyMessage = "No data available",
  searchPlaceholder = "Search...",
  className = ""
}: AdminDataTableProps<T>) {
  const [selectedRows, setSelectedRows] = useState<Set<string | number>>(new Set());
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  const handleRowSelect = (row: T) => {
    if (!row.id) return;
    
    const newSelectedRows = new Set(selectedRows);
    if (newSelectedRows.has(row.id)) {
      newSelectedRows.delete(row.id);
    } else {
      newSelectedRows.add(row.id);
    }
    
    setSelectedRows(newSelectedRows);
    
    if (onSelectionChange) {
      const selectedData = data.filter(item => item.id && newSelectedRows.has(item.id));
      onSelectionChange(selectedData);
    }
  };

  const handleSelectAll = () => {
    if (selectedRows.size === data.length && data.length > 0) {
      setSelectedRows(new Set());
      if (onSelectionChange) {
        onSelectionChange([]);
      }
    } else {
      const allIds = data.map(row => row.id).filter(Boolean) as (string | number)[];
      setSelectedRows(new Set(allIds));
      if (onSelectionChange) {
        onSelectionChange(data);
      }
    }
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return {
          key,
          direction: prev.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return { key, direction: 'asc' };
    });
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig) return 0;
    
    const aValue = a[sortConfig.key as keyof T];
    const bValue = b[sortConfig.key as keyof T];
    
    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  if (loading) {
    return (
      <div className={`flex flex-col flex-1 min-h-0 bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden ${className}`}>
        <div className="p-4 border-b border-slate-200/80 flex items-center justify-between gap-3">
          <div className="h-9 w-64 rounded-lg flag-skeleton-shimmer" />
          <div className="h-9 w-28 rounded-lg flag-skeleton-shimmer" />
        </div>
        <div className="p-4 flex-1 space-y-3">
          <div className="h-10 rounded-xl flag-skeleton-shimmer mb-4"></div>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-9 rounded-xl flag-skeleton-shimmer"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col flex-1 min-h-0 bg-white border border-slate-200 rounded-lg shadow-sm ${className}`}>
      {/* Search and Filters */}
      {filters && (
        <div className="p-3.5 border-b border-slate-200 bg-white flex-shrink-0">
          <div className="flex items-center space-x-4">
            <div className="w-full max-w-sm relative">
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={filters.searchQuery}
                onChange={(e) => filters.onSearchChange(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0B1F3A] focus:border-[#0B1F3A] text-xs font-medium text-slate-800 placeholder-slate-400 transition"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Table Container (Scrollable) */}
      <div className="flex-initial min-h-0 overflow-auto isolate">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 shadow-sm">
            <tr>
              {selectable && (
                <th className="px-4 py-2 w-12 text-center bg-slate-50">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === data.length && data.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-[#0B1F3A] focus:ring-[#0B1F3A] cursor-pointer"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-2 font-semibold text-slate-700 text-xs tracking-wider uppercase bg-slate-50 select-none ${
                    column.sortable ? 'cursor-pointer hover:bg-slate-100/80 transition-colors' : ''
                  } ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'}`}
                  onClick={() => column.sortable && handleSort(column.key)}
                  style={{ width: column.width }}
                >
                  <div className={`flex items-center space-x-1.5 ${column.align === 'center' ? 'justify-center' : column.align === 'right' ? 'justify-end' : 'justify-start'}`}>
                    <span>{column.header}</span>
                    {column.sortable && (
                      <span className="text-slate-400">
                        {sortConfig?.key === column.key ? (
                          sortConfig.direction === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-[#0B1F3A]" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-[#0B1F3A]" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-60 hover:opacity-100" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {rowActions && rowActions.length > 0 && (
                <th className="px-4 py-2 font-semibold text-slate-700 text-xs uppercase tracking-wider text-right w-28 bg-slate-50">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)}
                  className="px-6 py-14 text-center text-slate-500"
                >
                  <div className="flex flex-col items-center">
                    <svg
                      className="w-10 h-10 text-slate-300 mb-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p className="text-sm font-semibold text-slate-800 mb-1">No results found</p>
                    <p className="text-xs text-slate-500">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedData.map((row, index) => (
                <tr
                  key={row.id || index}
                  className={`min-h-[2.125rem] hover:bg-slate-50/80 transition-colors ${
                    index % 2 === 1 ? 'bg-[#fafbfc]' : 'bg-white'
                  } ${selectedRows.has(row.id!) ? '!bg-blue-50/60' : ''}`}
                >
                  {selectable && (
                    <td className="px-4 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(row.id!)}
                        onChange={() => handleRowSelect(row)}
                        className="rounded border-slate-300 text-[#0B1F3A] focus:ring-[#0B1F3A] cursor-pointer"
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td 
                      key={column.key} 
                      className={`px-4 py-2 text-xs text-slate-700 ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'}`}
                    >
                      {column.render ? (
                        column.render(row[column.key as keyof T], row)
                      ) : (
                        <span>
                          {(() => {
                            const value = row[column.key as keyof T];
                            if (value === null || value === undefined) return '—';
                            if (typeof value === 'object') return JSON.stringify(value);
                            return String(value);
                          })()}
                        </span>
                      )}
                    </td>
                  ))}
                  {rowActions && rowActions.length > 0 && (
                    <td className="px-4 py-2 text-xs font-medium text-right">
                      <div className="flex space-x-1.5 justify-end">
                        {rowActions.map((action, actionIndex) => {
                          const isDisabled = action.disabled ? action.disabled(row) : false;
                          return (
                            <button
                              key={actionIndex}
                              onClick={() => !isDisabled && action.onClick(row)}
                              disabled={isDisabled}
                              className={`px-2.5 py-1 rounded text-xs leading-4 font-semibold transition-all ${
                                isDisabled 
                                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                  : action.variant === 'danger'
                                  ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                                  : action.variant === 'secondary'
                                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                                  : 'bg-[#0B1F3A]/10 text-[#0B1F3A] hover:bg-[#0B1F3A]/20 border border-[#0B1F3A]/20'
                              }`}
                            >
                              {typeof action.label === 'function' ? action.label(row) : action.label}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Container (Fixed at Bottom) */}
      {pagination && (
        <div className="px-4 py-2 border-t border-slate-200 bg-white flex-shrink-0 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-medium whitespace-nowrap">
            Showing <span className="text-slate-800 font-semibold">{Math.min((pagination.currentPage - 1) * pagination.pageSize + 1, pagination.totalItems)}</span> to <span className="text-slate-800 font-semibold">{Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)}</span> of <span className="text-slate-800 font-semibold">{pagination.totalItems}</span> entries
          </div>
          <div className="flex space-x-1 items-center">
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            
            {(() => {
              const pages = [];
              const maxPages = 5;
              let startPage = Math.max(1, pagination.currentPage - Math.floor(maxPages / 2));
              let endPage = startPage + maxPages - 1;
              
              if (endPage > pagination.totalPages) {
                endPage = pagination.totalPages;
                startPage = Math.max(1, endPage - maxPages + 1);
              }
              
              for (let i = startPage; i <= endPage; i++) {
                pages.push(
                  <button
                    key={i}
                    onClick={() => pagination.onPageChange(i)}
                    className={`min-w-[28px] px-2 py-1 text-xs font-semibold rounded-md transition-colors ${
                      i === pagination.currentPage
                        ? 'bg-[#0B1F3A] text-white border border-[#0B1F3A] shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    {i}
                  </button>
                );
              }
              return pages;
            })()}

            <button
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
