/**
 * XML Parsing Utilities
 */

const xml2js = require('xml2js');

/**
 * Parse XML response from RDService
 * @param {string} xmlString - XML string to parse
 * @returns {Promise<Object>} Parsed JSON object
 */
async function parseXmlResponse(xmlString) {
  const parser = new xml2js.Parser({ 
    explicitArray: false,
    mergeAttrs: false
  });
  
  try {
    return await parser.parseStringPromise(xmlString);
  } catch (error) {
    console.error('XML Parse Error:', error);
    throw new Error('Failed to parse RDService response');
  }
}

/**
 * Build PID Options XML for different biometric types
 * @param {string} type - Biometric type (fingerprint, iris, photograph)
 * @param {Object} options - Additional options
 * @returns {string} XML string
 */
function buildPidOptions(type, options = {}) {
  const config = require('../config/config').capture.defaults[type] || 
                 require('../config/config').capture.defaults.fingerprint;
  
  const timeout = options.timeout || config.timeout;

  return `<?xml version="1.0"?>
<PidOptions ver="1.0">
  <Opts fCount="${config.fCount}" fType="${config.fType}" iCount="${config.iCount}" pCount="${config.pCount}" 
        format="0" pidVer="2.0" timeout="${timeout}" 
        posh="UNKNOWN" env="P" />
  <Demo></Demo>
</PidOptions>`;
}

module.exports = {
  parseXmlResponse,
  buildPidOptions
};
