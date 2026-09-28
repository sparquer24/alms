import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminBorderRadius, AdminSpacing } from '@/styles/admin-design-system';
import { useAdminTheme } from '@/context/AdminThemeContext';
import { AdminPermissionService } from '@/services/admin/permissions';

interface Permission {
  key: string;
  label: string;
  category?: string;
}

interface PermissionMatrixProps {
  permissions: Record<string, boolean>;
  onChange?: (permissions: Record<string, boolean>) => void;
  readOnly?: boolean;
}

export const PermissionMatrix: React.FC<PermissionMatrixProps> = ({
  permissions,
  onChange,
  readOnly = false,
}) => {
  const { colors } = useAdminTheme();
  const [localPermissions, setLocalPermissions] = useState<Record<string, boolean>>(permissions);

  useEffect(() => {
    setLocalPermissions(permissions);
  }, [permissions]);

  // The permission catalog (key/label/category) is managed in Admin > Permissions;
  // this matrix only edits which of those keys a given role has enabled.
  const { data: catalogPermissions = [] } = useQuery({
    queryKey: ['admin-permissions'],
    queryFn: () => AdminPermissionService.getPermissions(),
    staleTime: 5 * 60 * 1000,
  });

  const PERMISSION_LIST: Permission[] = catalogPermissions.map(p => ({
    key: p.key,
    label: p.label,
    category: p.category,
  }));

  const handlePermissionChange = (key: string, value: boolean) => {
    if (readOnly) return;

    const updated = {
      ...localPermissions,
      [key]: value,
    };
    setLocalPermissions(updated);
    onChange?.(updated);
  };

  const handleSelectAllInCategory = (category: string, value: boolean) => {
    if (readOnly) return;

    const categoryPermissions = PERMISSION_LIST.filter(p => p.category === category);
    const updated = { ...localPermissions };

    categoryPermissions.forEach(p => {
      updated[p.key] = value;
    });

    setLocalPermissions(updated);
    onChange?.(updated);
  };

  // Group permissions by category
  const permissionsByCategory = PERMISSION_LIST.reduce(
    (acc, perm) => {
      const category = perm.category || 'Other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(perm);
      return acc;
    },
    {} as Record<string, Permission[]>
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: AdminSpacing.lg,
      }}
    >
      {Object.entries(permissionsByCategory).map(([category, perms]) => {
        const categoryChecked = perms.every(p => localPermissions[p.key]);

        return (
          <div
            key={category}
            style={{
              border: `1px solid ${colors.border}`,
              borderRadius: AdminBorderRadius.lg,
              padding: AdminSpacing.lg,
              backgroundColor: colors.surface,
            }}
          >
            {/* Category Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: AdminSpacing.md,
                marginBottom: AdminSpacing.lg,
                paddingBottom: AdminSpacing.md,
                borderBottom: `1px solid ${colors.border}`,
              }}
            >
              {!readOnly && (
                <input
                  type='checkbox'
                  checked={categoryChecked}
                  onChange={e => handleSelectAllInCategory(category, e.target.checked)}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer',
                    accentColor: '#1976d2',
                  }}
                />
              )}
              <h4
                style={{
                  margin: 0,
                  color: colors.text.primary,
                  fontWeight: 600,
                  fontSize: '14px',
                }}
              >
                {category}
              </h4>
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: '12px',
                  color: colors.text.secondary,
                }}
              >
                {perms.filter(p => localPermissions[p.key]).length} of {perms.length} enabled
              </span>
            </div>

            {/* Permission Items */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: AdminSpacing.md,
              }}
            >
              {perms.map(({ key, label }) => (
                <label
                  key={key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: AdminSpacing.md,
                    cursor: readOnly ? 'default' : 'pointer',
                    padding: '8px',
                    borderRadius: AdminBorderRadius.sm,
                    backgroundColor: localPermissions[key] ? '#e3f2fd' : 'transparent',
                    transition: 'background-color 0.2s',
                  }}
                >
                  <input
                    type='checkbox'
                    checked={localPermissions[key] || false}
                    onChange={e => handlePermissionChange(key, e.target.checked)}
                    disabled={readOnly}
                    style={{
                      width: '16px',
                      height: '16px',
                      cursor: readOnly ? 'not-allowed' : 'pointer',
                      accentColor: '#1976d2',
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        color: colors.text.primary,
                        fontSize: '14px',
                        fontWeight: 500,
                      }}
                    >
                      {label}
                    </div>
                    <div
                      style={{
                        color: colors.text.secondary,
                        fontSize: '12px',
                        marginTop: '2px',
                      }}
                    >
                      {key}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        );
      })}

      {/* Summary */}
      <div
        style={{
          padding: AdminSpacing.md,
          backgroundColor: colors.background,
          borderRadius: AdminBorderRadius.lg,
          border: `1px solid ${colors.border}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              color: colors.text.secondary,
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            Total Permissions Enabled:
          </span>
          <span
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#1976d2',
            }}
          >
            {Object.values(localPermissions).filter(Boolean).length} / {PERMISSION_LIST.length}
          </span>
        </div>
      </div>
    </div>
  );
};
