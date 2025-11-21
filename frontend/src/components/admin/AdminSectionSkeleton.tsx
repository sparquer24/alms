import React from 'react';
import { useAdminTheme } from '../../context/AdminThemeContext';
import { AdminSpacing, AdminBorderRadius } from '../../styles/admin-design-system';

interface AdminSectionSkeletonProps {
  lines?: number;
  height?: string;
}

export const AdminSectionSkeleton: React.FC<AdminSectionSkeletonProps> = ({
  lines = 5,
  height = '400px',
}) => {
  const { colors } = useAdminTheme();

  return (
    <div
      style={{
        backgroundColor: colors.surface,
        borderRadius: AdminBorderRadius.lg,
        padding: AdminSpacing.xl,
        border: `1px solid ${colors.border}`,
        minHeight: height,
      }}
    >
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          style={{
            height: i === 0 ? '28px' : '16px',
            width: i === lines - 1 ? '70%' : '100%',
            backgroundColor: colors.border,
            borderRadius: AdminBorderRadius.md,
            marginBottom: AdminSpacing.lg,
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            animationDelay: `${i * 50}ms`,
          }}
        />
      ))}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};
