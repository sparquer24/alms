/**
 * Data Processing Utilities
 */

/**
 * Extract additional info params from device info
 * @param {Object} additionalInfo - Additional info from device
 * @returns {Object} Extracted parameters
 */
function extractAdditionalInfo(additionalInfo) {
  const info = {
    serialNumber: '',
    systemId: '',
    timestamp: ''
  };

  if (!additionalInfo || !additionalInfo.Param) {
    return info;
  }

  const params = Array.isArray(additionalInfo.Param) 
    ? additionalInfo.Param 
    : [additionalInfo.Param];

  params.forEach(param => {
    if (param.$ && param.$.name && param.$.value) {
      switch (param.$.name) {
        case 'srno':
          info.serialNumber = param.$.value;
          break;
        case 'sysid':
          info.systemId = param.$.value;
          break;
        case 'ts':
          info.timestamp = param.$.value;
          break;
      }
    }
  });

  return info;
}

/**
 * Process PID Data and transform to JSON
 * @param {Object} pidData - Parsed PID data from RDService
 * @param {string} type - Biometric type
 * @returns {Promise<Object>} Processed biometric data
 */
async function processPidData(pidData, type) {
  try {
    // Extract response attributes
    const resp = pidData.PidData.Resp;
    const respAttrs = resp.$ || resp;
    const errCode = parseInt(respAttrs.errCode || 0);
    const qScore = parseInt(respAttrs.qScore || 0);

    // Handle error response
    if (errCode !== 0) {
      return {
        success: false,
        errorCode: errCode,
        errorMessage: respAttrs.errInfo || 'Unknown error',
        qScore: qScore,
        type: type,
        templates: null,
        deviceInfo: null,
        timestamp: new Date().toISOString()
      };
    }

    // Extract device info
    const deviceInfo = pidData.PidData.DeviceInfo;
    const deviceAttrs = deviceInfo.$ || deviceInfo;
    const additionalInfo = extractAdditionalInfo(deviceInfo.additional_info);

    // Extract biometric data
    const dataNode = pidData.PidData.Data;
    const encryptedData = dataNode._ || dataNode;
    
    const hmacNode = pidData.PidData.Hmac;
    const hmac = hmacNode._ || hmacNode || '';
    
    const skeyNode = pidData.PidData.Skey;
    const sessionKey = skeyNode._ || skeyNode || '';

    // Build successful response
    return {
      success: true,
      errorCode: 0,
      errorMessage: respAttrs.errInfo || 'Capture Success',
      qScore: qScore,
      type: type,
      templates: {
        raw: encryptedData,
        sessionKey: sessionKey,
        isoTemplate: null // ISO templates would be extracted after decryption
      },
      deviceInfo: {
        model: deviceAttrs.mi || 'Unknown',
        manufacturer: deviceAttrs.dpId || 'Unknown',
        serialNumber: additionalInfo.serialNumber,
        rdsVersion: deviceAttrs.rdsVer || 'Unknown',
        rdsId: deviceAttrs.rdsId || 'Unknown'
      },
      timestamp: additionalInfo.timestamp || new Date().toISOString(),
      hmac: hmac
    };
  } catch (error) {
    console.error('Process PID Data Error:', error);
    return {
      success: false,
      errorCode: 999,
      errorMessage: 'Failed to process biometric data: ' + error.message,
      qScore: 0,
      type: type,
      templates: null,
      deviceInfo: null,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = {
  extractAdditionalInfo,
  processPidData
};
