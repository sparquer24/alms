// Common types used throughout the ALMS application

import { Key } from "readline";

// Location Types
export * from './location';

// User and Authentication Types
export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  designation: string;
  createdAt: string;
  lastLogin: string;
  permissions: string[];
  availableActions: {
    action: string;
    resource: string;
  }[];
  location?: any;
  stateId?: any;
  state?: any;
}

// Application Types
export interface WorkflowHistoryAttachment {
  url: string;
  name: string;
  type: string;
  contentType: string;
}

export interface WorkflowActiones {
  id: number;
  code: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowHistory {
  id: number;
  applicationId: number;
  previousUserId: number;
  nextUserId: number;
  actionTaken: string;
  remarks: string;
  createdAt: string;
  previousRoleId: number;
  nextRoleId: number;
  actionesId: number | null;
  attachments: WorkflowHistoryAttachment[] | null;
  actiones?: WorkflowActiones;
  previousUserName: string;
  previousRoleName: string;
  nextUserName: string;
  nextRoleName: string;
}

export interface ApplicationData {
  id: string;
  acknowledgementNo?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  applicantName: string;
  applicantMobile: string;
  applicantEmail?: string;
  // Legacy / alternate field names used by some API transforms
  mobileNumber?: string;
  email?: string;
  parentOrSpouseName?: string;
  fatherName?: string;
  sex?: 'MALE' | 'FEMALE' | 'OTHER';
  gender?: 'Male' | 'Female' | 'Other';
  placeOfBirth?: string;
  dob?: string; // Date of birth
  dateOfBirth?: string; // Alternative field name for date of birth
  dobInWords?: string;
  age?: string;
  panNumber?: string;
  aadharNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  licenseType?: string;
  weaponType?: string;
  purposeOfWeapon?: string;
  applicationType: string;
  applicationDate: string;
  applicationTime?: string;
  status?: ApplicationStatus;
  status_id?: string | number; // Numeric status ID for backend compatibility
  workflowStatus?: {
    id: number;
    code: string;
    name: string;
  };
  currentUser?: {
    id: number;
    username: string;
  };
  previousUser?: {
    id: number;
    username: string;
  } | null;
  presentAddress?: {

    addressLine?: string;

    sinceResiding?: string;

    state?: string | { id: number; name: string;[key: string]: any };

    district?: string | { id: number; name: string;[key: string]: any };

    zone?: {

      id: number;

      name: string;

    };

    division?: {

      id: number;

      name: string;

    };

    policeStation?: {

      id: number;

      name: string;

    };

  };

