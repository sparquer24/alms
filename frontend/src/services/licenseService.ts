/**
 * License API Service
 * Service for interacting with the Licenses API endpoints
 *
 * NOTE: apiClient.get<T>(url, params) returns the response directly (not wrapped in { data }).
 * The response shape is typically { success: boolean, data: T } or the raw T.
 */
import { apiClient } from '../config/authenticatedApiClient';
import { LicenseData, LicenseListResponse, LicenseStatistics } from '../types';

const normalizeLicenseListResponse = (response: any): LicenseListResponse => {
  const root = response?.body ?? response;
  const payload = root?.success && root?.data ? root.data : root;

  if (Array.isArray(payload)) {
    return {
      data: payload,
      total: payload.length,
      page: 1,
      limit: payload.length,
    };
  }

  const data = Array.isArray(payload?.data) ? payload.data : [];
  return {
    data,
    total: Number(payload?.total ?? data.length),
    page: Number(payload?.page ?? 1),
    limit: Number(payload?.limit ?? data.length),
  };
};

const unwrapEntityResponse = <T>(response: any): T | null => {
  if (!response) return null;
  if (response?.success && response?.data !== undefined) return response.data as T;
  return (response?.body ?? response) as T;
};

export class LicenseService {
  /**
   * Get a license by its ID with full details (source app, weapons, history)
   */
  static async getLicenseById(id: number): Promise<LicenseData | null> {
    try {
      const response = await apiClient.get<LicenseData>(`/licenses/${id}`);
      return unwrapEntityResponse<LicenseData>(response);
    } catch (error) {
      console.error('[LicenseService] getLicenseById error:', error);
      return null;
    }
  }

  /**
   * List/search licenses with pagination and filters
   */
  static async getAllLicenses(filters?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    licenseNumber?: string;
    aadharNumber?: string;
    sourceApplicationId?: number;
    expiringWithinDays?: number;
    createdFrom?: string;
    orderBy?: string;
    order?: 'asc' | 'desc';
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<LicenseListResponse | null> {
    try {
      const params: Record<string, any> = {};
      if (filters?.page) params.page = filters.page;
      if (filters?.limit) params.limit = filters.limit;
      if (filters?.search) params.search = filters.search;
      if (filters?.status) params.status = filters.status;
      if (filters?.licenseNumber) params.licenseNumber = filters.licenseNumber;
      if (filters?.aadharNumber) params.aadharNumber = filters.aadharNumber;
      if (filters?.sourceApplicationId) params.sourceApplicationId = filters.sourceApplicationId;
      if (filters?.expiringWithinDays) params.expiringWithinDays = filters.expiringWithinDays;
      if (filters?.createdFrom) params.createdFrom = filters.createdFrom;
      const orderBy = filters?.orderBy ?? filters?.sortBy;
      const order = filters?.order ?? filters?.sortOrder;
      if (orderBy) params.orderBy = orderBy;
      if (order) params.order = order;

      const response = await apiClient.get<any>('/licenses', params);
      return normalizeLicenseListResponse(response);
    } catch (error) {
      console.error('[LicenseService] getAllLicenses error:', error);
      return null;
    }
  }

  /**
   * Find a license by its unique license number
   */
  static async getLicenseByNumber(licenseNumber: string): Promise<LicenseData | null> {
    try {
      const response = await apiClient.get<LicenseData>(`/licenses/by-number/${encodeURIComponent(licenseNumber)}`);
      return unwrapEntityResponse<LicenseData>(response);
    } catch (error) {
      console.error('[LicenseService] getLicenseByNumber error:', error);
      return null;
    }
  }

  /**
   * Find all licenses for a given aadhar number
   */
  static async getLicenseByAadhar(aadharNumber: string): Promise<LicenseData[]> {
    try {
      const response = await apiClient.get<LicenseData[]>(`/licenses/by-aadhar/${encodeURIComponent(aadharNumber)}`);
      const data: any = (response as any)?.success ? (response as any).data : response ?? [];
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('[LicenseService] getLicenseByAadhar error:', error);
      return [];
    }
  }

  /**
   * Get workflow history for a license
   */
  static async getLicenseHistory(licenseId: number): Promise<any[]> {
    try {
      const response = await apiClient.get<any[]>(`/licenses/${licenseId}/history`);
      const data: any = (response as any)?.success ? (response as any).data : response ?? [];
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('[LicenseService] getLicenseHistory error:', error);
      return [];
    }
  }

  /**
   * Get the source application that created this license
   */
  static async getLicenseSourceApplication(licenseId: number): Promise<any | null> {
    try {
      const response = await apiClient.get<any>(`/licenses/${licenseId}/source-application`);
      return unwrapEntityResponse<any>(response);
    } catch (error) {
      console.error('[LicenseService] getLicenseSourceApplication error:', error);
      return null;
    }
  }

  /**
   * Get license statistics (counts by status, expiring soon)
   */
  static async getLicenseStatistics(): Promise<LicenseStatistics | null> {
    try {
      const response = await apiClient.get<LicenseStatistics>('/licenses/stats/overview');
      return unwrapEntityResponse<LicenseStatistics>(response);
    } catch (error) {
      console.error('[LicenseService] getLicenseStatistics error:', error);
      return null;
    }
  }

  static async getLicenseDashboard(): Promise<LicenseStatistics | null> {
    try {
      const response = await apiClient.get<LicenseStatistics>('/licenses/dashboard');
      return unwrapEntityResponse<LicenseStatistics>(response);
    } catch (error) {
      console.error('[LicenseService] getLicenseDashboard error:', error);
      return null;
    }
  }

  static async getExpiringLicenses(days = 90, filters?: { page?: number; limit?: number; search?: string }): Promise<LicenseListResponse | null> {
    try {
      const response = await apiClient.get<LicenseListResponse>('/licenses/expiring', {
        days,
        page: filters?.page ?? 1,
        limit: filters?.limit ?? 10,
        ...(filters?.search ? { search: filters.search } : {}),
      });
      return normalizeLicenseListResponse(response);
    } catch (error) {
      console.error('[LicenseService] getExpiringLicenses error:', error);
      return null;
    }
  }

  static async getExpiredLicenses(filters?: { page?: number; limit?: number; search?: string }): Promise<LicenseListResponse | null> {
    try {
      const response = await apiClient.get<LicenseListResponse>('/licenses/expired', {
        page: filters?.page ?? 1,
        limit: filters?.limit ?? 10,
        ...(filters?.search ? { search: filters.search } : {}),
      });
      return normalizeLicenseListResponse(response);
    } catch (error) {
      console.error('[LicenseService] getExpiredLicenses error:', error);
      return null;
    }
  }

  static async getLicenseAudit(licenseId: number): Promise<any[]> {
    try {
      const response = await apiClient.get<any[]>(`/licenses/${licenseId}/audit`);
      const data: any = (response as any)?.success ? (response as any).data : response ?? [];
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('[LicenseService] getLicenseAudit error:', error);
      return [];
    }
  }

  /**
   * Generate a license PDF for a given source application
   * POST /licenses/generate/:sourceApplicationId with { issuedBy } in the body
   */
  static async generateLicensePdf(sourceApplicationId: number, issuedBy: number): Promise<any> {
    try {
      const response = await apiClient.post(`/licenses/generate/${sourceApplicationId}`, { issuedBy });
      return unwrapEntityResponse<any>(response);
    } catch (error) {
      console.error('[LicenseService] generateLicensePdf error:', error);
      throw error;
    }
  }
}

export default LicenseService;
