/**
 * Sidebar API Calls Service
 * This service handles all API calls related to sidebar functionality
 * Replaces the old mockData.ts file with actual API implementations
 */

import { ApplicationApi } from '../config/APIClient';
import { APIApplication, ApiResponse } from '../types/api';
import { ApplicationData } from '../types';
import { statusIdMap } from '../config/statusMap';

// Simple cache to prevent duplicate API calls
const apiCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

const getCachedData = (key: string, ttl: number = 30000): any | null => {
  const cached = apiCache.get(key);
  if (cached && (Date.now() - cached.timestamp) < cached.ttl) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key: string, data: any, ttl: number = 30000): void => {
  apiCache.set(key, { data, timestamp: Date.now(), ttl });
};

// Status mapping for numeric status_id (based on actual API status codes)
// Using statusIdMap from config for consistency, with legacy aliases for backward compatibility
export const STATUS_MAP = {
  forward: statusIdMap.forwarded || [1, 9],     // FORWARD + INITIATE 
  forwarded: statusIdMap.forwarded || [1, 9],   // Alias for forward
  pending: statusIdMap.pending || [1, 9],       // Same as forward for now
  sent: statusIdMap.sent || [11, 1, 9],         // RECOMMEND
  returned: statusIdMap.returned || [2],        // REJECT (treated as returned)
  flagged: statusIdMap.redflagged || [8],       // RED_FLAG
  redflagged: statusIdMap.redflagged || [8],    // Alias for flagged
  approved: statusIdMap.approved || [11, 3],    // RECOMMEND + APPROVED
  freshform: statusIdMap.freshform || [9],      // INITIATE (fresh form applications)
  final: statusIdMap.finaldisposal || [7],      // FINAL DISPOSAL 
  finaldisposal: statusIdMap.finaldisposal || [7], // FINAL DISPOSAL
  closed: statusIdMap.closed || [10],           // CLOSE
  cancelled: statusIdMap.cancelled || [4],      // CANCEL
  reEnquiry: statusIdMap.reEnquiry || [5],      // RE_ENQUIRY
  groundReport: statusIdMap.groundReport || [6], // GROUND_REPORT
  drafts: statusIdMap.drafts || [13]            // DRAFTS (alias for draft)
};

/**
 * Transform DetailedApplicationData to ApplicationData format for backward compatibility
 */
