import React from 'react';
import { useAdminTheme } from '../../context/AdminThemeContext';
import {
  AdminLayout,
  AdminBorderRadius,
  AdminShadows,
  AdminSpacing,
  AdminZIndex,
} from '../../styles/admin-design-system';

interface AdminModalProps {
  isOpen: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
  className?: string;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  title,
  children,
  onClose,
  footer,
  className = '',
}) => {
  const { colors } = useAdminTheme();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: AdminZIndex.modal - 1,
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          maxWidth: AdminLayout.modal.maxWidth,
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto',
          zIndex: AdminZIndex.modal,
          backgroundColor: colors.surface,
          borderRadius: AdminLayout.modal.borderRadius,
          boxShadow: AdminShadows['2xl'],
        }}
        className={className}
      >
        {/* Header */}
        <div
          style={{
            padding: AdminLayout.modal.padding,
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2
            style={{
              color: colors.text.primary,
              fontSize: '20px',
              fontWeight: 600,
              margin: 0,
            }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: colors.text.secondary,
              padding: '0',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: AdminBorderRadius.md,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = colors.hover;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            padding: AdminLayout.modal.padding,
          }}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            style={{
              padding: AdminLayout.modal.padding,
              borderTop: `1px solid ${colors.border}`,
              display: 'flex',
              justifyContent: 'flex-end',
              gap: AdminSpacing.md,
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </>
  );
};
