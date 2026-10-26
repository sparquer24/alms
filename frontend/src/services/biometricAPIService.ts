/**
 * Biometric API Service
 * Handles communication between frontend and NestJS backend for biometric operations
 */

import { postData, fetchData } from '../api/axiosConfig';

export interface BiometricTemplate {
    template: string; // Base64 or binary-safe template
    quality: number; // 0-100 quality score
    isoTemplate?: string; // Optional ISO template
    captureTime: string; // ISO timestamp
    bitmapData?: string; // Base64 fingerprint image for display
}

/**
 * Service for all biometric-related API calls to the backend
 */
export class BiometricAPIService {
    private static readonly BASE_PATH = '/biometric';


    /**
     * Get enrolled fingerprints for an applicant
     * @param applicantId - Application ID
     * @returns Promise with array of enrolled fingerprints
     */
    static async getEnrolledFingerprints(applicantId: string): Promise<any[]> {
        try {
            const response = await fetch(
                `/api${this.BASE_PATH}/enrolled/${encodeURIComponent(applicantId)}`
            );
            if (response.status === 404) return [];
            if (!response.ok) throw new Error('Failed to fetch enrolled fingerprints');
            const data = await response.json();
            return data.data || [];
        } catch {
            return [];
        }
    }

    /**
     * Get all stored templates for client-side matching using Mantra SDK
     * @param excludeApplicationId - Optional application ID to exclude (for re-enrollment)
     * @returns Promise with array of stored templates
     */
    static async getTemplatesForMatching(
        excludeApplicationId?: string
    ): Promise<{
        success: boolean;
        templates: Array<{
            applicationId: number;
            almsLicenseId?: string;
            applicantName?: string;
            fingerPosition: string;
            template: string;
            enrolledAt?: string;
        }>;
        message: string;
    }> {
        try {
            const params = excludeApplicationId
                ? { excludeApplicationId }
                : {};

            const response = await fetchData(`${this.BASE_PATH}/templates/for-matching`, params);

            return response || { success: false, templates: [], message: 'Failed to get templates' };
        } catch (error: any) {
            return {
                success: false,
                templates: [],
                message: error.message || 'Failed to get templates for matching',
            };
        }
    }

    /**
     * Store fingerprint directly (after client-side validation passes)
     * @param applicantId - Application ID
     * @param fingerPosition - Finger position
     * @param template - Biometric template
     * @param description - Optional description
     * @returns Promise with storage result
     */
    static async storeFingerprint(
        applicantId: string,
        fingerPosition: string,
        template: BiometricTemplate,
        description?: string
    ): Promise<{
        success: boolean;
        fingerprintId?: string;
        enrolledAt?: string;
        message: string;
    }> {
        try {
            const response = await postData(
                `${this.BASE_PATH}/store/${encodeURIComponent(applicantId)}`,
                {
                    fingerPosition,
                    fingerTemplate: template,
                    description: description || `Fingerprint - ${fingerPosition}`,
                }
            );

            return response || { success: false, message: 'Storage failed' };
        } catch (error: any) {
            return {
                success: false,
                message: error.message || 'Failed to store fingerprint',
            };
        }
    }
}

export default BiometricAPIService;
