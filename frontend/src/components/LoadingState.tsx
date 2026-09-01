'use client';

import React from 'react';

/**
 * Props for the LoadingState component.
 *
 * The component handles up to four sequential states:
 * 1. Loading → renders `skeleton` (or a default spinner)
 * 2. Error   → renders `errorComponent` (or a default error card)
 * 3. Empty   → renders `emptyComponent` or `emptyMessage`
 * 4. Success → renders `children`
 */
export interface LoadingStateProps {
  /** When truthy, the skeleton/loading indicator is shown */
  isLoading?: boolean;

  /** When truthy/string, the error state is shown */
  error?: string | null;

  /** When true (and not loading/error), the empty state is shown */
  isEmpty?: boolean;

  /** Custom skeleton component to render while loading */
  skeleton?: React.ReactNode;

  /** Custom error component rendered instead of the default error card */
  errorComponent?: React.ReactNode;

  /** Custom empty-state component rendered instead of the default message */
  emptyComponent?: React.ReactNode;

  /** Shorthand for a simple text empty-state message */
  emptyMessage?: string;

  /** Optional callback for a "Retry" button shown in the default error card */
  onRetry?: () => void;

  /** The content rendered when none of the above states are active */
  children?: React.ReactNode;
}

// ─── Default Sub-components ───────────────────────────────────────────────

const DefaultSpinner: React.FC = () => (
  <div className='flex items-center justify-center py-20'>
    <svg
      className='animate-spin h-8 w-8 text-blue-600'
      xmlns='http://www.w3.org/2000/svg'
      fill='none'
      viewBox='0 0 24 24'
      aria-label='Loading'
    >
      <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
      <path
        className='opacity-75'
        fill='currentColor'
        d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
      />
    </svg>
  </div>
);

const DefaultError: React.FC<{ message: string; onRetry?: () => void }> = ({
  message,
  onRetry,
}) => {
  const text = message;
  return (
    <div className='rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm'>
      <div className='flex items-start gap-4'>
        <div className='flex-shrink-0 mt-0.5'>
          <svg className='h-6 w-6 text-red-400' fill='currentColor' viewBox='0 0 20 20'>
            <path
              fillRule='evenodd'
              d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
              clipRule='evenodd'
            />
          </svg>
        </div>
        <div className='flex-1'>
          <h3 className='text-sm font-semibold text-red-800'>Error</h3>
          <p className='mt-1 text-sm text-red-700'>{text}</p>
          {onRetry && (
            <button
              type='button'
              onClick={onRetry}
              className='mt-3 inline-flex items-center gap-1.5 rounded-lg bg-red-100 px-3 py-1.5 text-sm font-medium text-red-800 hover:bg-red-200 transition-colors'
            >
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                />
              </svg>
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const DefaultEmpty: React.FC<{ message: string }> = ({ message }) => (
  <div className='flex flex-col items-center justify-center py-16 text-center'>
    <svg
      className='w-16 h-16 text-gray-300 mb-4'
      fill='none'
      stroke='currentColor'
      viewBox='0 0 24 24'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={1}
        d='M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4'
      />
    </svg>
    <p className='text-lg font-medium text-gray-500'>{message}</p>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────

/**
 * LoadingState is a polymorphic wrapper that renders one of four states
 * based on the props:
 *
 * | State    | Prop              | Renders                       |
 * |----------|-------------------|-------------------------------|
 * | Loading  | `isLoading`       | `skeleton` or default spinner |
 * | Error    | `error`           | `errorComponent` or default   |
 * | Empty    | `isEmpty`         | `emptyComponent` or message   |
 * | Success  | (none of above)   | `children`                    |
 *
 * @example
 * ```tsx
 * <LoadingState
 *   isLoading={loading}
 *   error={error}
 *   isEmpty={!error && items.length === 0}
 *   skeleton={<TableSkeleton rows={8} columns={5} />}
 *   emptyMessage="No users found"
 *   onRetry={refetch}
 * >
 *   <UserTable data={items} />
 * </LoadingState>
 * ```
 */
const LoadingState: React.FC<LoadingStateProps> = ({
  isLoading,
  error,
  isEmpty,
  skeleton,
  errorComponent,
  emptyComponent,
  emptyMessage = 'No data available.',
  onRetry,
  children,
}) => {
  // 1. Loading
  if (isLoading) {
    return skeleton ? <>{skeleton}</> : <DefaultSpinner />;
  }

  // 2. Error
  if (error) {
    return errorComponent ? (
      <>{errorComponent}</>
    ) : (
      <DefaultError message={error} onRetry={onRetry} />
    );
  }

  // 3. Empty
  if (isEmpty) {
    return emptyComponent ? <>{emptyComponent}</> : <DefaultEmpty message={emptyMessage} />;
  }

  // 4. Success — render children
  return <>{children}</>;
};

export default LoadingState;
