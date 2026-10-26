/**
 * Analytics Service - Handles all API calls for analytics data
 */

import { apiClient } from '../config/authenticatedApiClient';

export interface AnalyticsFilters {
    fromDate?: string;
    toDate?: string;
}

export interface ApplicationsData {
    week: string;
    count: number;
    date?: string;
    fresh?: number;
    renewal?: number;
    cancel?: number;
}

export interface StateData {
    state: string;
    count: number;
    fresh?: number;
    renewal?: number;
    cancel?: number;
}

export interface ApplicationRecord {
    applicationId: number;
    licenseId?: string | null;
    applicantName?: string | null;
    applicantType?: string | null;
    currentUser?: { id: number; name: string } | null;
    status: string;
    actionTakenAt?: string | null;
    daysTillToday?: number | null;
    applicationType?: 'FRESH' | 'RENEWAL' | 'CANCEL';
}

export interface ApplicationsDetailsMeta {
    total?: number;
    page?: number;
    limit?: number;
    pages?: number;
}

export interface ApplicationsDetailsResult {
    success?: boolean;
    data: ApplicationRecord[];
    meta?: ApplicationsDetailsMeta;
    message?: string;
}

export interface ApplicationDetailsOptions {
    status?: string;
    page?: number;
    limit?: number;
    q?: string;
    sort?: string;
    fromDate?: string;
    toDate?: string;
    /** Restrict to a single application family: fresh | renewal | cancel. Omit for all. */
    type?: string;
    /** Action Required card key: under_verification | pending_over_15 | awaiting_action | biometric_pending. */
    filter?: string;
}

export interface AnalyticsResponse<T> {
    data: T;
    success: boolean;
    message?: string;
}

class AnalyticsService {
    /**
     * Fetch applications data aggregated by week
     */
    async getApplicationsByWeek(filters?: AnalyticsFilters): Promise<ApplicationsData[]> {
        try {
            const params = new URLSearchParams();
            if (filters?.fromDate) params.append('fromDate', filters.fromDate);
            if (filters?.toDate) params.append('toDate', filters.toDate);

            const queryString = params.toString();
            const endpoint = `/admin/analytics/applications${queryString ? `?${queryString}` : ''}`;

            const response = await apiClient.get<AnalyticsResponse<ApplicationsData[]>>(endpoint);
            return response.data || [];
        } catch (error) {
            console.error('Error fetching applications by week:', error);
            return []; // Return empty array instead of throwing
        }
    }

    /**
     * Fetch application state distribution
     */
    async getApplicationStates(filters?: AnalyticsFilters): Promise<StateData[]> {
        try {
            const params = new URLSearchParams();
            if (filters?.fromDate) params.append('fromDate', filters.fromDate);
            if (filters?.toDate) params.append('toDate', filters.toDate);

            const queryString = params.toString();
            const endpoint = `/admin/analytics/states${queryString ? `?${queryString}` : ''}`;

            const response = await apiClient.get<AnalyticsResponse<StateData[]>>(endpoint);
            return response.data || [];
        } catch (error) {
            console.error('Error fetching application states:', error);
            return []; // Return empty array instead of throwing
        }
    }

