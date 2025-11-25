import React from 'react';

interface AdminErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface AdminErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class AdminErrorBoundary extends React.Component<
  AdminErrorBoundaryProps,
  AdminErrorBoundaryState
> {
  constructor(props: AdminErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Admin Error Boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div
            style={{
              padding: '20px',
              backgroundColor: '#fee2e2',
              border: '1px solid #fca5a5',
              borderRadius: '8px',
              color: '#991b1b',
            }}
          >
            <h3 style={{ margin: '0 0 8px 0' }}>Something went wrong</h3>
            <p style={{ margin: 0, fontSize: '14px' }}>{this.state.error?.message}</p>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
