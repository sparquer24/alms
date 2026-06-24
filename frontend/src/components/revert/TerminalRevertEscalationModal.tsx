'use client';
// ─── components/revert/TerminalRevertEscalationModal.tsx ────────────────────
// Special high-stakes modal for ADMIN/SUPER_ADMIN reverting APPROVED/REJECTED/etc. statuses.
// Requires detailed reason, escalation document, and an acknowledgement checkbox.

import React, { useState } from 'react';
import { AlertTriangle, X, Loader2, RotateCcw, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { ApplicationType, VersionListItem } from '../../types/revert';
import { executeRevert } from '../../api/revertService';

interface TerminalRevertEscalationModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: number;
  applicationType: ApplicationType;
  targetVersion: VersionListItem;
  currentVersionNumber: number;
  currentStatusCode: string;   // e.g. 'APPROVED', 'REJECTED'
  acknowledgementNo?: string;
  onRevertSuccess: () => void;
}

const TerminalRevertEscalationModal: React.FC<TerminalRevertEscalationModalProps> = ({
  isOpen, onClose, applicationId, applicationType, targetVersion,
  currentVersionNumber, currentStatusCode, acknowledgementNo, onRevertSuccess,
}) => {
  const [reason, setReason] = useState('');
  const [escalationDocUrl, setEscalationDocUrl] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const reasonValid = reason.trim().length >= 50;
  const docValid = escalationDocUrl.trim().length > 0;
  const canSubmit = reasonValid && docValid && acknowledged && !loading;

  const handleConfirm = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const result = await executeRevert(applicationId, {
        applicationType,
        targetVersionNumber: targetVersion.versionNumber,
        reason: reason.trim(),
        escalationDocumentUrl: escalationDocUrl.trim(),
        expectedCurrentVersion: currentVersionNumber,
      });
      toast.success(`Terminal status reverted. New version V${result.newVersionNumber} created. This action has been logged for compliance.`);
      onRevertSuccess();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Revert failed.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setReason('');
    setEscalationDocUrl('');
    setAcknowledged(false);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={handleClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)' }} />

      <div style={{
        position: 'relative', zIndex: 1, background: '#fff', borderRadius: 14,
        width: '100%', maxWidth: 560, margin: '0 16px',
        boxShadow: '0 25px 80px rgba(220,38,38,0.3)', overflow: 'hidden',
      }}>
        {/* Red header */}
        <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #dc2626, #b91c1c)', borderBottom: '2px solid #991b1b' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: 8 }}>
              <ShieldAlert size={24} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#fff' }}>
                ⚠ Critical: Terminal Status Revert
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
                You are reverting a <strong>{currentStatusCode}</strong> status on{' '}
                {acknowledgementNo ? `#${acknowledgementNo}` : `Application #${applicationId}`}.
                This is a high-risk operation.
              </p>
            </div>
            <button onClick={handleClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', padding: 4 }}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div style={{ padding: '20px 24px', maxHeight: '65vh', overflowY: 'auto' }}>

          {/* Warning box */}
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '14px 16px', marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <AlertTriangle size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 12, color: '#991b1b', lineHeight: 1.6 }}>
                <strong>This action has the following implications:</strong>
                <ul style={{ margin: '6px 0 0', paddingLeft: 16 }}>
                  <li>The terminal decision ({currentStatusCode}) will be reversed</li>
                  <li>The application will return to V{targetVersion.versionNumber} state</li>
                  <li>This event is permanently logged in the compliance audit trail</li>
                  <li>A new version (V{currentVersionNumber + 1}) will be created preserving the current state</li>
                  <li>Compliance officers may be notified of this action</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Detailed Reason for Revert <span style={{ color: '#dc2626' }}>*</span>
              <span style={{ fontWeight: 400, color: '#9ca3af', marginLeft: 6 }}>(minimum 50 characters)</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="Provide a comprehensive explanation for reverting this terminal status. Include relevant case references, legal grounds, and authorization details…"
              style={{
                width: '100%', boxSizing: 'border-box', padding: '10px 12px',
                border: `1px solid ${reasonValid ? '#86efac' : '#fca5a5'}`,
                borderRadius: 8, fontSize: 13, resize: 'vertical', outline: 'none', fontFamily: 'inherit',
              }}
            />
            <p style={{ margin: '4px 0 0', fontSize: 11, color: reason.trim().length < 50 ? '#dc2626' : '#059669' }}>
              {reason.trim().length} / 50 characters minimum
            </p>
          </div>

          {/* Escalation document */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Supporting Document / Authorization URL <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="text"
              value={escalationDocUrl}
              onChange={(e) => setEscalationDocUrl(e.target.value)}
              placeholder="https://… (link to authorization document, court order, or internal approval)"
              style={{
                width: '100%', boxSizing: 'border-box', padding: '10px 12px',
                border: `1px solid ${docValid ? '#86efac' : '#d1d5db'}`,
                borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Acknowledgement checkbox */}
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', padding: '12px 16px', background: '#fef2f2', borderRadius: 8, border: `1px solid ${acknowledged ? '#fca5a5' : '#e5e7eb'}` }}>
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              style={{ marginTop: 2, accentColor: '#dc2626', width: 16, height: 16, flexShrink: 0 }}
            />
            <span style={{ fontSize: 12, color: '#7f1d1d', lineHeight: 1.5 }}>
              I understand that this revert of a terminal status is an irreversible audit event, and I confirm I have the authority and valid grounds to perform this action.
            </span>
          </label>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', background: '#f9fafb', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            onClick={handleClose}
            disabled={loading}
            style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', color: '#374151', fontSize: 14, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canSubmit}
            style={{
              padding: '9px 20px', borderRadius: 8, border: 'none',
              background: canSubmit ? '#dc2626' : '#fca5a5',
              color: '#fff', fontSize: 14, fontWeight: 600, cursor: canSubmit ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <RotateCcw size={16} />}
            {loading ? 'Processing…' : 'Confirm Terminal Revert'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TerminalRevertEscalationModal;
