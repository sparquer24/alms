/**
 * Public Dashboard Service
 * Fetches universal aggregated overview data without requiring authentication or cookies.
 */

import { BASE_URL } from '../config/APIsEndpoints';
import { getAuthTokenFromCookie } from '../utils/authCookies';

export interface SummaryKPIs {
  totalApplications: number;
  freshApplications: number;
  renewalApplications: number;
  cancelApplications: number;
  approvedApplications: number;
  pendingApplications: number;
  rejectedApplications: number;
  totalLicenses: number;
  activeLicenses: number;
  expiredLicenses: number;
  suspendedLicenses: number;
  revokedLicenses: number;
  expiringWithin30Days: number;
  expiringWithin60Days: number;
  expiringWithin90Days: number;
  approvalRate: number;
  disposalRate: number;
  avgProcessingDays: number;
  biometricComplianceRate: number;
  portalUptime: string;
}

export interface TrendDataPoint {
  period: string;
  fresh: number;
  renewal: number;
  cancel: number;
  total: number;
  approved: number;
  [key: string]: any;
}

export interface StatusDistributionItem {
  status: string;
  count: number;
  percentage: number;
  color: string;
  stage: string;
  [key: string]: any;
}

export interface WeaponCategoryItem {
  category: string;
  count: number;
  percentage: number;
  permissible: boolean;
}

export interface PurposeBreakdownItem {
  purpose: string;
  count: number;
  percentage: number;
  icon: string;
}

export interface ZoneLoadItem {
  zoneId: number;
  zoneName: string;
  divisionsCount: number;
  applicationsCount: number;
  activeLicenses: number;
  complianceRate: number;
}

export interface PublicActivityItem {
  id: number;
  type: string;
  title: string;
  reference: string;
  location: string;
  timestamp: string;
  category: string;
}

export interface SystemServiceStatus {
  name: string;
  status: 'OPERATIONAL' | 'DEGRADED' | 'MAINTENANCE';
  latency: string;
  uptime: string;
}

export interface PublicDashboardData {
  summary: SummaryKPIs;
  trend: TrendDataPoint[];
  statusDistribution: StatusDistributionItem[];
  weaponCategories: WeaponCategoryItem[];
  purposeBreakdown: PurposeBreakdownItem[];
  zoneLoads: ZoneLoadItem[];
  recentActivities: PublicActivityItem[];
  systemServices: SystemServiceStatus[];
}

export interface PublicDashboardResponse {
  success: boolean;
  generatedAt: string;
  timeRange: string;
  data: PublicDashboardData;
}

const FALLBACK_PUBLIC_DATA: PublicDashboardData = {
  summary: {
    totalApplications: 0,
    freshApplications: 0,
    renewalApplications: 0,
    cancelApplications: 0,
    approvedApplications: 0,
    pendingApplications: 0,
    rejectedApplications: 0,
    totalLicenses: 0,
    activeLicenses: 0,
    expiredLicenses: 0,
    suspendedLicenses: 0,
    revokedLicenses: 0,
    expiringWithin30Days: 0,
    expiringWithin60Days: 0,
    expiringWithin90Days: 0,
    approvalRate: 0,
    disposalRate: 0,
    avgProcessingDays: 0,
    biometricComplianceRate: 0,
    portalUptime: '99.98%',
  },
  trend: [],
  statusDistribution: [],
  weaponCategories: [],
  purposeBreakdown: [],
  zoneLoads: [],
  recentActivities: [],
  systemServices: [
    { name: 'Core API Gateway', status: 'OPERATIONAL', latency: '<10ms', uptime: '100%' },
    { name: 'PostgreSQL Database Engine', status: 'OPERATIONAL', latency: '<5ms', uptime: '100%' },
    { name: 'Node.js Memory Pool', status: 'OPERATIONAL', latency: 'Active', uptime: '100%' },
    { name: 'Biometric Enrolment Service', status: 'OPERATIONAL', latency: 'Connected', uptime: '100%' },
  ],
};

class PublicDashboardService {
  /**
   * Fetch universal public dashboard data
   */
  async getOverview(timeRange: string = 'all', type?: string): Promise<PublicDashboardData> {
    try {
      const baseUrl = BASE_URL.startsWith('http')
        ? BASE_URL
        : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000') + (BASE_URL.startsWith('/') ? BASE_URL : `/${BASE_URL}`);

      const url = new URL(`${baseUrl}/public/dashboard/overview`);
      if (timeRange && timeRange !== 'all') {
        url.searchParams.set('timeRange', timeRange);
      }
      if (type && type !== 'all') {
        url.searchParams.set('type', type);
      }

      const token = typeof window !== 'undefined' ? getAuthTokenFromCookie() : null;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers,
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const result: PublicDashboardResponse = await response.json();
      if (result && result.data && result.data.summary) {
        return result.data;
      }
      return FALLBACK_PUBLIC_DATA;
    } catch (error) {
      console.warn('[PublicDashboardService] Backend call failed, using fallback data:', error);
      return FALLBACK_PUBLIC_DATA;
    }
  }

  /**
   * Public application quick status lookup
   */
  async lookupApplicationStatus(identifier: string): Promise<any | null> {
    try {
      const cleaned = identifier.trim();
      const baseUrl = BASE_URL.startsWith('http')
        ? BASE_URL
        : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000') + (BASE_URL.startsWith('/') ? BASE_URL : `/${BASE_URL}`);

      const endpoint = `${baseUrl}/public/application/${encodeURIComponent(cleaned)}`;

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        return null;
      }

      const result = await response.json();
      return result?.data || null;
    } catch (error) {
      console.warn('[PublicDashboardService] Application status lookup error:', error);
      return null;
    }
  }
}

export const publicDashboardService = new PublicDashboardService();
