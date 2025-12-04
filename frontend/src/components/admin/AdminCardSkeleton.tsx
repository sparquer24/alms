import React from 'react';
import { useAdminTheme } from '../../context/AdminThemeContext';
import { AdminSpacing, AdminBorderRadius } from '../../styles/admin-design-system';

interface AdminCardSkeletonProps {
  count?: number;
}

export const AdminCardSkeleton: React.FC<AdminCardSkeletonProps> = ({ count = 1 }) => {
  const { colors } = useAdminTheme();

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            backgroundColor: colors.surface,
            borderRadius: AdminBorderRadius.lg,
            padding: AdminSpacing.xl,
            border: `1px solid ${colors.border}`,
            marginBottom: i < count - 1 ? AdminSpacing.lg : 0,
          }}
        >
          {/* Title skeleton */}
          <div
            style={{
              height: '24px',
              width: '30%',
              backgroundColor: colors.border,
              borderRadius: AdminBorderRadius.md,
              marginBottom: AdminSpacing.lg,
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}
          />

          {/* Content skeleton */}
          {Array.from({ length: 3 }).map((_, j) => (
            <div
              key={j}
              style={{
                height: '16px',
                width: j === 2 ? '80%' : '100%',
                backgroundColor: colors.border,
                borderRadius: AdminBorderRadius.md,
                marginBottom: AdminSpacing.md,
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                animationDelay: `${j * 50}ms`,
              }}
            />
          ))}
        </div>
      ))}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </>
  );
};
