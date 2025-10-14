import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ApplicationData } from '../types';
import styles from './BatchProcessingModal.module.css';
import { useAuth } from '../config/auth';
import { RoleTypes } from '../config/roles';
import { getRoleHierarchy, getRoleDisplayNames } from '../utils/roleUtils'; // Centralized utilities

interface BatchProcessingModalProps {
  isOpen: boolean;
  onClose: () => void;
  applications: ApplicationData[];
  onProcessBatch: (action: string, applications: ApplicationData[], comment: string) => Promise<void>;
}

const BatchProcessingModal: React.FC<BatchProcessingModalProps> = ({
  isOpen,
  onClose,
  applications,
  onProcessBatch
}) => {
  const [selectedAction, setSelectedAction] = useState<string>('forward');
  const [recipient, setRecipient] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [processing, setProcessing] = useState<boolean>(false);
  const { userRole } = useAuth();

  const availableRecipients = useMemo(() => {
    const roleHierarchy = getRoleHierarchy();
    const roleDisplayNames = getRoleDisplayNames();
    const roles: string[] = roleHierarchy[userRole] || [];
    return roles.map((role: string) => ({
      value: role,
      label: roleDisplayNames[role] || role
    }));
  }, [userRole]);

  useEffect(() => {
    if (isOpen && selectedAction === 'forward') {
      setRecipient(availableRecipients[0]?.value || '');
    }
  }, [isOpen, selectedAction, availableRecipients]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedAction === 'forward' && !recipient) {
      alert('Please select a recipient to forward applications to.');
      return;
    }

    setProcessing(true);

    try {
      const finalComment = selectedAction === 'forward'
        ? `Forwarded to: ${recipient}${comment ? ` - ${comment}` : ''}`
        : comment;

      await onProcessBatch(selectedAction, applications, finalComment);

      setSelectedAction('forward');
      setRecipient('');
      setComment('');
      onClose();
    } catch (error) {
      console.error('Error processing batch:', error);
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} role="dialog" aria-labelledby="batch-modal-title" aria-modal="true">
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 id="batch-modal-title" className={styles.modalTitle}>Batch Process Applications</h2>
          <button
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <p className="text-gray-700 mb-2">
              Selected Applications: <span className="font-bold">{applications.length}</span>
            </p>
            <ul className={styles.applicationsList}>
              {applications.map(app => (
                <li key={app.id} className={styles.applicationItem}>
                  {app.id} - {app.applicantName} ({app.status})
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="action-select" className="block text-sm font-medium text-gray-700">
              Action
            </label>
            <select
              id="action-select"
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="forward">Forward</option>
              <option value="approve">Approve</option>
              <option value="reject">Reject</option>
            </select>
          </div>

          {selectedAction === 'forward' && (
            <div className={styles.formGroup}>
              <label htmlFor="recipient-select" className="block text-sm font-medium text-gray-700">
                Recipient
              </label>
              <select
                id="recipient-select"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                {availableRecipients.map(({ value, label }: { value: string; label: string }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
              Comment
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div className={styles.formActions}>
            <button
              type="submit"
              disabled={processing}
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {processing ? 'Processing...' : 'Submit'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="ml-2 inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BatchProcessingModal;
