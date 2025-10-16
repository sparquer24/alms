/**
 * Biometric API Type Definitions
 * Types for communication with Biometric Bridge Server
 */

export interface BiometricDeviceInfo {
    model: string;
    manufacturer: string;
    serialNumber: string;
    rdsVersion: string;
    rdsId?: string;
}

export interface BiometricTemplates {
    raw: string;
    sessionKey?: string;
    isoTemplate?: string | null;
}

export interface BiometricResponse {
    success: boolean;
    errorCode: number;
    errorMessage: string;
    qScore: number;
    type: 'fingerprint' | 'iris' | 'photograph';
    templates: BiometricTemplates | null;
    deviceInfo: BiometricDeviceInfo | null;
    timestamp: string;
    hmac?: string;
}

export interface BiometricCaptureOptions {
    timeout?: number;
}

export interface RDServiceStatus {
    connected: boolean;
    rdserviceUrl: string;
    response?: any;
    error?: string;
}

// Error codes from RDService
export enum BiometricErrorCode {
    SUCCESS = 0,
    DEVICE_NOT_READY = 100,
    DEVICE_NOT_FOUND = 110,
    DEVICE_BUSY = 111,
    CAPTURE_TIMEOUT = 120,
    POOR_QUALITY = 300,
    INVALID_PID_OPTIONS = 700,
    BRIDGE_ERROR = 999,
}

// Quality score thresholds
export const QUALITY_THRESHOLDS = {
    fingerprint: 60,
    iris: 70,
    photograph: 50,
} as const;

// Bridge API configuration
export const BRIDGE_CONFIG = {
    baseUrl: process.env.NEXT_PUBLIC_BRIDGE_URL || 'http://localhost:3030',
    endpoints: {
        health: '/health',
        rdserviceStatus: '/api/rdservice/status',
        captureFingerprint: '/api/captureFingerprint',
        captureIris: '/api/captureIris',
        capturePhotograph: '/api/capturePhotograph',
        deviceInfo: '/api/deviceInfo',
    },
    timeout: 20000, // 20 seconds
} as const;

export type BiometricType = 'fingerprint' | 'iris' | 'photograph';
