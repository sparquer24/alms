'use client';
// ─── components/revert/RevertConfirmationModal.tsx ──────────────────────────
// Confirmation modal shown before executing a revert.
// Validates first, then shows current → target state diff summary + reason input.

import React, { useState, useEffect } from 'react';
import { RotateCcw, AlertTriangle, XCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { ApplicationType, VersionListItem, RevertValidation } from '../../types/revert';
import { validateRevert, executeRevert } from '../../api/revertService';

const ACTION_LABELS: Record<string, string> = {
  FORWARD: 'Forwarded', APPROVE: 'Approved', APPROVED: 'Approved', REJECT: 'Rejected',
  RE_ENQUIRY: 'Re-enquiry', RECOMMEND: 'Recommended', NOT_RECOMMEND: 'Not Recommended',
  INITIATE: 'Submitted', SUBMIT: 'Submitted', REVERT: 'Reverted (Prior revert)',
  CLOSE: 'Closed', DISPOSE: 'Disposed', CANCEL: 'Cancelled',
};

interface RevertConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: number;
  applicationType: ApplicationType;
  targetVersion: VersionListItem;
  currentVersionNumber: number;
  acknowledgementNo?: string;
  onRevertSuccess: () => void;
}

const RevertConfirmationModal: React.FC<RevertConfirmationModalProps> = ({
  isOpen, onClose, applicationId, applicationType, targetVersion,
  currentVersionNumber, acknowledgementNo, onRevertSuccess,
}) => {
  const [validation, setValidation] = useState<RevertValidation | null>(null);
  const [validating, setValidating] = useState(false);
  const [reason, setReason] = useState('');
  const [escalationDoc, setEscalationDoc] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setValidating(true);
    setValidation(null);
    setReason('');
    setEscalationDoc('');
    validateRevert(applicationId, applicationType, targetVersion.versionNumber)
      .then(setValidation)
      .catch(() => setValidation({ canRevert: false, blockers: ['Failed to validate revert. Please try again.'], isTerminalRevert: false, requiresEscalation: false }))
      .finally(() => setValidating(false));
  }, [isOpen, applicationId, applicationType, targetVersion.versionNumber]);

  if (!isOpen) return null;

  const isTerminal = validation?.isTerminalRevert;
  const minReasonLength = isTerminal ? 50 : 10;
  const reasonValid = reason.trim().length >= minReasonLength;
  const canSubmit = validation?.canRevert && reasonValid && (!validation?.requiresEscalation || escalationDoc.trim());

  const handleConfirm = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const result = await executeRevert(applicationId, {
        applicationType,
        targetVersionNumber: targetVersion.versionNumber,
        reason: reason.trim(),
        escalationDocumentUrl: escalationDoc.trim() || undefined,
        expectedCurrentVersion: currentVersionNumber,
      });
      toast.success(`Application reverted to Version ${targetVersion.versionNumber} (New: V${result.newVersionNumber})`);
      onRevertSuccess();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Revert failed. Please try again.';
      if (err?.response?.status === 409) {
        toast.error('Application was modified by another user. Please refresh.');
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)' }} />

      {/* Modal */}
      <div style={{
        position: 'relative', zIndex: 1, background: '#fff', borderRadius: 14,
        width: '100%', maxWidth: 540, margin: '0 16px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px', background: isTerminal ? '#fef2f2' : '#eef2ff',
          borderBottom: `2px solid ${isTerminal ? '#fca5a5' : '#a5b4fc'}`,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          {isTerminal
            ? <AlertTriangle size={22} color="#dc2626" />
            : <RotateCcw size={22} color="#6366f1" />}
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: isTerminal ? '#991b1b' : '#3730a3' }}>
              {isTerminal ? '⚠ Critical: Terminal Status Revert' : 'Confirm Revert'}
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: isTerminal ? '#b91c1c' : '#4f46e5' }}>
              Application {acknowledgementNo ? `#${acknowledgementNo}` : `#${applicationId}`}
            </p>
          </div>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
            <XCircle size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', maxHeight: '60vh', overflowY: 'auto' }}>

          {validating && (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#6b7280' }}>
              <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ marginTop: 8, fontSize: 13 }}>Validating revert…</p>
            </div>
          )}

          {!validating && validation && !validation.canRevert && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '14px 16px', marginBottom: 16 }}>
              <p style={{ margin: '0 0 8px', fontWeight: 600, color: '#991b1b', fontSize: 14 }}>Cannot Revert — Reasons:</p>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {validation.blockers.map((b, i) => (
                  <li key={i} style={{ fontSize: 13, color: '#b91c1c', marginBottom: 4 }}>{b}</li>
                ))}
              </ul>
            </div>
          )}

          {!validating && validation?.canRevert && (
            <>
              {/* State summary */}
              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '14px 16px', marginBottom: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 8 }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 11, color: '#6b7280', fontWeight: 500 }}>CURRENT (V{currentVersionNumber})</p>
                    <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 600, color: '#111827' }}>
                      {ACTION_LABELS[versions_current_action] ?? 'Active State'}
                    </p>
                  </div>
                  <RotateCcw size={18} color="#6366f1" />
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: 11, color: '#6b7280', fontWeight: 500 }}>REVERT TO (V{targetVersion.versionNumber})</p>
                    <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 600, color: '#6366f1' }}>
                      {ACTION_LABELS[targetVersion.triggerAction] ?? targetVersion.triggerAction}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9ca3af' }}>
                      {formatDate(targetVersion.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Warning box */}
              <div style={{
                background: isTerminal ? '#fef2f2' : '#fffbeb',
                border: `1px solid ${isTerminal ? '#fca5a5' : '#fcd34d'}`,
                borderRadius: 8, padding: '12px 16px', marginBottom: 16,
                fontSize: 12, color: isTerminal ? '#991b1b' : '#92400e',
              }}>
                {isTerminal
                  ? '⚠ You are reverting a TERMINAL status. This has legal and regulatory implications. This event will be permanently logged for compliance review.'
                  : 'This will create a new version (V' + (currentVersionNumber + 1) + ') capturing the current state before the revert. All existing versions are preserved.'}
              </div>

              {/* Reason input */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Reason for Revert <span style={{ color: '#ef4444' }}>*</span>
                  <span style={{ fontWeight: 400, color: '#9ca3af', marginLeft: 6 }}>
                    (min {minReasonLength} characters)
                  </span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder={isTerminal
                    ? 'Provide a detailed explanation for reverting this terminal status (min 50 chars)…'
                    : 'e.g. Application forwarded to wrong officer — correcting routing…'}
                  style={{
                    width: '100%', boxSizing: 'border-box', padding: '10px 12px',
                    border: `1px solid ${reasonValid ? '#86efac' : '#d1d5db'}`,
                    borderRadius: 8, fontSize: 13, resize: 'vertical', outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
                <p style={{ margin: '4px 0 0', fontSize: 11, color: reason.trim().length < minReasonLength ? '#ef4444' : '#10b981' }}>
                  {reason.trim().length} / {minReasonLength} characters minimum
                </p>
              </div>

              {/* Escalation doc — only for terminal reverts */}
              {validation.requiresEscalation && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                    Escalation Document URL <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={escalationDoc}
                    onChange={(e) => setEscalationDoc(e.target.value)}
                    placeholder="https://… (link to supporting document)"
                    style={{
                      width: '100%', boxSizing: 'border-box', padding: '10px 12px',
                      border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13,
                      outline: 'none', fontFamily: 'inherit',
                    }}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px', background: '#f9fafb', borderTop: '1px solid #e5e7eb',
          display: 'flex', justifyContent: 'flex-end', gap: 10,
        }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '9px 20px', borderRadius: 8, border: '1px solid #d1d5db',
              background: '#fff', color: '#374151', fontSize: 14, cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          {validation?.canRevert && (
            <button
              onClick={handleConfirm}
              disabled={!canSubmit || loading}
              style={{
                padding: '9px 20px', borderRadius: 8, border: 'none',
                background: canSubmit && !loading ? (isTerminal ? '#dc2626' : '#6366f1') : '#c7d2fe',
                color: '#fff', fontSize: 14, fontWeight: 600, cursor: canSubmit && !loading ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <RotateCcw size={16} />}
              {loading ? 'Reverting…' : `Confirm Revert to V${targetVersion.versionNumber}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Placeholder for current version action (in real use, pass from parent or fetch)
const versions_current_action = 'FORWARD';

export default RevertConfirmationModal;
