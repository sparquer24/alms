import React, { useState, useEffect } from 'react';
import { AdminBorderRadius, AdminSpacing } from '@/styles/admin-design-system';
import { useAdminTheme } from '@/context/AdminThemeContext';
import type { ActionFormData } from '@/services/admin/actions';

interface ActionFormModalProps {
  isOpen: boolean;
  action?: (ActionFormData & { id?: number }) | null;
  onClose: () => void;
  onSave: (data: ActionFormData) => Promise<void>;
  isSaving?: boolean;
  errors?: Record<string, string>;
}

export const ActionFormModal: React.FC<ActionFormModalProps> = ({
  isOpen,
  action,
  onClose,
  onSave,
  isSaving = false,
  errors = {},
}) => {
  const { colors } = useAdminTheme();
  const [formData, setFormData] = useState<ActionFormData>({
    name: '',
    code: '',
    description: '',
    isActive: true,
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (action) {
      setFormData({
        name: action.name || '',
        code: action.code || '',
        description: action.description || '',
        isActive: action.isActive !== undefined ? action.isActive : true,
      });
    } else {
      setFormData({
        name: '',
        code: '',
        description: '',
        isActive: true,
      });
    }
    setValidationErrors({});
  }, [action, isOpen]);

  const generateCode = (text: string): string => {
    return text
      .toUpperCase()
      .trim()
      .replace(/[^A-Z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  };

  const handleNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      name: value,
    }));
    if (!formData.code || formData.code === generateCode((formData as any).prevName || '')) {
      setFormData(prev => ({
        ...prev,
        code: generateCode(value),
      }));
    }
  };

  const handleInputChange = (field: keyof ActionFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Action name is required';
    if (!formData.code.trim()) errors.code = 'Action code is required';
    if (!/^[A-Z][A-Z0-9_]*$/.test(formData.code)) {
      errors.code = 'Code must be uppercase letters, numbers, and underscores only';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      await onSave(formData);
    } catch (error) {
      // Errors handled by parent
    }
  };

  if (!isOpen) return null;    const isEditMode = !!action?.id;

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
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: colors.surface,
          borderRadius: AdminBorderRadius.lg,
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
          maxWidth: '550px',
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
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: colors.text.primary }}>
            {isEditMode ? 'Edit Action' : 'Create New Action'}
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
        <div style={{ padding: AdminSpacing.lg, display: 'flex', flexDirection: 'column', gap: AdminSpacing.lg }}>
          {/* Action Name */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500, color: colors.text.primary }}>
              Action Name *
            </label>
            <input
              type='text'
              value={formData.name}
              onChange={e => handleNameChange(e.target.value)}
              placeholder='e.g., Forward, Approve, Reject'
              style={{
                width: '100%',
                padding: '8px 12px',
                border: `1px solid ${validationErrors.name ? colors.status.error : colors.border}`,
                borderRadius: AdminBorderRadius.md,
                fontSize: '14px',
                color: colors.text.primary,
                backgroundColor: colors.surface,
                boxSizing: 'border-box',
              }}
            />
            {validationErrors.name && (
              <div style={{ color: colors.status.error, fontSize: '12px', marginTop: '4px' }}>{validationErrors.name}</div>
            )}
          </div>

          {/* Action Code */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500, color: colors.text.primary }}>
              Action Code * (auto-generated from name, editable)
            </label>
            <input
              type='text'
              value={formData.code}
              onChange={e => handleInputChange('code', e.target.value.toUpperCase())}
              placeholder='e.g., FORWARD, APPROVE, REJECT'
              style={{
                width: '100%',
                padding: '8px 12px',
                border: `1px solid ${validationErrors.code ? colors.status.error : colors.border}`,
                borderRadius: AdminBorderRadius.md,
                fontSize: '14px',
                fontFamily: 'monospace',
                color: colors.text.primary,
                backgroundColor: colors.surface,
                boxSizing: 'border-box',
              }}
            />
            {validationErrors.code && (
              <div style={{ color: colors.status.error, fontSize: '12px', marginTop: '4px' }}>{validationErrors.code}</div>
            )}
            <div style={{ fontSize: '12px', color: colors.text.secondary, marginTop: '4px' }}>
              Unique identifier (uppercase letters, numbers, underscores)
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500, color: colors.text.primary }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={e => handleInputChange('description', e.target.value)}
              placeholder='Describe what this action does...'
              rows={3}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: `1px solid ${validationErrors.description ? colors.status.error : colors.border}`,
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
                checked={formData.isActive}
                onChange={e => handleInputChange('isActive', e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: colors.status.info }}
              />
              Active Action
            </label>
          </div>

          {/* Display server errors */}
          {Object.keys(errors).length > 0 && (
            <div
              style={{
                padding: AdminSpacing.md,
                backgroundColor: '#fff5f5',
                border: '1px solid #fecaca',
                borderRadius: AdminBorderRadius.md,
              }}
            >
              {Object.values(errors).map((err, idx) => (
                <p key={idx} style={{ margin: 0, color: colors.status.error, fontSize: '13px' }}>{err}</p>
              ))}
            </div>
          )}
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
              backgroundColor: colors.status.info,
              color: '#ffffff',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              opacity: isSaving ? 0.6 : 1,
            }}
          >
            {isSaving ? 'Saving...' : `${isEditMode ? 'Update' : 'Create'} Action`}
          </button>
        </div>
      </div>
    </div>
  );
};
