'use client';
// ─── components/revert/SnapshotViewerModal.tsx ──────────────────────────────
// Shows the complete application state captured at a specific version.

import React, { useEffect, useState } from 'react';
import { X, RotateCcw, Loader2, Camera, User, MapPin, Briefcase, FileText } from 'lucide-react';
import { ApplicationType } from '../../types/revert';
import { getVersionSnapshot } from '../../api/revertService';

interface SnapshotViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: number;
  applicationType: ApplicationType;
  versionNumber: number;
  canRevert: boolean;
  onRevert: (versionNumber: number) => void;
}

const Field: React.FC<{ label: string; value: unknown }> = ({ label, value }) => {
  const display = value === null || value === undefined || value === ''
    ? <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>—</span>
    : typeof value === 'boolean'
    ? <span style={{ color: value ? '#059669' : '#6b7280', fontWeight: 600 }}>{value ? 'Yes' : 'No'}</span>
    : <span>{String(value)}</span>;

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f3f4f6', gap: 8 }}>
      <span style={{ fontSize: 12, color: '#6b7280', flexShrink: 0, minWidth: 140 }}>{label}</span>
      <span style={{ fontSize: 12, color: '#111827', textAlign: 'right' }}>{display}</span>
    </div>
  );
};

const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: '8px 0', borderBottom: '2px solid #e5e7eb' }}>
      {icon}
      <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#374151' }}>{title}</h4>
    </div>
    {children}
  </div>
);

const SnapshotViewerModal: React.FC<SnapshotViewerModalProps> = ({
  isOpen, onClose, applicationId, applicationType, versionNumber, canRevert, onRevert,
}) => {
  const [snapshot, setSnapshot] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    getVersionSnapshot(applicationId, versionNumber, applicationType)
      .then(setSnapshot)
      .catch(() => setError('Failed to load snapshot.'))
      .finally(() => setLoading(false));
  }, [isOpen, applicationId, versionNumber, applicationType]);

  if (!isOpen) return null;

  const pd = snapshot?.snapshotData?.personalDetails;
  const presentAddr = snapshot?.snapshotData?.presentAddress;
  const permAddr = snapshot?.snapshotData?.permanentAddress;
  const occ = snapshot?.snapshotData?.occupation;
  const fileUploads = snapshot?.snapshotData?.fileUploads ?? [];

  const formatDate = (iso?: string) => iso ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)' }} />
      <div style={{
        position: 'relative', zIndex: 1, background: '#fff', borderRadius: 14,
        width: '100%', maxWidth: 640, margin: '0 16px', maxHeight: '90vh',
        display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 24px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Camera size={20} color="#6366f1" />
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>
              Version {versionNumber} Snapshot
            </h3>
            {snapshot && (
              <p style={{ margin: 0, fontSize: 11, color: '#6b7280' }}>
                Action: {snapshot.triggerAction} &nbsp;|&nbsp; {formatDate(snapshot.createdAt)} &nbsp;|&nbsp; By: {snapshot.actionByUser?.username}
              </p>
            )}
          </div>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280' }}>
              <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ marginTop: 10 }}>Loading snapshot…</p>
            </div>
          )}
          {error && <p style={{ color: '#ef4444', textAlign: 'center' }}>{error}</p>}
          {!loading && pd && (
            <>
              <Section icon={<User size={14} color="#6366f1" />} title="Personal Details">
                <Field label="Name" value={`${pd.firstName ?? ''} ${pd.middleName ?? ''} ${pd.lastName ?? ''}`.trim()} />
                <Field label="Father/Spouse" value={pd.parentOrSpouseName} />
                <Field label="Gender" value={pd.sex} />
                <Field label="Date of Birth" value={formatDate(pd.dateOfBirth)} />
                <Field label="Aadhar Number" value={pd.aadharNumber} />
                <Field label="PAN Number" value={pd.panNumber} />
                <Field label="Acknowledgement No" value={pd.acknowledgementNo} />
              </Section>

              <Section icon={<div style={{ fontSize: 12, fontWeight: 700, color: '#6366f1' }}>🚦</div>} title="Workflow Status Flags">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
                  {[
                    ['Submitted', pd.isSubmit], ['Approved', pd.isApproved], ['Rejected', pd.isRejected],
                    ['Pending', pd.isPending], ['Re-enquiry', pd.isReEnquiry], ['Recommended', pd.isRecommended],
                    ['Not Recommended', pd.isNotRecommended], ['Ground Report', pd.isGroundReportGenerated],
                  ].map(([lbl, val]) => (
                    <div key={String(lbl)} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f3f4f6', fontSize: 12 }}>
                      <span style={{ color: '#6b7280' }}>{String(lbl)}</span>
                      <span style={{ fontWeight: 600, color: val ? '#059669' : '#d1d5db' }}>{val ? '✓ Yes' : '✗ No'}</span>
                    </div>
                  ))}
                </div>
              </Section>

              {presentAddr && (
                <Section icon={<MapPin size={14} color="#6366f1" />} title="Present Address">
                  <Field label="Address Line" value={presentAddr.addressLine} />
                  <Field label="State ID" value={presentAddr.stateId} />
                  <Field label="District ID" value={presentAddr.districtId} />
                  <Field label="Zone ID" value={presentAddr.zoneId} />
                  <Field label="Division ID" value={presentAddr.divisionId} />
                  <Field label="Police Station ID" value={presentAddr.policeStationId} />
                </Section>
              )}

              {occ && (
                <Section icon={<Briefcase size={14} color="#6366f1" />} title="Occupation">
                  <Field label="Occupation" value={occ.occupation} />
                  <Field label="Office Address" value={occ.officeAddress} />
                  <Field label="Crop Location" value={occ.cropLocation} />
                </Section>
              )}

              {fileUploads.length > 0 && (
                <Section icon={<FileText size={14} color="#6366f1" />} title={`File Uploads (${fileUploads.length})`}>
                  {fileUploads.map((f: any, i: number) => (
                    <div key={i} style={{ fontSize: 12, padding: '5px 0', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#374151' }}>{f.fileType}</span>
                      <span style={{ color: '#6b7280' }}>{f.fileName}</span>
                    </div>
                  ))}
                </Section>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', background: '#f9fafb', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', color: '#374151', fontSize: 14, cursor: 'pointer' }}>
            Close
          </button>
          {canRevert && snapshot && (
            <button
              onClick={() => onRevert(versionNumber)}
              style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <RotateCcw size={15} />
              Revert to This Version
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SnapshotViewerModal;
