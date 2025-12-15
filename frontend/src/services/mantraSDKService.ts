/**
 * Mantra SDK Service - Frontend Integration
 * Provides client-side interface to Mantra MFS 500 fingerprint device
 * 
 * ARCHITECTURE:
 * - Runs only on client (no SSR)
 * - Makes direct fetch calls to Mantra Local SDK Server (localhost:8030/morfinauth/)
 * - Returns biometric templates to be sent to backend for storage/verification
 * - No raw fingerprint data is stored in browser
 */

import { Console } from "console";

export interface MantraDeviceStatus {
    isConnected: boolean;
    deviceName?: string;
    serialNumber?: string;
    quality?: number;
    errorCode?: number;
    errorMessage?: string;
}

export interface MantraFingerprintResult {
    success: boolean;
    template: string; // Base64 or binary-safe template string
    quality: number; // 0-100 fingerprint quality score
    isoTemplate?: string; // ISO standardized template (optional)
    bitmapData?: string; // Bitmap image data from capture (optional)
    nfiq?: number; // NFIQ quality score from device (optional)
    errorCode?: number;
    errorMessage?: string;
    captureTime?: string; // ISO timestamp when captured
}

export interface MantraDeviceInfo {
    deviceName: string;
    serialNumber: string;
    vendorName: string;
    firmwareVersion?: string;
    modelName?: string;
}

/**
 * Service wrapper for Mantra Local SDK Server
 * Makes direct REST API calls to localhost:8030/morfinauth/* endpoints
 */
export class MantraSDKService {
    private static sdkReady = false;
    private static readonly MANTRA_SERVICE_URL = 'http://localhost:8030/morfinauth';
    /**
     * Initialize the Mantra SDK
     * Just verifies that the service is reachable and device is initialized
     * @returns Promise<boolean> - true if service is reachable and device initialized
     */
    static async initialize(): Promise<boolean> {
        if (typeof window === 'undefined') {
            console.warn('[MantraSDK] Cannot initialize SDK on server-side');
            return false;
        }

        try {
            // If already initialized, return true
            if (this.sdkReady) {
                return true;
            }

            // First, check device connectivity
            const deviceStatus = await this.isDeviceConnected();
            if (!deviceStatus.isConnected) {
                console.error('[MantraSDK] Device not connected');
                return false;
            }

            // Then verify device info and initialization
            const deviceInfo = await this.getDeviceInfo();
            if (!deviceInfo) {
                console.error('[MantraSDK] Failed to get device information');
                return false;
            }

            this.sdkReady = true;
            console.log('[MantraSDK] Initialized successfully - Device is ready');
            return true;
        } catch (error: any) {
            console.error('[MantraSDK] Initialization failed:', error.message);
            return false;
        }
    }

    /**
     * Check if SDK is initialized and available
     */
    static isAvailable(): boolean {
        return this.sdkReady && typeof window !== 'undefined';
    }

