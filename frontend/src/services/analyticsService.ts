/**
 * Analytics Service - Handles all API calls for analytics data
 */

export interface AnalyticsFilters {
    fromDate?: string;
    toDate?: string;
}

export interface ApplicationsData {
    week: string;
    count: number;
    date?: string;
}

export interface RoleLoadData {
    name: string;
    value: number;
}

export interface StateData {
    state: string;
    count: number;
}

export interface AdminActivity {
    id: number;
    user: string;
    action: string;
    time: string;
    timestamp?: number;
    almsLicenseId?: string;
    applicantName?: string;
}

export interface AnalyticsResponse<T> {
    data: T;
    success: boolean;
    message?: string;
}

class AnalyticsService {
    private baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

    /**
     * Fetch applications data aggregated by week
     */
    async getApplicationsByWeek(filters?: AnalyticsFilters): Promise<ApplicationsData[]> {
        try {
            const params = new URLSearchParams();
            if (filters?.fromDate) params.append('fromDate', filters.fromDate);
            if (filters?.toDate) params.append('toDate', filters.toDate);

            const url = `${this.baseURL}/admin/analytics/applications?${params.toString()}`;
            const response = await fetch(url);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                throw new Error(`Failed to fetch applications data: ${response.status}`);
            }

            const text = await response.text();

            if (!text) {
                console.warn('Empty response from applications endpoint');
                return [];
            }

            const result: AnalyticsResponse<ApplicationsData[]> = JSON.parse(text);
            return result.data || [];
        } catch (error) {
            console.error('Error fetching applications by week:', error);
            return []; // Return empty array instead of throwing
        }
    }

    /**
     * Fetch role-wise application load
     */
    async getRoleLoad(filters?: AnalyticsFilters): Promise<RoleLoadData[]> {
        try {
            const params = new URLSearchParams();
            if (filters?.fromDate) params.append('fromDate', filters.fromDate);
            if (filters?.toDate) params.append('toDate', filters.toDate);

            const url = `${this.baseURL}/admin/analytics/role-load?${params.toString()}`;

            const response = await fetch(url);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                throw new Error(`Failed to fetch role load data: ${response.status}`);
            }

            const text = await response.text();
            if (!text) {
                console.warn('Empty response from role-load endpoint');
                return [];
            }

            const result: AnalyticsResponse<RoleLoadData[]> = JSON.parse(text);
            return result.data || [];
        } catch (error) {
            console.error('Error fetching role load:', error);
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

            const url = `${this.baseURL}/admin/analytics/states?${params.toString()}`;
            const response = await fetch(url);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                throw new Error(`Failed to fetch states data: ${response.status}`);
            }

            const text = await response.text();
            if (!text) {
                console.warn('Empty response from states endpoint');
                return [];
            }

            const result: AnalyticsResponse<StateData[]> = JSON.parse(text);
            return result.data || [];
        } catch (error) {
            console.error('Error fetching application states:', error);
            return []; // Return empty array instead of throwing
        }
    }

    /**
     * Fetch admin activity feed
     */
    async getAdminActivities(filters?: AnalyticsFilters): Promise<AdminActivity[]> {
        try {
            const params = new URLSearchParams();
            if (filters?.fromDate) params.append('fromDate', filters.fromDate);
            if (filters?.toDate) params.append('toDate', filters.toDate);

            const url = `${this.baseURL}/admin/analytics/admin-activities?${params.toString()}`;
            const response = await fetch(url);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                throw new Error(`Failed to fetch admin activities: ${response.status}`);
            }

            const text = await response.text();
            if (!text) {
                console.warn('Empty response from admin-activities endpoint');
                return [];
            }

            const result: AnalyticsResponse<AdminActivity[]> = JSON.parse(text);
            return result.data || [];
        } catch (error) {
            console.error('Error fetching admin activities:', error);
            return []; // Return empty array instead of throwing
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

    /**
     * Export analytics data to Excel (XLSX format)
     * Note: This requires a library like 'xlsx' to be installed
     */
    async exportToExcel(data: any[], filename: string = 'analytics.xlsx'): Promise<void> {
        try {
            // Dynamic import to avoid bundle bloat if not used
            const XLSX = await import('xlsx');

            if (!data || data.length === 0) {
                console.warn('No data to export');
                return;
            }

            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Analytics');

            // Auto-size columns
            const maxWidth = 20;
            const wscols = Object.keys(data[0]).map(() => ({ wch: maxWidth }));
            worksheet['!cols'] = wscols;

            XLSX.writeFile(workbook, filename);
        } catch (error) {
            console.error('Error exporting to Excel. Make sure xlsx package is installed:', error);
            throw error;
        }
    }
}

export const analyticsService = new AnalyticsService();
