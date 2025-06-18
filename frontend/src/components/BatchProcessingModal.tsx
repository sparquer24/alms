import React, { useState, useEffect, useCallback } from 'react';
import { ApplicationData } from '../config/mockData';
import styles from './BatchProcessingModal.module.css';
import { useAuth } from '../config/auth';
import { RoleTypes } from '../config/roles';

interface BatchProcessingModalProps {
  isOpen: boolean;
  onClose: () => void;
  applications: ApplicationData[];
  onProcessBatch: (action: string, applications: ApplicationData[], comment: string) => void;
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
  // Get available recipients based on user role hierarchy (similar to ForwardApplicationModal)
  const getAvailableRecipients = useCallback(() => {    // Define role hierarchy for forwarding purposes based on the application flow
    const roleHierarchy: Record<string, string[]> = {
      [RoleTypes.SHO]: [RoleTypes.ACP, RoleTypes.ZS],
      [RoleTypes.ACP]: [RoleTypes.DCP, RoleTypes.ZS, RoleTypes.SHO],
      [RoleTypes.ZS]: [RoleTypes.ACP, RoleTypes.DCP, RoleTypes.ARMS_SUPDT],
      [RoleTypes.DCP]: [RoleTypes.ZS, RoleTypes.ACP, RoleTypes.CP, RoleTypes.JTCP, RoleTypes.ARMS_SUPDT],
      [RoleTypes.JTCP]: [RoleTypes.CP, RoleTypes.CADO],
      [RoleTypes.CP]: [RoleTypes.JTCP],
      [RoleTypes.CADO]: [RoleTypes.JTCP, RoleTypes.CP],
      [RoleTypes.ACO]: [RoleTypes.CADO, RoleTypes.ACP],
      [RoleTypes.AS]: [RoleTypes.ADO, RoleTypes.DCP],
      [RoleTypes.ARMS_SUPDT]: [RoleTypes.ARMS_SEAT, RoleTypes.DCP],
      [RoleTypes.ARMS_SEAT]: [RoleTypes.ADO, RoleTypes.ARMS_SUPDT],
      [RoleTypes.ADO]: [RoleTypes.CADO, RoleTypes.ARMS_SUPDT],
      [RoleTypes.ADMIN]: [
        RoleTypes.ZS, 
        RoleTypes.DCP, 
        RoleTypes.ACP, 
        RoleTypes.SHO, 
        RoleTypes.AS,
        RoleTypes.ARMS_SUPDT, 
        RoleTypes.ARMS_SEAT,
        RoleTypes.ADO,
        RoleTypes.CADO,
        RoleTypes.JTCP,
        RoleTypes.CP
      ],
    };    const roleDisplayNames: Record<string, string> = {
      [RoleTypes.SHO]: 'Station House Officer (SHO)',
      [RoleTypes.ACP]: 'Assistant Commissioner of Police (ACP)',
      [RoleTypes.ZS]: 'Zonal Superintendent (ZS)',
      [RoleTypes.DCP]: 'Deputy Commissioner of Police (DCP)',
      [RoleTypes.JTCP]: 'Joint Commissioner of Police (JCP)',
      [RoleTypes.CP]: 'Commissioner of Police (CP)',
      [RoleTypes.ADO]: 'Administrative Officer (ADO)',
      [RoleTypes.CADO]: 'Chief Administrative Officer (CADO)',
      [RoleTypes.ARMS_SUPDT]: 'ARMS Superintendent',
      [RoleTypes.ARMS_SEAT]: 'ARMS Seat',
      [RoleTypes.AS]: 'Arms Superintendent (AS)',
      [RoleTypes.ACO]: 'Assistant Compliance Officer (ACO)',
      [RoleTypes.ADMIN]: 'System Administrator',
    };

    const availableRoles = roleHierarchy[userRole] || [];
    return availableRoles.map(role => ({
      value: role,
      label: roleDisplayNames[role] || role
    }));
  }, [userRole]);

  // Set default recipient when modal opens or when action changes
  useEffect(() => {
    if (isOpen && selectedAction === 'forward') {
      // Get available recipients
      const availableRecipients = getAvailableRecipients();
      // Set first recipient as default if available
      if (availableRecipients.length > 0) {
        setRecipient(availableRecipients[0].value);
      } else {
        setRecipient('');
      }
    }
  }, [isOpen, selectedAction, userRole, getAvailableRecipients]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that a recipient is selected if action is forward
    if (selectedAction === 'forward' && !recipient) {
      alert('Please select a recipient to forward applications to.');
      return;
    }
    
    setProcessing(true);

    try {
      // If action is forward, include the recipient in the comments
      const finalComment = selectedAction === 'forward' 
        ? `Forwarded to: ${recipient}${comment ? ` - ${comment}` : ''}`
        : comment;
        
      await onProcessBatch(selectedAction, applications, finalComment);
      
      // Reset form
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
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Batch Process Applications</h2>
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
            <div className={styles.selectedApplications}>
              <ul className={styles.applicationsList}>
                {applications.map(app => (
                  <li key={app.id} className={styles.applicationItem}>
                    {app.id} - {app.applicantName} ({app.status})
                  </li>
                ))}
              </ul>
            </div>
          </div>          <div className={styles.formGroup}>
            <label className={styles.label}>
              Action to Perform
            </label>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className={styles.selectInput}
              required
            >
              <option value="forward">Forward Applications</option>
              <option value="approve">Approve Applications</option>
              <option value="reject">Reject Applications</option>
              <option value="return">Return Applications</option>
              <option value="flag">Red Flag Applications</option>
            </select>
          </div>

          {/* Show recipient dropdown only when forward is selected */}
          {selectedAction === 'forward' && (
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Forward To
              </label>
              <select
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className={styles.selectInput}
                required
              >
                {getAvailableRecipients().length === 0 ? (
                  <option value="">No recipients available</option>
                ) : (
                  getAvailableRecipients().map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          <div className={styles.formGroup}>
            <label className={styles.label}>
              {selectedAction === 'forward' ? 'Comments (Optional)' : 'Reason/Comments'}
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className={styles.textareaInput}
              rows={3}
              placeholder={selectedAction === 'forward' 
                ? "Add any comments or notes for the recipient" 
                : "Add any comments or reasons for this action..."}
              required={selectedAction !== 'forward'}
            ></textarea>
          </div>

          <div className={styles.buttonGroup}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
              disabled={processing}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={processing}
            >
              {processing ? (
                <div className="flex items-center">
                  <svg className={styles.spinner} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </div>
              ) : (
                `Process ${applications.length} Application(s)`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BatchProcessingModal;
