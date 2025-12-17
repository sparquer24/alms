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
                return false;
            }

            // Then verify device info and initialization
            const deviceInfo = await this.getDeviceInfo();
            if (!deviceInfo) {
                return false;
            }

            this.sdkReady = true;
            return true;
        } catch (error: any) {
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
            const response = await fetch(`${this.MANTRA_SERVICE_URL}/checkdevice`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ConnectedDvc: 'MFS500' }),
            });

            if (!response.ok) {
                return {
                    isConnected: false,
                    errorCode: response.status,
                    errorMessage: `HTTP ${response.status}`,
                };
            }

            const data = await response.json();

            // Handle both ErrorCode (uppercase) and errorCode (lowercase) field names
            const errorCode = data.ErrorCode !== undefined ? data.ErrorCode : data.errorCode;
            const errorDesc = data.ErrorDescription !== undefined ? data.ErrorDescription : data.errorDescription;

            // Check if errorCode is "0" or 0 (both possible)
            const isConnected = errorCode === '0' || errorCode === 0;

            return {
                isConnected,
                deviceName: data.DeviceInfo?.Make || 'Mantra Device',
                serialNumber: data.DeviceInfo?.SerialNo,
                quality: isConnected ? 100 : 0,
                errorCode: parseInt(String(errorCode)) || -1,
                errorMessage: errorDesc || (isConnected ? 'Connected' : 'Not connected'),
            };
        } catch (error: any) {
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
            const requestBody = {
                Quality: String(quality),
                TimeOut: String(Math.floor(timeout / 1000)),
            };

            const response = await fetch(`${this.MANTRA_SERVICE_URL}/capture`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorText = await response.text();
                return {
                    success: false,
                    template: '',
                    quality: 0,
                    errorCode: response.status,
                    errorMessage: `HTTP ${response.status}: ${errorText}`,
                };
            }

            const data = await response.json();

            // Handle both ErrorCode (uppercase) and errorCode (lowercase) field names
            const errorCode = data.ErrorCode !== undefined ? data.ErrorCode : data.errorCode;
            const errorDesc = data.ErrorDescription !== undefined ? data.ErrorDescription : data.errorDescription;

            // Check for errorCode === "0" (string) or 0 (number)
            if (errorCode === "0" || errorCode === 0) {
                // Capture successful - now get template and image separately
                const bitmapData = data.BitmapData || '';

                // The BitmapData from capture is the IMAGE (starts with Qk2... for BMP)
                // We need to call /gettemplate to get the proper template for matching (starts with Rk1S...)
                let templateForMatching = '';

                // Try to get the template using gettemplate API (returns proper template format)
                try {
                    const templateResponse = await fetch(`${this.MANTRA_SERVICE_URL}/gettemplate`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ TmpFormat: 1 }),
                    });

                    if (templateResponse.ok) {
                        const templateData = await templateResponse.json();
                        const templateErrorCode = templateData.ErrorCode !== undefined ? templateData.ErrorCode : templateData.errorCode;

                        if (templateErrorCode === "0" || templateErrorCode === 0) {
                            templateForMatching = templateData.ImgData || '';
                        }
                    }
                } catch (templateError) {
                    // Failed to get template, will use fallback
                }

                // Fallback to IsoTemplate/AnsiTemplate if gettemplate failed
                if (!templateForMatching) {
                    templateForMatching = data.IsoTemplate || data.AnsiTemplate || bitmapData;
                }

                return {
                    success: true,
                    template: templateForMatching,  // Template for matching (from /gettemplate)
                    quality: data.Quality || quality,
                    nfiq: data.Nfiq,  // NFIQ quality score
                    bitmapData: bitmapData,  // Image data (from capture - for display only)
                    isoTemplate: templateForMatching,  // Same as template (for matching)
                    captureTime: new Date().toISOString(),
                    errorCode: 0,
                };
            } else {
                // Capture failed
                let errorMessage = data.ErrorDescription || 'Fingerprint capture failed';

                // Map specific error codes if needed
                if (errorCode === "-2027") errorMessage = 'Device not connected';
                else if (errorCode === "-2029") errorMessage = 'Fingerprint quality too low';

                return {
                    success: false,
                    template: '',
                    quality: data.Quality || 0,
                    errorCode: parseInt(String(errorCode), 10),
                    errorMessage,
                };
            }
        } catch (error: any) {
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
        console.log('[verifyTemplate] START - Verifying fingerprint templates');
        console.log('[verifyTemplate] Threshold:', threshold);
        console.log('[verifyTemplate] Stored template length:', storedTemplate?.length || 0);
        console.log('[verifyTemplate] Live template length:', liveTemplate?.length || 0);

        if (typeof window === 'undefined') {
            console.log('[verifyTemplate] ERROR - Running on server-side');
            return {
                isMatch: false,
                score: 0,
                errorMessage: 'Running on server-side',
            };
        }

        // Verify templates
        try {
            const requestBody = {
                ProbTemplate: liveTemplate,
                GalleryTemplate: storedTemplate,
                TmpFormat: "1",
            };
            console.log('[verifyTemplate] Request body prepared');
            console.log('[verifyTemplate] Calling Mantra verify API:', `${this.MANTRA_SERVICE_URL}/verify`);

            const response: any = await fetch(`${this.MANTRA_SERVICE_URL}/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            console.log('[verifyTemplate] Response status:', response.status);
            const data = await response.json();
            console.log('[verifyTemplate] Response data:', JSON.stringify(data, null, 2));

            // Handle ErrorCode check first
            const errorCode = data.ErrorCode !== undefined ? data.ErrorCode : data.statusCode;
            console.log('[verifyTemplate] Parsed errorCode:', errorCode);

            if (errorCode === "0" || errorCode === 0) {
                // Check Status field: if Status is true -> matched, if Status is not present or false -> not matched
                const isMatched = data.Status === true;
                const score = parseInt(data.Score !== undefined ? data.Score : (data.nScore || '0'), 10);
                console.log('[verifyTemplate] Status field:', data.Status);
                console.log('[verifyTemplate] isMatched:', isMatched, 'score:', score);
                console.log('[verifyTemplate] END - Verification completed');
                return {
                    isMatch: isMatched,
                    score: score,
                };
            } else {
                const errorMsg = data.ErrorDescription || data.statusMessage || 'Verification failed';
                console.log('[verifyTemplate] FAILED - errorCode:', errorCode, 'errorMsg:', errorMsg);
                console.log('[verifyTemplate] END - Verification failed');
                return {
                    isMatch: false,
                    score: 0,
                    errorMessage: errorMsg,
                };
            }
        } catch (error: any) {
            console.log('[verifyTemplate] EXCEPTION:', error?.message || error);
            console.log('[verifyTemplate] END - Verification failed with exception');
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
    static async getTemplate(templateType: number = 1): Promise<string | null> {
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
                return null;
            }

            const data = await response.json();

            // Handle both ErrorCode (uppercase) and errorCode (lowercase) field names
            const errorCode = data.ErrorCode !== undefined ? data.ErrorCode : data.errorCode;

            // Check for errorCode === "0" (string) or 0 (number)
            if (errorCode === "0" || errorCode === 0) {
                const imgData = data.ImgData || '';
                if (!imgData) {
                    return null;
                }
                return imgData;
            }
            return null;
        } catch (error) {
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
            const response = await fetch(`${this.MANTRA_SERVICE_URL}/getimage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ImgFormat: format }),
            });

            if (!response.ok) {
                return null;
            }

            const data = await response.json();

            // Handle both ErrorCode (uppercase) and errorCode (lowercase) field names
            const errorCode = data.ErrorCode !== undefined ? data.ErrorCode : data.errorCode;

            // Check for errorCode === "0" (string) or 0 (number)
            if (errorCode === "0" || errorCode === 0) {
                const imgData = data.ImgData || '';
                if (!imgData) {
                    return null;
                }
                return imgData;
            }
            return null;
        } catch (error: any) {
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
                return null;
            }

            const data = await response.json();

            // Handle both ErrorCode (uppercase) and errorCode (lowercase) field names
            const errorCode = data.ErrorCode !== undefined ? data.ErrorCode : data.errorCode;

            // Check if errorCode is "0" or 0 (device initialized and ready)
            const isReady = errorCode === '0' || errorCode === 0;

            if (!isReady) {
                return null;
            }

            // Parse the DeviceInfo object
            const deviceInfo = data.DeviceInfo;
            if (!deviceInfo) {
                return null;
            }

            return {
                deviceName: deviceInfo.Model || 'MFS500',
                serialNumber: deviceInfo.SerialNo || 'Unknown',
                vendorName: deviceInfo.Make || 'Mantra',
                firmwareVersion: deviceInfo.SystemID,
                modelName: `${deviceInfo.Make} ${deviceInfo.Model}`,
            };
        } catch (error) {
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
                return false;
            }

            const data = await response.json();

            const success = data.ErrorCode === "0" || data.ErrorCode === 0 || data.statusCode === 0;
            return success;
        } catch (error) {
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
                return false;
            }

            const data = await response.json();

            const success = data.ErrorCode === "0" || data.ErrorCode === 0 || data.statusCode === 0;
            return success;
        } catch (error) {
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
                return null;
            }

            const data = await response.json();
            return data;
        } catch (error) {
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
                return null;
            }

            const data = await response.json();
            return data;
        } catch (error) {
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
        templateFormat: number = 1
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

            // Handle both ErrorCode (uppercase) and errorCode (lowercase) field names
            const errorCode = data.ErrorCode !== undefined ? data.ErrorCode : data.errorCode;
            const errorDesc = data.ErrorDescription !== undefined ? data.ErrorDescription : data.errorDescription;

            // Check for errorCode === "0" (string) or 0 (number)
            if (errorCode === "0" || errorCode === 0) {
                const score = parseInt(data.Score || data.nScore || '0', 10);
                const isMatched = data.IsMatched === true || data.IsMatched === "true" || data.bIsMatched === true;
                return {
                    isMatch: isMatched,
                    score: score,
                };
            }
            return {
                isMatch: false,
                score: 0,
                errorMessage: errorDesc || 'Match failed',
            };
        } catch (error: any) {
            return {
                isMatch: false,
                score: 0,
                errorMessage: error?.message || 'Match failed',
            };
        }
    }
}

export default MantraSDKService;
