import { APIApplication } from '../types/api';
import { ApplicationData } from '../types';

const statusMap: Record<string, ApplicationData['status']> = {
  // Support both uppercase and lowercase status values from API
  'forwarded': 'pending',
  'FORWARDED': 'pending',
  'returned': 'returned',
  'RETURNED': 'returned',
  'red_flagged': 'red-flagged',
  'RED_FLAGGED': 'red-flagged',
  'disposed': 'disposed',
  'DISPOSED': 'disposed',
  'initiated': 'initiated',
  'INITIATED': 'initiated',
  'approved': 'approved',
  'APPROVED': 'approved',
  'rejected': 'rejected',
  'REJECTED': 'rejected',
  'closed': 'disposed',
  'CLOSED': 'disposed',
  'sent': 'pending',
  'SENT': 'pending',
  'final_disposal': 'disposed',
  'FINAL_DISPOSAL': 'disposed',
  'pending': 'pending',
  'PENDING': 'pending',
  'in_progress': 'pending',
  'IN_PROGRESS': 'pending'
};

export const mapAPIApplicationToTableData = (apiApplication: APIApplication): ApplicationData => {
  return {
    id: apiApplication.acknowledgementNo,
    applicantName: `${apiApplication.firstName} ${apiApplication.middleName || ''} ${apiApplication.lastName}`.trim(),
    applicationType: apiApplication.applicationType || apiApplication.licenseType || 'N/A',
    applicationDate: apiApplication.createdAt,
    status: statusMap[apiApplication.status] || 'pending',
    status_id: apiApplication.status,
    documents: [],
    assignedTo: '',
    forwardedTo: '',
    lastUpdated: apiApplication.createdAt,
    isViewed: true,
    applicantMobile: ''
  };
};
