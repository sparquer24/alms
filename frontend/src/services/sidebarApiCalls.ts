/**
 * Sidebar API Calls Service
 * This service handles all API calls related to sidebar functionality
 * Replaces the old mockData.ts file with actual API implementations
 */

import { ApplicationApi } from '../config/APIClient';
import { APIApplication, ApiResponse } from '../types/api';

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
export const STATUS_MAP = {
  forward: [1, 9],     // FORWARD + INITIATE (keep all ids in forward including freshform)
  pending: [1, 9],     // Same as forward for now
  sent: [11, 1, 9 ],          // RECOMMEND
  returned: [2],       // REJECT (treated as returned)
  flagged: [8],        // RED_FLAG
  disposed: [7],       // DISPOSE
  approved: [11, 3],   // RECOMMEND + APPROVED
  freshform: [9],      // INITIATE (fresh form applications)
  final: [7],          // FINAL DISPOSAL (same as disposed)
  finaldisposal: [7],  // FINAL DISPOSAL
  closed: [10],        // CLOSE
  cancelled: [4],      // CANCEL
  reEnquiry: [5],      // RE_ENQUIRY
  groundReport: [6]    // GROUND_REPORT
};

/**
 * Transform DetailedApplicationData to ApplicationData format for backward compatibility
 */
const transformDetailedToApplicationData = (detailedApp: any): ApplicationData => {
  const histories = Array.isArray(detailedApp?.FreshLicenseApplicationsFormWorkflowHistories)
    ? detailedApp.FreshLicenseApplicationsFormWorkflowHistories
    : [];
  const history = histories.map((h: any) => {
    const created = h.createdAt ? new Date(h.createdAt) : new Date();
    return {
      date: created.toISOString().split('T')[0],
      time: created.toTimeString().slice(0,5),
      action: h.actionTaken || h.action || '',
      by: h.previousUser?.username || String(h.previousUserId ?? ''),
      comments: h.remarks || undefined,
    };
  });
  return {
    id: String(detailedApp.id || ''),
    applicantName: `${detailedApp.firstName} ${detailedApp.middleName ? detailedApp.middleName + ' ' : ''}${detailedApp.lastName}`.trim() || 'Unknown',
    applicantMobile: detailedApp.contactInfo?.mobileNumber || '',
    applicantEmail: detailedApp.contactInfo?.mobileNumber || undefined, // Using mobile as email fallback
    fatherName: detailedApp.parentOrSpouseName || undefined,
    gender: detailedApp.sex === 'MALE' ? 'Male' : detailedApp.sex === 'FEMALE' ? 'Female' : 'Other',
    dob: detailedApp.dateOfBirth || undefined,
    address: detailedApp.presentAddress?.addressLine || undefined,
    applicationType: 'Fresh License', // Default for now
    applicationDate: detailedApp.createdAt || new Date().toISOString(),
    applicationTime: detailedApp.createdAt ? new Date(detailedApp.createdAt).toTimeString() : undefined,
    status: mapApiStatusToApplicationStatus(detailedApp.status),
    status_id: detailedApp.statusId || 1,
    assignedTo: detailedApp.currentUser?.username || String(detailedApp.currentUserId || ''),
    forwardedFrom: detailedApp.previousUser?.username || undefined,
    forwardedTo: detailedApp.currentUser?.username || undefined,
    forwardComments: detailedApp.remarks || undefined,
    isViewed: !detailedApp.isPending,
    returnReason: undefined, // Not directly available in DetailedApplicationData
    flagReason: undefined,   // Not directly available in DetailedApplicationData
    disposalReason: undefined, // Not directly available in DetailedApplicationData
    lastUpdated: detailedApp.updatedAt || detailedApp.createdAt || new Date().toISOString(),
  documents: detailedApp.fileUploads?.map((upload: any) => ({
      name: upload.fileName,
      type: upload.fileType,
      url: upload.fileUrl
    })) || [],
  history,
    actions: {
      canForward: detailedApp.currentRole?.can_forward || false,
      canReport: true,
      canApprove: !detailedApp.isApprovied && !detailedApp.isRejected,
      canReject: !detailedApp.isApprovied && !detailedApp.isRejected,
      canRaiseRedflag: !detailedApp.isApprovied && !detailedApp.isRejected,
      canReturn: !detailedApp.isApprovied && !detailedApp.isRejected,
      canDispose: detailedApp.isApprovied,
    },
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
  isApprovied: boolean;
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

// Application interface (matches your existing structure)
export interface ApplicationData {
  id: string;
  applicantName: string;
  applicantMobile: string;
  applicantEmail?: string;
  fatherName?: string;
  gender?: 'Male' | 'Female' | 'Other';
  dob?: string;
  address?: string;
  applicationType: string;
  applicationDate: string;
  applicationTime?: string;
  status: 'pending' | 'approved' | 'rejected' | 'returned' | 'red-flagged' | 'disposed' | 'initiated' | 'cancelled' | 're-enquiry' | 'ground-report' | 'closed' | 'recommended';
  status_id: string | number;
  assignedTo: string;
  forwardedFrom?: string;
  forwardedTo?: string;
  forwardComments?: string;
  isViewed?: boolean;
  returnReason?: string;
  flagReason?: string;
  disposalReason?: string;
  lastUpdated: string;
  documents?: Array<{
    name: string;
    type: string;
    url: string;
  }>;
  history?: Array<{
    date: string;
    time: string;
    action: string;
    by: string;
    comments?: string;
  }>;
  actions?: {
    canForward: boolean;
    canReport: boolean;
    canApprove: boolean;
    canReject: boolean;
    canRaiseRedflag: boolean;
    canReturn: boolean;
    canDispose: boolean;
  };
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
      // Map status name to numeric IDs
      const mappedIds = STATUS_MAP[String(status).toLowerCase() as keyof typeof STATUS_MAP];
      if (mappedIds) {
        numericIds.push(...mappedIds);
      } else {
        console.warn(`⚠️ Unknown status name: ${status}`);
      }
    }
  });
  
  return numericIds.join(',');
};

