/**
 * Arms License Management System (ALMS) API Endpoints
 * This file contains all API endpoints used in the application
 */

// Base API URL
export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Authentication APIs
export const AUTH_APIS = {
  LOGIN: `/auth/login`,
  GET_CURRENT_USER: `/auth/me`,
  CHANGE_PASSWORD: `/auth/change-password`,
  RESET_PASSWORD: `/auth/reset-password`,
  REFRESH_TOKEN: `/auth/refresh-token`,
};

// Application Management APIs
export const APPLICATION_APIS = {
  GET_ALL: `/applications`,
  GET_BY_ID: (id: string) => `/applications/${id}`,
  CREATE: `/applications`,
  UPDATE_STATUS: (id: string) => `/applications/${id}/status`,
  FORWARD: (id: string) => `/applications/${id}/forward`,
  BATCH_PROCESS: `/applications/batch`,
};

// Document Management APIs
export const DOCUMENT_APIS = {
  UPLOAD: (applicationId: string) => `/applications/${applicationId}/documents`,
  GET_ALL: (applicationId: string) => `/applications/${applicationId}/documents`,
  DELETE: (applicationId: string, documentId: string) =>
    `/applications/${applicationId}/documents/${documentId}`,
};

// Report APIs
export const REPORT_APIS = {
  STATISTICS: `/reports/statistics`,
  APPLICATIONS_BY_STATUS: `/reports/applications-by-status`,
  GENERATE_PDF: (applicationId: string) => `/applications/${applicationId}/pdf`,
};

// User Management APIs
export const USER_APIS = {
  GET_BY_ROLE: `/users`,
  GET_PREFERENCES: `/users/preferences`,
  UPDATE_PREFERENCES: `/users/preferences`,
};

// Notification APIs
export const NOTIFICATION_APIS = {
};

// Dashboard APIs
export const DASHBOARD_APIS = {
};

// Role-Based Action APIs
export const ROLE_APIS = {
  GET_AVAILABLE_ACTIONS: `/roles/actions`,
  GET_HIERARCHY: `/roles/hierarchy`,
};

// API Request Parameter Types
export type LoginParams = {
  username: string;
  password: string;
};

export type ApplicationQueryParams = {
  searchQuery?: string;
  startDate?: string;
  endDate?: string;
  statusIds?: string;
  page?: number;
  limit?: number;
  isSent?: boolean;
};

export type CreateApplicationParams = {
  applicantName: string;
  applicantMobile: string;
  applicantEmail: string;
  fatherName: string;
  gender: string;
  dob: string;
  address: string;
  applicationType: string;
  weaponType: string;
  weaponReason: string;
  licenseType: string;
  licenseValidity: string;
  isPreviouslyHeldLicense: boolean;
  previousLicenseNumber?: string;
  hasCriminalRecord: boolean;
  criminalRecordDetails?: string;
};

export type UpdateStatusParams = {
  status: 'approved' | 'rejected' | 'returned' | 'red-flagged' | 'disposed';
  comments: string;
  reason?: string; // Required for return, flag, or disposal
};

export type ForwardApplicationParams = {
  forwardTo: string; // User ID or role
  comments: string;
  recommendation?: 'recommend' | 'not-recommend' | 're-enquiry';
};

export type UploadDocumentParams = {
  document: File;
  documentType: string; // idProof, addressProof, photo, characterCertificate, etc.
};

export type ReportQueryParams = {
  startDate?: string;
  endDate?: string;
};

export type ApplicationsByStatusParams = {
  status: 'forwarded' | 'returned' | 'flagged' | 'disposed' | 'freshform' | 'sent' | 'final';
  page?: number;
  limit?: number;
};

export type UserQueryParams = {
  role?: 'SHO' | 'ACP' | 'DCP' | 'CP';
};

export type NotificationQueryParams = {
  read?: boolean;
  page?: number;
  pageSize?: number;
};

export type UserPreferencesParams = {
  notifications?: {
    emailNotifications?: boolean;
    applicationUpdates?: boolean;
    systemAlerts?: boolean;
  };
  display?: {
    darkMode?: boolean;
    compactView?: boolean;
    language?: string;
  };
};

export type BatchProcessParams = {
  actionType: 'forward' | 'approve' | 'reject' | 'return' | 'flag' | 'dispose';
  applicationIds: string[];
  details: {
    comments: string;
    forwardTo?: string; // Required for forward action
    reason?: string; // Required for reject, return, flag, dispose actions
    recommendation?: 'recommend' | 'not-recommend' | 're-enquiry'; // Optional for forward action
  };
};

/**
 * Generic API response type
 */
export interface ApiResponse<T> {
  data: boolean;
  statusCode: number;
  body?: any;
  success: boolean;
  message?: string;
  error?: any;
}

/**
 * Helper function to append query parameters to a URL
 */
export const appendQueryParams = (url: string, params: Record<string, any>): string => {
  const queryParams = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');

  return queryParams ? `${url}?${queryParams}` : url;
};

/**
 * Common headers for API requests
 */
export const getHeaders = (token?: string): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Multipart form headers for file uploads
 */
export const getMultipartHeaders = (token?: string): HeadersInit => {
  const headers: HeadersInit = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};
