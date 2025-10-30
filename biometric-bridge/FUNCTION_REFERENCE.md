# Biometric Bridge - Complete Function Reference

## 📚 Table of Contents

1. [Overview](#overview)
2. [Service Layer Functions](#service-layer-functions)
3. [API Endpoints](#api-endpoints)
4. [Utility Functions](#utility-functions)
5. [Configuration](#configuration)
6. [Data Structures](#data-structures)
7. [Error Handling](#error-handling)
8. [Integration Examples](#integration-examples)
9. [Testing Functions](#testing-functions)

---

## 🎯 Overview

The Biometric Bridge provides a RESTful API layer between your frontend application and the RDService (biometric device driver). It handles:

- **Communication** with Mantra MFS110 biometric device
- **SSL/TLS** certificate handling for HTTPS connections
- **XML to JSON** transformation
- **Error handling** and retry logic
- **Quality validation** for biometric captures

---

## 🔧 Service Layer Functions

### Class: `RDServiceService`

Located in: `src/services/rdservice.service.js`

#### **Constructor**

```javascript
constructor()
```

**Purpose**: Initializes the RDService connection settings

**What it does**:
- Sets up HTTPS and HTTP URLs for RDService
- Creates HTTPS agent with SSL certificate bypass
- Configures connection timeouts

**Configuration**:
```javascript
this.rdserviceUrl = 'https://127.0.0.1:11101';      // Primary HTTPS
this.rdserviceUrlHttp = 'http://127.0.0.1:11101';   // HTTP fallback
this.rdserviceUrlDomain = 'https://rd.myservice.com:11101'; // Custom domain
this.timeout = 10000; // 10 seconds
```

**HTTPS Agent Settings**:
```javascript
{
  rejectUnauthorized: false,  // Bypass self-signed certificate errors
  keepAlive: false,           // Don't reuse connections
  maxSockets: 1,              // Single connection at a time
  timeout: 10000              // Socket timeout
}
```

---

#### **Function: `makeRequest(endpoint, data, options)`**

```javascript
async makeRequest(endpoint, data, options = {})
```

**Purpose**: Core function for making HTTP/HTTPS requests to RDService

**Parameters**:
- `endpoint` (string) - API endpoint path (e.g., `/rd/capture`, `/rd/info`)
- `data` (string) - Request body (usually XML string)
- `options` (object) - Axios request options
  - `headers` (object) - HTTP headers
  - `timeout` (number) - Request timeout in milliseconds
  - `maxRedirects` (number) - Maximum redirects to follow
  - `validateStatus` (function) - Status code validator

**Returns**: 
```javascript
Promise<AxiosResponse> {
  status: 200,
  data: "<?xml version='1.0'?>...",
  headers: {...},
  config: {...}
}
```

**Logic Flow**:
1. Determines if request is for `/capture` endpoint
2. For capture: Uses HTTPS only
3. For other endpoints: Tries HTTPS, then HTTP fallback
4. Logs each attempt with detailed error information
5. Returns first successful response
6. Throws error if all attempts fail

**Error Handling**:
- Logs detailed error information including:
  - Error message
  - Error code (ECONNREFUSED, ETIMEDOUT, etc.)
  - HTTP status code
  - Syscall information for HTTPS errors

**Example Usage**:
```javascript
const response = await this.makeRequest(
  '/rd/capture',
  pidOptionsXML,
  {
    headers: { 
      'Content-Type': 'text/xml; charset=UTF-8',
      'Accept': '*/*'
    },
    timeout: 20000
  }
);
```

---

#### **Function: `checkConnection()`**

```javascript
async checkConnection()
```

**Purpose**: Verify RDService is running and accessible

**Parameters**: None

**Returns**:
```javascript
{
  connected: true,           // Connection status
  url: "https://...",        // Active URL being used
  responseTime: 234,         // Response time in milliseconds
  error: null,               // Error message (if failed)
  rawResponse: "<?xml..."    // Raw XML response from device
}
```

**When to Use**:
- Health checks
- Application startup verification
- Before attempting biometric capture
- Monitoring device connectivity

**Example Usage**:
```javascript
const status = await rdserviceService.checkConnection();

if (status.connected) {
  console.log(`RDService is online (${status.responseTime}ms)`);
} else {
  console.error(`RDService offline: ${status.error}`);
}
```

---

#### **Function: `getDeviceInfo()`**

```javascript
async getDeviceInfo()
```

**Purpose**: Retrieve detailed information about connected biometric devices

**Parameters**: None

**Returns**:
```javascript
{
  success: true,
  data: {
    RDService: {
      $: {
        status: "READY",
        info: "Mantra MFS110 Authentication Vendor Device Manager"
      },
      Interface: [
        { $: { id: "DEVICEINFO", path: "/rd/info" } },
        { $: { id: "CAPTURE", path: "/rd/capture" } }
      ]
    }
  }
}
```

**Error Response**:
```javascript
{
  success: false,
  error: "Error message"
}
```

**Use Cases**:
- Display device information in UI
- Verify device model and capabilities
- Check RDService version
- Troubleshooting device issues

**Example Usage**:
```javascript
const info = await rdserviceService.getDeviceInfo();

if (info.success) {
  console.log('Device Status:', info.data.RDService.$.status);
  console.log('Device Info:', info.data.RDService.$.info);
}
```

---

#### **Function: `capture(type, options)`**

```javascript
async capture(type, options = {})
```

**Purpose**: Capture biometric data from the device

**Parameters**:
- `type` (string) - Biometric type to capture
  - `"fingerprint"` - Capture fingerprint/thumb
  - `"iris"` - Capture iris scan
  - `"photograph"` - Capture face photo
  
- `options` (object) - Optional capture settings
  - `timeout` (number) - Capture timeout in milliseconds (default: 10000)
  - `pTimeout` (number) - Processing timeout (default: 20000)
  - `pgCount` (number) - Page count (default: 2)
  - `wadh` (string) - Aadhaar hash (optional)
  - `mantrakey` (string) - Mantra API key (optional)

**Returns - Success**:
```javascript
{
  success: true,
  errorCode: 0,
  errorMessage: "Success.",
  qScore: 85,                    // Quality score (0-100)
  nmPoints: 38,                  // Number of minutiae points
  type: "fingerprint",
  templates: {
    raw: "MjAyNS0xMC0yOF...",   // Encrypted biometric data (Base64)
    sessionKey: "kdQYZL6ERw...", // Encrypted session key (Base64)
    sessionKeyCi: "20280813",    // Certificate info
    hmac: "frXNQUynsQFO...",     // HMAC for integrity
    isoTemplate: null             // ISO template (after decryption)
  },
  deviceInfo: {
    model: "MFS110",
    manufacturer: "Morpho",
    deviceProviderId: "MANTRA.MSIPL",
    serialNumber: "8190767",
    systemId: "6A3FCBF38CE62A3FBFF0",
    rdsVersion: "1.4.1",
    rdsId: "RENESAS.MANTRA.001",
    deviceCode: "2174254f-7d7e-4c4b-8c02-6877237cf502",
    modalityType: "Finger",
    deviceType: "L1"
  },
  timestamp: "2025-10-28T15:02:56+05:30"
}
```

**Returns - Error**:
```javascript
{
  success: false,
  errorCode: 100,                // Error code (see error codes section)
  errorMessage: "Error description",
  qScore: 0,
  type: "fingerprint",
  templates: null,
  deviceInfo: null,
  timestamp: "2025-10-28T09:38:58.400Z"
}
```

**Processing Flow**:
1. Build PID Options XML based on type and options
2. Send POST request to `/rd/capture` endpoint
3. Receive encrypted XML response
4. Parse XML to JSON
5. Extract biometric templates and device info
6. Validate quality score
7. Return processed data

**Example Usage**:
```javascript
// Basic fingerprint capture
const result = await rdserviceService.capture('fingerprint');

// Fingerprint with custom timeout
const result = await rdserviceService.capture('fingerprint', {
  timeout: 15000,
  pTimeout: 25000
});

// IRIS capture
const result = await rdserviceService.capture('iris', {
  timeout: 20000
});

// Photograph capture
const result = await rdserviceService.capture('photograph');
```

**Quality Score Guidelines**:
| Score | Quality | Action |
|-------|---------|--------|
| 0-49 | ❌ Poor | Reject - Ask user to retry |
| 50-69 | ⚠️ Fair | Accept with warning |
| 70-84 | ✅ Good | Accept |
| 85-100 | ✅✅ Excellent | Accept |

---

#### **Function: `parseDeviceHealth(xmlResponse)`**

```javascript
async parseDeviceHealth(xmlResponse)
```

**Purpose**: Parse device information for health monitoring

**Parameters**:
- `xmlResponse` (string) - Raw XML response from RDService

**Returns**:
```javascript
{
  fingerprint: {
    available: true,
    manufacturer: "MANTRA.MSIPL",
    model: "MFS110",
    status: "READY",
    rdsVersion: "1.4.1",
    rdsId: "RENESAS.MANTRA.001",
    vendor: "Mantra",
    type: "Fingerprint Scanner"
  },
  iris: {
    available: true,
    manufacturer: null,
    model: null,
    status: "ready"
  },
  photograph: {
    available: true,
    status: "ready"
  }
}
```

**Use Cases**:
- System health dashboards
- Device availability monitoring
- Multi-device detection
- Status page displays

---

## 🌐 API Endpoints

### Base URL
```
http://localhost:3030
```

---

### 1. **GET `/health`**

**Purpose**: Check bridge server health and device connectivity

**Request**:
```http
GET http://localhost:3030/health
```

**Response**:
```json
{
  "status": "ok",
  "service": "biometric-bridge",
  "timestamp": "2025-10-28T09:38:58.400Z",
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
    },
    "iris": {
      "available": true,
      "status": "ready"
    },
    "photograph": {
      "available": true,
      "status": "ready"
    }
  }
}
```

**Status Codes**:
- `200` - Server healthy
- `503` - RDService unavailable

---

### 2. **GET `/api/rdservice/status`**

**Purpose**: Check RDService connectivity only

**Request**:
```http
GET http://localhost:3030/api/rdservice/status
```

**Response - Connected**:
```json
{
  "connected": true,
  "rdserviceUrl": "https://127.0.0.1:11101",
  "response": "<?xml version='1.0'?><RDService status='READY'>...</RDService>"
}
```

**Response - Disconnected**:
```json
{
  "connected": false,
  "rdserviceUrl": "https://127.0.0.1:11101",
  "error": "ECONNREFUSED"
}
```

---

### 3. **GET/POST `/api/captureFingerprint`**

**Purpose**: Capture fingerprint biometric

**Request (GET)**:
```http
GET http://localhost:3030/api/captureFingerprint?timeout=10000
```

**Request (POST)**:
```http
POST http://localhost:3030/api/captureFingerprint
Content-Type: application/json

{
  "timeout": 10000,
  "wadh": "",
  "mantrakey": ""
}
```

**Response - Success**:
```json
{
  "success": true,
  "errorCode": 0,
  "errorMessage": "Success.",
  "qScore": 85,
  "nmPoints": 38,
  "type": "fingerprint",
  "templates": {
    "raw": "[Base64 Encrypted Data]",
    "sessionKey": "[Encrypted Session Key]",
    "sessionKeyCi": "20280813",
    "hmac": "[HMAC Value]"
  },
  "deviceInfo": {
    "model": "MFS110",
    "manufacturer": "Morpho",
    "serialNumber": "8190767",
    "systemId": "6A3FCBF38CE62A3FBFF0"
  },
  "timestamp": "2025-10-28T15:02:56+05:30"
}
```

**Response - Error**:
```json
{
  "success": false,
  "errorCode": 100,
  "errorMessage": "RDService not running or not accessible",
  "qScore": 0,
  "type": "fingerprint",
  "templates": null,
  "deviceInfo": null,
  "timestamp": "2025-10-28T09:38:58.400Z"
}
```

**Status Codes**:
- `200` - Capture attempted (check `success` field)
- `408` - Timeout
- `503` - RDService not available

---

### 4. **GET/POST `/api/captureIris`**

**Purpose**: Capture iris biometric (both eyes)

**Request (GET)**:
```http
GET http://localhost:3030/api/captureIris?timeout=15000
```

**Request (POST)**:
```http
POST http://localhost:3030/api/captureIris
Content-Type: application/json

{
  "timeout": 15000
}
```

**Response**: Same structure as fingerprint capture

---

### 5. **GET/POST `/api/capturePhotograph`**

**Purpose**: Capture face photograph

**Request (GET)**:
```http
GET http://localhost:3030/api/capturePhotograph?timeout=10000
```

**Response**: Same structure as fingerprint capture

---

### 6. **GET `/api/deviceInfo`**

**Purpose**: Get detailed device information

**Request**:
```http
GET http://localhost:3030/api/deviceInfo
```

**Response**:
```json
{
  "success": true,
  "data": {
    "RDService": {
      "$": {
        "status": "READY",
        "info": "Mantra MFS110 Authentication Vendor Device Manager"
      },
      "Interface": [
        {
          "$": {
            "id": "DEVICEINFO",
            "path": "/rd/info"
          }
        },
        {
          "$": {
            "id": "CAPTURE",
            "path": "/rd/capture"
          }
        }
      ]
    }
  }
}
```

---

### 7. **GET `/api-docs`**

**Purpose**: Interactive Swagger API documentation

**Access**: Open in browser
```
http://localhost:3030/api-docs
```

**Features**:
- Interactive API testing
- Request/response examples
- Schema definitions
- Try out endpoints directly

---

## 🛠️ Utility Functions

### XML Parser (`src/utils/xmlParser.js`)

#### **Function: `parseXmlResponse(xmlString)`**

```javascript
async parseXmlResponse(xmlString)
```

**Purpose**: Convert XML response from RDService to JavaScript object

**Parameters**:
- `xmlString` (string) - XML string to parse

**Returns**: JavaScript object representing XML structure

**Parser Configuration**:
```javascript
{
  explicitArray: false,    // Don't force arrays for single elements
  mergeAttrs: false,       // Keep attributes separate in $ notation
  explicitRoot: true,      // Keep root element
  attrkey: '$',            // Attributes key
  charkey: '_',            // Text content key
  trim: true,              // Trim whitespace
  normalizeTags: false     // Don't change tag case
}
```

**Example**:
```javascript
const xml = `<?xml version="1.0"?>
<PidData>
  <Resp errCode="0" qScore="85" />
</PidData>`;

const result = await parseXmlResponse(xml);
// Result: { PidData: { Resp: { $: { errCode: "0", qScore: "85" } } } }
```

---

#### **Function: `buildPidOptions(type, options)`**

```javascript
function buildPidOptions(type, options = {})
```

**Purpose**: Build PID Options XML for biometric capture request

**Parameters**:
- `type` (string) - Biometric type (`fingerprint`, `iris`, `photograph`)
- `options` (object) - Custom options to override defaults

**Returns**: XML string formatted for Mantra device

**Generated XML Structure**:
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

**Configuration by Type**:

**Fingerprint**:
```javascript
{
  fCount: '1',      // Capture 1 finger
  fType: '0',       // FMR type
  iCount: '0',      // No iris
  pCount: '0',      // No photo
  timeout: '10000',
  pTimeout: '20000',
  pgCount: '2'
}
```

**IRIS**:
```javascript
{
  fCount: '0',      // No fingerprint
  fType: '0',
  iCount: '2',      // Both eyes
  pCount: '0',      // No photo
  timeout: '15000',
  pTimeout: '20000',
  pgCount: '2'
}
```

**Photograph**:
```javascript
{
  fCount: '0',      // No fingerprint
  fType: '0',
  iCount: '0',      // No iris
  pCount: '1',      // Face photo
  timeout: '10000',
  pTimeout: '20000',
  pgCount: '2'
}
```

---

### Data Processor (`src/utils/dataProcessor.js`)

#### **Function: `processPidData(pidData, type)`**

```javascript
async processPidData(pidData, type)
```

**Purpose**: Transform parsed XML PID data into structured JSON response

**Parameters**:
- `pidData` (object) - Parsed XML object from `parseXmlResponse()`
- `type` (string) - Biometric type

**Returns**: Structured capture result object

**Processing Steps**:
1. Validate pidData structure
2. Extract response attributes (errCode, qScore, nmPoints)
3. Check for error responses
4. Extract device information
5. Extract additional device parameters
6. Extract biometric templates (Data, Skey, Hmac)
7. Build complete response object

**Error Handling**:
- Validates each extraction step
- Provides detailed error messages
- Logs structure for debugging
- Returns error response if processing fails

---

#### **Function: `extractAdditionalInfo(additionalInfo)`**

```javascript
function extractAdditionalInfo(additionalInfo)
```

**Purpose**: Extract additional device parameters from XML

**Parameters**:
- `additionalInfo` (object) - `additional_info` section from device response

**Extracts**:
- `srno` → serialNumber
- `sysid` → systemId
- `ts` → timestamp
- `modality_type` → modalityType
- `device_type` → deviceType

**Returns**:
```javascript
{
  serialNumber: "8190767",
  systemId: "6A3FCBF38CE62A3FBFF0",
  timestamp: "2025-10-28T15:02:56+05:30",
  modalityType: "Finger",
  deviceType: "L1"
}
```

---

## ⚙️ Configuration

### Main Config (`src/config/config.js`)

```javascript
module.exports = {
  // Server Configuration
  server: {
    port: 3030,                    // Bridge server port
    host: '127.0.0.1',             // Listen address
    frontendUrl: 'http://localhost:3001'  // Frontend origin
  },

  // RDService Configuration
  rdservice: {
    url: 'https://127.0.0.1:11101',  // RDService URL
    timeout: 10000                    // Connection timeout (ms)
  },

  // CORS Configuration
  cors: {
    origins: [
      'http://localhost:3001',
      'http://localhost:3000'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  },

  // Capture Configuration
  capture: {
    defaults: {
      fingerprint: {
        fCount: '1',
        fType: '0',
        iCount: '0',
        pCount: '0',
        timeout: '10000',
        pTimeout: '20000',
        pgCount: '2'
      },
      iris: {
        fCount: '0',
        fType: '0',
        iCount: '2',
        pCount: '0',
        timeout: '15000',
        pTimeout: '20000',
        pgCount: '2'
      },
      photograph: {
        fCount: '0',
        fType: '0',
        iCount: '0',
        pCount: '1',
        timeout: '10000',
        pTimeout: '20000',
        pgCount: '2'
      }
    }
  },

  // Swagger Configuration
  swagger: {
    enabled: true,
    path: '/api-docs',
    title: 'Biometric Bridge API',
    version: '1.0.0',
    description: 'API documentation for Biometric Bridge Server'
  }
};
```

---

## 📊 Data Structures

### Capture Response Structure

```typescript
interface CaptureResponse {
  success: boolean;
  errorCode: number;
  errorMessage: string;
  qScore: number;
  nmPoints?: number;
  type: 'fingerprint' | 'iris' | 'photograph';
  templates: {
    raw: string;           // Base64 encrypted biometric data
    sessionKey: string;    // Base64 encrypted session key
    sessionKeyCi: string;  // Certificate info
    hmac: string;          // HMAC for integrity
    isoTemplate: null | string;  // ISO template (after decryption)
  } | null;
  deviceInfo: {
    model: string;
    manufacturer: string;
    deviceProviderId: string;
    serialNumber: string;
    systemId: string;
    rdsVersion: string;
    rdsId: string;
    deviceCode: string;
    modalityType: string;
    deviceType: string;
  } | null;
  timestamp: string;  // ISO 8601 timestamp
}
```

### Device Info Structure

```typescript
interface DeviceInfo {
  success: boolean;
  data: {
    RDService: {
      $: {
        status: string;
        info: string;
      };
      Interface: Array<{
        $: {
          id: string;
          path: string;
        };
      }>;
    };
  } | null;
  error?: string;
}
```

### Health Check Structure

```typescript
interface HealthCheck {
  status: 'ok' | 'error';
  service: string;
  timestamp: string;
  rdservice: {
    connected: boolean;
    url: string;
    responseTime: number | null;
    error?: string;
  };
  devices: {
    fingerprint: DeviceStatus;
    iris: DeviceStatus;
    photograph: DeviceStatus;
  };
}

interface DeviceStatus {
  available: boolean;
  manufacturer?: string;
  model?: string;
  status: string;
  rdsVersion?: string;
  rdsId?: string;
}
```

---

## ⚠️ Error Handling

### Error Codes

| Code | Name | Description | Solution |
|------|------|-------------|----------|
| 0 | SUCCESS | Capture successful | - |
| 100 | DEVICE_NOT_FOUND | RDService not accessible | Check RDService is running |
| 110 | CONNECTION_INTERRUPTED | Connection reset | Restart RDService or retry |
| 120 | TIMEOUT | Capture timeout | Increase timeout or retry |
| 700 | QUALITY_LOW | Quality too low | Clean sensor, retry |
| 710 | DEVICE_NOT_INITIALIZED | Device not ready | Restart RDService |
| 999 | UNKNOWN_ERROR | Unexpected error | Check logs for details |

### HTTP Status Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | OK | Request successful |
| 405 | Method Not Allowed | Wrong HTTP method used |
| 408 | Request Timeout | Capture timeout exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | RDService not running |

### Connection Error Codes

| Code | Description |
|------|-------------|
| ECONNREFUSED | Connection refused - RDService not running |
| ETIMEDOUT | Connection timeout |
| ECONNRESET | Connection reset by peer |
| EPIPE | Broken pipe |
| CERT_HAS_EXPIRED | SSL certificate expired |
| UNABLE_TO_VERIFY_LEAF_SIGNATURE | SSL certificate issue |

---

## 💻 Integration Examples

### React/Next.js Integration

```javascript
import { useState } from 'react';

export function BiometricCapture() {
  const [capturing, setCapturing] = useState(false);
  const [result, setResult] = useState(null);

  const captureFingerprint = async () => {
    setCapturing(true);
    setResult(null);

    try {
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
      setResult(data);

      if (data.success) {
        if (data.qScore >= 70) {
          // Good quality - proceed with submission
          console.log('Biometric captured successfully');
          await submitToBackend(data);
        } else {
          // Low quality - ask user to retry
          alert(`Quality is low (${data.qScore}%). Please retry for better quality.`);
        }
      } else {
        // Capture failed
        alert(`Capture failed: ${data.errorMessage}`);
      }
    } catch (error) {
      console.error('Capture error:', error);
      alert('Failed to connect to biometric device');
    } finally {
      setCapturing(false);
    }
  };

  const submitToBackend = async (biometricData) => {
    // Submit encrypted biometric data to your backend
    const response = await fetch('/api/submit-biometric', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: '12345',
        biometric: {
          type: biometricData.type,
          data: biometricData.templates.raw,
          sessionKey: biometricData.templates.sessionKey,
          hmac: biometricData.templates.hmac,
          quality: biometricData.qScore,
          deviceInfo: biometricData.deviceInfo
        }
      })
    });

    return response.json();
  };

  return (
    <div>
      <button 
        onClick={captureFingerprint} 
        disabled={capturing}
      >
        {capturing ? 'Capturing...' : 'Capture Fingerprint'}
      </button>

      {result && (
        <div>
          <h3>Result:</h3>
          <p>Status: {result.success ? '✅ Success' : '❌ Failed'}</p>
          <p>Quality: {result.qScore}%</p>
          <p>Message: {result.errorMessage}</p>
        </div>
      )}
    </div>
  );
}
```

### Node.js/Express Backend Integration

```javascript
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// Endpoint to capture biometric
app.post('/api/capture-biometric', async (req, res) => {
  try {
    const { type = 'fingerprint', timeout = 10000 } = req.body;

    // Call bridge server
    const response = await axios.post(
      `http://localhost:3030/api/capture${type.charAt(0).toUpperCase() + type.slice(1)}`,
      { timeout },
      { timeout: timeout + 5000 } // Add buffer to timeout
    );

    const biometricData = response.data;

    if (biometricData.success) {
      // Store encrypted biometric data in database
      // DO NOT decrypt - store as-is for security
      const saved = await saveBiometricData({
        userId: req.user.id,
        type: biometricData.type,
        encryptedData: biometricData.templates.raw,
        sessionKey: biometricData.templates.sessionKey,
        hmac: biometricData.templates.hmac,
        quality: biometricData.qScore,
        deviceInfo: biometricData.deviceInfo,
        capturedAt: new Date()
      });

      res.json({
        success: true,
        message: 'Biometric captured and stored',
        quality: biometricData.qScore,
        id: saved.id
      });
    } else {
      res.status(400).json({
        success: false,
        error: biometricData.errorMessage
      });
    }
  } catch (error) {
    console.error('Capture error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to capture biometric'
    });
  }
});

async function saveBiometricData(data) {
  // Your database save logic
  // Example with Prisma:
  return await prisma.biometric.create({
    data: {
      userId: data.userId,
      type: data.type,
      encryptedData: data.encryptedData,
      sessionKey: data.sessionKey,
      hmac: data.hmac,
      quality: data.quality,
      deviceInfo: JSON.stringify(data.deviceInfo),
      capturedAt: data.capturedAt
    }
  });
}
```

### Error Handling Best Practices

```javascript
async function captureBiometricWithRetry(maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch('http://localhost:3030/api/captureFingerprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeout: 10000 })
      });

      const result = await response.json();

      if (result.success) {
        if (result.qScore >= 50) {
          return { success: true, data: result };
        } else {
          // Quality too low
          if (attempt < maxRetries) {
            console.log(`Quality low (${result.qScore}%), retrying... (${attempt}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s
            continue;
          }
        }
      }

      // Handle specific error codes
      switch (result.errorCode) {
        case 100:
          return {
            success: false,
            error: 'Device not connected. Please check USB connection.'
          };
        case 120:
          if (attempt < maxRetries) {
            console.log(`Timeout, retrying... (${attempt}/${maxRetries})`);
            continue;
          }
          return {
            success: false,
            error: 'Capture timeout. Please place your finger and try again.'
          };
        case 700:
          return {
            success: false,
            error: 'Quality too low. Please clean the sensor and retry.'
          };
        default:
          return {
            success: false,
            error: result.errorMessage
          };
      }
    } catch (error) {
      if (attempt < maxRetries) {
        console.log(`Error occurred, retrying... (${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
      return {
        success: false,
        error: 'Failed to connect to biometric service'
      };
    }
  }

  return {
    success: false,
    error: 'Maximum retry attempts reached'
  };
}
```

---

## 🧪 Testing Functions

### Test RDService Connection

```bash
node test-rdservice-connection.js
```

This diagnostic tool will:
- Test HTTPS on port 11101
- Test HTTPS on port 11100
- Test HTTP on port 11101
- Test HTTP on port 11100
- Test both `/rd/info` and `/rd/capture` endpoints
- Display detailed connection results
- Recommend the working URL

### Manual Testing with cURL

**Test Device Info**:
```bash
curl -k -X POST https://127.0.0.1:11101/rd/info \
  -H "Content-Type: text/xml; charset=UTF-8" \
  -d ""
```

**Test Capture**:
```bash
curl -k -X POST https://127.0.0.1:11101/rd/capture \
  -H "Content-Type: text/xml; charset=UTF-8" \
  -d "<?xml version='1.0'?> <PidOptions ver='1.0'> <Opts fCount='1' fType='0' iCount='0' pCount='0' pgCount='2' format='0' pidVer='2.0' timeout='10000' pTimeout='20000' posh='UNKNOWN' env='P' /> <CustOpts><Param name='mantrakey' value='' /></CustOpts> </PidOptions>"
```

### Test Bridge API

**Health Check**:
```bash
curl http://localhost:3030/health
```

**RDService Status**:
```bash
curl http://localhost:3030/api/rdservice/status
```

**Capture Fingerprint**:
```bash
curl -X POST http://localhost:3030/api/captureFingerprint \
  -H "Content-Type: application/json" \
  -d '{"timeout": 10000}'
```

---

## 📝 Summary

This biometric bridge provides:

✅ **Secure HTTPS Communication** with self-signed certificate handling
✅ **Automatic Protocol Detection** and retry logic
✅ **Complete API Layer** for frontend integration
✅ **Error Handling** with specific error codes
✅ **Quality Validation** for biometric captures
✅ **Device Information** extraction
✅ **XML to JSON** transformation
✅ **Comprehensive Logging** for debugging
✅ **CORS Support** for web applications
✅ **Swagger Documentation** for API testing

---

## 🔗 Related Files

- `src/services/rdservice.service.js` - Core service layer
- `src/utils/xmlParser.js` - XML parsing utilities
- `src/utils/dataProcessor.js` - Data transformation
- `src/controllers/biometric.controller.js` - API controllers
- `src/routes/biometric.routes.js` - API routes
- `src/config/config.js` - Configuration
- `test-rdservice-connection.js` - Connection diagnostic tool

---

**Version**: 1.0.0  
**Last Updated**: October 28, 2025  
**Device**: Mantra MFS110  
**RDService**: RENESAS.MANTRA.001 v1.4.1
