/**
 * License API Service
 * Service for interacting with the Licenses API endpoints
 *
 * NOTE: apiClient.get<T>(url, params) returns the response directly (not wrapped in { data }).
 * The response shape is typically { success: boolean, data: T } or the raw T.
 */
import { apiClient } from '../config/authenticatedApiClient';
import { LicenseData, LicenseListResponse, LicenseStatistics } from '../types';

export class LicenseService {
  /**
   * Get a license by its ID with full details (source app, weapons, history)
   */
  static async getLicenseById(id: number): Promise<LicenseData | null> {
    try {
      const response = await apiClient.get<LicenseData>(`/licenses/${id}`);
      return (response as any)?.data ?? response ?? null;
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
      if (filters?.sortBy) params.sortBy = filters.sortBy;
      if (filters?.sortOrder) params.sortOrder = filters.sortOrder;

      const response = await apiClient.get<any>('/licenses', params);
      // Response may be { success, data } or the paginated result directly
      return (response as any)?.data ?? response ?? null;
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
      return (response as any)?.data ?? response ?? null;
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
      const data: any = (response as any)?.data ?? response ?? [];
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
      const data: any = (response as any)?.data ?? response ?? [];
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
      return (response as any)?.data ?? response ?? null;
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
      return (response as any)?.data ?? response ?? null;
    } catch (error) {
      console.error('[LicenseService] getLicenseStatistics error:', error);
      return null;
    }
  }

  /**
   * Generate a license PDF for a given source application
   * POST /licenses/generate/:sourceApplicationId with { issuedBy } in the body
   */
  static async generateLicensePdf(sourceApplicationId: number, issuedBy: number): Promise<any> {
    try {
      const response = await apiClient.post(`/licenses/generate/${sourceApplicationId}`, { issuedBy });
      return (response as any)?.data ?? response ?? null;
    } catch (error) {
      console.error('[LicenseService] generateLicensePdf error:', error);
      throw error;
    }
  }
}

export default LicenseService;
