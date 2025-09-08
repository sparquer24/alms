'use client';

import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import styles from './ProceedingsForm.module.css';
import { postData } from '../api/axiosConfig';

interface UserOption {
  value: string;
  label: string;
}

interface ProceedingsFormProps {
  applicationId: string;
  onSuccess?: () => void;
}

const ACTION_OPTIONS = [
  { value: 'forward', label: 'Forward' },
  { value: 'return', label: 'Return' },
  { value: 'dispose', label: 'Dispose' },
  { value: 'red-flag', label: 'Red Flag' },
];

// Map UI actions to backend action IDs expected by /workflow/action
const ACTION_ID_MAP: Record<string, number> = {
  'forward': 1,
  'return': 2,
  'dispose': 3,
  'red-flag': 4,
};

// Dummy users used only as a fallback when API is not available
const DUMMY_USERS: Array<{ id: string | number; username: string; role?: string | null }> = [
  { id: 3, username: 'JTCP_ADMIN', role: 'JTCP' },
  { id: 4, username: 'SUPDT_STORES_HYD', role: 'SUPDT' },
  { id: 5, username: 'SUPDT_TL_HYD', role: 'SUPDT' },
  { id: 6, username: 'CP_HYD', role: 'CP' },
  { id: 7, username: 'ACP_NORTH', role: 'ACP' },
  { id: 8, username: 'DCP_CENTRAL', role: 'DCP' },
  { id: 9, username: 'SHO_WEST', role: 'SHO' },
  { id: 10, username: 'ADMIN_USER', role: 'ADMIN' },
  { id: 1, username: 'CADO_HYD', role: 'CADO' }, 
  { id: 13, username: 'ZS_ADMIN', role: 'ZS' },
];

// Simple TextArea Component as Rich Text Editor Replacement
function SimpleTextArea({ value, onChange, placeholder, disabled, dataTestId }: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  dataTestId?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      data-testid={dataTestId}
      className="w-full min-h-[120px] p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
      style={{ fontFamily: 'inherit', fontSize: '0.875rem' }}
    />
  );
}

// Loading Spinner Component
function LoadingSpinner({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: styles.loadingSpinnerSmall,
    md: styles.loadingSpinnerMedium,
    lg: styles.loadingSpinnerLarge
  };

  return (
    <div className={`${styles.loadingSpinner} ${sizeClasses[size]}`}></div>
  );
}

