/**
 * Arms License Management System (ALMS) API Endpoints
 * This file contains all API endpoints used in the application
 */

// Base API URL
// Normalize and trim trailing slash so constructed endpoints are consistent
export const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '');

// Authentication APIs
export const AUTH_APIS = {
  LOGIN: `/auth/login`,
  GET_CURRENT_USER: `/auth/me`,
  CHANGE_PASSWORD: `/auth/change-password`,
  RESET_PASSWORD: `/auth/reset-password`,
  REFRESH_TOKEN: `/auth/refresh-token`,
};

// Notification APIs
export const NOTIFICATION_APIS = {
  LIST: `/notifications`,
  UNREAD_COUNT: `/notifications/unread-count`,
  MARK_READ: (id: string | number) => `/notifications/${encodeURIComponent(String(id))}/read`,
  MARK_ALL_READ: `/notifications/read-all`,
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

export type NotificationQueryParams = {
  read?: boolean;
  page?: number;
  pageSize?: number;
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

