'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, MessageSquare, Paperclip, ArrowRight, User, Clock } from 'lucide-react';
import { RichTextDisplay } from '@/components/RichTextDisplay';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateStr(input: string | number | Date): string {
  if (!input) return '';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return 'Invalid date';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTimeStr(input: string | number | Date): string {
  if (!input) return '';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase();
}

const ACTION_STYLE: Record<string, { border: string; bg: string; badge: string; dot: string }> = {
  APPROVE: { border: 'border-emerald-500', bg: 'bg-emerald-50/60',  badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  FORWARD: { border: 'border-violet-500',  bg: 'bg-violet-50/60',   badge: 'bg-violet-100  text-violet-700  border-violet-200',  dot: 'bg-violet-500'  },
  REJECT:  { border: 'border-red-500',     bg: 'bg-red-50/60',      badge: 'bg-red-100    text-red-700    border-red-200',      dot: 'bg-red-500'     },
  RETURN:  { border: 'border-amber-500',   bg: 'bg-amber-50/60',    badge: 'bg-amber-100  text-amber-700  border-amber-200',    dot: 'bg-amber-500'   },
  CLOSE:   { border: 'border-slate-400',   bg: 'bg-slate-50/60',    badge: 'bg-slate-100  text-slate-600  border-slate-300',    dot: 'bg-slate-400'   },
  SUBMIT:  { border: 'border-blue-500',    bg: 'bg-blue-50/60',     badge: 'bg-blue-100   text-blue-700   border-blue-200',     dot: 'bg-blue-500'    },
  DEFAULT: { border: 'border-blue-400',    bg: 'bg-blue-50/40',     badge: 'bg-blue-100   text-blue-700   border-blue-200',     dot: 'bg-blue-400'    },
};

function getActionStyle(action: string) {
  const a = (action || '').toUpperCase();
  for (const [key, style] of Object.entries(ACTION_STYLE)) {
    if (key !== 'DEFAULT' && a.includes(key)) return style;
  }
  return ACTION_STYLE.DEFAULT;
}

// ─── Public component ─────────────────────────────────────────────────────────

export const ApplicationHistoryCards: React.FC<{ workflowHistory: any[] }> = ({ workflowHistory }) => {
  if (!workflowHistory || workflowHistory.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold text-slate-800 mb-6">Application History</h2>
      <div className="relative">
        {/* Vertical timeline line */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-200 z-0" />
        <div className="space-y-4">
          {workflowHistory.map((item, idx) => (
            <HistoryCard key={item.id ?? idx} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Single card ──────────────────────────────────────────────────────────────

const HistoryCard: React.FC<{ item: any }> = ({ item }) => {
  const [expanded, setExpanded] = useState(false);

  const rawAction = item.actionTaken || item.actiones?.code || '';
  const style = getActionStyle(rawAction);

  // Prefer human-readable label from actiones.name
  const actionLabel = item.actiones?.name || rawAction || 'Processed';

  // Actor: API sends flat previousUserName / previousRoleName
  const actorName =
    item.previousUserName ||
    item.previousUser?.username ||
    (item.previousUserId ? `User #${item.previousUserId}` : 'System');
  const actorRole =
    item.previousRoleName ||
    item.previousUser?.role?.name ||
    item.previousUser?.roles?.[0]?.name ||
    '';

  // Next (forwarded-to): flat nextUserName / nextRoleName
  const nextName =
    item.nextUserName ||
    item.nextUser?.username ||
    (item.nextUserId ? `User #${item.nextUserId}` : null);
  const nextRole =
    item.nextRoleName ||
    item.nextUser?.role?.name ||
    item.nextUser?.roles?.[0]?.name ||
    '';

  const showForwardedTo = nextName && nextName !== actorName;

  const dateStr = formatDateStr(item.createdAt);
  const timeStr = formatTimeStr(item.createdAt);

  const hasRemarks =
    item.remarks &&
    item.remarks.trim() !== '' &&
    item.remarks !== 'No remarks provided.';
  const hasAttachments =
    Array.isArray(item.attachments) && item.attachments.length > 0;
  const canExpand = hasRemarks || hasAttachments;

  return (
    <div className="relative flex gap-4 z-10">
      {/* Timeline dot */}
      <div className="flex-shrink-0 flex flex-col items-center pt-4">
        <div className={`w-4 h-4 rounded-full border-2 border-white shadow-md ${style.dot} z-10`} />
      </div>

      {/* Card */}
      <div className={`flex-1 rounded-xl border border-slate-100 shadow-sm overflow-hidden mb-1 ${style.bg}`}>
        <div className="flex">
          {/* Left accent strip */}
          <div className={`w-1 shrink-0 ${style.border} border-l-4`} />

          {/* Body */}
          <div className="flex-1 p-4">
            {/* Top row */}
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex flex-col gap-0.5">
                {/* Actor name + role */}
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-800 text-sm">{actorName}</span>
                  {actorRole && (
                    <span className="text-xs text-slate-500">({actorRole})</span>
                  )}
                </div>

                {/* Action badge */}
                <span className={`self-start mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${style.badge}`}>
                  {actionLabel}
                </span>

                {/* Forwarded to */}
                {showForwardedTo && (
                  <div className="flex items-center gap-1 mt-1.5 text-sm text-slate-700">
                    <ArrowRight className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                    <span className="font-medium">{nextName}</span>
                    {nextRole && (
                      <span className="text-xs text-slate-500">({nextRole})</span>
                    )}
                  </div>
                )}
              </div>

              {/* Timestamp + expand button */}
              <div className="flex flex-col items-end gap-2 shrink-0">
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock className="w-3 h-3" />
                  <span>{dateStr}</span>
                  {timeStr && <span className="text-slate-400">· {timeStr}</span>}
                </div>

                {canExpand && (
                  <button
                    onClick={() => setExpanded(v => !v)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium transition-colors shadow-sm"
                  >
                    {expanded
                      ? <ChevronUp className="w-3.5 h-3.5" />
                      : <ChevronDown className="w-3.5 h-3.5" />}
                    {expanded ? 'Hide' : 'Details'}
                    {/* Paper-clip hint when collapsed and has attachments */}
                    {hasAttachments && !expanded && (
                      <Paperclip className="w-3 h-3 text-blue-400 ml-0.5" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Expanded panel: remarks + attachments */}
            {expanded && canExpand && (
              <div className="mt-3 space-y-3">
                {/* Remarks (may be TipTap HTML) */}
                {hasRemarks && (
                  <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
                    <div className="flex items-center gap-1.5 text-slate-700 font-semibold text-sm mb-2">
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Remarks</span>
                    </div>
                    <div className="text-slate-700 text-sm leading-relaxed">
                      <RichTextDisplay content={item.remarks} />
                    </div>
                  </div>
                )}

                {/* Attachments / documents */}
                {hasAttachments && (
                  <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
                    <div className="flex items-center gap-1.5 text-slate-700 font-semibold text-sm mb-2">
                      <Paperclip className="w-3.5 h-3.5 text-blue-500" />
                      <span>Documents ({item.attachments.length})</span>
                    </div>
                    <ul className="space-y-1.5">
                      {item.attachments.map((att: any, i: number) => (
                        <li key={i}>
                          <a
                            href={att.url || att.fileUrl || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            <Paperclip className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">
                              {att.name || att.fileName || `Document ${i + 1}`}
                            </span>
                            {att.type && (
                              <span className="text-xs text-slate-400 uppercase">{att.type}</span>
                            )}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


