/**
 * Biometric Controller
 * Handles biometric capture and device information endpoints
 */

const rdserviceService = require('../services/rdservice.service');

class BiometricController {
  /**
   * Capture fingerprint
   * @route GET/POST /api/captureFingerprint
   */
  async captureFingerprint(req, res) {
    const options = req.method === 'GET' ? req.query : req.body;
    const result = await rdserviceService.capture('fingerprint', options);
    
    if (!result.success) {
      const statusCode = result.errorCode === 100 ? 503 : 
                        result.errorCode === 120 ? 408 : 500;
      return res.status(statusCode).json(result);
    }
    
    res.json(result);
  }

  /**
   * Capture iris scan
   * @route GET/POST /api/captureIris
   */
  async captureIris(req, res) {
    const options = req.method === 'GET' ? req.query : req.body;
    const result = await rdserviceService.capture('iris', options);
    
    if (!result.success) {
      const statusCode = result.errorCode === 100 ? 503 : 
                        result.errorCode === 120 ? 408 : 500;
      return res.status(statusCode).json(result);
    }
    
    res.json(result);
  }

  /**
   * Capture photograph
   * @route GET/POST /api/capturePhotograph
   */
  async capturePhotograph(req, res) {
    // MFS110 is a fingerprint-only device - photograph capture not supported
    return res.status(400).json({
      success: false,
      errorCode: 998,
      errorMessage: 'Photograph capture not supported - MFS110 is a fingerprint-only device. For face capture, use browser webcam API or connect a face recognition device.',
      qScore: 0,
      type: 'photograph',
      templates: null,
      deviceInfo: null,
      timestamp: new Date().toISOString(),
      availableCaptureMethods: ['fingerprint'],
      hint: 'Use /api/captureFingerprint endpoint for biometric authentication, or implement webcam capture in frontend'
    });
    
    // Uncomment below and remove above block when photo capture device is connected:
    /*
    const options = req.method === 'GET' ? req.query : req.body;
    const result = await rdserviceService.capture('photograph', options);
    
    if (!result.success) {
      const statusCode = result.errorCode === 100 ? 503 : 
                        result.errorCode === 120 ? 408 : 500;
      return res.status(statusCode).json(result);
    }
    
    res.json(result);
    */
  }

  /**
   * Get device information
   * @route GET /api/deviceInfo
   */
  async getDeviceInfo(req, res) {
    const deviceInfo = await rdserviceService.getDeviceInfo();
    
    if (deviceInfo.success) {
      res.json(deviceInfo);
    } else {
      res.status(500).json(deviceInfo);
    }
  }
}

module.exports = new BiometricController();
