import React from 'react';
import { useAdminTheme } from '../../context/AdminThemeContext';
import { AdminSpacing, AdminBorderRadius } from '../../styles/admin-design-system';

interface AdminFormSkeletonProps {
  fields?: number;
  showButton?: boolean;
}

export const AdminFormSkeleton: React.FC<AdminFormSkeletonProps> = ({
  fields = 5,
  showButton = true,
}) => {
  const { colors } = useAdminTheme();

  return (
    <div
      style={{
        backgroundColor: colors.surface,
        borderRadius: AdminBorderRadius.lg,
        padding: AdminSpacing.xl,
        border: `1px solid ${colors.border}`,
      }}
    >
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} style={{ marginBottom: AdminSpacing.lg }}>
          {/* Label skeleton */}
          <div
            style={{
              height: '16px',
              width: '120px',
              backgroundColor: colors.border,
              borderRadius: AdminBorderRadius.md,
              marginBottom: AdminSpacing.md,
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}
          />
          {/* Input skeleton */}
          <div
            style={{
              height: '40px',
              width: '100%',
              backgroundColor: colors.border,
              borderRadius: AdminBorderRadius.md,
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              animationDelay: `${i * 50}ms`,
            }}
          />
        </div>
      ))}

      {showButton && (
        <div
          style={{
            display: 'flex',
            gap: AdminSpacing.md,
            marginTop: AdminSpacing.xl,
          }}
        >
          <div
            style={{
              height: '40px',
              width: '120px',
              backgroundColor: colors.border,
              borderRadius: AdminBorderRadius.md,
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}
          />
          <div
            style={{
              height: '40px',
              width: '120px',
              backgroundColor: colors.border,
              borderRadius: AdminBorderRadius.md,
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              animationDelay: '100ms',
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};
