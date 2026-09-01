import React from 'react';
import { AdminBorderRadius, AdminSpacing } from '@/styles/admin-design-system';
import { useAdminTheme } from '@/context/AdminThemeContext';

export interface ConfirmationDialogConfig {
  title: string;
  message: string;
  type: 'delete' | 'deactivate' | 'warning' | 'info';
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

interface ConfirmationDialogProps {
  isOpen: boolean;
  config?: ConfirmationDialogConfig;
  isLoading?: boolean;
  onClose: () => void;
}

const getTypeStyles = (
  type: string,
  colors: any
): {
  backgroundColor: string;
  iconColor: string;
  confirmColor: string;
} => {
  switch (type) {
    case 'delete':
      return {
        backgroundColor: '#ffebee',
        iconColor: '#c62828',
        confirmColor: '#dc3545',
      };
    case 'deactivate':
      return {
        backgroundColor: '#fff3e0',
        iconColor: '#f57c00',
        confirmColor: '#fd7e14',
      };
    case 'warning':
      return {
        backgroundColor: '#fff3e0',
        iconColor: '#f57c00',
        confirmColor: '#fd7e14',
      };
    default:
      return {
        backgroundColor: '#e3f2fd',
        iconColor: '#1976d2',
        confirmColor: '#1976d2',
      };
  }
};

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  config,
  isLoading = false,
  onClose,
}) => {
  const { colors } = useAdminTheme();

  if (!isOpen || !config) return null;

  const typeStyles = getTypeStyles(config.type, colors);

  const handleConfirm = async () => {
    try {
      await config.onConfirm();
      onClose();
    } catch (error) {
      // Error handling in parent component
    }
  };

  const handleCancel = () => {
    config.onCancel?.();
    onClose();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'delete':
        return '🗑️';
      case 'deactivate':
        return '⚠️';
      case 'warning':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={e => {
        if (e.target === e.currentTarget && !isLoading) {
          handleCancel();
        }
      }}
    >
      <div
        style={{
          backgroundColor: colors.surface,
          borderRadius: AdminBorderRadius.lg,
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
          maxWidth: '400px',
          width: '90%',
          overflow: 'hidden',
        }}
      >
        {/* Icon Section */}
        <div
          style={{
            padding: AdminSpacing.lg,
            backgroundColor: typeStyles.backgroundColor,
            display: 'flex',
            justifyContent: 'center',
            fontSize: '48px',
          }}
        >
          {getIcon(config.type)}
        </div>

        {/* Content */}
        <div
          style={{
            padding: AdminSpacing.lg,
            display: 'flex',
            flexDirection: 'column',
            gap: AdminSpacing.md,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 600,
              color: colors.text.primary,
              textAlign: 'center',
            }}
          >
            {config.title}
          </h2>

          <p
            style={{
              margin: 0,
              fontSize: '14px',
              color: colors.text.secondary,
              textAlign: 'center',
              lineHeight: 1.6,
            }}
          >
            {config.message}
          </p>

          {/* Warning for delete/deactivate */}
          {(config.type === 'delete' || config.type === 'deactivate') && (
            <div
              style={{
                padding: AdminSpacing.md,
                backgroundColor: '#fff5f5',
                borderLeft: `4px solid ${typeStyles.confirmColor}`,
                borderRadius: AdminBorderRadius.sm,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: '12px',
                  color: '#c62828',
                  fontWeight: 500,
                }}
              >
                ⚠️ This action cannot be undone.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: AdminSpacing.lg,
            borderTop: `1px solid ${colors.border}`,
            display: 'flex',
            gap: AdminSpacing.md,
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={handleCancel}
            disabled={isLoading}
            style={{
              padding: '8px 16px',
              borderRadius: AdminBorderRadius.md,
              border: `1px solid ${colors.border}`,
              backgroundColor: 'transparent',
              color: colors.text.secondary,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              opacity: isLoading ? 0.5 : 1,
            }}
          >
            {config.cancelText || 'Cancel'}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            style={{
              padding: '8px 16px',
              borderRadius: AdminBorderRadius.md,
              border: 'none',
              backgroundColor: typeStyles.confirmColor,
              color: '#ffffff',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              opacity: isLoading ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {isLoading && (
              <span
                style={{
                  display: 'inline-block',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  borderTop: '2px solid white',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
            )}
            {isLoading ? 'Processing...' : config.confirmText || 'Confirm'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};
