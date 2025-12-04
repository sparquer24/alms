import React, { useState, useEffect } from 'react';
import { AdminBorderRadius, AdminSpacing } from '@/styles/admin-design-system';
import { useAdminTheme } from '@/context/AdminThemeContext';

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

const PERMISSION_LIST: Permission[] = [
  // Capability Permissions
  { key: 'can_forward', label: 'Can Forward Applications', category: 'Capabilities' },
  { key: 'can_FLAF', label: 'Can FLAF (Fresh License Form)', category: 'Capabilities' },
  {
    key: 'can_generate_ground_report',
    label: 'Can Generate Ground Report',
    category: 'Capabilities',
  },
  { key: 'can_re_enquiry', label: 'Can Re-enquiry', category: 'Capabilities' },
  { key: 'can_create_freshLicence', label: 'Can Create Fresh Licence', category: 'Capabilities' },
  { key: 'can_access_settings', label: 'Can Access Settings', category: 'Capabilities' },

  // View Permissions
  { key: 'canViewFreshForm', label: 'View Fresh Forms', category: 'View Permissions' },
  { key: 'canViewForwarded', label: 'View Forwarded Applications', category: 'View Permissions' },
  { key: 'canViewReturned', label: 'View Returned Applications', category: 'View Permissions' },
  {
    key: 'canViewRedFlagged',
    label: 'View Red Flagged Applications',
    category: 'View Permissions',
  },
  { key: 'canViewDisposed', label: 'View Disposed Applications', category: 'View Permissions' },
  { key: 'canViewSent', label: 'View Sent Applications', category: 'View Permissions' },
  { key: 'canViewFinalDisposal', label: 'View Final Disposal', category: 'View Permissions' },
  { key: 'canViewReports', label: 'View Reports', category: 'View Permissions' },

  // Action Permissions
  { key: 'canSubmitApplication', label: 'Submit Applications', category: 'Actions' },
  { key: 'canCaptureUIN', label: 'Capture UIN', category: 'Actions' },
  { key: 'canCaptureBiometrics', label: 'Capture Biometrics', category: 'Actions' },
  { key: 'canUploadDocuments', label: 'Upload Documents', category: 'Actions' },
  { key: 'canForwardToACP', label: 'Forward to ACP', category: 'Actions' },
  { key: 'canForwardToSHO', label: 'Forward to SHO', category: 'Actions' },
  { key: 'canForwardToDCP', label: 'Forward to DCP', category: 'Actions' },
  { key: 'canForwardToAS', label: 'Forward to AS', category: 'Actions' },
  { key: 'canForwardToCP', label: 'Forward to CP', category: 'Actions' },
  { key: 'canConductEnquiry', label: 'Conduct Enquiry', category: 'Actions' },
  { key: 'canAddRemarks', label: 'Add Remarks', category: 'Actions' },
  { key: 'canApproveTA', label: 'Approve TA', category: 'Actions' },
  { key: 'canApproveAI', label: 'Approve AI', category: 'Actions' },
  { key: 'canReject', label: 'Reject Applications', category: 'Actions' },
  { key: 'canRequestResubmission', label: 'Request Resubmission', category: 'Actions' },
  { key: 'canGeneratePDF', label: 'Generate PDF', category: 'Actions' },
];

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
