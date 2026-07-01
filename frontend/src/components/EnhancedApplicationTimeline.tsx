import React, { useMemo } from 'react';
import { ApplicationData } from '../types';
import { CheckIcon, ForwardIcon, RejectIcon, ReturnIcon, FlagIcon, DisposeIcon, ReviewIcon, PendingIcon } from '../utils/icons';

// Local date helpers to replace missing '../utils/dateUtils'
function formatDate(input: string | number | Date): string {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return 'Invalid date';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
}

function formatTime(input: string | number | Date): string {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

interface EnhancedApplicationTimelineProps {
  application: ApplicationData;
  workflowHistory?: any[];
}

interface TimelineEvent {
  date: string;
  time: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'complete' | 'current' | 'upcoming';
  user?: string;
  attachments?: any[];
}

const TimelineEventItem: React.FC<{ event: TimelineEvent; isLast: boolean }> = ({ event, isLast }) => (
  <li>
    <div className="relative pb-4 group">
      {!isLast && (
        <span
          className="absolute top-3 left-3 -ml-px h-full w-[1px] bg-gradient-to-b from-blue-400 to-transparent opacity-30"
          aria-hidden="true"
        ></span>
      )}
      <div className="relative flex items-start space-x-2">
        <div>
          <div
            className={`relative p-1.5 transition-transform duration-300 group-hover:scale-110 ${
              event.status === 'complete'
                ? 'bg-emerald-500 shadow-emerald-500/30'
                : event.status === 'current'
                ? 'bg-blue-500 shadow-blue-500/30'
                : 'bg-slate-300 shadow-slate-300/30'
            } rounded-full flex items-center justify-center ring-1 ring-white shadow-sm`}
          >
            <div className="text-white w-3 h-3 flex items-center justify-center">{event.icon}</div>
          </div>
        </div>

        <div className="min-w-0 flex-1 bg-white/60 backdrop-blur-md border border-slate-100 rounded-lg p-2 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-110 origin-left hover:z-10 hover:bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div className="min-w-0 flex-1 pr-1">
              <p className="text-[11px] font-bold text-slate-800 truncate">{event.title}</p>
            </div>
            <div className="text-right text-[9px] whitespace-nowrap text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 sm:ml-1 mt-0.5 sm:mt-0 flex-shrink-0">
              <time dateTime={event.date} className="font-medium text-slate-700 mr-1">{event.date}</time>
              <span>{event.time}</span>
            </div>
          </div>

          {event.attachments && event.attachments.length > 0 && (
             <div className="mt-1 flex flex-wrap gap-1">
                {event.attachments.map((att: any, idx: number) => (
                  <a key={idx} href={att.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[9px] font-semibold hover:bg-blue-100 transition-colors border border-blue-100">
                    <svg className="w-2.5 h-2.5 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    <span className="truncate max-w-[80px]">{att.name}</span>
                  </a>
                ))}
             </div>
          )}

          {event.user && (
            <div className="mt-1 pt-1 border-t border-slate-100 flex items-center text-[10px] text-slate-500 overflow-hidden">
              <div className="w-4 h-4 flex-shrink-0 rounded-full bg-gradient-to-tr from-blue-100 to-blue-50 text-blue-600 flex items-center justify-center mr-1 font-bold text-[8px] uppercase border border-blue-100 shadow-sm">
                {event.user.charAt(0)}
              </div>
              <span className="font-medium text-slate-700 truncate">{event.user}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  </li>
);

const EnhancedApplicationTimeline: React.FC<EnhancedApplicationTimelineProps> = ({ application, workflowHistory }) => {
  const timelineEvents = useMemo(() => {
    if (workflowHistory && workflowHistory.length > 0) {
      // Map actual workflow history to timeline events
      return workflowHistory.map((historyItem: any, index: number) => {
        let icon = <CheckIcon />;
        let status: 'complete' | 'current' = 'complete';
        
        const action = historyItem.actionTaken?.toUpperCase() || '';
        if (action === 'FORWARD' || action === 'FORWARDED') icon = <ForwardIcon />;
        else if (action === 'REJECT' || action === 'REJECTED') icon = <RejectIcon />;
        else if (action === 'RETURN' || action === 'RETURNED') icon = <ReturnIcon />;
        else if (action === 'FLAG' || action === 'RED_FLAG') icon = <FlagIcon />;
        else if (action === 'DISPOSE' || action === 'DISPOSED') icon = <DisposeIcon />;
        else if (action === 'SCHEDULE_HEARING') icon = <ReviewIcon />;
        
        if (index === workflowHistory.length - 1 && application.status === 'pending') {
           status = 'current';
        }

        const userObj = historyItem.previousUser;
                     
        const userName = userObj ? userObj.username : `User ${historyItem.previousUserId || 'System'}`;
        
        const actionLabel = historyItem.actiones?.label || action || 'Processed';

        return {
          date: formatDate(historyItem.createdAt),
          time: formatTime(historyItem.createdAt),
          title: `Application ${actionLabel}`,
          description: historyItem.remarks || 'No remarks provided.',
          user: userName,
          icon,
          status,
          attachments: historyItem.attachments || []
        };
      });
    }

    // Fallback if no history is provided
    const events: TimelineEvent[] = [];
    events.push({
      date: formatDate(application.applicationDate),
      time: '10:30 AM',
      title: 'Application Submitted',
      description: `Application was submitted by the applicant and assigned to ${application.assignedTo}`,
      user: 'Applicant',
      icon: <CheckIcon />,
      status: 'complete',
    });

    if (application.forwardedFrom && application.forwardedTo) {
      events.push({
        date: formatDate(application.lastUpdated),
        time: '02:45 PM',
        title: 'Application Forwarded',
        description: `Forwarded from ${application.forwardedFrom} to ${application.forwardedTo}`,
        user: application.forwardedFrom,
        icon: <ForwardIcon />,
        status: 'complete',
      });
    }

    switch (application.status) {
      case 'approved':
        events.push({
          date: formatDate(application.lastUpdated),
          time: '11:20 AM',
          title: 'Application Approved',
          description: `The application was approved by ${application.assignedTo}`,
          user: application.assignedTo,
          icon: <CheckIcon />,
          status: 'complete',
        });
        break;
      case 'rejected':
        events.push({
          date: formatDate(application.lastUpdated),
          time: '03:15 PM',
          title: 'Application Rejected',
          description: `The application was rejected by ${application.assignedTo}`,
          user: application.assignedTo,
          icon: <RejectIcon />,
          status: 'complete',
        });
        break;
      case 'pending':
      default:
        events.push({
          date: formatDate(application.lastUpdated),
          time: '01:30 PM',
          title: 'Under Review',
          description: `Currently under review with ${application.assignedTo}`,
          user: application.assignedTo,
          icon: <ReviewIcon />,
          status: 'current',
        });
    }
    return events;
  }, [application, workflowHistory]);

  const displayEvents = useMemo(() => {
    if (!timelineEvents || timelineEvents.length <= 3) return timelineEvents || [];
    return [
      timelineEvents[0],
      timelineEvents[timelineEvents.length - 2],
      timelineEvents[timelineEvents.length - 1]
    ];
  }, [timelineEvents]);

  if (!displayEvents || displayEvents.length === 0) {
    return <div className="p-2 text-center text-xs text-slate-500">No timeline data available.</div>;
  }

  return (
    <div className="py-2 px-1">
      <div className="flow-root">
        <ul className="-mb-6">
          {displayEvents.map((event, index) => (
            <TimelineEventItem
              key={index}
              event={event}
              isLast={index === displayEvents.length - 1}
            />
          ))}
        </ul>
      </div>
    </div>
  );
};

export default EnhancedApplicationTimeline;
