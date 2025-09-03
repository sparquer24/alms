import { APIApplication } from '../types/api';
import { ApplicationData } from '../config/mockData';

const statusMap: Record<string, ApplicationData['status']> = {
  // Forward synonyms
  'forward': 'pending',
  'FORWARD': 'pending',
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

// Accept broader shape because backend sends nested structures
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mapAPIApplicationToTableData = (apiApplication: any): ApplicationData => {
  const rawStatus = apiApplication?.status?.code || apiApplication?.status?.name || apiApplication?.status || 'pending';
  const normalizedStatus = String(rawStatus);

  return {
    id: String(apiApplication.acknowledgementNo || apiApplication.id || ''),
    applicantName: `${apiApplication.firstName || ''} ${apiApplication.middleName || ''} ${apiApplication.lastName || ''}`.trim() || 'N/A',
    applicationType: apiApplication.applicationType || apiApplication.licenseType || 'N/A',
    applicationDate: apiApplication.createdAt || new Date().toISOString(),
    status: (statusMap[normalizedStatus] || 'pending') as ApplicationData['status'],
    status_id: normalizedStatus,
    documents: [],
    assignedTo: '',
    forwardedTo: '',
    lastUpdated: apiApplication.updatedAt || apiApplication.createdAt || new Date().toISOString(),
    isViewed: true,
    applicantMobile: apiApplication?.contactInfo?.mobileNumber || '',
  };
};
