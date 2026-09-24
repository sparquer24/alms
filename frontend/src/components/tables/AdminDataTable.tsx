"use client";

import { useState } from 'react';

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
  className?: string; // Additional classes for the container
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

  // Handle row selection
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

  // Handle select all
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

  // Handle sorting
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

  // Sort data
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
      <div className={`flex flex-col flex-1 min-h-0 bg-white ${className}`}>
        <div className="animate-pulse p-4 flex-1">
          <div className="h-10 bg-slate-200 rounded-t-lg mb-4"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-slate-100 border-b border-slate-200 mb-2"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col flex-1 min-h-0 bg-white ${className}`}>
      {/* Search and Filters */}
      {filters && (
        <div className="p-4 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center space-x-4">
            <div className="w-full max-w-sm relative">
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={filters.searchQuery}
                onChange={(e) => filters.onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-slate-800"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Table Container (Scrollable) */}
      <div className="flex-1 min-h-0 overflow-auto isolate">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
            <tr>
              {selectable && (
                <th className="px-6 py-4 w-12 text-center bg-slate-50">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === data.length && data.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-4 font-semibold text-slate-600 text-sm tracking-wider bg-slate-50 ${
                    column.sortable ? 'cursor-pointer hover:bg-slate-100' : ''
                  } ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'}`}
                  onClick={() => column.sortable && handleSort(column.key)}
                  style={{ width: column.width }}
                >
                  <div className={`flex items-center space-x-1 ${column.align === 'center' ? 'justify-center' : column.align === 'right' ? 'justify-end' : 'justify-start'}`}>
                    <span>{column.header}</span>
                    {column.sortable && sortConfig?.key === column.key && (
                      <span className="text-slate-400">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {rowActions && rowActions.length > 0 && (
                <th className="px-6 py-4 font-semibold text-slate-600 text-sm text-right w-24 bg-slate-50">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)}
                  className="px-6 py-12 text-center text-slate-500"
                >
                  <div className="flex flex-col items-center">
                    <svg
                      className="w-12 h-12 text-slate-300 mb-4"
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
                    <p className="text-base font-medium text-slate-700 mb-1">No results found</p>
                    <p className="text-sm text-slate-400">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedData.map((row, index) => (
                <tr
                  key={row.id || index}
                  className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                    selectedRows.has(row.id!) ? 'bg-blue-50/50' : ''
                  }`}
                >
                  {selectable && (
                    <td className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(row.id!)}
                        onChange={() => handleRowSelect(row)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td 
                      key={column.key} 
                      className={`px-6 py-4 text-sm text-slate-800 ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'}`}
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
                    <td className="px-6 py-4 text-sm font-medium text-right">
                      <div className="flex space-x-2 justify-end">
                        {rowActions.map((action, actionIndex) => {
                          const isDisabled = action.disabled ? action.disabled(row) : false;
                          return (
                            <button
                              key={actionIndex}
                              onClick={() => !isDisabled && action.onClick(row)}
                              disabled={isDisabled}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                isDisabled 
                                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                  : action.variant === 'danger'
                                  ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100'
                                  : action.variant === 'secondary'
                                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100'
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
        <div className="px-6 py-4 border-t border-slate-200 bg-white flex-shrink-0 flex items-center justify-between">
          <div className="text-sm text-slate-500 font-medium">
            Showing <span className="text-slate-800 font-semibold">{Math.min((pagination.currentPage - 1) * pagination.pageSize + 1, pagination.totalItems)}</span> to <span className="text-slate-800 font-semibold">{Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)}</span> of <span className="text-slate-800 font-semibold">{pagination.totalItems}</span> entries
          </div>
          <div className="flex space-x-1.5">
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            
            {/* Show up to 5 page numbers */}
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
                    className={`min-w-[32px] px-2 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      i === pagination.currentPage
                        ? 'bg-[#001F54] text-white border border-[#001F54]'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-800'
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
              className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
