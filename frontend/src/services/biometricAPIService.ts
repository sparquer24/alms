/**
 * Biometric API Service
 * Handles communication between frontend and NestJS backend for biometric operations
 */

import { postData } from '../api/axiosConfig';

export interface BiometricTemplate {
    template: string; // Base64 or binary-safe template
    quality: number; // 0-100 quality score
    isoTemplate?: string; // Optional ISO template
    captureTime: string; // ISO timestamp
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
            return response.data || { isConnected: false, message: 'Device check failed' };
        } catch (error: any) {
            console.error('Failed to check biometric device status:', error);
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

            return response.data || { success: false, message: 'Enrollment failed' };
        } catch (error: any) {
            console.error('Fingerprint enrollment failed:', error);
            return {
                success: false,
                message: error.message || 'Fingerprint enrollment failed',
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

            return response.data || {
                success: false,
                isMatch: false,
                matchScore: 0,
                message: 'Verification failed',
            };
        } catch (error: any) {
            console.error('Fingerprint verification failed:', error);
            return {
                success: false,
                isMatch: false,
                matchScore: 0,
                message: error.message || 'Verification failed',
            };
        }
    }

    /**
     * Get enrolled fingerprints for an application
     * @param applicantId - Application ID
     * @returns Promise with list of enrolled fingerprints
     */
    static async getEnrolledFingerprints(applicantId: string): Promise<any[]> {
        try {
            const response = await fetch(`/api${this.BASE_PATH}/enrolled/${encodeURIComponent(applicantId)}`);
            if (!response.ok) throw new Error('Failed to fetch enrolled fingerprints');
            const data = await response.json();
            return data.data || [];
        } catch (error: any) {
            console.error('Failed to fetch enrolled fingerprints:', error);
            return [];
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
            console.error('Failed to delete fingerprint:', error);
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
            console.error('Failed to fetch audit logs:', error);
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
            console.warn('Mantra SDK service not available at localhost:8030');
            return false;
        }
    }
}

export default BiometricAPIService;
