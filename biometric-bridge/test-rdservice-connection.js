/**
 * Test RDService Connection
 * Run this to diagnose connection issues
 */

const axios = require('axios');
const https = require('https');

const urls = [
  'https://127.0.0.1:11101',
  'https://127.0.0.1:11100',
  'http://127.0.0.1:11101',
  'http://127.0.0.1:11100'
];

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
  keepAlive: false,
  maxSockets: 1,
  timeout: 10000
});

async function testConnection(url) {
  console.log(`\n========================================`);
  console.log(`Testing: ${url}`);
  console.log(`========================================`);
  
  try {
    const isHttps = url.startsWith('https');
    
    // Test /rd/info endpoint
    console.log(`\n1. Testing /rd/info...`);
    const infoResponse = await axios.post(
      `${url}/rd/info`,
      '',
      {
        headers: { 
          'Content-Type': 'text/xml; charset=UTF-8',
          'Accept': '*/*'
        },
        httpsAgent: isHttps ? httpsAgent : undefined,
        timeout: 5000
      }
    );
    
    console.log(`✅ /rd/info SUCCESS - Status: ${infoResponse.status}`);
    console.log(`Response length: ${infoResponse.data?.length || 0} bytes`);
    console.log(`Response preview: ${infoResponse.data?.substring(0, 200)}`);
    
    // Test /rd/capture endpoint with PID Options
    console.log(`\n2. Testing /rd/capture...`);
    const pidOptions = `<?xml version="1.0"?> <PidOptions ver="1.0"> <Opts fCount="1" fType="0" iCount="0" pCount="0" pgCount="2" format="0" pidVer="2.0" timeout="10000" pTimeout="20000" posh="UNKNOWN" env="P" /> <CustOpts><Param name="mantrakey" value="" /></CustOpts> </PidOptions>`;
    
    const captureResponse = await axios.post(
      `${url}/rd/capture`,
      pidOptions,
      {
        headers: { 
          'Content-Type': 'text/xml; charset=UTF-8',
          'Accept': '*/*'
        },
        httpsAgent: isHttps ? httpsAgent : undefined,
        timeout: 15000
      }
    );
    
    console.log(`✅ /rd/capture SUCCESS - Status: ${captureResponse.status}`);
    console.log(`Response length: ${captureResponse.data?.length || 0} bytes`);
    console.log(`Response preview: ${captureResponse.data?.substring(0, 500)}`);
    
    console.log(`\n🎉 ${url} is WORKING!`);
    return true;
    
  } catch (error) {
    console.log(`❌ ${url} FAILED`);
    console.log(`Error: ${error.message}`);
    console.log(`Code: ${error.code}`);
    console.log(`Status: ${error.response?.status}`);
    
    if (error.response) {
      console.log(`Response data: ${error.response.data?.substring(0, 200)}`);
    }
    
    return false;
  }
}

async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       RDService Connection Diagnostic Tool                ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\nTesting all possible RDService URLs...\n');
  
  const results = [];
  
  for (const url of urls) {
    const success = await testConnection(url);
    results.push({ url, success });
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    Test Results Summary                   ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  
  results.forEach(({ url, success }) => {
    const status = success ? '✅ WORKING' : '❌ FAILED';
    console.log(`║  ${status.padEnd(10)} ${url.padEnd(45)} ║`);
  });
  
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  const workingUrls = results.filter(r => r.success);
  if (workingUrls.length > 0) {
    console.log(`\n🎉 Found ${workingUrls.length} working URL(s):`);
    workingUrls.forEach(({ url }) => console.log(`   ${url}`));
    console.log(`\nUpdate your config to use: ${workingUrls[0].url}`);
  } else {
    console.log('\n⚠️  No working URLs found!');
    console.log('\nTroubleshooting steps:');
    console.log('1. Check if RDService is running');
    console.log('2. Check if biometric device is connected');
    console.log('3. Try restarting RDService');
    console.log('4. Check Windows Firewall settings');
  }
}

// Run tests
runTests().catch(console.error);
