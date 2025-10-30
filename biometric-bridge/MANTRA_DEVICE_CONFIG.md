# Mantra MFS110 Device Configuration

## ✅ Configuration Complete

Your biometric bridge is now configured for **Mantra MFS110 Authentication Vendor Device Manager** with HTTPS support.

---

## 🔧 Device Details

| Property | Value |
|----------|-------|
| **Device Model** | MFS110 |
| **Manufacturer** | Mantra Softech India Pvt Ltd |
| **RDService ID** | RENESAS.MANTRA.001 |
| **RDService Version** | 1.4.1 |
| **Device Provider** | MANTRA.MSIPL |
| **Port** | 11101 (HTTPS) |
| **Status** | READY ✅ |

---

## 🌐 Connection URLs

The bridge will automatically try these URLs in order:

1. **HTTPS (IP)**: `https://127.0.0.1:11101` ← Primary
2. **HTTPS (Domain)**: `https://rd.myservice.com:11101` ← Fallback
3. **HTTP (IP)**: `http://127.0.0.1:11101` ← Last resort

### Custom SSL Domain Setup (Optional)

If you want to use `rd.myservice.com`:

1. Add to hosts file: `C:\Windows\System32\drivers\etc\hosts`
   ```
   127.0.0.1 rd.myservice.com
   ```

2. The bridge will automatically detect and use it!

---

## 📋 PID Options Configuration

### Fingerprint Capture (Your Device Format)

```xml
<?xml version="1.0"?>
<PidOptions ver="1.0">
  <Opts 
    fCount="1" 
    fType="0" 
    iCount="0" 
    pCount="0" 
    pgCount="2" 
    format="0" 
    pidVer="2.0" 
    timeout="10000" 
    pTimeout="20000" 
    posh="UNKNOWN" 
    env="P" />
  <CustOpts>
    <Param name="mantrakey" value="" />
  </CustOpts>
</PidOptions>
```

### Parameter Mapping

| Parameter | Value | Description |
|-----------|-------|-------------|
| `fCount` | `1` | Capture 1 finger |
| `fType` | `0` | FMR (Finger Minutiae Record) |
| `iCount` | `0` | No IRIS |
| `pCount` | `0` | No photograph |
| `pgCount` | `2` | Page count (Mantra specific) |
| `timeout` | `10000` | 10 seconds timeout |
| `pTimeout` | `20000` | 20 seconds processing timeout |
| `env` | `P` | Production environment |

---

## 📥 Sample Response

Your device returns this structure:

```xml
<?xml version="1.0"?>
<PidData>
  <Resp 
    errCode="0" 
    errInfo="Success." 
    fCount="1" 
    fType="0" 
    nmPoints="38" 
    qScore="58" />
  
  <DeviceInfo 
    dpId="MANTRA.MSIPL" 
    rdsId="RENESAS.MANTRA.001" 
    rdsVer="1.4.1" 
    mi="MFS110" 
    mc="[Certificate]" 
    dc="2174254f-7d7e-4c4b-8c02-6877237cf502">
    <additional_info>
      <Param name="srno" value="8190767" />
      <Param name="sysid" value="6A3FCBF38CE62A3FBFF0" />
      <Param name="ts" value="2025-10-28T15:02:56+05:30" />
      <Param name="modality_type" value="Finger" />
      <Param name="device_type" value="L1" />
    </additional_info>
  </DeviceInfo>
  
  <Skey ci="20280813">[Encrypted Session Key]</Skey>
  <Hmac>[HMAC Value]</Hmac>
  <Data type="X">[Encrypted Biometric Data]</Data>
</PidData>
```

### Response Fields

| Field | Description | Your Value |
|-------|-------------|------------|
| `errCode` | 0 = Success | `0` ✅ |
| `qScore` | Quality Score (0-100) | `58` (Acceptable) |
| `nmPoints` | Minutiae points | `38` |
| `srno` | Device Serial Number | `8190767` |
| `sysid` | System ID | `6A3FCBF38CE62A3FBFF0` |
| `device_type` | Device Level | `L1` (Level 1) |

---

## 🚀 Testing the Bridge

### 1. Start the Server

```powershell
cd c:\Users\preml\Desktop\office\LMS\biometric-bridge
node server.js
```

You'll see:
```
╔════════════════════════════════════════════════════════════╗
║         Biometric Bridge Server Started                   ║
╠════════════════════════════════════════════════════════════╣
║  Bridge URL:     http://localhost:3030                   ║
║  API Docs:       http://localhost:3030/api-docs          ║
║  RDService URL:  https://127.0.0.1:11101              ║
╚════════════════════════════════════════════════════════════╝
```

### 2. Test Health Check

**Browser**: http://localhost:3030/health

**Expected Response**:
```json
{
  "status": "ok",
  "service": "biometric-bridge",
  "timestamp": "2025-10-28T...",
  "rdservice": {
    "connected": true,
    "url": "https://127.0.0.1:11101",
    "responseTime": 234
  },
  "devices": {
    "fingerprint": {
      "available": true,
      "manufacturer": "MANTRA.MSIPL",
      "model": "MFS110",
      "status": "READY"
    }
  }
}
```

### 3. Test Fingerprint Capture

