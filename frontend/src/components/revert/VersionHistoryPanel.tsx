'use client';
// ─── components/revert/VersionHistoryPanel.tsx ──────────────────────────────
// Timeline panel showing all versions of an application.
// Placed inside ProceedingsForm / RenewalProceedingsForm as a collapsible section.

import React, { useState, useEffect, useCallback } from 'react';
import { RotateCcw, ChevronDown, Eye, GitCompare, Clock, CheckCircle, XCircle, ArrowRightLeft } from 'lucide-react';
import styles from './VersionHistoryPanel.module.css';
import { ApplicationType, VersionListItem, VersionHistory } from '../../types/revert';
import { getVersionHistory } from '../../api/revertService';
import { getStatusStyle } from '../../utils/statusColors';
import RevertConfirmationModal from './RevertConfirmationModal';
import SnapshotViewerModal from './SnapshotViewerModal';
import VersionDiffModal from './VersionDiffModal';

// Map triggerAction codes → human labels
const ACTION_LABELS: Record<string, string> = {
  FORWARD: 'Forwarded',
  APPROVE: 'Approved',
  APPROVED: 'Approved',
  REJECT: 'Rejected',
  RE_ENQUIRY: 'Re-enquiry',
  RECOMMEND: 'Recommended',
  NOT_RECOMMEND: 'Not Recommended',
  INITIATE: 'Submitted',
  SUBMIT: 'Submitted',
  REVERT: 'Reverted',
  CLOSE: 'Closed',
  DISPOSE: 'Disposed',
  CANCEL: 'Cancelled',
  CREATE: 'Created (Draft)',
  GROUND_REPORT: 'Ground Report',
  RED_FLAG: 'Red Flagged',
};

const TERMINAL_ACTIONS = ['APPROVE', 'APPROVED', 'REJECT', 'CLOSE', 'DISPOSE', 'CANCEL'];

interface VersionHistoryPanelProps {
  applicationId: number;
  applicationType: ApplicationType;
  canRevert: boolean;           // Role-level permission flag
  currentVersionNumber: number; // From the application object
  /** Optional: acknowledgement number for display in modals */
  acknowledgementNo?: string;
}