// Success Message Component
function SuccessMessage({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className={`${styles.statusMessage} ${styles.successMessage}`} role="alert">
      <div className={styles.statusIcon}>
        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      </div>
      <div className={styles.statusContent}>
        <p>{message}</p>
      </div>
      <button
        onClick={onDismiss}
        className={styles.dismissButton}
        aria-label="Dismiss success message"
      >
        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}

// Error Message Component
function ErrorMessage({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 8000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className={`${styles.statusMessage} ${styles.errorMessage}`} role="alert">
      <div className={styles.statusIcon}>
        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      </div>
      <div className={styles.statusContent}>
        <p>{message}</p>
      </div>
      <button
        onClick={onDismiss}
        className={styles.dismissButton}
        aria-label="Dismiss error message"
      >
        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}

export default function ProceedingsForm({ applicationId, onSuccess }: ProceedingsFormProps) {
  const [actionType, setActionType] = useState('');
  const [nextUser, setNextUser] = useState<UserOption | null>(null);
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [remarks, setRemarks] = useState('');
  const [remarksVisible, setRemarksVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch users when action type changes (available for all actions) using dummy data
  useEffect(() => {
    if (actionType) {
      setFetchingUsers(true);
      setError(null);

      const timer = setTimeout(() => {
        const formatted = DUMMY_USERS.map((u) => ({
          value: String(u.id),
          label: `${u.username} (${u.id})`,
        }));
        setUserOptions(formatted);
        setFetchingUsers(false);
      }, 300);

      return () => clearTimeout(timer);
    } else {
      setUserOptions([]);
      setNextUser(null);
      setFetchingUsers(false);
    }
  }, [actionType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (!actionType) {
      setError('Please select an action type.');
      return;
    }

    if (actionType === 'forward' && !nextUser) {
      setError('Please select a user to forward to.');
      return;
    }

    if (!remarks.trim()) {
      setError('Please add remarks before submitting.');
      return;
    }

    // Build payload for /workflow/action
    const actionId = ACTION_ID_MAP[actionType];
    if (!actionId) {
      setError('Unknown action type.');
      return;
    }

    const payload: any = {
      applicationId: Number(applicationId),
      actionId,
      remarks: remarks.trim(),
      attachments: [],
    };
    if (nextUser?.value) {
      payload.nextUserId = Number(nextUser.value);
    }

    setIsSubmitting(true);

    try {
  const result = await postData(`/workflow/action`, payload);
      setSuccess(result.message || 'Action completed successfully.');
      
      // Reset form
      setActionType('');
      setNextUser(null);
      setRemarks('');
      
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to submit action. Please try again.');
      console.error('Error submitting form:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismissError = () => setError(null);
  const handleDismissSuccess = () => setSuccess(null);

  return (
    <div className={styles.formContainer}>
      {/* Header */}
      <div className={styles.formHeader}>
        <h2>
          <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Proceedings Form
        </h2>
        <p>Process application #{applicationId}</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.formContent}>
        {/* Status Messages */}
        {error && <ErrorMessage message={error} onDismiss={handleDismissError} />}
        {success && <SuccessMessage message={success} onDismiss={handleDismissSuccess} />}

        {/* Action Type Selection */}
        <div className={styles.formSection}>
          <label className={styles.formLabel}>
            Action Type <span className={styles.required}>*</span>
          </label>
          <div className={styles.selectContainer}>
            <Select
              options={ACTION_OPTIONS}
              value={ACTION_OPTIONS.find(opt => opt.value === actionType) || null}
              onChange={opt => setActionType(opt?.value || '')}
              placeholder="Select action type"
              isDisabled={isSubmitting}
              className="text-sm"
              styles={{
                control: (provided, state) => ({
                  ...provided,
                  borderColor: state.isFocused ? '#3B82F6' : '#D1D5DB',
                  boxShadow: state.isFocused ? '0 0 0 1px #3B82F6' : 'none',
                  '&:hover': {
                    borderColor: '#3B82F6'
                  }
                })
              }}
            />
          </div>
        </div>

        {/* Next User Selection */}
        <div className={styles.formSection}>
          <label className={styles.formLabel}>
            Forward To (Next User/Role) 
            {actionType === 'forward' && <span className={styles.required}>*</span>}
          </label>
          <div className={styles.selectContainer}>
            <Select
              options={userOptions}
              value={nextUser}
              onChange={setNextUser}
              placeholder={
                actionType
                  ? (fetchingUsers ? 'Loading users...' : 'Select user')
                  : 'Select action first'
              }
              isLoading={fetchingUsers}
              isDisabled={isSubmitting || fetchingUsers || !actionType}
              className="text-sm"
              styles={{
                control: (provided, state) => ({
                  ...provided,
                  borderColor: state.isFocused ? '#3B82F6' : '#D1D5DB',
                  boxShadow: state.isFocused ? '0 0 0 1px #3B82F6' : 'none',
                  '&:hover': {
                    borderColor: '#3B82F6'
                  },
                  backgroundColor: !actionType ? '#f9fafb' : 'white'
                })
              }}
            />
          </div>
          {actionType && fetchingUsers && (
            <div className={styles.loadingText}>
              <LoadingSpinner size="sm" />
              <span>Loading available users...</span>
            </div>
          )}
          {actionType && !fetchingUsers && userOptions.length === 0 && (
            <p className={styles.helpText}>
              No users available. Please try refreshing the page.
            </p>
          )}
          {actionType && actionType !== 'forward' && (
            <p className={styles.helpText}>
              This field is only required when "Forward" action is selected.
            </p>
          )}
        </div>

        {/* Remarks/Text Area */}
        <div className={styles.formSection}>
          <div className="flex items-center justify-between">
            <label className={styles.formLabel}>
              Remarks <span className={styles.required}>*</span>
            </label>
            <button
              type="button"
              onClick={() => setRemarksVisible(v => !v)}
              className="ml-3 text-blue-600 hover:underline text-sm"
              aria-pressed={remarksVisible}
              aria-label={remarksVisible ? 'Hide' : 'Show'}
            >
              {remarksVisible ? 'Hide' : 'Show'}
            </button>
          </div>
          {remarksVisible && (
            <>
              <div className={styles.richTextContainer}>
                <SimpleTextArea 
                  value={remarks} 
                  onChange={setRemarks}
                  placeholder="Enter your remarks here..."
                  disabled={isSubmitting}
                  dataTestId="rich-text-editor"
                />
              </div>
              <p className={styles.helpText}>
                Enter your detailed remarks about this action. You can use multiple lines for better formatting.
              </p>
            </>
          )}
        </div>

        {/* Submit Button */}
        <div className={styles.submitSection}>
          <div className={styles.loadingText}>
            {isSubmitting && (
              <>
                <LoadingSpinner size="sm" />
                <span>Processing your request...</span>
              </>
            )}
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting || loading || fetchingUsers}
            className={styles.submitButton}
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Submitting...</span>
              </>
            ) : (
              'Submit Action'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
