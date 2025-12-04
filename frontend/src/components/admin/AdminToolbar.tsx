import React from 'react';
import { useAdminTheme } from '../../context/AdminThemeContext';
import {
  AdminLayout,
  AdminBorderRadius,
  AdminShadows,
  AdminSpacing,
} from '../../styles/admin-design-system';

interface AdminToolbarProps {
  children: React.ReactNode;
  className?: string;
  sticky?: boolean;
}

export const AdminToolbar: React.FC<AdminToolbarProps> = ({
  children,
  className = '',
  sticky = true,
}) => {
  const { colors } = useAdminTheme();

  return (
    <div
      className={className}
      style={{
        backgroundColor: colors.surface,
        borderBottom: `1px solid ${colors.border}`,
        padding: AdminLayout.header.padding,
        display: 'flex',
        alignItems: 'center',
        gap: AdminLayout.header.gap,
        height: AdminLayout.header.height,
        boxShadow: AdminShadows.sm,
        position: sticky ? 'sticky' : 'static',
        top: sticky ? 0 : undefined,
        zIndex: sticky ? 10 : undefined,
      }}
    >
      {children}
    </div>
  );
};
