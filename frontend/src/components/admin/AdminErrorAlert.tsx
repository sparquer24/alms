import React from 'react';
import { useAdminTheme } from '../../context/AdminThemeContext';
import { AdminSpacing, AdminBorderRadius } from '../../styles/admin-design-system';

interface AdminErrorAlertProps {
  title: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export const AdminErrorAlert: React.FC<AdminErrorAlertProps> = ({
  title,
  message,
  onRetry,
  onDismiss,
  className = '',
}) => {
  const { colors } = useAdminTheme();

  return (
    <div
      className={className}
      style={{
        backgroundColor: colors.background,
        border: `1px solid ${colors.status.error}`,
        borderRadius: AdminBorderRadius.lg,
        padding: AdminSpacing.lg,
        display: 'flex',
        gap: AdminSpacing.lg,
      }}
    >
      <div style={{ flex: 1 }}>
        <h3
          style={{
            margin: 0,
            marginBottom: AdminSpacing.sm,
            color: colors.status.error,
            fontWeight: 600,
          }}
        >
          {title}
        </h3>
        <p
          style={{
            margin: 0,
            color: colors.text.secondary,
            fontSize: '14px',
            lineHeight: '20px',
          }}
        >
          {message}
        </p>
      </div>

      <div style={{ display: 'flex', gap: AdminSpacing.md }}>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              padding: '8px 16px',
              backgroundColor: colors.status.error,
              color: '#ffffff',
              border: 'none',
              borderRadius: AdminBorderRadius.md,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              whiteSpace: 'nowrap',
            }}
          >
            Retry
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              color: colors.text.secondary,
              border: `1px solid ${colors.border}`,
              borderRadius: AdminBorderRadius.md,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
};
