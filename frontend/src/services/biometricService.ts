/**
 * Biometric Bridge API Service
 * Handles communication with local biometric bridge server
 */

import {
    BiometricResponse,
    BiometricCaptureOptions,
    RDServiceStatus,
    BRIDGE_CONFIG,
    BiometricType,
    QUALITY_THRESHOLDS,
} from '@/types/biometric';

class BiometricService {
    private baseUrl: string;

    constructor() {
        this.baseUrl = BRIDGE_CONFIG.baseUrl;
    }

    /**
     * Check if bridge server is running
     */
    async checkHealth(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}${BRIDGE_CONFIG.endpoints.health}`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000),
            });
            return response.ok;
        } catch (error) {
            console.error('Bridge health check failed:', error);
            return false;
        }
    }

    /**
     * Get detailed health information including device connectivity
     */
    async getDetailedHealth(): Promise<any> {
        try {
            const response = await fetch(`${this.baseUrl}${BRIDGE_CONFIG.endpoints.health}`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000),
            });

            if (!response.ok) {
                throw new Error('Failed to get health information');
            }

            return await response.json();
        } catch (error) {
            console.error('Failed to get detailed health:', error);
            return {
                status: 'error',
                service: 'biometric-bridge',
                rdservice: { connected: false },
                devices: {
                    fingerprint: { available: false, status: 'bridge-offline' },
                    iris: { available: false, status: 'bridge-offline' },
                    photograph: { available: false, status: 'bridge-offline' }
                }
            };
        }
    }

    /**
     * Check RDService connectivity status
     */
    async checkRDServiceStatus(): Promise<RDServiceStatus> {
        try {
            const response = await fetch(`${this.baseUrl}${BRIDGE_CONFIG.endpoints.rdserviceStatus}`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000),
            });

            if (!response.ok) {
                throw new Error('Failed to check RDService status');
            }

            return await response.json();
        } catch (error) {
            return {
                connected: false,
                rdserviceUrl: 'http://127.0.0.1:11100',
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Generic capture method
     */
    private async capture(
        type: BiometricType,
        options: BiometricCaptureOptions = {}
    ): Promise<BiometricResponse> {
        const endpoint =
            type === 'fingerprint'
                ? BRIDGE_CONFIG.endpoints.captureFingerprint
                : type === 'iris'
                    ? BRIDGE_CONFIG.endpoints.captureIris
                    : BRIDGE_CONFIG.endpoints.capturePhotograph;

        const timeout = options.timeout || BRIDGE_CONFIG.timeout;

        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'OPTIONS',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: AbortSignal.timeout(timeout),
            });

            if (!response.ok) {
                throw new Error(`Bridge request failed: ${response.statusText}`);
            }

            const data: BiometricResponse = await response.json();
            return data;
        } catch (error) {
            console.error(`${type} capture error:`, error);

            // Return error response in expected format
            return {
                success: false,
                errorCode: 999,
                errorMessage: error instanceof Error ? error.message : 'Unknown error occurred',
                qScore: 0,
                type,
                templates: null,
                deviceInfo: null,
                timestamp: new Date().toISOString(),
            };
        }
    }

    /**
     * Capture fingerprint/thumb impression
     */
    async captureFingerprint(options?: BiometricCaptureOptions): Promise<BiometricResponse> {
        return this.capture('fingerprint', options);
    }

    /**
     * Capture iris scan
     */
    async captureIris(options?: BiometricCaptureOptions): Promise<BiometricResponse> {
        return this.capture('iris', options);
    }

    /**
     * Capture photograph
     */
    async capturePhotograph(options?: BiometricCaptureOptions): Promise<BiometricResponse> {
        return this.capture('photograph', options);
    }

    /**
     * Validate biometric quality score
     */
    validateQuality(response: BiometricResponse): { valid: boolean; message: string } {
        if (!response.success) {
            return {
                valid: false,
                message: `Capture failed: ${response.errorMessage}`,
            };
        }

        const threshold = QUALITY_THRESHOLDS[response.type];

        if (response.qScore < threshold) {
            return {
                valid: false,
                message: `Quality too low: ${response.qScore}% (minimum: ${threshold}%). Please try again.`,
            };
        }

        return {
            valid: true,
            message: `Quality acceptable: ${response.qScore}%`,
        };
    }

    /**
     * Get device information
     */
    async getDeviceInfo(): Promise<any> {
        try {
            const response = await fetch(`${this.baseUrl}${BRIDGE_CONFIG.endpoints.deviceInfo}`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000),
            });

            if (!response.ok) {
                throw new Error('Failed to get device info');
            }

            return await response.json();
        } catch (error) {
            console.error('Get device info error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
}

// Export singleton instance
export const biometricService = new BiometricService();

// Export class for testing/alternative usage
export default BiometricService;