**Browser**: http://localhost:3030/api-docs

Or **JavaScript**:
```javascript
const response = await fetch('http://localhost:3030/api/captureFingerprint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    timeout: 10000
  })
});

const data = await response.json();
console.log('Capture Result:', data);
```

**Expected Response**:
```json
{
  "success": true,
  "errorCode": 0,
  "errorMessage": "Success.",
  "qScore": 58,
  "type": "fingerprint",
  "templates": {
    "raw": "[Base64 Encrypted Data]",
    "sessionKey": "[Encrypted Session Key]",
    "isoTemplate": null
  },
  "deviceInfo": {
    "model": "MFS110",
    "manufacturer": "Morpho",
    "serialNumber": "8190767",
    "systemId": "6A3FCBF38CE62A3FBFF0",
    "deviceProviderId": "MANTRA.MSIPL",
    "rdsId": "RENESAS.MANTRA.001",
    "rdsVersion": "1.4.1"
  },
  "timestamp": "2025-10-28T..."
}
```

---

## 🔍 Troubleshooting

### Issue 1: SSL Certificate Error
**Status**: ✅ **FIXED**
- Using custom HTTPS agent with `rejectUnauthorized: false`
- Ignores self-signed certificate errors

### Issue 2: Socket Hang Up
**Status**: ✅ **FIXED**
- Disabled keep-alive connections
- Limited to single socket
- Added automatic retry mechanism

### Issue 3: Protocol Detection
**Status**: ✅ **FIXED**
- Automatically tries HTTPS first
- Falls back to domain name
- Falls back to HTTP if needed

### Issue 4: Connection Interrupted
**Status**: ✅ **FIXED**
- Added comprehensive error handling
- Specific error codes for different failures
- Detailed logging for debugging

---

## 📊 Quality Score Guidelines

Based on your capture (qScore: 58):

| Score Range | Quality | Action |
|-------------|---------|--------|
| 0-49 | ❌ Poor | Reject - Ask user to retry |
| 50-69 | ⚠️ Fair | **Your Device** - Acceptable but warn user |
| 70-84 | ✅ Good | Accept - Good quality |
| 85-100 | ✅✅ Excellent | Accept - Perfect quality |

**Recommendation**: For production, set minimum qScore to 50 or 55.

---

## 🎯 Integration with Frontend

### Simple Integration

```javascript
// In your React/Vue/Angular app
async function captureBiometric() {
  try {
    const response = await fetch('http://localhost:3030/api/captureFingerprint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      if (result.qScore >= 50) {
        console.log('Capture successful!');
        // Send result.templates.raw to your backend
        submitBiometricData(result);
      } else {
        alert(`Quality too low (${result.qScore}%). Please retry.`);
      }
    } else {
      alert(`Capture failed: ${result.errorMessage}`);
    }
  } catch (error) {
    console.error('Capture error:', error);
    alert('Failed to connect to biometric device');
  }
}
```

---

## 📚 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check with device status |
| `/api/rdservice/status` | GET | Check RDService connectivity |
| `/api/captureFingerprint` | GET/POST | Capture fingerprint |
| `/api/captureIris` | GET/POST | Capture iris scan |
| `/api/capturePhotograph` | GET/POST | Capture photograph |
| `/api/deviceInfo` | GET | Get device information |
| `/api-docs` | GET | Swagger API documentation |

---

## ✨ Features Implemented

✅ **HTTPS Support** - Full SSL certificate handling
✅ **Automatic Protocol Detection** - HTTPS → Domain → HTTP fallback
✅ **Custom Domain Support** - `rd.myservice.com` ready
✅ **Mantra Device Format** - Correct XML structure with `pgCount` and `CustOpts`
✅ **Error Handling** - Comprehensive error codes and messages
✅ **Quality Validation** - Quality score checking and validation
✅ **Logging** - Detailed logs for debugging
✅ **Retry Logic** - Automatic retry on connection failures
✅ **CORS Enabled** - Frontend integration ready

---

## 🔐 Security Notes

1. **SSL Certificate**: Self-signed certificate is bypassed (safe for localhost)
2. **Local Only**: Bridge runs on localhost:3030 (not exposed to internet)
3. **Device Communication**: Direct HTTPS to device on 127.0.0.1:11101
4. **Data Encryption**: Biometric data is encrypted by the device
5. **Session Keys**: Encrypted with device's public key

---

## 📝 Configuration Files

### Modified Files
- ✅ `src/services/rdservice.service.js` - HTTPS support, retry logic
- ✅ `src/utils/xmlParser.js` - Mantra device format
- ✅ `src/config/config.js` - Updated defaults
- ✅ `swagger.js` - API documentation paths
- ✅ `package.json` - Correct entry point

---

## 🎉 Ready to Use!

Your biometric bridge is fully configured and ready to integrate with your LMS application!

**Next Steps**:
1. Start the server: `node server.js`
2. Test in browser: http://localhost:3030/api-docs
3. Integrate with your frontend application
4. Deploy and enjoy! 🚀

---

**Device Info**:
- Model: Mantra MFS110
- Serial: 8190767
- Status: READY ✅
- Quality: Capturing at ~50-60% (acceptable)

**Bridge Status**: ✅ **OPERATIONAL**