/**
 * Fetch all applications from the API
 */
export const fetchAllApplications = async (params: Record<string, any> = {}): Promise<ApplicationData[]> => {
  try {    
    console.log({params},'>>>>>>>>>>>>>')
    
    // Convert status names to numeric IDs if needed
    if (params.statusIds) {
      params.statusIds = convertStatusNamesToIds(params.statusIds);
    }
    
    console.log({params},'<<<<<<<<<<<')
    const response = await ApplicationApi.getAll(params);
  
    if (!response?.success || !response?.data || !Array.isArray(response.data)) {
      console.warn('⚠️ fetchAllApplications: Invalid response data, returning empty array');
      return [];
    }
    
    // Transform API response to match ApplicationData interface
    const applications = response.data.map(transformApiApplicationToApplicationData);
    
    console.log('✅ fetchAllApplications: Transformed applications:', {
      count: applications.length,
      sample: applications[0]
    });
    
    return applications;
  } catch (error) {
    console.error('❌ fetchAllApplications error:', error);
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
      console.log('📦 fetchApplicationsByStatus: Using cached data for status:', status);
      return cachedData;
    }
    
    console.log('📡 fetchApplicationsByStatus called with status:', status);
    
    // Convert status names to numeric IDs if needed
    const convertedStatusIds = convertStatusNamesToIds(status);
    const params = { statusIds: convertedStatusIds };
    
    const response = await ApplicationApi.getAll(params);
    
    console.log('📡 fetchApplicationsByStatus response:', {
      success: response?.success,
      message: response?.message,
      dataType: typeof response?.data,
      isArray: Array.isArray(response?.data),
      length: Array.isArray(response?.data) ? response.data.length : 'N/A',
      pagination: (response as any)?.pagination
    });
    
    if (!response?.success || !response?.data || !Array.isArray(response.data)) {
      console.warn('⚠️ fetchApplicationsByStatus: Invalid response data, returning empty array');
      return [];
    }
    
    // Transform API response to match ApplicationData interface
    const applications = response.data.map(transformApiApplicationToApplicationData);
    
    console.log('✅ fetchApplicationsByStatus: Transformed applications:', {
      count: applications.length,
      sample: applications[0]
    });
    
    // Cache the results
    setCachedData(cacheKey, applications, 30000);
    
    return applications;
  } catch (error) {
    console.error('❌ fetchApplicationsByStatus error:', error);
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
  disposedCount: number;
  pendingCount: number;
  approvedCount: number;
  closedCount: number;
  cancelledCount: number;
  reEnquiryCount: number;
  groundReportCount: number;
}> => {
  try {
    const cacheKey = 'fetchApplicationCounts';
    
    // Check cache first
    const cachedData = getCachedData(cacheKey, 30000); // 30 second cache
    if (cachedData) {
      console.log('📦 fetchApplicationCounts: Using cached data');
      return cachedData;
    }
    
    console.log('📊 fetchApplicationCounts called');
    
    // Fetch applications for each status in parallel
    const [forwarded, returned, redFlagged, disposed, pending, approved, closed, cancelled, reEnquiry, groundReport] = await Promise.all([
      fetchApplicationsByStatus(STATUS_MAP.forward), // Updated to use forward status
      fetchApplicationsByStatus(STATUS_MAP.returned),
      fetchApplicationsByStatus(STATUS_MAP.flagged),
      fetchApplicationsByStatus(STATUS_MAP.disposed),
      fetchApplicationsByStatus(STATUS_MAP.pending),
      fetchApplicationsByStatus(STATUS_MAP.approved),
      fetchApplicationsByStatus(STATUS_MAP.closed),
      fetchApplicationsByStatus(STATUS_MAP.cancelled),
      fetchApplicationsByStatus(STATUS_MAP.reEnquiry),
      fetchApplicationsByStatus(STATUS_MAP.groundReport),
    ]);
    
    const counts = {
      forwardedCount: forwarded.length,
      returnedCount: returned.length,
      redFlaggedCount: redFlagged.length,
      disposedCount: disposed.length,
      pendingCount: pending.length,
      approvedCount: approved.length,
      closedCount: closed.length,
      cancelledCount: cancelled.length,
      reEnquiryCount: reEnquiry.length,
      groundReportCount: groundReport.length,
    };
    
    console.log('📊 fetchApplicationCounts result:', counts);
    
    // Cache the results
    setCachedData(cacheKey, counts, 30000);
    
    return counts;
  } catch (error) {
    console.error('❌ fetchApplicationCounts error:', error);
    return {
      forwardedCount: 0,
      returnedCount: 0,
      redFlaggedCount: 0,
      disposedCount: 0,
      pendingCount: 0,
      approvedCount: 0,
      closedCount: 0,
      cancelledCount: 0,
      reEnquiryCount: 0,
      groundReportCount: 0,
    };
  }
};

