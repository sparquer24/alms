import { ApplicationData } from '../types';

// Status mapping for numeric status_id
export const STATUS_MAP = {
  pending: 1,        // Pending (fresh, not forwarded)
  sent: 2,           // Sent/Forwarded
  returned: 3,       // Returned
  flagged: 4,        // Red-flagged
  disposed: 5,       // Disposed/Closed/Rejected
  approved: 6        // Approved/Final Disposal
};

// Remove mock applications for production usage. Export an empty list.
export const mockApplications: ApplicationData[] = [];

// Helper function to filter applications based on search query and date range
export const filterApplications = (
  applications: ApplicationData[],
  searchQuery?: string,
  startDate?: string,
  endDate?: string
): ApplicationData[] => {
  let filtered = [...applications];

  // Filter by search query
  if (searchQuery && searchQuery.trim() !== '') {
    const query = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(
      app =>
        app.id.toLowerCase().includes(query) ||
        app.applicantName.toLowerCase().includes(query) ||
        app.applicantMobile.includes(query)
    );
  }

  // Filter by date range
  if (startDate && startDate.trim() !== '') {
    filtered = filtered.filter(
      app => new Date(app.applicationDate) >= new Date(startDate)
    );
  }

  if (endDate && endDate.trim() !== '') {
    filtered = filtered.filter(
      app => new Date(app.applicationDate) <= new Date(endDate)
    );
  }

  return filtered;
};

// Helper function to filter applications by status
export const getApplicationsByStatus = (
  applications: ApplicationData[],
  status: string | number,
  userId?: string
): ApplicationData[] => {
  let filtered = [];
  switch (status) {
    case 'forwarded':
    case STATUS_MAP.sent:
      filtered = applications.filter(app => app.forwardedFrom && app.status_id === STATUS_MAP.sent);
      break;
    case 'returned':
    case STATUS_MAP.returned:
      filtered = applications.filter(app => app.status_id === STATUS_MAP.returned);
      break;
    case 'flagged':
    case STATUS_MAP.flagged:
      filtered = applications.filter(app => app.status_id === STATUS_MAP.flagged);
      break;
    case 'disposed':
    case STATUS_MAP.disposed:
      filtered = applications.filter(app => app.status_id === STATUS_MAP.disposed);
      break;
    case 'freshform':
    case STATUS_MAP.pending:
      filtered = applications.filter(app => !app.forwardedFrom && app.status_id === STATUS_MAP.pending);
      break;
    case 'final':
    case STATUS_MAP.approved:
      filtered = applications.filter(app => app.status_id === STATUS_MAP.approved);
      break;
    default:
      filtered = applications;
  }
  // Filter by userId if provided
  if (userId) {
    filtered = filtered.filter(app => app.assignedTo === userId || app.forwardedTo === userId);
  }
  return filtered;
};
