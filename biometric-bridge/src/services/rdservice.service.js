/**
 * RDService Communication Service
 * Handles all communication with RDService (Biometric Device Driver)
 */

const axios = require('axios');
const https = require('https');
const config = require('../config/config');
const { parseXmlResponse, buildPidOptions } = require('../utils/xmlParser');
const { processPidData } = require('../utils/dataProcessor');

class RDServiceService {
  constructor() {
    // Support for multiple devices on different ports
    this.devices = {
      fingerprint: {
        urlHttps: config.rdservice.fingerprint.url,
        urlHttp: config.rdservice.fingerprint.url.replace('https://', 'http://'),
        timeout: config.rdservice.fingerprint.timeout
      },
      iris: {
        urlHttps: config.rdservice.iris.url,
        urlHttp: config.rdservice.iris.url.replace('https://', 'http://'),
        timeout: config.rdservice.iris.timeout
      },
      photograph: {
        urlHttps: config.rdservice.photograph.url,
        urlHttp: config.rdservice.photograph.url.replace('https://', 'http://'),
        timeout: config.rdservice.photograph.timeout
      }
    };
    
    // Legacy URLs for backward compatibility
    this.rdserviceUrl = config.rdservice.url;
    this.rdserviceUrlHttp = config.rdservice.url.replace('https://', 'http://');
    this.timeout = config.rdservice.timeout;
    
    // Create HTTPS agent that ignores SSL certificate errors
    this.httpsAgent = new https.Agent({
      rejectUnauthorized: false, // Ignore self-signed certificate errors
      keepAlive: false, // Don't keep connections alive
      maxSockets: 1, // Limit concurrent connections
      timeout: 10000 // Socket timeout
    });
  }

  /**
   * Make request with retry logic (try HTTPS only for capture)
   * @param {string} endpoint - API endpoint path
   * @param {string} data - Request body
   * @param {Object} options - Request options
   * @param {string} deviceType - Device type (fingerprint, iris, photograph)
   */
  async makeRequest(endpoint, data, options = {}, deviceType = null) {
    // Determine which device URLs to use
    let urls;
    
    if (deviceType && this.devices[deviceType]) {
      // Use device-specific URLs
      const device = this.devices[deviceType];
      const isCapture = endpoint.includes('/capture');
      urls = isCapture 
        ? [device.urlHttps] // Only HTTPS for capture
        : [device.urlHttps, device.urlHttp]; // Both for info
    } else {
      // Fallback to legacy URLs
      const isCapture = endpoint.includes('/capture');
      urls = isCapture 
        ? [this.rdserviceUrl] // Only HTTPS for capture
        : [this.rdserviceUrl, this.rdserviceUrlHttp]; // Both for info
    }
    
    let lastError = null;
    let errorDetails = [];

    for (const url of urls) {
      try {
        const isHttps = url.startsWith('https');
        const urlType = isHttps ? 'HTTPS' : 'HTTP';
        console.log(`[RDService] Trying ${urlType} (${deviceType || 'default'}): ${url}${endpoint}`);
        
        const response = await axios.post(
          `${url}${endpoint}`,
          data,
          {
            ...options,
            httpsAgent: isHttps ? this.httpsAgent : undefined,
            timeout: options.timeout || this.timeout
          }
        );
        
        console.log(`[RDService] ${urlType} request successful - Status: ${response.status}`);
        
        return response;
      } catch (error) {
        const errorMsg = `${url} failed: ${error.message} (Code: ${error.code}, Status: ${error.response?.status})`;
        console.error(`[RDService] ${errorMsg}`);
        errorDetails.push(errorMsg);
        lastError = error;
        
        // For HTTPS errors, log more details
        if (url.startsWith('https')) {
          console.error('[RDService] HTTPS Error details:', {
            code: error.code,
            errno: error.errno,
            syscall: error.syscall,
            address: error.address,
            port: error.port
          });
        }
        
        // Continue to next URL
      }
    }

    // If all attempts failed, throw the last error with details
    console.error('[RDService] All connection attempts failed:', errorDetails);
    throw lastError;
  }

  /**
   * Check if RDService is running and accessible
   * @returns {Promise<Object>} Connection status
   */
  async checkConnection() {
    try {
      const startTime = Date.now();
      // RDService expects POST request with empty body for device info
      const response = await this.makeRequest(
        '/rd/info',
        '',
        {
          headers: { 
            'Content-Type': 'text/xml; charset=UTF-8',
            'Accept': '*/*'
          }
        }
      );
      const responseTime = Date.now() - startTime;

      return {
        connected: true,
        url: this.rdserviceUrl,
        responseTime,
        error: null,
        rawResponse: response.data
      };
    } catch (error) {
      console.error('[RDService] Connection error:', error.message);
      return {
        connected: false,
        url: this.rdserviceUrl,
        responseTime: null,
        error: error.message,
        rawResponse: null
      };
    }
  }

