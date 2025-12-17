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

export interface BiometricEnrollmentRequest {
    fingerPosition: string; // e.g., 'RIGHT_THUMB', 'LEFT_INDEX', etc.
    template: BiometricTemplate;
    description?: string;
}

export interface BiometricVerificationRequest {
    template: BiometricTemplate;
    matchThreshold?: number; // Default 65
}

export interface BiometricVerificationResponse {
    success: boolean;
    isMatch: boolean;
    matchScore: number;
    matchedFingerPosition?: string;
    message: string;
}

export interface BiometricStorageResponse {
    success: boolean;
    fingerprintId?: string;
    message: string;
    enrolledAt?: string;
    exists?: boolean;
    existingApplication?: {
        applicationId: number;
        almsLicenseId?: string;
        applicantName?: string;
        fingerPosition?: string;
        enrolledAt?: string;
    };
}

/**
 * Response for fingerprint validation (also includes storage result if unique)
 */
export interface FingerprintValidationResponse {
    success: boolean;
    exists: boolean;
    message: string;
    fingerprintId?: string; // Returned when fingerprint is stored
    enrolledAt?: string; // Returned when fingerprint is stored
    existingApplication?: {
        applicationId: number;
        almsLicenseId?: string;
        applicantName?: string;
        fingerPosition?: string;
        enrolledAt?: string;
    };
}

/**
 * Service for all biometric-related API calls to the backend
 */
export class BiometricAPIService {
    private static readonly BASE_PATH = '/biometric';

    /**
     * Check device connectivity status via backend validation
     * @param applicantId - Application ID
     * @returns Promise with device status
     */
    static async checkDeviceStatus(applicantId: string): Promise<{
        isConnected: boolean;
        message: string;
    }> {
        try {
            const response = await postData(`${this.BASE_PATH}/device/status`, {
                applicantId,
            });
            // postData already returns response.data
            return response || { isConnected: false, message: 'Device check failed' };
        } catch (error: any) {
            return { isConnected: false, message: error.message };
        }
    }


    /**
     * Enroll fingerprint for an application
     * @param applicantId - Application ID
     * @param fingerPosition - Finger position (e.g., 'RIGHT_THUMB')
     * @param template - Biometric template from Mantra SDK
     * @param description - Optional description
     * @returns Promise<BiometricStorageResponse>
     */
    static async enrollFingerprint(
        applicantId: string,
        fingerPosition: string,
        template: BiometricTemplate,
        description?: string
    ): Promise<BiometricStorageResponse> {
        try {
            const payload: BiometricEnrollmentRequest = {
                fingerPosition,
                template,
                description: description || `Fingerprint enrollment - ${fingerPosition}`,
            };

            const response = await postData(
                `${this.BASE_PATH}/enroll/${encodeURIComponent(applicantId)}`,
                payload
            );

            // postData already returns response.data
            return response || { success: false, message: 'Enrollment failed' };
        } catch (error: any) {
            // Handle conflict response (duplicate fingerprint detected)
            if (error.response?.status === 409 && error.response?.data) {
                return {
                    success: false,
                    exists: error.response.data.exists,
                    existingApplication: error.response.data.existingApplication,
                    message: error.response.data.message || 'Duplicate fingerprint detected',
                };
            }

            return {
                success: false,
                message: error.response?.data?.message || error.message || 'Fingerprint enrollment failed',
            };
        }
    }

    /**
     * Verify fingerprint against stored templates
     * @param applicantId - Application ID
     * @param template - Biometric template from Mantra SDK
     * @param matchThreshold - Match threshold (default 65)
     * @returns Promise<BiometricVerificationResponse>
     */
    static async verifyFingerprint(
        applicantId: string,
        template: BiometricTemplate,
        matchThreshold: number = 65
    ): Promise<BiometricVerificationResponse> {
        try {
            const payload: BiometricVerificationRequest = {
                template,
                matchThreshold,
            };

            const response = await postData(
                `${this.BASE_PATH}/verify/${encodeURIComponent(applicantId)}`,
                payload
            );

            // postData already returns response.data
            return response || {
                success: false,
                isMatch: false,
                matchScore: 0,
                message: 'Verification failed',
            };
        } catch (error: any) {
            return {
                success: false,
                isMatch: false,
                matchScore: 0,
                message: error.message || 'Verification failed',
            };
        }
    }

    /**
     * Delete enrolled fingerprint
     * @param applicantId - Application ID
     * @param fingerprintId - Fingerprint ID to delete
     * @returns Promise<{success: boolean; message: string}>
     */
    static async deleteEnrolledFingerprint(
        applicantId: string,
        fingerprintId: string
    ): Promise<{ success: boolean; message: string }> {
        try {
            const response = await fetch(
                `/api${this.BASE_PATH}/${encodeURIComponent(applicantId)}/${encodeURIComponent(fingerprintId)}`,
                { method: 'DELETE' }
            );
            if (!response.ok) throw new Error('Failed to delete fingerprint');
            const data = await response.json();
            return data || { success: false, message: 'Delete failed' };
        } catch (error: any) {
            return { success: false, message: error.message };
        }
    }

    /**
     * Get biometric audit logs for an application
     * @param applicantId - Application ID
     * @param limit - Number of logs to retrieve
     * @param offset - Offset for pagination
     * @returns Promise with audit logs
     */
    static async getBiometricAuditLogs(
        applicantId: string,
        limit: number = 50,
        offset: number = 0
    ): Promise<any[]> {
        try {
            const response = await fetch(
                `/api${this.BASE_PATH}/audit-logs/${encodeURIComponent(applicantId)}?limit=${limit}&offset=${offset}`
            );
            if (!response.ok) throw new Error('Failed to fetch audit logs');
            const data = await response.json();
            return data.data || [];
        } catch (error: any) {
            return [];
        }
    }

    /**
     * Check if biometric device is available on the local system
     * This is a frontend-only check (no backend call)
     * @returns Promise<boolean>
     */
    static async isDeviceAvailable(): Promise<boolean> {
        try {
            // Try to reach the Mantra local SDK server
            const response = await fetch('http://localhost:8030/api/device/status', {
                method: 'GET',
            });
            return response.ok;
        } catch (error) {
            return false;
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
