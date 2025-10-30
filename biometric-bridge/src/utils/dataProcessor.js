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
    timestamp: '',
    modalityType: '',
    deviceType: ''
  };

  if (!additionalInfo || !additionalInfo.Param) {
    return info;
  }

  const params = Array.isArray(additionalInfo.Param) 
    ? additionalInfo.Param 
    : [additionalInfo.Param];

  params.forEach(param => {
    // Handle both merged attributes and separate $ notation
    const attrs = param.$ || param;
    if (attrs && attrs.name && attrs.value) {
      switch (attrs.name) {
        case 'srno':
          info.serialNumber = attrs.value;
          break;
        case 'sysid':
          info.systemId = attrs.value;
          break;
        case 'ts':
          info.timestamp = attrs.value;
          break;
        case 'modality_type':
          info.modalityType = attrs.value;
          break;
        case 'device_type':
          info.deviceType = attrs.value;
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
    console.log('[DataProcessor] Processing PID Data...');
    console.log('[DataProcessor] PID Data keys:', Object.keys(pidData || {}));
    console.log('[DataProcessor] PID Data structure:', JSON.stringify(pidData, null, 2).substring(0, 2000));
    
    // Check if pidData exists
    if (!pidData) {
      throw new Error('Parsed data is null or undefined');
    }
    
    // Handle both root-level PidData and nested PidData
    let pidDataObj = pidData.PidData || pidData;
    
    if (!pidDataObj || !pidDataObj.Resp) {
      console.error('[DataProcessor] Invalid structure. Available keys:', Object.keys(pidData));
      throw new Error('Invalid response structure - Missing PidData or Resp element');
    }
    
    console.log('[DataProcessor] Using PidData object with keys:', Object.keys(pidDataObj));
    
    // Extract response attributes
    const resp = pidDataObj.Resp;
    const respAttrs = resp.$ || resp;
    const errCode = parseInt(respAttrs.errCode || 0);
    const qScore = parseInt(respAttrs.qScore || 0);
    const nmPoints = parseInt(respAttrs.nmPoints || 0);

    console.log('[DataProcessor] Response - errCode:', errCode, 'qScore:', qScore, 'nmPoints:', nmPoints);

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
    const deviceInfo = pidDataObj.DeviceInfo;
    if (!deviceInfo) {
      throw new Error('Missing DeviceInfo element');
    }
    
    const deviceAttrs = deviceInfo.$ || deviceInfo;
    const additionalInfo = extractAdditionalInfo(deviceInfo.additional_info);

    console.log('[DataProcessor] Device info extracted:', {
      model: deviceAttrs.mi,
      manufacturer: deviceAttrs.dpId,
      serialNumber: additionalInfo.serialNumber
    });

    // Extract biometric data
    const dataNode = pidDataObj.Data;
    const encryptedData = (dataNode && (dataNode._ || dataNode)) || '';
    
    const hmacNode = pidDataObj.Hmac;
    const hmac = (hmacNode && (hmacNode._ || hmacNode)) || '';
    
    const skeyNode = pidDataObj.Skey;
    const sessionKey = (skeyNode && (skeyNode._ || skeyNode)) || '';
    const sessionKeyCi = (skeyNode && skeyNode.$) ? skeyNode.$.ci : '';

    console.log('[DataProcessor] Biometric data extracted - Data length:', encryptedData.length, 'Session key length:', sessionKey.length);

    // Build successful response
    return {
      success: true,
      errorCode: 0,
      errorMessage: respAttrs.errInfo || 'Capture Success',
      qScore: qScore,
      nmPoints: nmPoints,
      type: type,
      templates: {
        raw: encryptedData,
        sessionKey: sessionKey,
        sessionKeyCi: sessionKeyCi,
        hmac: hmac,
        isoTemplate: null // ISO templates would be extracted after decryption
      },
      deviceInfo: {
        model: deviceAttrs.mi || 'Unknown',
        manufacturer: deviceAttrs.mc || deviceAttrs.dpId || 'Unknown',
        deviceProviderId: deviceAttrs.dpId || 'Unknown',
        serialNumber: additionalInfo.serialNumber,
        systemId: additionalInfo.systemId,
        rdsVersion: deviceAttrs.rdsVer || 'Unknown',
        rdsId: deviceAttrs.rdsId || 'Unknown',
        deviceCode: deviceAttrs.dc || '',
        modalityType: additionalInfo.modalityType,
        deviceType: additionalInfo.deviceType
      },
      timestamp: additionalInfo.timestamp || new Date().toISOString()
    };
  } catch (error) {
    console.error('[DataProcessor] Process PID Data Error:', error);
    console.error('[DataProcessor] Error stack:', error.stack);
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
