import React from 'react';

interface DataStateProps {
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyMessage?: string;
  children?: React.ReactNode;
}

export const DataState: React.FC<DataStateProps> = ({ loading, error, empty, emptyMessage = 'No data available', children }) => {
  if (loading) {
    return (
      <div className="p-4 text-sm text-gray-600 flex items-center gap-2">
        <span className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-transparent rounded-full" />
        Loading...
      </div>
    );
  }
  if (error) {
    return <div className="p-4 text-sm bg-red-50 text-red-700 border border-red-200 rounded">{error}</div>;
  }
  if (empty) {
    return <div className="p-4 text-sm text-gray-500">{emptyMessage}</div>;
  }
  return <>{children}</>;
};

export default DataState;
