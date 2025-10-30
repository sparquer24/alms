# Biometric Bridge API - Complete Parameters Explanation

## 📋 Table of Contents
1. [API Overview](#api-overview)
2. [PID Options Parameters](#pid-options-parameters)
3. [Capture Request Parameters](#capture-request-parameters)
4. [Response Data Structure](#response-data-structure)
5. [Error Codes](#error-codes)
6. [Usage Examples](#usage-examples)

---

## 🔌 API Overview

### Base URLs
- **Bridge Server**: `http://localhost:3030`
- **RDService**: `http://127.0.0.1:11101` *(Updated for your setup)*

### Available Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Server health check |
| `/api/rdservice/status` | GET | Check RDService connectivity |
| `/api/captureFingerprint` | GET/POST | Capture fingerprint/thumb |
| `/api/captureIris` | GET/POST | Capture iris scan |
| `/api/capturePhotograph` | GET/POST | Capture photograph |
| `/api/deviceInfo` | GET | Get device information |

---

## 🎯 PID Options Parameters

### XML Structure
```xml
<?xml version="1.0"?>
<PidOptions ver="1.0">
  <Opts 
    fCount="1" 
    fType="2" 
    iCount="0" 
    pCount="0" 
    format="0" 
    pidVer="2.0" 
    timeout="10000" 
    posh="UNKNOWN" 
    env="P" 
    wadh="" />
</PidOptions>
```

### Parameter Details

#### 1. **fCount** (Finger Count)
- **Type**: String/Number
- **Range**: `"0"` to `"10"`
- **Description**: Number of fingers to capture
- **Values**:
  - `"0"` = No fingerprint capture
  - `"1"` = Single finger/thumb
  - `"2"` = Two fingers/thumbs
  - `"4"` = Four fingers
  - `"10"` = All ten fingers

**Example**:
```javascript
fCount: "1"  // Capture one thumb
```

---

#### 2. **fType** (Finger Type)
- **Type**: String/Number
- **Values**:
  - `"0"` = All fingers (any position)
  - `"2"` = Thumbs only
  - `"4"` = Four fingers (excluding thumbs)
- **Description**: Specifies which type of fingers to capture

**Example**:
```javascript
fType: "2"  // Thumbs only
```

---

#### 3. **iCount** (IRIS Count)
- **Type**: String/Number
- **Range**: `"0"` to `"2"`
- **Description**: Number of IRIS (eyes) to capture
- **Values**:
  - `"0"` = No IRIS capture
  - `"1"` = Single eye
  - `"2"` = Both eyes

**Example**:
```javascript
iCount: "2"  // Capture both eyes
```

---

#### 4. **pCount** (Photo Count)
- **Type**: String/Number
- **Range**: `"0"` to `"1"`
- **Description**: Whether to capture photograph
- **Values**:
  - `"0"` = No photo
  - `"1"` = Capture face photo

**Example**:
```javascript
pCount: "1"  // Capture photograph
```

---

#### 5. **format** (Data Format)
- **Type**: String/Number
- **Values**:
  - `"0"` = XML format (standard)
  - `"1"` = JSON format (if supported)
- **Description**: Response data format
- **Default**: `"0"` (XML)

---

#### 6. **pidVer** (PID Version)
- **Type**: String
- **Value**: `"2.0"`
- **Description**: PID data specification version
- **Required**: Always use `"2.0"`

---

#### 7. **timeout** (Capture Timeout)
- **Type**: String/Number (milliseconds)
- **Range**: `"5000"` to `"30000"`
- **Description**: Maximum time to wait for capture
- **Recommendations**:
  - Fingerprint: `"10000"` (10 seconds)
  - IRIS: `"15000"` (15 seconds)
  - Photograph: `"10000"` (10 seconds)

**Example**:
```javascript
timeout: "10000"  // 10 seconds
```

---

#### 8. **posh** (Position)
- **Type**: String
- **Values**:
  - `"UNKNOWN"` = Position not specified
  - `"LEFT_THUMB"` = Specific position
  - `"RIGHT_THUMB"` = Specific position
- **Description**: Physical position of operator/device
- **Default**: `"UNKNOWN"`

---

#### 9. **env** (Environment)
- **Type**: String
- **Values**:
  - `"P"` = Production
  - `"S"` = Staging
  - `"D"` = Development
- **Description**: Environment mode for capture
- **Default**: `"P"` (Production)

---

#### 10. **wadh** (Aadhaar Hash) 🆕
- **Type**: String
- **Description**: Aadhaar number hash (for authentication)
- **Default**: Empty string `""`
- **Note**: Used for Aadhaar authentication scenarios

---

## 📤 Capture Request Parameters

### HTTP Methods
Both GET and POST are supported for capture endpoints.

### GET Request (Query Parameters)
```javascript
GET /api/captureFingerprint?timeout=10000
```

**Available Query Parameters**:
- `timeout` - Capture timeout in milliseconds

### POST Request (JSON Body)
```javascript
POST /api/captureFingerprint
Content-Type: application/json

{
  "timeout": 10000,
  "wadh": ""  // Optional Aadhaar hash
}
```

---

## 📥 Response Data Structure

### Success Response

```json
{
  "success": true,
  "errorCode": 0,
  "errorMessage": "Capture Success",
  "qScore": 85,
  "type": "fingerprint",
  "templates": {
    "raw": "encrypted_biometric_data_base64...",
    "sessionKey": "encrypted_session_key...",
    "isoTemplate": null
  },
  "deviceInfo": {
    "model": "MFS110",
    "manufacturer": "Morpho",
    "serialNumber": "1234567",
    "systemId": "DESKTOP-ABC123",
    "deviceProviderId": "MANTRA.MSIPL",
    "rdsId": "MANTRA.WIN.001",
    "rdsVersion": "1.0.5"
  },
  "timestamp": "2025-10-28T09:30:00.000Z"
}
```

### Response Fields Explained

#### 1. **success**
- **Type**: Boolean
- **Values**: `true` | `false`
- **Description**: Whether capture was successful

#### 2. **errorCode**
- **Type**: Number
- **Values**: See [Error Codes](#error-codes) section
- **Description**: Error code (0 = success)

#### 3. **errorMessage**
- **Type**: String
- **Description**: Human-readable error message or success info

#### 4. **qScore** (Quality Score)
- **Type**: Number
- **Range**: `0` to `100`
- **Description**: Quality of captured biometric
- **Quality Levels**:
  - `0-49`: Poor (❌ Not acceptable)
  - `50-69`: Fair (⚠️ Marginal)
  - `70-84`: Good (✅ Acceptable)
  - `85-100`: Excellent (✅✅ Ideal)

#### 5. **type**
- **Type**: String
- **Values**: `"fingerprint"` | `"iris"` | `"photograph"`
- **Description**: Type of biometric captured

#### 6. **templates**
- **Type**: Object
- **Description**: Encrypted biometric data
- **Fields**:
  - `raw`: Encrypted biometric template (Base64)
  - `sessionKey`: Encrypted session key (Base64)
  - `isoTemplate`: ISO-compliant template (after decryption)

#### 7. **deviceInfo**
- **Type**: Object
- **Description**: Information about the capture device
- **Fields**:
  - `model`: Device model (e.g., "MFS110")
  - `manufacturer`: Manufacturer name
  - `serialNumber`: Device serial number
  - `systemId`: Computer system ID
  - `deviceProviderId`: Provider ID
  - `rdsId`: RDService ID
  - `rdsVersion`: RDService version

#### 8. **timestamp**
- **Type**: String (ISO 8601)
- **Description**: Capture timestamp

---

## ⚠️ Error Codes

### HTTP Status Codes

| Status | Meaning | When |
|--------|---------|------|
| 200 | OK | Capture attempted (check `success` field) |
| 408 | Timeout | Capture timeout exceeded |
| 500 | Server Error | Internal server error |
| 503 | Service Unavailable | RDService not running |

### RDService Error Codes

| Code | Message | Description | Solution |
|------|---------|-------------|----------|
| 0 | Capture Success | ✅ Successful capture | - |
| 100 | Device not found | Device not connected | Check USB connection |
| 110 | Device not ready | Device initializing | Wait and retry |
| 120 | Timeout | No biometric placed | Retry capture |
| 700 | Quality too low | Poor quality capture | Clean sensor, retry |
| 710 | Device not initialized | RDService issue | Restart RDService |
| 720 | Capture failed | General capture failure | Check device, retry |

### Error Response Example

```json
{
  "success": false,
  "errorCode": 700,
  "errorMessage": "Quality too low - Clean sensor and retry",
  "qScore": 35,
  "type": "fingerprint",
  "templates": null,
  "deviceInfo": null,
  "timestamp": "2025-10-28T09:30:00.000Z"
}
```

---

## 💡 Usage Examples

### Example 1: Capture Single Thumb (Fingerprint)

**Request**:
```javascript
// Using Bridge API
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
```

**What happens internally**:
1. Bridge server receives request
2. Builds PID XML with: `fCount="1" fType="2" iCount="0" pCount="0"`
3. Sends to RDService at `http://127.0.0.1:11101/rd/capture`
4. RDService communicates with device
5. User places thumb on sensor
6. Device captures and encrypts biometric
7. Returns PID Data (XML)
8. Bridge parses XML to JSON
9. Returns JSON response to frontend

---

### Example 2: Capture Both IRIS

**Request**:
```javascript
const response = await fetch('http://localhost:3030/api/captureIris', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    timeout: 15000  // 15 seconds for iris
  })
});
```

**PID Options sent to RDService**:
```xml
<PidOptions ver="1.0">
  <Opts 
    fCount="0" 
    fType="0" 
    iCount="2" 
    pCount="0" 
    format="0" 
    pidVer="2.0" 
    timeout="15000" 
    posh="UNKNOWN" 
    env="P" 
    wadh="" />
</PidOptions>
```

---

### Example 3: Capture Photograph

**Request**:
```javascript
const response = await fetch('http://localhost:3030/api/capturePhotograph', {
  method: 'GET'  // Can also use GET
});
```

**PID Options sent to RDService**:
```xml
<PidOptions ver="1.0">
  <Opts 
    fCount="0" 
    fType="0" 
    iCount="0" 
    pCount="1" 
    format="0" 
    pidVer="2.0" 
    timeout="10000" 
    posh="UNKNOWN" 
    env="P" 
    wadh="" />
</PidOptions>
```

---

### Example 4: Check Device Status

**Request**:
```javascript
const response = await fetch('http://localhost:3030/api/rdservice/status');
const status = await response.json();

console.log(status);
// {
//   connected: true,
//   rdserviceUrl: "http://127.0.0.1:11101",
//   response: "<?xml version='1.0'?><RDService status='READY'>..."
// }
```

---

### Example 5: Get Device Information

**Request**:
```javascript
const response = await fetch('http://localhost:3030/api/deviceInfo');
const info = await response.json();

console.log(info.data);
// {
//   RDService: {
//     status: "READY",
//     info: "Device Ready",
//     Interface: { id: "MANTRA.MSIPL" },
//     DeviceInfo: { ... }
//   }
// }
```

---

## 🔧 Configuration

Your current configuration in `src/config/config.js`:

```javascript
rdservice: {
  url: 'http://127.0.0.1:11101',  // Updated for your setup
  timeout: 5000
},

capture: {
  defaults: {
    fingerprint: {
      fCount: '1',    // Single thumb
      fType: '2',     // Thumbs
      iCount: '0',    // No iris
      pCount: '0',    // No photo
      timeout: '10000' // 10 seconds
    },
    iris: {
      fCount: '0',    // No fingerprint
      fType: '0',
      iCount: '2',    // Both eyes
      pCount: '0',    // No photo
      timeout: '15000' // 15 seconds
    },
    photograph: {
      fCount: '0',    // No fingerprint
      fType: '0',
      iCount: '0',    // No iris
      pCount: '1',    // Capture photo
      timeout: '10000' // 10 seconds
    }
  }
}
```

---

## 📝 Important Notes

### 1. Port Configuration
- Your RDService runs on **port 11101** (not the default 11100)
- This has been updated in the configuration

### 2. HTTP Headers
The bridge server uses correct headers:
- For `/rd/info`: `Content-Type: text/xml; charset=UTF-8`
- For `/rd/capture`: `Content-Type: text/xml; charset=UTF-8`

### 3. Data Flow
```
Frontend → Bridge Server (port 3030) → RDService (port 11101) → Biometric Device
                                                                          ↓
Frontend ← Bridge Server (JSON)     ← RDService (XML)          ← Encrypted Data
```

### 4. Quality Guidelines
- **Minimum acceptable**: qScore ≥ 50
- **Recommended**: qScore ≥ 70
- **Excellent**: qScore ≥ 85

If qScore < 50, ask user to:
- Clean the sensor
- Place finger/eye properly
- Retry capture

### 5. Timeout Guidelines
- **Fingerprint**: 10 seconds (usually captures in 2-5 seconds)
- **IRIS**: 15 seconds (may need positioning)
- **Photograph**: 10 seconds

---

## 🎯 Quick Reference

### Capture Types Configuration

| Type | fCount | fType | iCount | pCount | Timeout |
|------|--------|-------|--------|--------|---------|
| **Fingerprint** | 1 | 2 | 0 | 0 | 10000 |
| **IRIS** | 0 | 0 | 2 | 0 | 15000 |
| **Photograph** | 0 | 0 | 0 | 1 | 10000 |

### Common Error Handling

```javascript
const result = await captureFingerprint();

if (!result.success) {
  switch(result.errorCode) {
    case 100:
      alert('Device not connected. Please check USB cable.');
      break;
    case 120:
      alert('Capture timeout. Please place your thumb and try again.');
      break;
    case 700:
      alert(`Quality too low (${result.qScore}%). Clean sensor and retry.`);
      break;
    default:
      alert(`Capture failed: ${result.errorMessage}`);
  }
} else {
  if (result.qScore >= 70) {
    // Good quality - proceed
    console.log('Captured with quality:', result.qScore);
  } else {
    // Low quality - ask user to retry
    alert(`Quality is low (${result.qScore}%). Please retry for better quality.`);
  }
}
```

---

## 📚 Additional Resources

- **RDService API Reference**: See `RDSERVICE_API_REFERENCE.md`
- **Quick Start Guide**: See `QUICKSTART.md`
- **README**: See `README.md`

---

**Last Updated**: October 28, 2025
**Server Running**: `http://localhost:3030`
**API Docs**: `http://localhost:3030/api-docs`
