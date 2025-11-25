import React from 'react';
import { useAdminTheme } from '../../context/AdminThemeContext';
import { AdminSpacing, AdminBorderRadius } from '../../styles/admin-design-system';

export const AdminTableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 4,
}) => {
  const { colors } = useAdminTheme();

  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          backgroundColor: colors.surface,
        }}
      >
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th
                key={i}
                style={{
                  padding: AdminSpacing.lg,
                  height: '48px',
                }}
              >
                <div
                  style={{
                    height: '16px',
                    backgroundColor: colors.border,
                    borderRadius: AdminBorderRadius.md,
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                  }}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowI) => (
            <tr
              key={rowI}
              style={{
                borderBottom: `1px solid ${colors.border}`,
                height: '48px',
              }}
            >
              {Array.from({ length: columns }).map((_, colI) => (
                <td
                  key={colI}
                  style={{
                    padding: AdminSpacing.lg,
                  }}
                >
                  <div
                    style={{
                      height: '16px',
                      backgroundColor: colors.border,
                      borderRadius: AdminBorderRadius.md,
                      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                      animationDelay: `${rowI * 50}ms`,
                    }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};
