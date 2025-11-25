import React, { useState, useEffect } from 'react';
import { AdminBorderRadius, AdminSpacing } from '@/styles/admin-design-system';
import { useAdminTheme } from '@/context/AdminThemeContext';
import { PermissionMatrix } from './PermissionMatrix';

interface Role {
  id?: number;
  name: string;
  code: string;
  dashboard_title: string;
  description?: string;
  is_active?: boolean;
  permissions?: Record<string, boolean>;
  [key: string]: any;
}

interface RoleFormModalProps {
  isOpen: boolean;
  role?: Role | null;
  onClose: () => void;
  onSave: (roleData: Role) => Promise<void>;
  isSaving?: boolean;
  errors?: Record<string, string>;
}

export const RoleFormModal: React.FC<RoleFormModalProps> = ({
  isOpen,
  role,
  onClose,
  onSave,
  isSaving = false,
  errors = {},
}) => {
  const { colors } = useAdminTheme();
  const [formData, setFormData] = useState<Role>({
    name: '',
    code: '',
    dashboard_title: '',
    description: '',
    is_active: true,
    permissions: {},
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showPermissions, setShowPermissions] = useState(false);

  useEffect(() => {
    if (role) {
      setFormData(role);
    } else {
      setFormData({
        name: '',
        code: '',
        dashboard_title: '',
        description: '',
        is_active: true,
        permissions: {},
      });
    }
    setValidationErrors({});
    setShowPermissions(false);
  }, [role, isOpen]);

  const generateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '_')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      name: value,
    }));
    // Auto-generate code if not explicitly edited
    if (!formData.code || formData.code === generateSlug((formData as any).prevName || '')) {
      setFormData(prev => ({
        ...prev,
        code: generateSlug(value),
      }));
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const handlePermissionsChange = (permissions: Record<string, boolean>) => {
    setFormData(prev => ({
      ...prev,
      permissions,
    }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name || formData.name.trim() === '') {
      errors.name = 'Role name is required';
    }

    if (!formData.code || formData.code.trim() === '') {
      errors.code = 'Role code is required';
    }

    if (!formData.dashboard_title || formData.dashboard_title.trim() === '') {
      errors.dashboard_title = 'Dashboard title is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await onSave(formData);
    } catch (error) {
      // Errors are handled by parent component
    }
  };

  if (!isOpen) return null;

  const isEditMode = !!role?.id;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={e => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        style={{
          backgroundColor: colors.surface,
          borderRadius: AdminBorderRadius.lg,
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
          maxWidth: '700px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: AdminSpacing.lg,
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 600,
              color: colors.text.primary,
            }}
          >
            {isEditMode ? 'Edit Role' : 'Create New Role'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: colors.text.secondary,
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            padding: AdminSpacing.lg,
            display: 'flex',
            flexDirection: 'column',
            gap: AdminSpacing.lg,
          }}
        >
          {/* Basic Information */}
          <div>
            <h3
              style={{
                margin: `0 0 ${AdminSpacing.md}px 0`,
                fontSize: '14px',
                fontWeight: 600,
                color: colors.text.primary,
              }}
            >
              Basic Information
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: AdminSpacing.md }}>
              {/* Role Name */}
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: colors.text.primary,
                  }}
                >
                  Role Name *
                </label>
                <input
                  type='text'
                  value={formData.name}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder='e.g., Inspector, Auditor'
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${validationErrors.name ? '#dc3545' : colors.border}`,
                    borderRadius: AdminBorderRadius.md,
                    fontSize: '14px',
                    color: colors.text.primary,
                    backgroundColor: colors.surface,
                    boxSizing: 'border-box',
                    ':focus': {
                      outline: 'none',
                      borderColor: '#1976d2',
                    },
                  }}
                />
                {validationErrors.name && (
                  <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>
                    {validationErrors.name}
                  </div>
                )}
              </div>

              {/* Role Code */}
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: colors.text.primary,
                  }}
                >
                  Role Code * (auto-generated from name)
                </label>
                <input
                  type='text'
                  value={formData.code}
                  onChange={e => handleInputChange('code', e.target.value)}
                  placeholder='e.g., inspector'
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${validationErrors.code ? '#dc3545' : colors.border}`,
                    borderRadius: AdminBorderRadius.md,
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    color: colors.text.primary,
                    backgroundColor: colors.surface,
                    boxSizing: 'border-box',
                  }}
                />
                {validationErrors.code && (
                  <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>
                    {validationErrors.code}
                  </div>
                )}
                <div style={{ fontSize: '12px', color: colors.text.secondary, marginTop: '4px' }}>
                  Unique identifier for this role (must be lowercase with underscores)
                </div>
              </div>

              {/* Dashboard Title */}
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: colors.text.primary,
                  }}
                >
                  Dashboard Title *
                </label>
                <input
                  type='text'
                  value={formData.dashboard_title}
                  onChange={e => handleInputChange('dashboard_title', e.target.value)}
                  placeholder='e.g., Inspector Dashboard'
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${validationErrors.dashboard_title ? '#dc3545' : colors.border}`,
                    borderRadius: AdminBorderRadius.md,
                    fontSize: '14px',
                    color: colors.text.primary,
                    backgroundColor: colors.surface,
                    boxSizing: 'border-box',
                  }}
                />
                {validationErrors.dashboard_title && (
                  <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>
                    {validationErrors.dashboard_title}
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: colors.text.primary,
                  }}
                >
                  Description
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={e => handleInputChange('description', e.target.value)}
                  placeholder='Describe the purpose of this role'
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: AdminBorderRadius.md,
                    fontSize: '14px',
                    color: colors.text.primary,
                    backgroundColor: colors.surface,
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Status Toggle */}
              {isEditMode && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: AdminSpacing.md,
                    padding: AdminSpacing.md,
                    backgroundColor: colors.background,
                    borderRadius: AdminBorderRadius.md,
                  }}
                >
                  <label
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: AdminSpacing.sm,
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: colors.text.primary,
                      fontWeight: 500,
                    }}
                  >
                    <input
                      type='checkbox'
                      checked={formData.is_active || false}
                      onChange={e => handleInputChange('is_active', e.target.checked)}
                      style={{
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer',
                        accentColor: '#1976d2',
                      }}
                    />
                    Active Role
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Permissions Section */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: AdminSpacing.md,
                cursor: 'pointer',
              }}
              onClick={() => setShowPermissions(!showPermissions)}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: '14px',
                  fontWeight: 600,
                  color: colors.text.primary,
                }}
              >
                Permissions & Capabilities
              </h3>
              <span
                style={{
                  fontSize: '12px',
                  color: colors.text.secondary,
                  userSelect: 'none',
                }}
              >
                {showPermissions ? '▼' : '▶'}
              </span>
            </div>

            {showPermissions && (
              <PermissionMatrix
                permissions={formData.permissions || {}}
                onChange={handlePermissionsChange}
                readOnly={false}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: AdminSpacing.lg,
            borderTop: `1px solid ${colors.border}`,
            display: 'flex',
            gap: AdminSpacing.md,
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onClose}
            disabled={isSaving}
            style={{
              padding: '8px 16px',
              borderRadius: AdminBorderRadius.md,
              border: `1px solid ${colors.border}`,
              backgroundColor: 'transparent',
              color: colors.text.secondary,
              cursor: isSaving ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              opacity: isSaving ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            style={{
              padding: '8px 16px',
              borderRadius: AdminBorderRadius.md,
              border: 'none',
              backgroundColor: '#1976d2',
              color: '#ffffff',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              opacity: isSaving ? 0.6 : 1,
            }}
          >
            {isSaving ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    borderTop: '2px solid white',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                Saving...
              </span>
            ) : (
              `${isEditMode ? 'Update' : 'Create'} Role`
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};
