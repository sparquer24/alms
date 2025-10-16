/**
 * Health Controller
 * Handles health check and status endpoints
 */

const rdserviceService = require('../services/rdservice.service');

class HealthController {
  /**
   * Get comprehensive health status
   * @route GET /health
   */
  async getHealth(req, res) {
    const healthData = {
      status: 'ok',
      service: 'biometric-bridge',
      timestamp: new Date().toISOString(),
      rdservice: {
        connected: false,
        url: null,
        responseTime: null,
        error: null
      },
      devices: {
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
      }
    };

    // Check RDService connectivity
    const connectionStatus = await rdserviceService.checkConnection();
    healthData.rdservice = {
      connected: connectionStatus.connected,
      url: connectionStatus.url,
      responseTime: connectionStatus.responseTime,
      error: connectionStatus.error
    };

    if (connectionStatus.connected && connectionStatus.rawResponse) {
      // Parse device information
      const devices = await rdserviceService.parseDeviceHealth(connectionStatus.rawResponse);
      healthData.devices = devices;
    } else {
      // If RDService is not connected, mark all devices as unavailable
      healthData.devices.fingerprint.status = 'rdservice-not-connected';
      healthData.devices.iris.status = 'rdservice-not-connected';
      healthData.devices.photograph.status = 'rdservice-not-connected';
    }

    res.json(healthData);
  }

  /**
   * Get RDService connection status
   * @route GET /api/rdservice/status
   */
  async getRDServiceStatus(req, res) {
    const connectionStatus = await rdserviceService.checkConnection();
    
    if (connectionStatus.connected) {
      res.json({
        connected: true,
        rdserviceUrl: connectionStatus.url,
        response: connectionStatus.rawResponse
      });
    } else {
      res.json({
        connected: false,
        rdserviceUrl: connectionStatus.url,
        error: connectionStatus.error
      });
    }
  }
}

module.exports = new HealthController();