/**
 * Transform API application object to ApplicationData format
 * Maps the actual API response structure to ApplicationData interface
 */
const transformApiApplicationToApplicationData = (apiApp: any): ApplicationData => {
  return {
    id: String(apiApp.id || ''),
    applicantName: apiApp.applicantFullName || 'Unknown',
    applicantMobile: apiApp.mobileNumber || '', // This might need to be fetched from detailed API
    applicantEmail: apiApp.emailAddress || undefined, // This might need to be fetched from detailed API
    fatherName: apiApp.fatherName || undefined, // This might need to be fetched from detailed API
    gender: apiApp.gender || undefined, // This might need to be fetched from detailed API
    dob: apiApp.dateOfBirth || undefined, // This might need to be fetched from detailed API
    address: apiApp.address || undefined, // This might need to be fetched from detailed API
    applicationType: 'Fresh License', // Default for now, might need to be determined from other fields
    applicationDate: apiApp.createdAt || new Date().toISOString(),
    applicationTime: apiApp.createdAt ? new Date(apiApp.createdAt).toTimeString() : undefined,
    status: mapApiStatusToApplicationStatus(apiApp.status),
    status_id: apiApp.status?.id || STATUS_MAP.pending[0],
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
      canForward: !apiApp.isApprovied && !apiApp.isRejected,
      canReport: true,
      canApprove: !apiApp.isApprovied && !apiApp.isRejected,
      canReject: !apiApp.isApprovied && !apiApp.isRejected,
      canRaiseRedflag: !apiApp.isApprovied && !apiApp.isRejected,
      canReturn: !apiApp.isApprovied && !apiApp.isRejected,
      canDispose: apiApp.isApprovied,
    },
  };
};