const VersionHistoryPanel: React.FC<VersionHistoryPanelProps> = ({
  applicationId,
  applicationType,
  canRevert,
  currentVersionNumber,
  acknowledgementNo,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [loading, setLoading] = useState(false);
  const [versions, setVersions] = useState<VersionListItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [revertTarget, setRevertTarget] = useState<VersionListItem | null>(null);
  const [viewSnapshotVersion, setViewSnapshotVersion] = useState<number | null>(null);
  const [compareVersions, setCompareVersions] = useState<{ from: number; to: number } | null>(null);

  const fetchVersions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data: VersionHistory = await getVersionHistory(applicationId, applicationType);
      setVersions(data.versions);
    } catch (err: any) {
      setError('Failed to load version history.');
    } finally {
      setLoading(false);
    }
  }, [applicationId, applicationType]);

  useEffect(() => {
    if (isExpanded) fetchVersions();
  }, [isExpanded, fetchVersions]);

  const latestVersion = versions[0]?.versionNumber ?? currentVersionNumber;

  const getDotClass = (v: VersionListItem) => {
    if (v.versionNumber === latestVersion) return `${styles.timelineDot} ${styles.timelineDotCurrent}`;
    if (v.triggerAction === 'REVERT') return `${styles.timelineDot} ${styles.timelineDotRevert}`;
    if (TERMINAL_ACTIONS.includes(v.triggerAction)) return `${styles.timelineDot} ${styles.timelineDotTerminal}`;
    return styles.timelineDot;
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <div className={styles.panel}>
        {/* ── Header ── */}
        <div className={styles.header} onClick={() => setIsExpanded((p) => !p)}>
          <div className={styles.headerLeft}>
            <Clock size={16} color="#6366f1" />
            <span className={styles.headerTitle}>Version History</span>
            {versions.length > 0 && (
              <span className={styles.headerBadge}>{versions.length} versions</span>
            )}
          </div>
          <ChevronDown
            size={18}
            className={`${styles.chevron} ${isExpanded ? styles.chevronOpen : ''}`}
          />
        </div>

        {/* ── Body ── */}
        {isExpanded && (
          <div className={styles.body}>
            {loading && <p className={styles.loading}>Loading version history…</p>}
            {error && <p className={styles.empty}>{error}</p>}
            {!loading && !error && versions.length === 0 && (
              <p className={styles.empty}>No version history yet. Versions are created when workflow actions are taken.</p>
            )}

            {!loading && versions.length > 0 && (
              <div className={styles.timeline}>
                {versions.map((v) => {
                  const isLatest = v.versionNumber === latestVersion;
                  const actionLabel = ACTION_LABELS[v.triggerAction] ?? v.triggerAction;
                  const isRevertVersion = v.triggerAction === 'REVERT';
                  const isTerminal = TERMINAL_ACTIONS.includes(v.triggerAction);

                  return (
                    <div key={v.id} className={styles.timelineItem}>
                      {/* Dot */}
                      <div className={getDotClass(v)}>
                        {isLatest ? (
                          <CheckCircle size={16} />
                        ) : isTerminal ? (
                          <XCircle size={16} />
                        ) : isRevertVersion ? (
                          <RotateCcw size={14} />
                        ) : (
                          <span>V{v.versionNumber}</span>
                        )}
                      </div>

                      {/* Content */}
                      <div
                        className={`${styles.timelineContent} ${isLatest ? styles.timelineContentCurrent : ''}`}
                      >
                        <div className={styles.timelineTop}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className={styles.actionLabel}>{actionLabel}</span>
                            {isLatest && <span className={styles.currentTag}>Current</span>}
                          </div>
                          <span className={styles.timestamp}>{formatDate(v.createdAt)}</span>
                        </div>

                        <p className={styles.byLine}>
                          By: <strong>{v.actionByUser?.username ?? `User #${v.actionByUserId}`}</strong>{' '}
                          ({v.actionByRole?.name ?? 'Unknown Role'})
                        </p>

                        {isRevertVersion && (
                          <p className={styles.revertNote}>↩ This version was created by a revert operation</p>
                        )}

                        {/* Action buttons — don't show on latest */}
                        {!isLatest && (
                          <div className={styles.actions}>
                            <button
                              className={styles.btnView}
                              onClick={() => setViewSnapshotVersion(v.versionNumber)}
                              title="View full snapshot data at this version"
                            >
                              <Eye size={12} style={{ display: 'inline', marginRight: 4 }} />
                              View Snapshot
                            </button>

                            <button
                              className={styles.btnCompare}
                              onClick={() =>
                                setCompareVersions({ from: v.versionNumber, to: latestVersion })
                              }
                              title="Compare this version with the current version"
                            >
                              <GitCompare size={12} style={{ display: 'inline', marginRight: 4 }} />
                              Compare with Current
                            </button>

                            {canRevert && (
                              <button
                                className={styles.btnRevert}
                                onClick={() => setRevertTarget(v)}
                                title="Revert application to this version"
                              >
                                <RotateCcw size={12} />
                                Revert to V{v.versionNumber}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {revertTarget && (
        <RevertConfirmationModal
          isOpen={!!revertTarget}
          onClose={() => setRevertTarget(null)}
          applicationId={applicationId}
          applicationType={applicationType}
          targetVersion={revertTarget}
          currentVersionNumber={latestVersion}
          acknowledgementNo={acknowledgementNo}
          onRevertSuccess={() => {
            setRevertTarget(null);
            fetchVersions();
          }}
        />
      )}

      {viewSnapshotVersion !== null && (
        <SnapshotViewerModal
          isOpen={viewSnapshotVersion !== null}
          onClose={() => setViewSnapshotVersion(null)}
          applicationId={applicationId}
          applicationType={applicationType}
          versionNumber={viewSnapshotVersion}
          onRevert={(vNum) => {
            const v = versions.find((x) => x.versionNumber === vNum);
            if (v) { setViewSnapshotVersion(null); setRevertTarget(v); }
          }}
          canRevert={canRevert}
        />
      )}

      {compareVersions && (
        <VersionDiffModal
          isOpen={!!compareVersions}
          onClose={() => setCompareVersions(null)}
          applicationId={applicationId}
          applicationType={applicationType}
          fromVersion={compareVersions.from}
          toVersion={compareVersions.to}
          onRevert={(vNum) => {
            const v = versions.find((x) => x.versionNumber === vNum);
            if (v) { setCompareVersions(null); setRevertTarget(v); }
          }}
          canRevert={canRevert}
        />
      )}
    </>
  );
};

export default VersionHistoryPanel;
