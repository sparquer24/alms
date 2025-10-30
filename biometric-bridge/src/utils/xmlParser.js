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
    mergeAttrs: false, // Keep attributes separate
    explicitRoot: true, // Keep root element
    attrkey: '$',
    charkey: '_',
    trim: true,
    normalizeTags: false
  });
  
  try {
    console.log('[XMLParser] Parsing XML response...');
    console.log('[XMLParser] XML input (first 500 chars):', xmlString.substring(0, 500));
    
    const result = await parser.parseStringPromise(xmlString);
    
    console.log('[XMLParser] Parse successful');
    console.log('[XMLParser] Result keys:', Object.keys(result || {}));
    console.log('[XMLParser] Full result structure:', JSON.stringify(result, null, 2).substring(0, 1000));
    
    return result;
  } catch (error) {
    console.error('[XMLParser] XML Parse Error:', error);
    console.error('[XMLParser] Failed XML:', xmlString);
    throw new Error('Failed to parse RDService response: ' + error.message);
  }
}

/**
 * Build PID Options XML for different biometric types
 * Matches Mantra MFS110 format
 * @param {string} type - Biometric type (fingerprint, iris, photograph)
 * @param {Object} options - Additional options
 * @returns {string} XML string
 */
function buildPidOptions(type, options = {}) {
  const config = require('../config/config').capture.defaults[type] || 
                 require('../config/config').capture.defaults.fingerprint;
  
  const timeout = options.timeout || config.timeout;
  const pTimeout = options.pTimeout || '20000';
  const pgCount = options.pgCount || '2';
  const wadh = options.wadh || '';
  const mantrakey = options.mantrakey || '';

  // Build XML matching Mantra device format
  return `<?xml version="1.0"?> <PidOptions ver="1.0"> <Opts fCount="${config.fCount}" fType="0" iCount="${config.iCount}" pCount="${config.pCount}" pgCount="${pgCount}" format="0" pidVer="2.0" timeout="${timeout}" pTimeout="${pTimeout}" posh="UNKNOWN" env="P" /> <CustOpts><Param name="mantrakey" value="${mantrakey}" /></CustOpts> </PidOptions>`;
}

module.exports = {
  parseXmlResponse,
  buildPidOptions
};
