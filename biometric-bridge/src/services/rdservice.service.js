/**
 * RDService Communication Service
 * Handles all communication with RDService (Biometric Device Driver)
 */

const axios = require('axios');
const config = require('../config/config');
const { parseXmlResponse, buildPidOptions } = require('../utils/xmlParser');
const { processPidData } = require('../utils/dataProcessor');

class RDServiceService {
  constructor() {
    this.rdserviceUrl = config.rdservice.url;
    this.timeout = config.rdservice.timeout;
  }

  /**
   * Check if RDService is running and accessible
   * @returns {Promise<Object>} Connection status
   */
  async checkConnection() {
    try {
      const startTime = Date.now();
      // RDService expects POST request with empty body for device info
      const response = await axios.post(
        `${this.rdserviceUrl}/rd/info`,
        '',
        {
          headers: { 
            'Content-Type': 'text/xml'
          },
          timeout: this.timeout
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
      const response = await axios.post(
        `${this.rdserviceUrl}/rd/info`,
        '',
        {
          headers: { 
            'Content-Type': 'text/xml'
          },
          timeout: this.timeout
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
      
      // Build PID Options XML
      const pidOptions = buildPidOptions(type, options);
      console.log('[RDService] Sending PID Options...');

      // Send request to RDService
      const response = await axios.post(
        `${this.rdserviceUrl}/rd/capture`,
        pidOptions,
        {
          headers: { 
            'Content-Type': 'application/xml'
          },
          timeout: parseInt(options.timeout || 20000)
        }
      );

      console.log('[RDService] Received response');
      
      // Parse XML response
      const pidData = await parseXmlResponse(response.data);
      
      // Process and transform to JSON
      const processedData = await processPidData(pidData, type);
      
      console.log(`[RDService] Capture ${processedData.success ? 'successful' : 'failed'} - Quality: ${processedData.qScore}%`);
      
      return processedData;
      
    } catch (error) {
      console.error(`[RDService] ${type} capture error:`, error.message);
      
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
