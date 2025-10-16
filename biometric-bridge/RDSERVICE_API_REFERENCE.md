# RDService API Reference

## 🔌 RDService Endpoints

RDService runs on **http://127.0.0.1:11100** by default.

---

## 1. Device Information

### Endpoint
```
POST /rd/info
```

### Request

**Method**: POST (not GET!)

**Headers**:
```
Content-Type: text/xml
```

**Body**: Empty string `""`

### Example Request (PowerShell)

```powershell
$response = Invoke-RestMethod `
  -Uri "http://127.0.0.1:11100/rd/info" `
  -Method Post `
  -Body "" `
  -ContentType "text/xml"

Write-Output $response
```

### Example Request (JavaScript/Axios)

```javascript
const response = await axios.post(
  'http://127.0.0.1:11100/rd/info',
  '',
  {
    headers: { 
      'Content-Type': 'text/xml'
    },
    timeout: 5000
  }
);
```

### Response (XML)

```xml
<RDService status="READY" info="Device Ready">
  <Interface id="MANTRA.MSIPL" />
  <DeviceInfo 
    dpId="MANTRA.MSIPL" 
    rdsId="MANTRA.WIN.001" 
    rdsVer="1.0.5" 
    mi="MFS110" 
    mc="Morpho" 
    dc="c9fadc71-3090-4e7b-b5bc-0c8ddfdeb5c4"
    status="READY">
  </DeviceInfo>
</RDService>
```

### Response Fields

| Field | Description | Example |
|-------|-------------|---------|
| `dpId` | Device Provider ID | MANTRA.MSIPL |
| `rdsId` | RDService ID | MANTRA.WIN.001 |
| `rdsVer` | RDService Version | 1.0.5 |
| `mi` | Model Info | MFS110 |
| `mc` | Manufacturer Code | Morpho |
| `dc` | Device Code | UUID |
| `status` | Device Status | READY / NOT_READY / BUSY |

---

## 2. Capture Biometric

### Endpoint
```
POST /rd/capture
```

### Request

**Method**: POST

**Headers**:
```
Content-Type: application/xml
```

**Body**: PID Options XML

### PID Options XML Structure

#### For Fingerprint (Thumb)

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
    env="P" />
  <Demo></Demo>
</PidOptions>
```

#### For IRIS

```xml
<?xml version="1.0"?>
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
    env="P" />
  <Demo></Demo>
</PidOptions>
```

#### For Photograph

```xml
<?xml version="1.0"?>
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
    env="P" />
  <Demo></Demo>
</PidOptions>
```

### PID Options Parameters

| Parameter | Description | Values |
|-----------|-------------|--------|
| `fCount` | Finger count | 0-10 (0 = none) |
| `fType` | Finger type | 0 = All, 2 = Thumbs |
| `iCount` | IRIS count | 0-2 (0 = none) |
| `pCount` | Photo count | 0-1 (0 = none) |
| `format` | Data format | 0 = XML |
| `pidVer` | PID version | 2.0 |
| `timeout` | Capture timeout (ms) | 10000-30000 |
| `posh` | Position | UNKNOWN |
| `env` | Environment | P = Production |

### Example Request (JavaScript/Axios)

```javascript
const pidOptions = `<?xml version="1.0"?>
<PidOptions ver="1.0">
  <Opts fCount="1" fType="2" iCount="0" pCount="0" 
        format="0" pidVer="2.0" timeout="10000" 
        posh="UNKNOWN" env="P" />
  <Demo></Demo>
</PidOptions>`;

