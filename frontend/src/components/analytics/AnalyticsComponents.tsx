import React, { ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Analytics Error Boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center'>
            <p className='text-red-800 dark:text-red-200 font-semibold'>Failed to load chart</p>
            <p className='text-red-600 dark:text-red-300 text-sm mt-1'>
              {this.state.error?.message}
            </p>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

interface LoadingSkeletonProps {
  height?: string;
  className?: string;
}

export function LoadingSkeleton({ height = 'h-64', className = '' }: LoadingSkeletonProps) {
  return (
    <div
      className={`${height} ${className} bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-lg animate-pulse`}
    />
  );
}

interface ChartCardProps {
  title: string;
  children: ReactNode;
  isLoading?: boolean;
  error?: string;
  actions?: ReactNode;
}

export function ChartCard({ title, children, isLoading, error, actions }: ChartCardProps) {
  return (
    <div className='bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-lg p-6 hover:shadow-lg dark:hover:shadow-xl transition-shadow duration-200'>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>{title}</h2>
        {actions && <div className='flex gap-2'>{actions}</div>}
      </div>

      <ErrorBoundary>
        {isLoading ? (
          <LoadingSkeleton height='h-64' />
        ) : error ? (
          <div className='text-red-600 dark:text-red-400 p-4 bg-red-50 dark:bg-red-900/20 rounded'>
            {error}
          </div>
        ) : (
          children
        )}
      </ErrorBoundary>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  loading?: boolean;
  error?: string;
}

export function StatCard({ title, value, subtitle, loading, error }: StatCardProps) {
  return (
    <div className='bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-lg p-6 hover:shadow-lg dark:hover:shadow-xl transition-shadow duration-200'>
      <h3 className='text-sm font-medium text-gray-600 dark:text-gray-400 truncate'>{title}</h3>
      {loading ? (
        <div className='mt-2 h-8 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded animate-pulse' />
      ) : error ? (
        <p className='text-red-600 dark:text-red-400 text-sm mt-2'>Error loading</p>
      ) : (
        <p className='text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2'>{value}</p>
      )}
      {subtitle && <p className='text-xs text-gray-500 dark:text-gray-500 mt-2'>{subtitle}</p>}
    </div>
  );
}

interface DrillDownPanelProps {
  isOpen: boolean;
  title: string;
  data: any[];
  onClose: () => void;
  onExport?: (format: 'csv' | 'xlsx') => void;
}

export function DrillDownPanel({ isOpen, title, data, onClose, onExport }: DrillDownPanelProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className='fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-40'
        onClick={onClose}
      />

      {/* Panel */}
      <div className='fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-800 shadow-xl z-50 overflow-y-auto'>
        <div className='sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-6 flex items-center justify-between'>
          <h3 className='text-xl font-bold text-gray-900 dark:text-white'>{title}</h3>
          <button
            onClick={onClose}
            className='text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors'
            aria-label='Close panel'
          >
            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
        </div>

        <div className='p-6'>
          {onExport && (
            <div className='mb-6 flex gap-2'>
              <button
                onClick={() => onExport('csv')}
                className='flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors'
              >
                Export CSV
              </button>
              <button
                onClick={() => onExport('xlsx')}
                className='flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors'
              >
                Export Excel
              </button>
            </div>
          )}

          {data.length === 0 ? (
            <p className='text-gray-500 dark:text-gray-400 text-center py-8'>No data to display</p>
          ) : (
            <div className='space-y-4'>
              {data.map((item, idx) => (
                <div key={idx} className='p-4 bg-gray-50 dark:bg-gray-700 rounded-lg'>
                  {Object.entries(item).map(([key, val]: [string, any]) => (
                    <div key={key} className='flex justify-between text-sm mb-2'>
                      <span className='text-gray-600 dark:text-gray-400 capitalize'>{key}:</span>
                      <span className='font-medium text-gray-900 dark:text-white'>
                        {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
