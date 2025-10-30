/**
 * Test Iris Device Connection (Mantra MIS100V2)
 * This script tests connection to the iris scanner RDService
 */

const axios = require('axios');
const https = require('https');

// Test configurations for iris scanner
const TEST_CONFIGS = [
  { url: 'https://127.0.0.1:11102', name: 'HTTPS Port 11102 (Standard Iris)' },
  { url: 'http://127.0.0.1:11102', name: 'HTTP Port 11102' },
  { url: 'https://127.0.0.1:11101', name: 'HTTPS Port 11101 (Fingerprint Port)' },
  { url: 'https://127.0.0.1:11100', name: 'HTTPS Port 11100 (Alternative)' },
  { url: 'http://127.0.0.1:11100', name: 'HTTP Port 11100' },
];

// HTTPS agent that bypasses SSL certificate errors
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
  keepAlive: false,
  maxSockets: 1
});

// Sample iris PID Options XML for MIS100V2
const irisPidOptions = `<?xml version="1.0"?> <PidOptions ver="1.0"> <Opts fCount="0" fType="0" iCount="2" pCount="0" pgCount="2" format="0" pidVer="2.0" timeout="15000" pTimeout="20000" posh="UNKNOWN" env="P" /> <CustOpts><Param name="mantrakey" value="" /></CustOpts> </PidOptions>`;

async function testConnection(config) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`Testing: ${config.name}`);
  console.log(`URL: ${config.url}`);
  console.log('='.repeat(70));

  const isHttps = config.url.startsWith('https');

  // Test 1: Device Info
  try {
    console.log('\n[Test 1] Getting device info...');
    const infoResponse = await axios.post(
      `${config.url}/rd/info`,
      '',
      {
        headers: {
          'Content-Type': 'text/xml; charset=UTF-8',
          'Accept': '*/*'
        },
        httpsAgent: isHttps ? httpsAgent : undefined,
        timeout: 5000,
        validateStatus: (status) => status >= 200 && status < 500
      }
    );

    console.log(`✅ Device Info Success - Status: ${infoResponse.status}`);
    console.log('Response (first 500 chars):');
    console.log(infoResponse.data.substring(0, 500));

    // Check if it's iris device
    if (infoResponse.data.includes('IRIS') || infoResponse.data.includes('MIS100')) {
      console.log('✅ IRIS DEVICE DETECTED!');
    } else if (infoResponse.data.includes('MFS') || infoResponse.data.includes('FINGER')) {
      console.log('⚠️  This appears to be a FINGERPRINT device, not iris');
    }

  } catch (error) {
    console.log(`❌ Device Info Failed: ${error.message}`);
    console.log(`   Code: ${error.code}`);
    console.log(`   Status: ${error.response?.status || 'N/A'}`);
    return { success: false, config, error: error.message };
  }

  // Test 2: Iris Capture (will timeout without actual scan, but tests endpoint)
  try {
    console.log('\n[Test 2] Testing iris capture endpoint...');
    console.log('(This will timeout waiting for scan - that\'s normal for testing)');
    
    const captureResponse = await axios.post(
      `${config.url}/rd/capture`,
      irisPidOptions,
      {
        headers: {
          'Content-Type': 'text/xml; charset=UTF-8',
          'Accept': '*/*'
        },
        httpsAgent: isHttps ? httpsAgent : undefined,
        timeout: 3000, // Short timeout for testing
        validateStatus: (status) => status >= 200 && status < 500
      }
    );

    console.log(`✅ Capture Endpoint Accessible - Status: ${captureResponse.status}`);
    console.log('Response (first 500 chars):');
    console.log(captureResponse.data.substring(0, 500));
    
    return { success: true, config, supportsBothEndpoints: true };

  } catch (error) {
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      console.log('⏱️  Capture endpoint accessible (timeout waiting for scan - expected)');
      return { success: true, config, note: 'Timeout is normal without actual iris scan' };
    } else if (error.response?.status === 405) {
      console.log('❌ Capture endpoint returns 405 - Wrong HTTP method or endpoint not supported');
      return { success: false, config, error: '405 Method Not Allowed' };
    } else {
      console.log(`⚠️  Capture Test Failed: ${error.message}`);
      console.log(`   This might still work - device info was successful`);
      return { success: true, config, note: 'Device info works, capture needs actual device' };
    }
  }
}

async function runAllTests() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║        Mantra MIS100V2 Iris Scanner Connection Test               ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝');
  console.log('\nThis will test all possible RDService URLs for your iris scanner...\n');

  const results = [];

  for (const config of TEST_CONFIGS) {
    const result = await testConnection(config);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between tests
  }

  // Summary
  console.log('\n\n');
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║                          TEST SUMMARY                              ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝');

  const successfulConnections = results.filter(r => r.success);

  if (successfulConnections.length === 0) {
    console.log('\n❌ NO WORKING CONNECTIONS FOUND');
    console.log('\nPossible Issues:');
    console.log('1. Iris RDService is not running');
    console.log('2. MIS100V2 device is not connected');
    console.log('3. Iris RDService is on a different port');
    console.log('4. Device drivers are not installed');
    console.log('\nTroubleshooting Steps:');
    console.log('- Check if RDService for iris is running in Task Manager');
    console.log('- Verify MIS100V2 device is connected via USB');
    console.log('- Reinstall Mantra MIS100V2 drivers');
    console.log('- Check RDService logs for iris device');
  } else {
    console.log('\n✅ WORKING CONNECTIONS FOUND:\n');
    successfulConnections.forEach((result, index) => {
      console.log(`${index + 1}. ${result.config.name}`);
      console.log(`   URL: ${result.config.url}`);
      if (result.note) {
        console.log(`   Note: ${result.note}`);
      }
      console.log('');
    });

    console.log('\n📝 RECOMMENDED CONFIGURATION:');
    console.log('Update your config/config.js with:');
    console.log('');
    console.log('rdservice: {');
    console.log('  iris: {');
    console.log(`    url: '${successfulConnections[0].config.url}',`);
    console.log('    timeout: 15000');
    console.log('  }');
    console.log('}');
  }

  console.log('\n' + '='.repeat(70));
}

// Run tests
runAllTests().catch(error => {
  console.error('\n❌ Test script error:', error);
  process.exit(1);
});