    /**
     * Check fingerprint device connectivity
     * @returns Promise<MantraDeviceStatus>
     */
    static async isDeviceConnected(): Promise<MantraDeviceStatus> {
        if (typeof window === 'undefined') {
            return {
                isConnected: false,
                errorMessage: 'Running on server-side',
                errorCode: -1,
            };
        }

        try {
            console.log('[MantraSDK] ===== CHECK DEVICE START =====');
            console.log('[MantraSDK] Calling:', `${this.MANTRA_SERVICE_URL}/checkdevice`);

            const response = await fetch(`${this.MANTRA_SERVICE_URL}/checkdevice`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ConnectedDvc: 'MFS500' }),
            });

            console.log('[MantraSDK] Response status:', response.status, response.statusText);

            if (!response.ok) {
                console.error('[MantraSDK] ❌ HTTP Error! Status:', response.status);
                const errorText = await response.text();
                console.error('[MantraSDK] Error response body:', errorText);
                return {
                    isConnected: false,
                    errorCode: response.status,
                    errorMessage: `HTTP ${response.status}`,
                };
            }

            const data = await response.json();
            console.log('[MantraSDK] ✓ Response received and parsed');
            console.log('[MantraSDK] isDeviceConnected full response:', JSON.stringify(data, null, 2));

            // Handle both ErrorCode (uppercase) and errorCode (lowercase) field names
            const errorCode = data.ErrorCode !== undefined ? data.ErrorCode : data.errorCode;
            const errorDesc = data.ErrorDescription !== undefined ? data.ErrorDescription : data.errorDescription;

            console.log('[MantraSDK] isDeviceConnected response parsed:', {
                errorCode: errorCode,
                errorDescription: errorDesc,
                DeviceInfo: data.DeviceInfo,
                allKeys: Object.keys(data)
            });

            // Check if errorCode is "0" or 0 (both possible)
            const isConnected = errorCode === '0' || errorCode === 0;
            console.log('[MantraSDK] Device connection status:', isConnected ? '✓ Connected' : '❌ Not connected');

            return {
                isConnected,
                deviceName: data.DeviceInfo?.Make || 'Mantra Device',
                serialNumber: data.DeviceInfo?.SerialNo,
                quality: isConnected ? 100 : 0,
                errorCode: parseInt(String(errorCode)) || -1,
                errorMessage: errorDesc || (isConnected ? 'Connected' : 'Not connected'),
            };
        } catch (error: any) {
            console.error('[MantraSDK] ❌ DEVICE CHECK ERROR - Exception thrown:', error);
            console.error('[MantraSDK] Error message:', error?.message);
            console.error('[MantraSDK] Error stack:', error?.stack);
            return {
                isConnected: false,
                errorCode: -2,
                errorMessage: error?.message || 'Failed to check device status',
            };
        }
    }

    /**
     * Capture fingerprint from device
     * @param quality - Minimum quality threshold (0-100)
     * @param timeout - Capture timeout in milliseconds
     * @returns Promise<MantraFingerprintResult>
     */
    static async captureFinger(
        quality: number = 60,
        timeout: number = 10000
    ): Promise<MantraFingerprintResult> {
        if (typeof window === 'undefined') {
            return {
                success: false,
                template: '',
                quality: 0,
                errorCode: -1,
                errorMessage: 'Running on server-side',
            };
        }

        try {
            console.log('[MantraSDK] ===== CAPTURE FINGER START =====');
            console.log('[MantraSDK] Parameters:', { quality, timeout });

            const requestBody = {
                Quality: String(quality),
                TimeOut: String(Math.floor(timeout / 1000)),
            };
            console.log('[MantraSDK] Request body:', JSON.stringify(requestBody, null, 2));
            console.log('[MantraSDK] Calling:', `${this.MANTRA_SERVICE_URL}/capture`);

            const response = await fetch(`${this.MANTRA_SERVICE_URL}/capture`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            console.log('[MantraSDK] Response status:', response.status, response.statusText);
            console.log('[MantraSDK] Response headers:', {
                contentType: response.headers.get('content-type'),
                contentLength: response.headers.get('content-length')
            });

            if (!response.ok) {
                console.error('[MantraSDK] ❌ HTTP Error! Status:', response.status);
                const errorText = await response.text();
                console.error('[MantraSDK] Error response body:', errorText);
                return {
                    success: false,
                    template: '',
                    quality: 0,
                    errorCode: response.status,
                    errorMessage: `HTTP ${response.status}: ${errorText}`,
                };
            }

            const data = await response.json();
            console.log('[MantraSDK] ✓ Response received and parsed');
            console.log('[MantraSDK] captureFinger full response:', JSON.stringify(data, null, 2));

            // Handle both ErrorCode (uppercase) and errorCode (lowercase) field names
            const errorCode = data.ErrorCode !== undefined ? data.ErrorCode : data.errorCode;
            const errorDesc = data.ErrorDescription !== undefined ? data.ErrorDescription : data.errorDescription;

            console.log('[MantraSDK] captureFinger response parsed:', {
                errorCode: errorCode,
                errorDescription: errorDesc,
                Quality: data.Quality,
                Nfiq: data.Nfiq,
                hasImgData: 'BitmapData' in data,
                ImgDataLength: data.BitmapData ? String(data.BitmapData).length : 0,
                ImgDataType: typeof data.BitmapData,
                allKeys: Object.keys(data)
            });

            // Check for errorCode === "0" (string) or 0 (number)
            if (errorCode === "0" || errorCode === 0) {
                // Capture successful
                const imgData = data.BitmapData || '';
                if (!imgData) {
                    console.warn('[MantraSDK] ⚠️ Capture returned ErrorCode 0 but ImgData is empty');
                }
                console.log('[MantraSDK] ✓ Capture successful - Quality:', data.Quality, 'ImgData length:', String(imgData).length);
                return {
                    success: true,
                    template: imgData,  // Template is in BitmapData field
                    quality: data.Quality || quality,
                    nfiq: data.Nfiq,  // NFIQ quality score
                    bitmapData: imgData,  // Image data (bitmap)
                    isoTemplate: imgData,  // ISO template format (same as BitmapData)
                    captureTime: new Date().toISOString(),
                    errorCode: 0,
                };
            } else {
                // Capture failed
                let errorMessage = data.ErrorDescription || 'Fingerprint capture failed';

                // Map specific error codes if needed
                if (errorCode === "-2027") errorMessage = 'Device not connected';
                else if (errorCode === "-2029") errorMessage = 'Fingerprint quality too low';

                console.error('[MantraSDK] ❌ Capture failed with ErrorCode:', errorCode, 'Message:', errorMessage, 'Full response:', JSON.stringify(data, null, 2));
                return {
                    success: false,
                    template: '',
                    quality: data.Quality || 0,
                    errorCode: parseInt(String(errorCode), 10),
                    errorMessage,
                };
            }
        } catch (error: any) {
            console.error('[MantraSDK] ❌ CAPTURE ERROR - Exception thrown:', error);
            console.error('[MantraSDK] Error message:', error?.message);
            console.error('[MantraSDK] Error stack:', error?.stack);
            return {
                success: false,
                template: '',
                quality: 0,
                errorCode: -100,
                errorMessage: error?.message || 'Fingerprint capture failed',
            };
        }
    }

    /**
     * Verify fingerprint template against stored template
     * @param storedTemplate - Previously captured and stored template
     * @param liveTemplate - Currently captured template
     * @returns Promise<{isMatch: boolean; score: number}>
     */
    static async verifyTemplate(
        storedTemplate: string,
        liveTemplate: string,
        threshold: number = 65
    ): Promise<{ isMatch: boolean; score: number; errorMessage?: string }> {
        if (typeof window === 'undefined') {
            return {
                isMatch: false,
                score: 0,
                errorMessage: 'Running on server-side',
            };
        }

        try {
            const response = await fetch(`${this.MANTRA_SERVICE_URL}/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ProbTemplate: liveTemplate,
                    GalleryTemplate: storedTemplate,
                    TmpFormat: '2',
                }),
            });

            if (!response.ok) {
                return {
                    isMatch: false,
                    score: 0,
                    errorMessage: `HTTP ${response.status}`,
                };
            }

            const data = await response.json();
            console.log('[MantraSDK] verifyTemplate full response:', JSON.stringify(data, null, 2));
            console.log('[MantraSDK] verifyTemplate response parsed:', {
                statusCode: data.statusCode,
                ErrorCode: data.ErrorCode,
                statusMessage: data.statusMessage,
                ErrorDescription: data.ErrorDescription,
                bIsMatched: data.bIsMatched,
                IsMatched: data.IsMatched,
                nScore: data.nScore,
                Score: data.Score,
                allKeys: Object.keys(data)
            });

            // Handle both old format (statusCode, bIsMatched, nScore) and new format (ErrorCode, IsMatched, Score)
            const errorCode = data.ErrorCode !== undefined ? data.ErrorCode : data.statusCode;
            const statusCode = data.statusCode;

            if (errorCode === "0" || errorCode === 0 || statusCode === 0) {
                const isMatched = data.IsMatched !== undefined ? (data.IsMatched === true || data.IsMatched === "true") : (data.bIsMatched === true);
                const score = parseInt(data.Score !== undefined ? data.Score : (data.nScore || '0'), 10);
                console.log('[MantraSDK] Verify result:', { isMatched, score });
                return {
                    isMatch: isMatched,
                    score: score,
                };
            } else {
                const errorMsg = data.ErrorDescription || data.statusMessage || 'Verification failed';
                console.error('[MantraSDK] verifyTemplate failed with error:', errorCode, 'Message:', errorMsg);
                return {
                    isMatch: false,
                    score: 0,
                    errorMessage: errorMsg,
                };
            }
        } catch (error: any) {
            console.error('[MantraSDK] Verify template error:', error);
            return {
                isMatch: false,
                score: 0,
                errorMessage: error?.message || 'Verification failed',
            };
        }
    }

    /**
     * Get captured template for later use
     * @param templateType - Template type: 'ISO' or 'ANSI'
     * @returns Promise<string | null>
     */
    static async getTemplate(templateType: string = '2'): Promise<string | null> {
        if (typeof window === 'undefined') {
            return null;
        }

        try {
            const response = await fetch(`${this.MANTRA_SERVICE_URL}/gettemplate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ TmpFormat: templateType }),
            });

            if (!response.ok) {
                console.error('[MantraSDK] Failed to get template:', response.status);
                return null;
            }

            const data = await response.json();
            console.log('[MantraSDK] getTemplate full response:', JSON.stringify(data, null, 2));

            // Handle both ErrorCode (uppercase) and errorCode (lowercase) field names
            const errorCode = data.ErrorCode !== undefined ? data.ErrorCode : data.errorCode;
            const errorDesc = data.ErrorDescription !== undefined ? data.ErrorDescription : data.errorDescription;

            console.log('[MantraSDK] getTemplate response parsed:', {
                errorCode: errorCode,
                errorDescription: errorDesc,
                ImgData: data.ImgData ? 'Present' : 'Missing',
                ImgDataType: typeof data.ImgData,
                ImgDataLength: data.ImgData ? String(data.ImgData).length : 0,
                allKeys: Object.keys(data)
            });

            // Check for errorCode === "0" (string) or 0 (number)
            if (errorCode === "0" || errorCode === 0) {
                const imgData = data.ImgData || '';
                if (!imgData) {
                    console.warn('[MantraSDK] Template returned ErrorCode 0 but ImgData is empty or missing');
                    return null;
                }
                console.log('[MantraSDK] Template data retrieved successfully, length:', String(imgData).length);
                return imgData;  // ← Correct field: ImgData
            }
            console.error('[MantraSDK] getTemplate failed with ErrorCode:', errorCode, 'Full response:', JSON.stringify(data, null, 2));
            return null;
        } catch (error) {
            console.error('[MantraSDK] Get template error:', error);
            return null;
        }
    }

    /**
     * Get fingerprint image
     * @param format - Image format: '0'=BMP, '1'=WSQ
     * @returns Promise<string | null>
     */
    static async getImage(format: string = '0'): Promise<string | null> {
        if (typeof window === 'undefined') {
            return null;
        }

        try {
            console.log('[MantraSDK] ===== GET IMAGE START =====');
            console.log('[MantraSDK] Image format:', format);
            console.log('[MantraSDK] Calling:', `${this.MANTRA_SERVICE_URL}/getimage`);

            const response = await fetch(`${this.MANTRA_SERVICE_URL}/getimage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ImgFormat: format }),
            });

            console.log('[MantraSDK] Response status:', response.status, response.statusText);

            if (!response.ok) {
                console.error('[MantraSDK] ❌ HTTP Error! Status:', response.status);
                const errorText = await response.text();
                console.error('[MantraSDK] Error response body:', errorText);
                return null;
            }

            const data = await response.json();
            console.log('[MantraSDK] ✓ Response received and parsed');
            console.log('[MantraSDK] getImage full response:', JSON.stringify(data, null, 2));

            // Handle both ErrorCode (uppercase) and errorCode (lowercase) field names
            const errorCode = data.ErrorCode !== undefined ? data.ErrorCode : data.errorCode;
            const errorDesc = data.ErrorDescription !== undefined ? data.ErrorDescription : data.errorDescription;

            console.log('[MantraSDK] getImage response parsed:', {
                errorCode: errorCode,
                errorDescription: errorDesc,
                hasImgData: 'ImgData' in data,
                ImgDataLength: data.ImgData ? String(data.ImgData).length : 0,
                ImgDataType: typeof data.ImgData,
                allKeys: Object.keys(data)
            });

            // Check for errorCode === "0" (string) or 0 (number)
            if (errorCode === "0" || errorCode === 0) {
                const imgData = data.ImgData || '';
                if (!imgData) {
                    console.warn('[MantraSDK] ⚠️ Image returned ErrorCode 0 but ImgData is empty or missing');
                    return null;
                }
                console.log('[MantraSDK] ✓ Image data retrieved successfully, length:', String(imgData).length);
                return imgData;  // ← Correct field: ImgData
            }
            console.error('[MantraSDK] ❌ getImage failed with ErrorCode:', errorCode, 'Full response:', JSON.stringify(data, null, 2));
            return null;
        } catch (error: any) {
            console.error('[MantraSDK] ❌ GET IMAGE ERROR - Exception thrown:', error);
            console.error('[MantraSDK] Error message:', error?.message);
            console.error('[MantraSDK] Error stack:', error?.stack);
            return null;
        }
    }

    /**
     * Get device info
     * Returns device information if ErrorCode is "0" (device initialized and ready)
     * @returns Promise<MantraDeviceInfo | null>
     */
    static async getDeviceInfo(): Promise<MantraDeviceInfo | null> {
        if (typeof window === 'undefined') {
            return null;
        }

        try {
            const response = await fetch(`${this.MANTRA_SERVICE_URL}/info`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ConnectedDvc: 'MFS500',
                    ClientKey: '',
                }),
            });

            if (!response.ok) {
                console.error('[MantraSDK] Get device info HTTP error:', response.status);
                return null;
            }

            const data = await response.json();
            console.log('[MantraSDK] getDeviceInfo full response:', JSON.stringify(data, null, 2));

            // Handle both ErrorCode (uppercase) and errorCode (lowercase) field names
            const errorCode = data.ErrorCode !== undefined ? data.ErrorCode : data.errorCode;
            const errorDesc = data.ErrorDescription !== undefined ? data.ErrorDescription : data.errorDescription;

            console.log('[MantraSDK] getDeviceInfo response parsed:', {
                errorCode: errorCode,
                errorDescription: errorDesc,
                DeviceInfo: data.DeviceInfo,
                allKeys: Object.keys(data)
            });

            // Check if errorCode is "0" or 0 (device initialized and ready)
            const isReady = errorCode === '0' || errorCode === 0;
            console.log('[MantraSDK] Device ready status:', isReady);

            if (!isReady) {
                console.error('[MantraSDK] Device not ready. ErrorCode:', errorCode, 'Description:', errorDesc);
                return null;
            }

            // Parse the DeviceInfo object
            const deviceInfo = data.DeviceInfo;
            if (!deviceInfo) {
                console.error('[MantraSDK] No DeviceInfo in response');
                return null;
            }

            console.log('[MantraSDK] Device info retrieved:', deviceInfo);
            return {
                deviceName: deviceInfo.Model || 'MFS500',
                serialNumber: deviceInfo.SerialNo || 'Unknown',
                vendorName: deviceInfo.Make || 'Mantra',
                firmwareVersion: deviceInfo.SystemID,
                modelName: `${deviceInfo.Make} ${deviceInfo.Model}`,
            };
        } catch (error) {
            console.error('[MantraSDK] Get device info error:', error);
            return null;
        }
    }

    /**
     * Initialize device
     * @returns Promise<boolean>
     */
    static async initDevice(): Promise<boolean> {
        if (typeof window === 'undefined') {
            return false;
        }

        try {
            const response = await fetch(`${this.MANTRA_SERVICE_URL}/initdevice`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ConnectedDvc: 'MFS500',
                    ClientKey: '',
                }),
            });

            if (!response.ok) {
                console.error('[MantraSDK] initDevice HTTP error:', response.status);
                return false;
            }

            const data = await response.json();
            console.log('[MantraSDK] initDevice full response:', JSON.stringify(data, null, 2));
            console.log('[MantraSDK] initDevice parsed:', {
                statusCode: data.statusCode,
                ErrorCode: data.ErrorCode,
                statusMessage: data.statusMessage,
                ErrorDescription: data.ErrorDescription,
                allKeys: Object.keys(data)
            });

            const success = data.ErrorCode === "0" || data.ErrorCode === 0 || data.statusCode === 0;
            console.log('[MantraSDK] initDevice result:', { success });
            return success;
        } catch (error) {
            console.error('[MantraSDK] Init device error:', error);
            return false;
        }
    }

    /**
     * Uninitialize device
     * @returns Promise<boolean>
     */
    static async uninitDevice(): Promise<boolean> {
        if (typeof window === 'undefined') {
            return false;
        }

        try {
            const response = await fetch(`${this.MANTRA_SERVICE_URL}/uninitdevice`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });

            if (!response.ok) {
                console.error('[MantraSDK] uninitDevice HTTP error:', response.status);
                return false;
            }

            const data = await response.json();
            console.log('[MantraSDK] uninitDevice full response:', JSON.stringify(data, null, 2));
            console.log('[MantraSDK] uninitDevice parsed:', {
                statusCode: data.statusCode,
                ErrorCode: data.ErrorCode,
                statusMessage: data.statusMessage,
                ErrorDescription: data.ErrorDescription,
                allKeys: Object.keys(data)
            });

            const success = data.ErrorCode === "0" || data.ErrorCode === 0 || data.statusCode === 0;
            console.log('[MantraSDK] uninitDevice result:', { success });
            return success;
        } catch (error) {
            console.error('[MantraSDK] Uninit device error:', error);
            return false;
        }
    }

    /**
     * Get supported device list
     * @returns Promise<any>
     */
    static async getSupportedDeviceList(): Promise<any> {
        if (typeof window === 'undefined') {
            return null;
        }

        try {
            const response = await fetch(`${this.MANTRA_SERVICE_URL}/supporteddevicelist`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });

            if (!response.ok) {
                console.error('[MantraSDK] getSupportedDeviceList HTTP error:', response.status);
                return null;
            }

            const data = await response.json();
            console.log('[MantraSDK] getSupportedDeviceList full response:', JSON.stringify(data, null, 2));
            console.log('[MantraSDK] getSupportedDeviceList parsed:', {
                allKeys: Object.keys(data),
                dataType: typeof data,
                isArray: Array.isArray(data),
                length: Array.isArray(data) ? data.length : 'N/A'
            });
            return data;
        } catch (error) {
            console.error('[MantraSDK] Get supported device list error:', error);
            return null;
        }
    }

    /**
     * Get connected device list
     * @returns Promise<any>
     */
    static async getConnectedDeviceList(): Promise<any> {
        if (typeof window === 'undefined') {
            return null;
        }

        try {
            const response = await fetch(`${this.MANTRA_SERVICE_URL}/connecteddevicelist`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });

            if (!response.ok) {
                console.error('[MantraSDK] getConnectedDeviceList HTTP error:', response.status);
                return null;
            }

            const data = await response.json();
            console.log('[MantraSDK] getConnectedDeviceList full response:', JSON.stringify(data, null, 2));
            console.log('[MantraSDK] getConnectedDeviceList parsed:', {
                allKeys: Object.keys(data),
                dataType: typeof data,
                isArray: Array.isArray(data),
                length: Array.isArray(data) ? data.length : 'N/A'
            });
            return data;
        } catch (error) {
            console.error('[MantraSDK] Get connected device list error:', error);
            return null;
        }
    }

    /**
     * Match fingerprint
     * @param quality - Minimum quality
     * @param timeout - Capture timeout
     * @param galleryTemplate - Template to match against
     * @returns Promise<{isMatch: boolean; score: number}>
     */
    static async matchFinger(
        quality: number = 60,
        timeout: number = 10000,
        galleryTemplate: string = '',
        templateFormat: string = '2'
    ): Promise<{ isMatch: boolean; score: number; errorMessage?: string }> {
        if (typeof window === 'undefined') {
            return {
                isMatch: false,
                score: 0,
                errorMessage: 'Running on server-side',
            };
        }

        try {
            const response = await fetch(`${this.MANTRA_SERVICE_URL}/match`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    Quality: String(quality),
                    TimeOut: String(timeout),
                    GalleryTemplate: galleryTemplate,
                    TmpFormat: templateFormat,
                }),
            });

            if (!response.ok) {
                return {
                    isMatch: false,
                    score: 0,
                    errorMessage: `HTTP ${response.status}`,
                };
            }

            const data = await response.json();
            console.log('[MantraSDK] matchFinger full response:', JSON.stringify(data, null, 2));

            // Handle both ErrorCode (uppercase) and errorCode (lowercase) field names
            const errorCode = data.ErrorCode !== undefined ? data.ErrorCode : data.errorCode;
            const errorDesc = data.ErrorDescription !== undefined ? data.ErrorDescription : data.errorDescription;

            console.log('[MantraSDK] matchFinger response parsed:', {
                errorCode: errorCode,
                errorDescription: errorDesc,
                IsMatched: data.IsMatched,
                Score: data.Score,
                hasIsMatched: 'IsMatched' in data,
                hasScore: 'Score' in data,
                allKeys: Object.keys(data)
            });

            // Check for errorCode === "0" (string) or 0 (number)
            if (errorCode === "0" || errorCode === 0) {
                const score = parseInt(data.Score || data.nScore || '0', 10);
                const isMatched = data.IsMatched === true || data.IsMatched === "true" || data.bIsMatched === true;
                console.log('[MantraSDK] Match result:', { isMatched, score });
                return {
                    isMatch: isMatched,
                    score: score,
                };
            }
            console.error('[MantraSDK] matchFinger failed with ErrorCode:', errorCode, 'Full response:', JSON.stringify(data, null, 2));
            return {
                isMatch: false,
                score: 0,
                errorMessage: errorDesc || 'Match failed',
            };
        } catch (error: any) {
            console.error('[MantraSDK] Match finger error:', error);
            return {
                isMatch: false,
                score: 0,
                errorMessage: error?.message || 'Match failed',
            };
        }
    }
}

export default MantraSDKService;
