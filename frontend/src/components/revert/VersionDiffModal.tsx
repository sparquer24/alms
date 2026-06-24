'use client';
// ─── components/revert/VersionDiffModal.tsx ─────────────────────────────────
// Side-by-side comparison of two version snapshots, showing only changed fields.

import React, { useEffect, useState } from 'react';
import { X, RotateCcw, Loader2, GitCompare } from 'lucide-react';
import { ApplicationType, VersionDiff } from '../../types/revert';
import { compareVersions } from '../../api/revertService';

interface VersionDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: number;
  applicationType: ApplicationType;
  fromVersion: number;   // older version (being compared FROM)
  toVersion: number;     // newer/current version (being compared TO)
  canRevert: boolean;
  onRevert: (versionNumber: number) => void;
}

const VersionDiffModal: React.FC<VersionDiffModalProps> = ({
  isOpen, onClose, applicationId, applicationType, fromVersion, toVersion, canRevert, onRevert,
}) => {
  const [diff, setDiff] = useState<VersionDiff | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    compareVersions(applicationId, applicationType, fromVersion, toVersion)
      .then(setDiff)
      .catch(() => setError('Failed to compare versions.'))
      .finally(() => setLoading(false));
  }, [isOpen, applicationId, applicationType, fromVersion, toVersion]);

  if (!isOpen) return null;

  // Group changed fields by section
  const grouped = diff?.changedFields.reduce<Record<string, typeof diff.changedFields>>((acc, f) => {
    if (!acc[f.section]) acc[f.section] = [];
    acc[f.section].push(f);
    return acc;
  }, {}) ?? {};

  const formatValue = (v: unknown) => {
    if (v === null || v === undefined || v === '') return <span style={{ color: '#9ca3af' }}>—</span>;
    if (typeof v === 'boolean') return <span style={{ color: v ? '#059669' : '#ef4444', fontWeight: 600 }}>{v ? 'Yes' : 'No'}</span>;
    return <span>{String(v)}</span>;
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)' }} />
      <div style={{
        position: 'relative', zIndex: 1, background: '#fff', borderRadius: 14,
        width: '100%', maxWidth: 700, margin: '0 16px', maxHeight: '90vh',
        display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 24px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 12 }}>
          <GitCompare size={20} color="#6366f1" />
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>
              Compare Versions
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>
              V{fromVersion} &nbsp;←→&nbsp; V{toVersion} (Current)
            </p>
          </div>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {/* Column headers */}
        {!loading && diff && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: '#f3f4f6', padding: '10px 24px', gap: 8, borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Field</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#ef4444' }}>V{fromVersion} (Older)</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>V{toVersion} (Current)</div>
          </div>
        )}

        {/* Body */}
        <div style={{ padding: '16px 24px', overflowY: 'auto', flex: 1 }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280' }}>
              <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ marginTop: 10 }}>Comparing versions…</p>
            </div>
          )}

          {error && <p style={{ color: '#ef4444', textAlign: 'center' }}>{error}</p>}

          {!loading && diff && diff.totalChanges === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <GitCompare size={40} color="#d1d5db" style={{ marginBottom: 12 }} />
              <p style={{ color: '#6b7280', fontSize: 14 }}>No differences found between these two versions.</p>
            </div>
          )}

          {!loading && diff && diff.totalChanges > 0 && (
            <>
              <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>
                <strong style={{ color: '#6366f1' }}>{diff.totalChanges} field(s)</strong> changed between V{fromVersion} and V{toVersion}
              </p>

              {Object.entries(grouped).map(([section, fields]) => (
                <div key={section} style={{ marginBottom: 20 }}>
                  <h4 style={{ fontSize: 12, fontWeight: 700, color: '#374151', margin: '0 0 8px', padding: '6px 10px', background: '#f3f4f6', borderRadius: 6 }}>
                    {section}
                  </h4>
                  {fields.map((f) => (
                    <div key={f.field} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, padding: '8px 0', borderBottom: '1px solid #f3f4f6', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{f.label}</span>
                      <div style={{ fontSize: 12, padding: '4px 8px', background: '#fef2f2', borderRadius: 4 }}>
                        {formatValue(f.fromValue)}
                      </div>
                      <div style={{ fontSize: 12, padding: '4px 8px', background: '#f0fdf4', borderRadius: 4 }}>
                        {formatValue(f.toValue)}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', background: '#f9fafb', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', color: '#374151', fontSize: 14, cursor: 'pointer' }}>
            Close
          </button>
          {canRevert && (
            <button
              onClick={() => onRevert(fromVersion)}
              style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <RotateCcw size={15} />
              Revert to V{fromVersion}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VersionDiffModal;