  permanentAddress?: {

    addressLine?: string;

    sinceResiding?: string;

    state?: string | { id: number; name: string;[key: string]: any };

    district?: string | { id: number; name: string;[key: string]: any };

    zone?: {

      id: number;

      name: string;

    };

    division?: {

      id: number;

      name: string;

    };

    policeStation?: {

      id: number;

      name: string;

    };

  };
  occupationAndBusiness?: {
    id: number;
    occupation?: string;
    officeAddress?: string;
    cropLocation?: string;
    areaUnderCultivation?: string;
    state?: {
      id: number;
      name: string;
    };
    district?: {
      id: number;
      name: string;
    };
  };
  // Raw contact object from API (kept for compatibility)
  contactInfo?: {
    mobileNumber?: string;
    email?: string;
    [key: string]: any;
  };
  assignedTo: string;
  forwardedFrom?: string;
  forwardedTo?: string;
  forwardComments?: string; // Comments when forwarding an application
  isViewed?: boolean; // Track if the application has been viewed by the forwarded user
  returnReason?: string;
  flagReason?: string;
  disposalReason?: string;
  lastUpdated: string;
  createdAt?: string;
  updatedAt?: string;
  comments?: string[]; // Legacy field for comments array
  documents?: Array<{
    id?: string;
    name?: string;
    fileName?: string;
    type?: string;
    fileType?: string;
    url?: string;
    fileUrl?: string;
    path?: string;
    downloadUrl?: string;
    uploadedAt?: string;
    size?: number;
    [key: string]: any;
  }>;
  // Optional resolved photo URL (may come from biometricData or fileUploads)
  photoUrl?: string;
  biometricData?: any;
  history?: Array<{
    actionTaken: any;
    attachments: any;
    id: Key | null | undefined;
    by: string;
    createdAt: string | number | Date;
    remarks: any;
    date: string;
    time: string;
    action: string;
    comments?: string;
  }>;
  // New workflow history fields
  workflowHistories?: WorkflowHistory[];
  FreshLicenseApplicationsFormWorkflowHistories?: WorkflowHistory[];
  licenseHistories?: Array<{
    id: number;
    applicationId: number;
    hasAppliedBefore: boolean;
    dateAppliedFor?: string | null;
    previousAuthorityName?: string | null;
    previousResult?: string;
    hasLicenceSuspended: boolean;
    suspensionAuthorityName?: string | null;
    suspensionReason?: string | null;
    hasFamilyLicence: boolean;
    familyMemberName?: string | null;
    familyLicenceNumber?: string | null;
    familyWeaponsEndorsed: any[];
    hasSafePlace: boolean;
    safePlaceDetails?: string | null;
    hasTraining: boolean;
    trainingDetails?: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  criminalHistories?: Array<{
    id: number;
    applicationId: number;
    isConvicted: boolean;
    isBondExecuted: boolean;
    bondDate?: string | null;
    bondPeriod?: string | null;
    isProhibited: boolean;
    prohibitionDate?: string | null;
    prohibitionPeriod?: string | null;
    createdAt: string;
    updatedAt: string;
    firDetails?: Array<{
      unit?: string;
      state?: string;
      offence?: string;
      District?: string;
      sentence?: string;
      firNumber?: string;
      underSection?: string;
      policeStation?: string;
      DateOfSentence?: string;
    }>;
  }>;
  licenseDetails?: Array<{
    id: number;
    applicationId: number;
    needForLicense?: string;
    armsCategory?: string;
    areaOfValidity?: string;
    ammunitionDescription?: string;
    specialConsiderationReason?: string;
    licencePlaceArea?: string;
    wildBeastsSpecification?: string;
    createdAt: string;
    updatedAt: string;
    requestedWeapons?: Array<{
      id: number;
      name: string;
      description?: string;
      imageUrl?: string;
    }>;
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
  isApproved?: boolean;
  isRejected?: boolean;
  isRecommended?: boolean;
  isNotRecommended?: boolean;
  usersInHierarchy?: Array<{
    id: number;
    userName?: string;
    username?: string; // Alternative field name
    email: string;
    stateId: number;
    districtId: number;
    zoneId: number | null;
    divisionId: number | null;
    policeStationId: number | null;
    roleId: number;
    roleName?: string;
  }>;
}

export type ApplicationStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'returned'
  | 'red-flagged'
  | 'disposed'
  | 'initiated'
  | 'cancelled'
  | 're-enquiry'
  | 'ground-report'
  | 'closed'
  | 'recommended'
  | 'under_review'
  | 'forwarded'
  | 'final_disposal'
  | 'sent';

export interface MenuItem {
  name: string;
  path?: string;
  icon?: React.ComponentType;
  children?: MenuItem[];
}

// Notification Types
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Theme Types
export interface Theme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
  };
}

// ============================================================
// License Types (mirrors backend Prisma Licenses model)
// ============================================================

export type LicenseStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'SUSPENDED' | 'REVOKED';

export interface LicenseWorkflowHistoryEntry {
  id: number;
  licenseId: number;
  action: string;
  applicationId?: number | null;
  applicationType?: string | null;
  previousStatus?: string | null;
  newStatus?: string | null;
  changedBy?: number | null;
  changedByUser?: { id: number; username: string } | null;
  remarks?: string | null;
  createdAt: string;
}

export interface LicenseData {
  id: number;
  licenseNumber: string;
  almsLicenseId?: string | null;
  sourceApplicationId?: number | null;
  issueDate?: string | null;
  validFrom?: string | null;
  validTill?: string | null;
  status: LicenseStatus;