  /**
   * Get device information from RDService
   * @returns {Promise<Object>} Device information
   */
  async getDeviceInfo() {
    try {
      // RDService expects POST request with empty body for device info
      const response = await this.makeRequest(
        '/rd/info',
        '',
        {
          headers: { 
            'Content-Type': 'text/xml; charset=UTF-8',
            'Accept': '*/*'
          }
        }
      );
      
      const deviceInfo = await parseXmlResponse(response.data);
      return {
        success: true,
        data: deviceInfo
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Capture biometric data
   * @param {string} type - Biometric type (fingerprint, iris, photograph)
   * @param {Object} options - Capture options
   * @returns {Promise<Object>} Capture result
   */
  async capture(type, options = {}) {
    try {
      console.log(`[RDService] Capturing ${type}...`);
      console.log(`[RDService] Using device URL: ${this.devices[type]?.urlHttps || 'default'}`);
      
      // Build PID Options XML
      const pidOptions = buildPidOptions(type, options);
      console.log('[RDService] Sending PID Options...');
      console.log('[RDService] PID XML:', pidOptions);

      // Get timeout for this device type
      const deviceTimeout = this.devices[type]?.timeout || parseInt(options.timeout || 20000);

      // Send request to RDService with device-specific URL
      const response = await this.makeRequest(
        '/rd/capture',
        pidOptions,
        {
          headers: { 
            'Content-Type': 'text/xml; charset=UTF-8',
            'Accept': '*/*'
          },
          timeout: deviceTimeout,
          maxRedirects: 0,
          validateStatus: (status) => status >= 200 && status < 500
        },
        type // Pass device type to use correct URL
      );

      console.log('[RDService] Received response', response.data);
      console.log('[RDService] Response status:', response.status);
      console.log('[RDService] Response data type:', typeof response.data);
      console.log('[RDService] Response data length:', response.data?.length || 0);
      
      // Check if response is valid
      if (!response.data || response.data.length === 0) {
        throw new Error(`Empty response from RDService (Status: ${response.status})`);
      }
      
      if (response.status !== 200) {
        throw new Error(`Invalid response status: ${response.status}`);
      }
      
      console.log('[RDService] Response data (first 500 chars):', 
        typeof response.data === 'string' 
          ? response.data.substring(0, 500) 
          : JSON.stringify(response.data).substring(0, 500)
      );
      
      // Parse XML response
      const pidData = await parseXmlResponse(response.data);
      console.log('[RDService] Parsed PID Data keys:', Object.keys(pidData || {}));
      
      // Process and transform to JSON
      const processedData = await processPidData(pidData, type);
      
      console.log(`[RDService] Capture ${processedData.success ? 'successful' : 'failed'} - Quality: ${processedData.qScore}%`);
      
      return processedData;
      
    } catch (error) {
      console.error(`[RDService] ${type} capture error:`, error.message);
      console.error(`[RDService] Error code:`, error.code);
      console.error(`[RDService] Error response:`, error.response?.status);
      
      // Handle different error types
      if (error.code === 'ECONNREFUSED') {
        return {
          success: false,
          errorCode: 100,
          errorMessage: 'RDService not running or not accessible',
          qScore: 0,
          type: type,
          templates: null,
          deviceInfo: null,
          timestamp: new Date().toISOString()
        };
      } else if (error.code === 'ETIMEDOUT') {
        return {
          success: false,
          errorCode: 120,
          errorMessage: 'Capture timeout - device did not respond',
          qScore: 0,
          type: type,
          templates: null,
          deviceInfo: null,
          timestamp: new Date().toISOString()
        };
      } else if (error.code === 'ECONNRESET' || error.code === 'EPIPE' || error.message.includes('socket hang up')) {
        return {
          success: false,
          errorCode: 110,
          errorMessage: 'Connection interrupted - RDService may be busy or restarting',
          qScore: 0,
          type: type,
          templates: null,
          deviceInfo: null,
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          success: false,
          errorCode: 999,
          errorMessage: error.message || 'Unknown error occurred',
          qScore: 0,
          type: type,
          templates: null,
          deviceInfo: null,
          timestamp: new Date().toISOString()
        };
      }
    }
  }

  /**
   * Parse device information for health check
   * @param {string} xmlResponse - XML response from RDService
   * @returns {Promise<Object>} Parsed device information
   */
  async parseDeviceHealth(xmlResponse) {
    try {
      const deviceInfo = await parseXmlResponse(xmlResponse);
      
      const devices = {
        fingerprint: {
          available: false,
          manufacturer: null,
          model: null,
          status: 'unknown'
        },
        iris: {
          available: false,
          manufacturer: null,
          model: null,
          status: 'unknown'
        },
        photograph: {
          available: false,
          status: 'unknown'
        }
      };

      // Extract device details from RDService response
      if (deviceInfo && deviceInfo.RDService) {
        const rdInfo = deviceInfo.RDService;
        
        // Check for fingerprint device (Mantra or other)
        if (rdInfo.$ || rdInfo.info) {
          const info = rdInfo.$ || rdInfo.info || {};
          
          // Mantra fingerprint scanner detection
          devices.fingerprint = {
            available: true,
            manufacturer: info.dpId || 'Unknown',
            model: info.mi || 'Unknown',
            status: info.status || 'READY',
            rdsVersion: info.rdsVer || 'Unknown',
            rdsId: info.rdsId || 'Unknown'
          };

          // If Mantra device, add specific details
          if (info.dpId && info.dpId.includes('MANTRA')) {
            devices.fingerprint.vendor = 'Mantra';
            devices.fingerprint.type = 'Fingerprint Scanner';
          }
        }

        // Note: Iris and photograph devices would be detected similarly
        // For now, we mark them as available if RDService is connected
        devices.iris.available = true;
        devices.iris.status = 'ready';
        devices.photograph.available = true;
        devices.photograph.status = 'ready';
      }

      return devices;
    } catch (error) {
      console.error('[RDService] Device info parse error:', error.message);
      return {
        fingerprint: { available: false, status: 'info-parse-error' },
        iris: { available: false, status: 'info-parse-error' },
        photograph: { available: false, status: 'info-parse-error' }
      };
    }
  }
}

module.exports = new RDServiceService();
