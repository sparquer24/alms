'use client';
// ─── components/revert/RevertStatusBadge.tsx ────────────────────────────────
// Small inline badge displayed when a record's current status is REVERTED.

import React from 'react';
import { RotateCcw } from 'lucide-react';

interface RevertStatusBadgeProps {
  /** Show extended label ("Reverted") or just the icon */
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

const RevertStatusBadge: React.FC<RevertStatusBadgeProps> = ({
  showLabel = true,
  size = 'md',
}) => {
  const isSmall = size === 'sm';
  return (
    <span
      title="This application has been reverted to a previous version"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: isSmall ? 10 : 12,
        fontWeight: 600,
        padding: isSmall ? '2px 6px' : '3px 10px',
        borderRadius: 999,
        background: '#8b5cf6',
        color: '#fff',
        letterSpacing: 0.2,
      }}
    >
      <RotateCcw size={isSmall ? 10 : 12} />
      {showLabel && 'Reverted'}
    </span>
  );
};

export default RevertStatusBadge;