  // Personal details (denormalized)
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  parentOrSpouseName?: string | null;
  sex?: string | null;
  dateOfBirth?: string | null;
  placeOfBirth?: string | null;
  aadharNumber?: string | null;
  panNumber?: string | null;

  // License details
  armsCategory?: string | null;
  areaOfValidity?: string | null;
  ammunitionDescription?: string | null;
  licencePlaceArea?: string | null;
  specialConsiderationReason?: string | null;
  needForLicense?: string | null;

  // Address (denormalized)
  presentAddressLine?: string | null;
  presentState?: string | null;
  presentDistrict?: string | null;
  presentPoliceStation?: string | null;
  presentZone?: string | null;
  presentDivision?: string | null;
  permanentAddressLine?: string | null;
  permanentState?: string | null;
  permanentDistrict?: string | null;
  permanentPoliceStation?: string | null;
  permanentZone?: string | null;
  permanentDivision?: string | null;

  // Address hierarchy ids as stored on the license
  presentStateId?: number | null;
  presentDistrictId?: number | null;
  presentPoliceStationId?: number | null;
  presentZoneId?: number | null;
  presentDivisionId?: number | null;
  presentRangeOfficeId?: number | null;
  permanentStateId?: number | null;
  permanentDistrictId?: number | null;
  permanentPoliceStationId?: number | null;
  permanentZoneId?: number | null;
  permanentDivisionId?: number | null;
  permanentRangeOfficeId?: number | null;

  // Address hierarchy names, resolved server-side for display
  presentStateName?: string | null;
  presentDistrictName?: string | null;
  presentPoliceStationName?: string | null;
  presentZoneName?: string | null;
  presentDivisionName?: string | null;
  presentRangeOfficeName?: string | null;
  permanentStateName?: string | null;
  permanentDistrictName?: string | null;
  permanentPoliceStationName?: string | null;
  permanentZoneName?: string | null;
  permanentDivisionName?: string | null;
  permanentRangeOfficeName?: string | null;

  // Occupation
  occupation?: string | null;
  officeAddress?: string | null;

  // Status & lifecycle
  cancellationReason?: string | null;
  cancellationDate?: string | null;
  suspendedReason?: string | null;
  suspendedDate?: string | null;
  lastRenewedDate?: string | null;
  renewalCount?: number;

  // Documents
  qrCodeUrl?: string | null;
  pdfUrl?: string | null;
  digitalSignature?: string | null;
  issuedBy?: number | null;

  // Tracking
  freshApplicationId?: number | null;
  renewalApplicationId?: number | null;
  cancelApplicationId?: number | null;
  lastModifiedAppType?: string | null;
  lastModifiedAppId?: number | null;
  previousModifiedAppType?: string | null;
  previousModifiedAppId?: number | null;
  lastModifiedRenewalId?: number | null;
  renewalIds?: number[];

  // Timestamps
  createdAt: string;
  updatedAt: string;

  // Relations
  sourceApplication?: any | null;
  issuedByUser?: { id: number; username: string } | null;
  endorsedWeapons?: Array<{ id: number; name: string; description?: string | null }>;
  workflowHistories?: LicenseWorkflowHistoryEntry[];
}

export interface LicenseListResponse {
  data: LicenseData[];
  total: number;
  page: number;
  limit: number;
}

export interface LicenseStatistics {
  active: number;
  expired: number;
  cancelled: number;
  suspended: number;
  revoked: number;
  total: number;
  expiringWithin30Days: number;
  expiringWithin60Days?: number;
  expiringWithin90Days?: number;
  renewed?: number;
}

export type { ApplicationData as Application };