const transformDetailedToApplicationData = (detailedApp: any): ApplicationData => {
  // Handle both old and new API response formats
  const histories = Array.isArray(detailedApp?.FreshLicenseApplicationsFormWorkflowHistories)
    ? detailedApp.FreshLicenseApplicationsFormWorkflowHistories
    : Array.isArray(detailedApp?.workflowHistory)
      ? detailedApp.workflowHistory
      : [];
  const history = histories.map((h: any) => {
    const created = h.createdAt ? new Date(h.createdAt) : new Date();
    return {
      date: created.toISOString().split('T')[0],
      time: created.toTimeString().slice(0, 5),
      action: h.actionTaken || h.action || '',
      by: h.previousUserName + ' (' + h.previousRoleName + ')' || 'Unknown User',
      comments: h.remarks || undefined,
      attachments: Array.isArray(h.attachments) ? h.attachments : (h.attachments ? [h.attachments] : []),
    };
  });

  // Extract name from applicantFullName (new API format) or construct from firstName/lastName (old format)
  const applicantName = detailedApp.applicantFullName ||
    `${detailedApp.firstName || ''} ${detailedApp.middleName || ''} ${detailedApp.lastName || ''}`.trim() ||
    'Unknown Applicant';

  // Map status from new API format
  const statusName = detailedApp.workflowStatus?.name;

  return {
    id: String(detailedApp.id || ''),
    applicantName: applicantName,
    applicantMobile: detailedApp.contactInfo?.mobileNumber || detailedApp.mobileNumber || '',
    applicantEmail: detailedApp.contactInfo?.email || detailedApp.email || undefined,
    fatherName: detailedApp.parentOrSpouseName || detailedApp.fatherName || undefined,
    gender: detailedApp.sex === 'MALE' ? 'Male' : detailedApp.sex === 'FEMALE' ? 'Female' : 'Other',
    dob: detailedApp.dateOfBirth || detailedApp.dob || undefined,
    address: detailedApp.presentAddress?.addressLine || detailedApp.address || undefined,
    applicationType: 'Fresh License',
    applicationDate: detailedApp.createdAt || new Date().toISOString(),
    applicationTime: detailedApp.createdAt ? new Date(detailedApp.createdAt).toTimeString() : undefined,
    status: statusName,
    status_id: detailedApp.status?.id || detailedApp.statusId || 1,
    assignedTo: detailedApp.currentUser?.username || String(detailedApp.currentUserId || ''),
    forwardedFrom: detailedApp.previousUser?.username || undefined,
    forwardedTo: detailedApp.currentUser?.username || undefined,
    forwardComments: detailedApp.remarks || undefined,
    isViewed: !detailedApp.isPending,
    returnReason: undefined,
    currentUser: detailedApp.currentUser,
    flagReason: undefined,
    disposalReason: undefined,
    lastUpdated: detailedApp.updatedAt || detailedApp.createdAt || new Date().toISOString(),
    documents: detailedApp.fileUploads?.map((upload: any) => ({
      name: upload.fileName,
      type: upload.fileType,
      url: upload.fileUrl
    })) || [],
    // Prefer an explicit photoUrl resolved from biometric payloads or fileUploads
    photoUrl: (() => {
      try {
        const resolve = (d: any) => {
          if (!d) return undefined;
          // biometric wrappers can be nested
          const bioRoot = d.biometricData || d.biometric_data || null;
          let bio = bioRoot;
          if (bio && bio.biometricData) bio = bio.biometricData;
          if (bio && bio.photo && typeof bio.photo.url === 'string' && bio.photo.url.trim()) return bio.photo.url.trim();

          // direct top-level photoUrl
          if (typeof d.photoUrl === 'string' && d.photoUrl.trim()) return d.photoUrl.trim();

          // fileUploads relation fallback
          const uploads = d.fileUploads || d.file_uploads || [];
          if (Array.isArray(uploads)) {
            const byType = uploads.find((f: any) => ((f.fileType || f.type || '') + '').toString().toUpperCase().includes('PHOTOGRAPH') && (f.fileUrl || f.url));
            if (byType) return (byType.fileUrl || byType.url || '').toString();

            const byName = uploads.find((f: any) => {
              const name = (f.fileName || f.name || '').toString().toLowerCase();
              return /(photo|photograph|passport)/.test(name) && (f.fileUrl || f.url);
            });
            if (byName) return (byName.fileUrl || byName.url || '').toString();
          }

          return undefined;
        };

        return resolve(detailedApp);
      } catch (e) {
        return undefined;
      }
    })(),
    history,
    // Preserve the original workflowHistories for the new Application History display
    workflowHistories: detailedApp.workflowHistories || detailedApp.FreshLicenseApplicationsFormWorkflowHistories || [],
    // Preserve additional data fields
    licenseHistories: detailedApp.licenseHistories || [],
    criminalHistories: detailedApp.criminalHistories || [],
    licenseDetails: detailedApp.licenseDetails || [],
    actions: {
      canForward: detailedApp.currentRole?.can_forward || false,
      canReport: true,
      canApprove: !detailedApp.isApproved && !detailedApp.isRejected,
      canReject: !detailedApp.isApproved && !detailedApp.isRejected,
      canRaiseRedflag: !detailedApp.isApproved && !detailedApp.isRejected,
      canReturn: !detailedApp.isApproved && !detailedApp.isRejected,
      canDispose: detailedApp.isApproved,
    },
    usersInHierarchy: Array.isArray(detailedApp.usersInHierarchy)
      ? detailedApp.usersInHierarchy
      : [],
  };
};

