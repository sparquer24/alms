import React, { useMemo } from 'react';
import { ApplicationData } from '../services/sidebarApiCalls';
import { CheckIcon, ForwardIcon, RejectIcon, ReturnIcon, FlagIcon, DisposeIcon, ReviewIcon, PendingIcon } from '../utils/icons';

// Local date helpers to replace missing '../utils/dateUtils'
function formatDate(input: string | number | Date): string {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return 'Invalid date';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
}

function getFutureDate(base: string | number | Date, daysAhead: number): string {
  const d = new Date(base);
  if (Number.isNaN(d.getTime())) return 'Invalid date';
  d.setDate(d.getDate() + daysAhead);
  return formatDate(d);
}

interface EnhancedApplicationTimelineProps {
  application: ApplicationData;
}

interface TimelineEvent {
  date: string;
  time: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'complete' | 'current' | 'upcoming';
  user?: string;
}

const TimelineEventItem: React.FC<{ event: TimelineEvent; isLast: boolean }> = ({ event, isLast }) => (
  <li>
    <div className="relative pb-8">
      {!isLast && (
        <span
          className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
          aria-hidden="true"
        ></span>
      )}
      <div className="relative flex items-start space-x-4">
        <div>
          <div
            className={`relative p-2 ${
              event.status === 'complete'
                ? 'bg-green-500'
                : event.status === 'current'
                ? 'bg-blue-500'
                : 'bg-gray-300'
            } rounded-full flex items-center justify-center ring-8 ring-white`}
          >
            <div className="text-white">{event.icon}</div>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-medium text-gray-900">{event.title}</p>
            </div>
            <div className="text-right text-sm whitespace-nowrap text-gray-500">
              <time dateTime={event.date}>{event.date}</time>
              <p>{event.time}</p>
            </div>
          </div>

          <div className="mt-2 text-sm text-gray-700">
            <p>{event.description}</p>
          </div>

          {event.user && (
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <svg
                className="mr-1.5 h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <p>{event.user}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  </li>
);

const EnhancedApplicationTimeline: React.FC<EnhancedApplicationTimelineProps> = ({ application }) => {
  const generateTimelineEvents = (): TimelineEvent[] => {
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
        events.push({
          date: getFutureDate(application.lastUpdated, 7),
          time: 'Pending',
          title: 'License Issuance',
          description: 'License ready for issuance',
          icon: <PendingIcon />,
          status: 'current',
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
      case 'returned':
        events.push({
          date: formatDate(application.lastUpdated),
          time: '12:40 PM',
          title: 'Application Returned',
          description: application.returnReason || 'The application was returned for corrections',
          user: application.assignedTo,
          icon: <ReturnIcon />,
          status: 'complete',
        });
        break;
      case 'red-flagged':
        events.push({
          date: formatDate(application.lastUpdated),
          time: '09:55 AM',
          title: 'Application Red-Flagged',
          description: application.flagReason || 'The application was marked for special attention',
          user: application.assignedTo,
          icon: <FlagIcon />,
          status: 'complete',
        });
        break;
      case 'disposed':
        events.push({
          date: formatDate(application.lastUpdated),
          time: '04:20 PM',
          title: 'Application Disposed',
          description: application.disposalReason || 'The application has been disposed',
          user: application.assignedTo,
          icon: <DisposeIcon />,
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
        events.push({
          date: 'Pending',
          time: 'Upcoming',
          title: 'Final Decision',
          description: 'Final approval or rejection pending',
          icon: <PendingIcon />,
          status: 'upcoming',
        });
    }

    return events;
  };

  const timelineEvents = useMemo(generateTimelineEvents, [application]);

  return (
    <div className="py-4">
      <div className="flow-root">
        <ul className="-mb-8">
          {timelineEvents.map((event, index) => (
            <TimelineEventItem
              key={index}
              event={event}
              isLast={index === timelineEvents.length - 1}
            />
          ))}
        </ul>
      </div>
    </div>
  );
};

export default EnhancedApplicationTimeline;
