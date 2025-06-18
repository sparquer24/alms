import React from 'react';
import { ApplicationData } from '../config/mockData';

interface ApplicationTimelineProps {
  application: ApplicationData;
}

interface TimelineEvent {
  date: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'complete' | 'current' | 'upcoming';
}

const ApplicationTimeline: React.FC<ApplicationTimelineProps> = ({ application }) => {
  // Generate timeline events based on application data
  const generateTimelineEvents = (): TimelineEvent[] => {
    const events: TimelineEvent[] = [];
    
    // Application created event
    events.push({
      date: formatDate(application.applicationDate),
      title: 'Application Submitted',
      description: `Application was submitted and assigned to ${application.assignedTo}`,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      status: 'complete'
    });
    
    // Forwarded event
    if (application.forwardedFrom && application.forwardedTo) {
      events.push({
        date: formatDate(application.lastUpdated),
        title: 'Application Forwarded',
        description: `Forwarded from ${application.forwardedFrom} to ${application.forwardedTo}`,
        icon: (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        ),
        status: 'complete'
      });
    }
    
    // Status-based events
    switch (application.status) {
      case 'approved':
        events.push({
          date: formatDate(application.lastUpdated),
          title: 'Application Approved',
          description: `The application was approved by ${application.assignedTo}`,
          icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ),
          status: 'complete'
        });
        events.push({
          date: getFutureDate(application.lastUpdated, 7),
          title: 'License Issuance',
          description: 'License ready for issuance',
          icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
          status: 'current'
        });
        break;
        
      case 'rejected':
        events.push({
          date: formatDate(application.lastUpdated),
          title: 'Application Rejected',
          description: `The application was rejected by ${application.assignedTo}`,
          icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ),
          status: 'complete'
        });
        break;
        
      case 'returned':
        events.push({
          date: formatDate(application.lastUpdated),
          title: 'Application Returned',
          description: application.returnReason || 'The application was returned for corrections',
          icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ),
          status: 'complete'
        });
        break;
        
      case 'red-flagged':
        events.push({
          date: formatDate(application.lastUpdated),
          title: 'Application Red-Flagged',
          description: application.flagReason || 'The application was marked for special attention',
          icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
          ),
          status: 'complete'
        });
        break;
        
      case 'disposed':
        events.push({
          date: formatDate(application.lastUpdated),
          title: 'Application Disposed',
          description: application.disposalReason || 'The application has been disposed',
          icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          ),
          status: 'complete'
        });
        break;
        
      case 'pending':
      default:
        events.push({
          date: formatDate(application.lastUpdated),
          title: 'Under Review',
          description: `Currently under review with ${application.assignedTo}`,
          icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
          status: 'current'
        });
        
        // Add prediction for the next steps if pending
        events.push({
          date: 'Pending',
          title: 'Final Decision',
          description: 'Final approval or rejection pending',
          icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          ),
          status: 'upcoming'
        });
    }
    
    return events;
  };

  const timelineEvents = generateTimelineEvents();
  
  return (
    <div className="py-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Application Timeline</h3>
      <div className="flow-root">
        <ul className="-mb-8">
          {timelineEvents.map((event, eventIdx) => (
            <li key={eventIdx}>
              <div className="relative pb-8">
                {eventIdx !== timelineEvents.length - 1 ? (
                  <span
                    className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  ></span>
                ) : null}
                <div className="relative flex items-start space-x-3">
                  <div>
                    <div className={`relative p-1 ${
                      event.status === 'complete' ? 'bg-[#6366F1]' : 
                      event.status === 'current' ? 'bg-yellow-500' : 
                      'bg-gray-300'
                    } rounded-full flex items-center justify-center ring-8 ring-white`}>
                      <div className={`${
                        event.status === 'complete' || event.status === 'current' ? 'text-white' : 
                        'text-gray-500'
                      }`}>
                        {event.icon}
                      </div>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{event.title}</p>
                      <p className="mt-1 text-sm text-gray-500">{event.date}</p>
                    </div>
                    <div className="mt-2 text-sm text-gray-700">
                      <p>{event.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// Helper function to format dates
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
};

// Helper function to calculate a future date
const getFutureDate = (dateString: string, daysToAdd: number): string => {
  try {
    const date = new Date(dateString);
    date.setDate(date.getDate() + daysToAdd);
    return formatDate(date.toISOString());
  } catch {
    return 'Upcoming';
  }
};

export default ApplicationTimeline;
