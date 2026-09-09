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
  /** When true, the card and its body flex to fill the available height of a
   * flex-column ancestor instead of sizing to content - used for cards that
   * wrap a scrollable table/content region so only that region scrolls. */
  fill?: boolean;
}

export const AdminCard: React.FC<AdminCardProps> = ({
  children,
  title,
  description,
  className = '',
  onClick,
  loading = false,
  fill = false,
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
        ${fill ? 'flex flex-col flex-1 min-h-0' : ''}
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
      <div
        className={`${loading ? 'opacity-50 pointer-events-none' : ''} ${fill ? 'flex flex-col flex-1 min-h-0' : ''}`}
      >
        {children}
      </div>
    </div>
  );
};