const response = await axios.post(
  'http://127.0.0.1:11100/rd/capture',
  pidOptions,
  {
    headers: { 
      'Content-Type': 'application/xml'
    },
    timeout: 20000
  }
);
```

### Response (XML)

```xml
<PidData>
  <Resp 
    errCode="0" 
    errInfo="Capture Success" 
    fCount="1" 
    fType="2" 
    iCount="0" 
    pCount="0" 
    nmPoints="38" 
    qScore="85">
  </Resp>
  
  <DeviceInfo 
    dpId="MANTRA.MSIPL" 
    rdsId="MANTRA.WIN.001" 
    rdsVer="1.0.5" 
    mi="MFS110" 
    mc="Morpho">
    <additional_info>
      <Param name="srno" value="1234567" />
      <Param name="sysid" value="DESKTOP-ABC123" />
      <Param name="ts" value="2025-10-14T10:30:00" />
    </additional_info>
  </DeviceInfo>
  
  <Skey ci="20251014">encrypted_session_key_here</Skey>
  
  <Hmac>hmac_value_here</Hmac>
  
  <Data type="X">encrypted_biometric_data_here</Data>
</PidData>
```

### Response Fields

| Field | Description |
|-------|-------------|
| `errCode` | Error code (0 = success) |
| `errInfo` | Error message or success info |
| `qScore` | Quality score (0-100) |
| `nmPoints` | Number of minutiae points |
| `Skey` | Encrypted session key |
| `Hmac` | HMAC for data integrity |
| `Data` | Encrypted biometric template |

### Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| 0 | Success | - |
| 100 | Device not found | Check USB connection |
| 110 | Device not ready | Wait and retry |
| 120 | Timeout | Increase timeout value |
| 700 | Quality too low | Clean sensor, retry |
| 710 | Device not initialized | Restart RDService |

---

## 🔍 Testing Commands

### Test 1: Check RDService Port

```powershell
Test-NetConnection -ComputerName 127.0.0.1 -Port 11100
```

### Test 2: Get Device Info

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:11100/rd/info" -Method Post -Body "" -ContentType "text/xml"
```

### Test 3: Capture Fingerprint

```powershell
$pidOptions = @"
<?xml version="1.0"?>
<PidOptions ver="1.0">
  <Opts fCount="1" fType="2" iCount="0" pCount="0" format="0" pidVer="2.0" timeout="10000" posh="UNKNOWN" env="P" />
  <Demo></Demo>
</PidOptions>
"@

Invoke-RestMethod -Uri "http://127.0.0.1:11100/rd/capture" -Method Post -Body $pidOptions -ContentType "application/xml"
```

---

## ⚠️ Important Notes

### 1. Use POST, not GET

❌ **Wrong**:
```javascript
axios.get('http://127.0.0.1:11100/rd/info')
```

✅ **Correct**:
```javascript
axios.post('http://127.0.0.1:11100/rd/info', '', {
  headers: { 'Content-Type': 'text/xml' }
})
```

### 2. Content-Type Headers

- `/rd/info` → `text/xml`
- `/rd/capture` → `application/xml`

### 3. Timeout Handling

- Default: 10 seconds
- IRIS capture: 15 seconds recommended
- Maximum: 30 seconds

### 4. Quality Score

- Minimum acceptable: 50%
- Good quality: 70%+
- Excellent quality: 85%+

---

## 📚 Integration in Your Bridge Server

Your bridge server (`src/services/rdservice.service.js`) already implements this correctly:

### Device Info

```javascript
async checkConnection() {
  const response = await axios.post(
    `${this.rdserviceUrl}/rd/info`,
    '',
    {
      headers: { 'Content-Type': 'text/xml' },
      timeout: this.timeout
    }
  );
  return response.data;
}
```

### Capture Biometric

```javascript
async capture(type, options = {}) {
  const pidOptions = buildPidOptions(type, options);
  
  const response = await axios.post(
    `${this.rdserviceUrl}/rd/capture`,
    pidOptions,
    {
      headers: { 'Content-Type': 'application/xml' },
      timeout: parseInt(options.timeout || 20000)
    }
  );
  
  return await processPidData(response.data, type);
}
```

---

## 🎯 Quick Reference

| Task | Endpoint | Method | Body |
|------|----------|--------|------|
| Get device info | `/rd/info` | POST | Empty |
| Capture fingerprint | `/rd/capture` | POST | PID XML |
| Capture IRIS | `/rd/capture` | POST | PID XML |
| Capture photo | `/rd/capture` | POST | PID XML |

**Base URL**: http://127.0.0.1:11100

**All requests use POST method!**