    /**
     * Fetch applications list for admin analytics table
     */
    async getApplicationsDetails(options?: ApplicationDetailsOptions): Promise<ApplicationsDetailsResult> {
        try {
            const params = new URLSearchParams();

            if (options?.page) params.append('page', String(options.page));
            if (options?.limit) params.append('limit', String(options.limit));
            if (options?.status) params.append('status', options.status);
            if (options?.q) params.append('q', options.q);
            if (options?.sort) params.append('sort', options.sort);
            if (options?.fromDate) params.append('fromDate', options.fromDate);
            if (options?.toDate) params.append('toDate', options.toDate);
            if (options?.type) params.append('type', options.type);
            if (options?.filter) params.append('filter', options.filter);

            const queryString = params.toString();
            const endpoint = `/admin/analytics/applications/details${queryString ? `?${queryString}` : ''}`;

            const response = await apiClient.get<ApplicationsDetailsResult>(endpoint);
            
            return {
                success: response.success ?? true,
                data: response.data || [],
                meta: response.meta,
                message: response.message,
            };
        } catch (error) {
            console.error('Error fetching application details:', error);
            return {
                data: [],
                meta: {
                    total: 0,
                    page: options?.page,
                    limit: options?.limit,
                },
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Export analytics data to CSV
     */
    exportToCSV(data: any[], filename: string = 'analytics.csv'): void {
        if (!data || data.length === 0) {
            console.warn('No data to export');
            return;
        }

        // Get headers from first object
        const headers = Object.keys(data[0]);
        const csv = [
            headers.join(','),
            ...data.map((row) =>
                headers.map((header) => {
                    const value = row[header];
                    // Escape quotes and wrap in quotes if contains comma
                    if (typeof value === 'string' && value.includes(',')) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return value;
                }).join(',')
            ),
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // NEW: Dashboard enhancement endpoints
    // ─────────────────────────────────────────────────────────────────────────

    /** Application Funnel — counts per lifecycle stage */
    async getApplicationFunnel(): Promise<{ stage: string; code: string; count: number; order: number }[]> {
        try {
            const response = await apiClient.get<{ success: boolean; data: any[] }>('/admin/analytics/funnel');
            return response.data || [];
        } catch (error) {
            console.error('Error fetching application funnel:', error);
            return [];
        }
    }

    /** Application Aging — pending apps by bucket */
    async getAgingBuckets(): Promise<{ label: string; minDays: number; maxDays: number; count: number }[]> {
        try {
            const response = await apiClient.get<{ success: boolean; data: any[] }>('/admin/analytics/aging');
            return response.data || [];
        } catch (error) {
            console.error('Error fetching aging buckets:', error);
            return [];
        }
    }

    /** Action Required — 5 actionable counts */
    async getActionRequired(): Promise<{ key: string; label: string; count: number; severity: 'critical' | 'warning' | 'info' }[]> {
        try {
            const response = await apiClient.get<{ success: boolean; data: any[] }>('/admin/analytics/action-required');
            return response.data || [];
        } catch (error) {
            console.error('Error fetching action required:', error);
            return [];
        }
    }

    /** License Expiry Buckets — 30/60/90 days + expired */
    async getLicenseExpiryBuckets(): Promise<{ label: string; days: number; count: number }[]> {
        try {
            const response = await apiClient.get<{ success: boolean; data: any[] }>('/admin/analytics/license-expiry');
            return response.data || [];
        } catch (error) {
            console.error('Error fetching license expiry buckets:', error);
            return [];
        }
    }

    /** Monthly Comparison — this month vs last month */
    async getMonthlyComparison(): Promise<{
        thisMonth: { submitted: number; approved: number; rejected: number };
        lastMonth: { submitted: number; approved: number; rejected: number };
    }> {
        try {
            const response = await apiClient.get<{ success: boolean; data: any }>('/admin/analytics/monthly-comparison');
            return response.data || { thisMonth: { submitted: 0, approved: 0, rejected: 0 }, lastMonth: { submitted: 0, approved: 0, rejected: 0 } };
        } catch (error) {
            console.error('Error fetching monthly comparison:', error);
            return { thisMonth: { submitted: 0, approved: 0, rejected: 0 }, lastMonth: { submitted: 0, approved: 0, rejected: 0 } };
        }
    }

    /** Processing Performance — avg/median days, SLA %, delayed count */
    async getProcessingPerformance(): Promise<{
        avgDays: number;
        medianDays: number;
        slaPercent: number;
        delayedCount: number;
        totalProcessed: number;
    }> {
        try {
            const response = await apiClient.get<{ success: boolean; data: any }>('/admin/analytics/processing-performance');
            return response.data || { avgDays: 0, medianDays: 0, slaPercent: 0, delayedCount: 0, totalProcessed: 0 };
        } catch (error) {
            console.error('Error fetching processing performance:', error);
            return { avgDays: 0, medianDays: 0, slaPercent: 0, delayedCount: 0, totalProcessed: 0 };
        }
    }
}

export const analyticsService = new AnalyticsService();