/**
 * Map API status to ApplicationData status
 * Based on the actual API response structure
 */
const mapApiStatusToApplicationStatus = (apiStatus: any): ApplicationData['status'] => {
  if (!apiStatus) return 'pending';
  
  // Handle the status object structure: { id: 1, name: "Forward", code: "FORWARD" }
  const statusStr = (apiStatus.code || apiStatus.name || String(apiStatus)).toLowerCase();
  
  const statusMapping: Record<string, ApplicationData['status']> = {
    'forward': 'pending', // Forward status maps to pending in UI
    'pending': 'pending',
    'approved': 'approved',
    'approve': 'approved',
    'rejected': 'rejected',
    'reject': 'rejected',
    'returned': 'returned',
    'return': 'returned',
    'red_flagged': 'red-flagged',
    'red-flagged': 'red-flagged',
    'flagged': 'red-flagged',
    'flag': 'red-flagged',
    'disposed': 'disposed',
    'dispose': 'disposed',
    'close': 'closed',
    'closed': 'closed',
    'initiated': 'initiated',
    'initiate': 'initiated',
    'sent': 'pending',
    'forwarded': 'pending',
    'cancelled': 'cancelled',
    'cancel': 'cancelled',
    're_enquiry': 're-enquiry',
    're-enquiry': 're-enquiry',
    'ground_report': 'ground-report',
    'ground-report': 'ground-report',
    'recommend': 'recommended',
    'recommended': 'recommended',
  };
  
  return statusMapping[statusStr] || 'pending';
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
    case 'disposed':
      filtered = applications.filter(app => STATUS_MAP.disposed.includes(Number(app.status_id)));
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
    case 're-enquiry':
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
    console.log('📡 fetchApplicationById called with id:', id);
    
    const response = await ApplicationApi.getById(id);
    
    if (!response?.data) {
      console.warn('⚠️ fetchApplicationById: No data in response');
      return null;
    }
    
    const application = transformApiApplicationToApplicationData(response.data);
    
    console.log('✅ fetchApplicationById: Transformed application:', application);
    return application;
  } catch (error) {
    console.error('❌ fetchApplicationById error:', error);
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
    console.log('🔍 searchApplications called with params:', searchParams);
    
    const response = await ApplicationApi.getAll(searchParams);
    
    if (!response?.success || !response?.data || !Array.isArray(response.data)) {
      console.warn('⚠️ searchApplications: Invalid response data');
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
    console.error('❌ searchApplications error:', error);
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
 * Renders API: http://localhost:3000/application-form?applicationId={id}
 * 
 * Usage example:
 * const applicationData = await getApplicationByApplicationId(6);
 * console.log(applicationData?.acknowledgementNo); // "ALMS1756794369038"
 * console.log(`${applicationData?.firstName} ${applicationData?.lastName}`); // "John Doe"
 */
export const getApplicationByApplicationId = async (applicationId: string | number): Promise<ApplicationData | null> => {
  try {
    console.log('📡 getApplicationByApplicationId called with applicationId:', applicationId);
    
    // Make API call to get specific application by ID
    const response = await ApplicationApi.getById(Number(applicationId));
    
    console.log('📡 getApplicationByApplicationId response:', {
      success: response?.success,
      message: response?.message,
      hasData: !!response?.data,
      dataType: typeof response?.data
    });
    
    if (!response?.success || !response?.data) {
      console.warn('⚠️ getApplicationByApplicationId: Invalid response data');
      return null;
    }
    
    // The response.data contains the application data in the format we expect
    const detailedApplicationData = response.data as any; // Use any since we know the structure from the API response
    
    // Transform the detailed API response to ApplicationData format for backward compatibility
    const applicationData = transformDetailedToApplicationData(detailedApplicationData);
    
    // Return the transformed data that matches the expected ApplicationData interface
    console.log('✅ getApplicationByApplicationId: Transformed application:', {
      id: applicationData.id,
      applicantName: applicationData.applicantName,
      status: applicationData.status
    });
    
    return applicationData;
  } catch (error) {
    console.error('❌ getApplicationByApplicationId error:', error);
    return null;
  }
};
