// Common types used throughout the ALMS application

import { ReactNode } from "react";
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
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  username: string;
  password: string;
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
  status: ApplicationStatus;
  status_id: string | number; // Numeric status ID for backend compatibility
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

    state?: string | { id: number; name: string; [key: string]: any };

    district?: string | { id: number; name: string; [key: string]: any };

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

    state?: string | { id: number; name: string; [key: string]: any };

    district?: string | { id: number; name: string; [key: string]: any };

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
    name: string;
    type: string;
    url: string;
    uploadedAt?: string;
    size?: number;
  }>;
  // Optional resolved photo URL (may come from biometricData or fileUploads)
  photoUrl?: string;
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

export interface DocumentFile {
  id?: string;
  name: string;
  type: string;
  url: string;
  uploadedAt?: string;
  size?: number;
}

// Form Types
export interface FormData {
  [key: string]: string | number | boolean | File | undefined;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'file' | 'date' | 'checkbox';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: ValidationRule[];
}

export interface ValidationRule {
  type: 'required' | 'email' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: string | number;
  message: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// UI Component Types
export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

export interface TableColumn<T = any> {
  key: string;
  header: string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

// Role and Permission Types
export type UserRole =
  | 'ADMIN'
  | 'DCP'
  | 'ACP'
  | 'CP'
  | 'ARMS_SUPDT'
  | 'SHO'
  | 'ZS'
  | 'APPLICANT'
  | 'ADO'
  | 'CADO'
  | 'AS'
  | 'ARMS_SEAT'
  | 'JTCP';

export interface RoleConfig {
  permissions: string[];
  dashboardTitle: string;
  canAccessSettings: boolean;
  menuItems: MenuItem[];
}

export interface MenuItem {
  name: string;
  path?: string;
  icon?: React.ComponentType;
  children?: MenuItem[];
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
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

// Search and Filter Types
export interface SearchFilters {
  query?: string;
  status?: ApplicationStatus[];
  dateRange?: {
    start: string;
    end: string;
  };
  assignedTo?: string;
  licenseType?: string;
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Event Types
export interface FormEvent {
  target: {
    name: string;
    value: string | number | boolean;
  };
}

// Route Types
export interface RouteConfig {
  path: string;
  component: React.ComponentType;
  exact?: boolean;
  protected?: boolean;
  roles?: UserRole[];
  layout?: React.ComponentType;
}

// Loading States
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  data: any | null;
}

// Pagination Types
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// File Upload Types
export interface FileUploadConfig {
  maxSize: number; // in bytes
  allowedTypes: string[];
  multiple?: boolean;
  maxFiles?: number;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// WebSocket Types
export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: string;
  userId?: string;
}

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

// Export commonly used types
export type { User as CurrentUser };
export type { ApplicationData as Application };
export type { FormData as FormValues };