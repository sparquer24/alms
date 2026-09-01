import React from 'react';
import { useAdminTheme } from '../../context/AdminThemeContext';
import {
  AdminColors,
  AdminLayout,
  AdminBorderRadius,
  AdminShadows,
  AdminSpacing,
  AdminTransitions,
} from '../../styles/admin-design-system';

interface AdminCardProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
  onClick?: () => void;
  loading?: boolean;
}

export const AdminCard: React.FC<AdminCardProps> = ({
  children,
  title,
  description,
  className = '',
  onClick,
  loading = false,
}) => {
  const { colors } = useAdminTheme();

  return (
    <div
      onClick={onClick}
      className={`
        rounded-[${AdminBorderRadius.lg}]
        p-[${AdminLayout.card.padding}]
        transition-all duration-250
        ${onClick ? 'cursor-pointer hover:shadow-lg' : ''}
        ${loading ? 'opacity-75' : ''}
        ${className}
      `}
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
        border: `1px solid ${colors.border}`,
        borderRadius: AdminBorderRadius.lg,
        padding: AdminLayout.card.padding,
        boxShadow: AdminShadows.md,
      }}
    >
      {title && (
        <h3
          style={{
            color: colors.text.primary,
            fontSize: '16px',
            fontWeight: 600,
            marginBottom: AdminSpacing.md,
          }}
        >
          {title}
        </h3>
      )}
      {description && (
        <p
          style={{
            color: colors.text.secondary,
            fontSize: '14px',
            marginBottom: AdminSpacing.lg,
          }}
        >
          {description}
        </p>
      )}
      <div className={loading ? 'opacity-50 pointer-events-none' : ''}>{children}</div>
    </div>
  );
};