/**
 * Fetch application by Application ID for detailed view
 * Renders API: http://localhost:3000/application-form?applicationId={id}
 * 
 * Usage example:
 * const applicationData = await getApplicationByApplicationId(6);
 * console.log(applicationData?.id); // "6"
 * console.log(applicationData?.applicantName); // "John Doe"
 */

// Detailed Application interface for the full API response
export interface DetailedApplicationData {
  id: number;
  acknowledgementNo: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  filledBy: string;
  parentOrSpouseName: string;
  sex: string;
  placeOfBirth: string;
  dateOfBirth: string;
  panNumber: string;
  aadharNumber: string;
  dobInWords: string;
  presentAddressId: number;
  permanentAddressId: number;
  contactInfoId: number;
  occupationInfoId: number;
  biometricDataId?: number | null;
  statusId: number;
  currentRoleId: number;
  previousRoleId?: number | null;
  currentUserId: number;
  previousUserId?: number | null;
  createdAt: string;
  stateId: number;
  districtId: number;
  updatedAt: string;
  isApproved: boolean;
  isFLAFGenerated: boolean;
  isGroundReportGenerated: boolean;
  isPending: boolean;
  isReEnquiry: boolean;
  isReEnquiryDone: boolean;
  isRejected: boolean;
  remarks?: string | null;
  presentAddress: {
    id: number;
    addressLine: string;
    stateId: number;
    districtId: number;
    sinceResiding: string;
    state: { id: number; name: string };
    district: { id: number; name: string; stateId: number };
  };
  permanentAddress: {
    id: number;
    addressLine: string;
    stateId: number;
    districtId: number;
    sinceResiding: string;
    state: { id: number; name: string };
    district: { id: number; name: string; stateId: number };
  };
  contactInfo: {
    id: number;
    telephoneOffice: string;
    telephoneResidence: string;
    mobileNumber: string;
    officeMobileNumber: string;
    alternativeMobile: string;
    applicationId?: number | null;
  };
  occupationInfo: {
    id: number;
    occupation: string;
    officeAddress: string;
    stateId: number;
    districtId: number;
    cropLocation: string;
    areaUnderCultivation: number;
    state: { id: number; name: string };
    district: { id: number; name: string; stateId: number };
  };
  biometricData?: any | null;
  criminalHistory: Array<{
    id: number;
    applicationId: number;
    convicted: boolean;
    bondDate?: string | null;
    bondExecutionOrdered?: string | null;
    convictionData?: string | null;
    periodOfBond?: string | null;
    prohibitedDate?: string | null;
    prohibitedUnderArmsAct?: string | null;
  }>;
  licenseHistory: Array<{
    id: number;
    applicationId: number;
    createdAt: string;
    familyMemberHasArmsLicense: boolean;
    familyMemberLicenses?: string | null;
    hasAppliedBefore: boolean;
    hasOtherApplications: boolean;
    hasSafePlaceForArms: boolean;
    hasUndergoneTraining: boolean;
    otherApplications?: string | null;
    previousApplications?: string | null;
    safeStorageDetails?: string | null;
    trainingDetails?: string | null;
    updatedAt: string;
  }>;
  licenseDetails: Array<{
    id: number;
    needForLicense: string;
    weaponCategory: string;
    areaOfValidity: string;
    applicationId: number;
    createdAt: string;
    updatedAt: string;
    requestedWeapons: Array<{
      id: number;
      name: string;
      description: string;
      imageUrl?: string | null;
    }>;
  }>;
  fileUploads: Array<{
    id: number;
    applicationId: number;
    fileType: string;
    fileUrl: string;
    uploadedAt: string;
    fileName: string;
    fileSize: number;
  }>;
  state: { id: number; name: string };
  district: { id: number; name: string; stateId: number };
  status: {
    id: number;
    code: string;
    name: string;
    description: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  currentRole: {
    id: number;
    code: string;
    name: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    dashboard_title?: string | null;
    menu_items?: any | null;
    permissions?: any | null;
    can_access_settings: boolean;
    can_forward: boolean;
    can_re_enquiry: boolean;
    can_generate_ground_report: boolean;
    can_FLAF: boolean;
    can_create_freshLicence: boolean;
  };
  previousRole?: any | null;
  currentUser: {
    id: number;
    username: string;
    email: string;
    password: string;
    createdAt: string;
    updatedAt: string;
    phoneNo: string;
    roleId: number;
    policeStationId?: number | null;
    stateId: number;
    districtId: number;
    zoneId?: number | null;
    divisionId?: number | null;
  };
  previousUser?: any | null;
}

/**
 * Converts status name strings to their corresponding numeric IDs
 */
export const convertStatusNamesToIds = (statusIds: string | string[] | number | number[]): string => {
  if (!statusIds) return '';

  const statusArray = Array.isArray(statusIds) ? statusIds : [statusIds];
  const numericIds: number[] = [];

  statusArray.forEach(status => {
    // If already numeric, keep it
    if (typeof status === 'number' || !isNaN(Number(status))) {
      numericIds.push(Number(status));
    } else {
      // Map status name to numeric IDs (case-insensitive lookup)
      const lookup = String(status).toLowerCase();
      const foundKey = Object.keys(STATUS_MAP).find(k => k.toLowerCase() === lookup) as keyof typeof STATUS_MAP | undefined;
      const mappedIds = foundKey ? STATUS_MAP[foundKey] : undefined;
      if (mappedIds) {
        numericIds.push(...mappedIds);
      }
    }
  });

  return numericIds.join(',');
};

/**
 * Utility function to get status IDs from statusIdMap by key
 * Provides a consistent interface for all pages to fetch applications by status
 */
export const getStatusIdsForKey = (statusKey: string): number[] => {
  if (!statusKey) return [];
  // Do a case-insensitive lookup because callers may use lowercase/uppercase variations
  const lookup = String(statusKey).toLowerCase();
  const foundKey = Object.keys(statusIdMap).find(k => k.toLowerCase() === lookup) as keyof typeof statusIdMap | undefined;
  const statusIds = foundKey ? statusIdMap[foundKey] : undefined;
  return statusIds || [];
};

/**
 * Fetch applications by status key (forwarded, returned, redFlagged, disposed, etc.)
 * This is the recommended way for pages to fetch applications by status
 * @param statusKey - The status key to fetch applications for
 * @param customStatusIds - Optional custom status IDs from role-based menu items (cookie)
 */
export const fetchApplicationsByStatusKey = async (statusKey: string, customStatusIds?: number[]): Promise<ApplicationData[]> => {
  // Normalize statusKey to lowercase to be robust against URL/menu casing
  const key = String(statusKey || '').toLowerCase();

  // Special handling for 'sent' - use isSent parameter instead of status filtering
  if (key === 'sent') {
    try {
      const response = await ApplicationApi.getAll({ isSent: true });

      if (!response?.success || !response?.data || !Array.isArray(response.data)) {
        console.warn('⚠️ fetchApplicationsByStatusKey (sent): Invalid response data, returning empty array');
        return [];
      }

      // Transform sent applications - they have different structure
      // Backend returns: applicationId, acknowledgementNo, createdAt, applicantName, 
      // workflowHistoryId, actionTakenAt, actionTaken, actionRemarks
      const applications: ApplicationData[] = response.data.map((item: any) => ({
        id: String(item.applicationId),
        acknowledgementNo: item.acknowledgementNo,
        applicantName: item.applicantName,
        applicationDate: item.createdAt,
        lastUpdated: item.actionTakenAt || item.createdAt,
        status: 'sent', // Use 'sent' as unique status to prevent appearing in other menus
        status_id: 999, // Unique ID for sent status (not from database)
        // Fields not available in sent response - use empty/undefined defaults
        applicantMobile: '', // Not included in workflow history response
        applicationType: '', // Not included in workflow history response
        currentUser: undefined,
        assignedTo: '', // Not included in workflow history response
        // Additional sent-specific fields from workflow history
        actionTaken: item.actionTaken,
        actionRemarks: item.actionRemarks,
        actionTakenAt: item.actionTakenAt,
        workflowHistoryId: item.workflowHistoryId,
      }));

      return applications;
    } catch (error) {
      console.error('❌ fetchApplicationsByStatusKey (sent) error:', error);
      return [];
    }
  }

  // Original logic for other status keys
  // Use custom statusIds if provided, otherwise use default mapping
  const statusIds = customStatusIds && customStatusIds.length > 0 ? customStatusIds : getStatusIdsForKey(key);
  // debug: log statusKey -> statusIds mapping
  try {
    // eslint-disable-next-line no-console
    console.debug('[sidebarApiCalls] fetchApplicationsByStatusKey', { statusKey, key, customStatusIds, statusIds });
  } catch (e) { }
  if (statusIds.length === 0) {
    // debug: no status ids found for this key
    try { console.debug('[sidebarApiCalls] No statusIds for key', statusKey); } catch (e) { }
    return [];
  }

  const applications = await fetchApplicationsByStatus(statusIds);

  return applications;
};

/**
 * Fetch all applications from the API
 */
export const fetchAllApplications = async (params: Record<string, any> = {}): Promise<ApplicationData[]> => {
  try {
    const response = await ApplicationApi.getAll(params);

    if (!response?.success || !response?.data || !Array.isArray(response.data)) {
      return [];
    }

    // Transform API response to match ApplicationData interface
    const applications = response.data.map(transformApiApplicationToApplicationData);
    return applications;
  } catch (error) {
    return [];
  }
};

/**
 * Fetch applications by status from the API
 */
export const fetchApplicationsByStatus = async (status: number[] | string[]): Promise<ApplicationData[]> => {
  try {
    const cacheKey = `fetchApplicationsByStatus_${status}`;

    // Check cache first
    const cachedData = getCachedData(cacheKey, 30000); // 30 second cache
    if (cachedData) {
      return cachedData;
    }
    // Convert status names to numeric IDs if needed
    const convertedStatusIds = convertStatusNamesToIds(status);
    const params = { statusIds: convertedStatusIds };

    const response = await ApplicationApi.getAll(params);
    if (!response?.success || !response?.data || !Array.isArray(response.data)) {
      return [];
    }

    // Transform API response to match ApplicationData interface
    const applications = response.data.map(transformApiApplicationToApplicationData);
    // Cache the results
    setCachedData(cacheKey, applications, 30000);

    return applications;
  } catch (error) {
    return [];
  }
};

/**
 * Fetch application counts for sidebar badges
 */
export const fetchApplicationCounts = async (): Promise<{
  forwardedCount: number;
  returnedCount: number;
  redFlaggedCount: number;
  reEnquiryCount: number;
  draftCount: number;
  pendingCount: number;
  approvedCount: number;
  closedCount: number;
  cancelledCount: number;
  groundReportCount: number;
}> => {
  try {
    const cacheKey = 'fetchApplicationCounts';

    // Check cache first - increased cache time to 5 minutes
    const cachedData = getCachedData(cacheKey, 300000); // 5 minute cache
    if (cachedData) {
      return cachedData;
    }
    // Only fetch counts for the essential inbox items to reduce API load
    const [forwarded, returned, redFlagged, reEnquiry, draft] = await Promise.all([
      fetchApplicationsByStatus(STATUS_MAP.forward),
      fetchApplicationsByStatus(STATUS_MAP.returned),
      fetchApplicationsByStatus(STATUS_MAP.flagged),
      fetchApplicationsByStatus(STATUS_MAP.reEnquiry),
      fetchApplicationsByStatus(STATUS_MAP.drafts),
    ]);

    const counts = {
      forwardedCount: forwarded.length,
      returnedCount: returned.length,
      redFlaggedCount: redFlagged.length,
      reEnquiryCount: reEnquiry.length,
      draftCount: draft.length,
      // Set other counts to 0 for now - can be loaded on-demand
      pendingCount: 0,
      approvedCount: 0,
      closedCount: 0,
      cancelledCount: 0,
      groundReportCount: 0,
    };
    // Cache the results for longer
    setCachedData(cacheKey, counts, 300000);

    return counts;
  } catch (error) {
    return {
      forwardedCount: 0,
      returnedCount: 0,
      redFlaggedCount: 0,
      reEnquiryCount: 0,
      draftCount: 0,
      pendingCount: 0,
      approvedCount: 0,
      closedCount: 0,
      cancelledCount: 0,
      groundReportCount: 0,
    };
  }
};

/**
 * Transform API application object to ApplicationData format
 * Maps the actual API response structure to ApplicationData interface
 */
const transformApiApplicationToApplicationData = (apiApp: any): ApplicationData => {
  // Derive applicant name from available fields; some list endpoints may not include applicantFullName
  const derivedName = (apiApp.applicantFullName
    || `${apiApp.firstName || ''} ${apiApp.middleName || ''} ${apiApp.lastName || ''}`.trim()
  ) || 'Unknown Applicant';

  return {
    id: String(apiApp.id || ''),
    applicantName: derivedName,
    applicantMobile: apiApp.mobileNumber || '', // This might need to be fetched from detailed API
    applicantEmail: apiApp.emailAddress || undefined, // This might need to be fetched from detailed API
    fatherName: apiApp.fatherName || undefined, // This might need to be fetched from detailed API
    gender: apiApp.gender || undefined, // This might need to be fetched from detailed API
    dob: apiApp.dateOfBirth || undefined, // This might need to be fetched from detailed API
    address: apiApp.address || undefined, // This might need to be fetched from detailed API
    applicationType: 'Fresh License', // Default for now, might need to be determined from other fields
    applicationDate: apiApp.createdAt || new Date().toISOString(),
    applicationTime: apiApp.createdAt ? new Date(apiApp.createdAt).toTimeString() : undefined,
    status: apiApp.status,
    status_id: apiApp.status?.id || STATUS_MAP.pending[0],
    workflowStatus: apiApp.workflowStatus ? {
      id: apiApp.workflowStatus.id,
      code: apiApp.workflowStatus.code,
      name: apiApp.workflowStatus.name
    } : undefined,
    assignedTo: String(apiApp.currentUser?.id || ''),
    forwardedFrom: apiApp.previousUser?.id ? String(apiApp.previousUser.id) : undefined,
    forwardedTo: apiApp.currentUser?.id ? String(apiApp.currentUser.id) : undefined,
    forwardComments: apiApp.remarks || undefined,
    isViewed: !apiApp.isPending, // Assuming if not pending, it's been viewed
    returnReason: apiApp.returnReason || undefined,
    flagReason: apiApp.flagReason || undefined,
    disposalReason: apiApp.disposalReason || undefined,
    lastUpdated: apiApp.updatedAt || apiApp.createdAt || new Date().toISOString(),
    documents: apiApp.documents || [],
    history: apiApp.workflowHistory || [],
    actions: {
      canForward: !apiApp.isApproved && !apiApp.isRejected,
      canReport: true,
      canApprove: !apiApp.isApproved && !apiApp.isRejected,
      canReject: !apiApp.isApproved && !apiApp.isRejected,
      canRaiseRedflag: !apiApp.isApproved && !apiApp.isRejected,
      canReturn: !apiApp.isApproved && !apiApp.isRejected,
      canDispose: apiApp.isApproved,
    },
    usersInHierarchy: Array.isArray(apiApp.usersInHierarchy)
      ? apiApp.usersInHierarchy
      : undefined,
  };
};


/**
 * Filter applications based on search query and date range
 */
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
        app.applicantMobile.includes(query) ||
        (app.applicantEmail && app.applicantEmail.toLowerCase().includes(query))
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

/**
 * Filter applications by status (replacement for getApplicationsByStatus from mockData)
 */
export const getApplicationsByStatus = (
  applications: ApplicationData[],
  status: string | number,
  userId?: string
): ApplicationData[] => {
  let filtered = [];

  switch (status) {
    case 'forwarded':
    case 'forward':
      filtered = applications.filter(app => app.forwardedFrom && STATUS_MAP.forward.includes(Number(app.status_id)));
      break;
    case 'sent':
      filtered = applications.filter(app => STATUS_MAP.sent.includes(Number(app.status_id)));
      break;
    case 'returned':
      filtered = applications.filter(app => STATUS_MAP.returned.includes(Number(app.status_id)));
      break;
    case 'flagged':
    case 'redFlagged':
      filtered = applications.filter(app => STATUS_MAP.flagged.includes(Number(app.status_id)));
      break;
    case 'freshform':
      filtered = applications.filter(app => STATUS_MAP.freshform.includes(Number(app.status_id)));
      break;
    case 'pending':
      filtered = applications.filter(app => !app.forwardedFrom && STATUS_MAP.pending.includes(Number(app.status_id)));
      break;
    case 'final':
    case 'approved':
      filtered = applications.filter(app => STATUS_MAP.approved.includes(Number(app.status_id)));
      break;
    case 'closed':
      filtered = applications.filter(app => STATUS_MAP.closed.includes(Number(app.status_id)));
      break;
    case 'cancelled':
      filtered = applications.filter(app => STATUS_MAP.cancelled.includes(Number(app.status_id)));
      break;
    case 'reEnquiry':
    case 'reenquiry':
      filtered = applications.filter(app => STATUS_MAP.reEnquiry.includes(Number(app.status_id)));
      break;
    case 'groundReport':
    case 'ground-report':
      filtered = applications.filter(app => STATUS_MAP.groundReport.includes(Number(app.status_id)));
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

/**
 * Fetch a specific application by ID
 */
export const fetchApplicationById = async (id: Number): Promise<ApplicationData | null> => {
  try {
    const response = await ApplicationApi.getById(id);

    if (!response?.data) {
      return null;
    }

    const application = transformApiApplicationToApplicationData(response.data);
    return application;
  } catch (error) {
    return null;
  }
};

/**
 * Search applications with filters
 */
export const searchApplications = async (searchParams: {
  searchQuery?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{
  applications: ApplicationData[];
  total: number;
  page: number;
  limit: number;
}> => {
  try {
    const response = await ApplicationApi.getAll(searchParams);

    if (!response?.success || !response?.data || !Array.isArray(response.data)) {
      return {
        applications: [],
        total: 0,
        page: searchParams.page || 1,
        limit: searchParams.limit || 10,
      };
    }

    const applications = response.data.map(transformApiApplicationToApplicationData);

    // Extract pagination info from the actual API response structure
    const pagination = (response as any).pagination || {};
    const result = {
      applications,
      total: pagination.total || applications.length,
      page: pagination.page || searchParams.page || 1,
      limit: pagination.limit || searchParams.limit || 10,
    };

    return result;
  } catch (error) {
    return {
      applications: [],
      total: 0,
      page: searchParams.page || 1,
      limit: searchParams.limit || 10,
    };
  }
};

/**
 * Fetch application by Application ID for detailed view
 * Uses API: http://localhost:3000/application-form/{id}
 * 
 * Usage example:
 * const applicationData = await getApplicationByApplicationId(6);
 * console.log(applicationData?.acknowledgementNo); // "ALMS1756794369038"
 * console.log(applicationData?.applicantName); // "John Doe"
 */
export const getApplicationByApplicationId = async (applicationId: string | number): Promise<ApplicationData | null> => {
  try {
    // Make API call to get specific application by ID
    const response = await ApplicationApi.getById(Number(applicationId));
    if (!response?.success || !response?.data) {
      return null;
    }

    // The API now returns a single application object (not an array)
    const detailedApplicationData: any = response.data;
    // Transform the detailed API response to ApplicationData format for backward compatibility
    const applicationData = transformDetailedToApplicationData(detailedApplicationData);

    // Return the transformed data that matches the expected ApplicationData interface
    return applicationData;
  } catch (error) {
    return null;
  }
};
