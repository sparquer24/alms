# Mantra MIS100V2 Iris Scanner Setup Guide

## 🎯 Quick Diagnosis

Run this command to test your iris scanner connection:

```bash
node test-iris-connection.js
```

This will automatically detect which port your iris RDService is running on.

---

## 📋 Current Configuration

The bridge server is now configured to support multiple devices:

### Device URLs (Auto-configured)

| Device | Default URL | Default Port |
|--------|-------------|--------------|
| **Fingerprint** (MFS110) | `https://127.0.0.1:11101` | 11101 |
| **Iris** (MIS100V2) | `https://127.0.0.1:11102` | 11102 |
| **Photograph** | `https://127.0.0.1:11103` | 11103 |

### Configuration File

Location: `src/config/config.js`

```javascript
rdservice: {
  fingerprint: {
    url: 'https://127.0.0.1:11101',
    timeout: 10000
  },
  iris: {
    url: 'https://127.0.0.1:11102',  // ← MIS100V2 iris scanner
    timeout: 15000
  }
}
```

---

## 🔧 Common Iris Scanner Ports

Mantra devices typically use these ports:

| Device Type | Common Ports | Check First |
|-------------|--------------|-------------|
| MIS100V2 (Iris) | 11102, 11100, 11101 | ✅ 11102 |
| MFS110 (Fingerprint) | 11101, 11100 | ✅ 11101 |
| Face Device | 11103, 11100 | ✅ 11103 |

---

## 🚀 Setup Steps

### 1. Verify Iris Device Installation

**Check Device Manager:**
1. Open Device Manager (Win + X → Device Manager)
2. Look for "Mantra MIS100" or "Iris Scanner" under "Biometric Devices" or "Imaging Devices"
3. If not present, install MIS100V2 drivers

**Check RDService:**
1. Open Task Manager (Ctrl + Shift + Esc)
2. Go to "Details" tab
3. Look for RDService processes:
   - `RDService.exe` or `MantraRDService.exe`
   - You should see TWO instances if both fingerprint and iris are installed

### 2. Find Iris RDService Port

**Option A: Run Diagnostic (Recommended)**
```bash
node test-iris-connection.js
```

**Option B: Manual Check with PowerShell**
```powershell
# Check all RDService ports
netstat -ano | findstr "1110"

# Check specifically for iris (port 11102)
curl -k https://127.0.0.1:11102/rd/info
```

**Option C: Check RDService Configuration**
1. Navigate to: `C:\Program Files\Mantra\` or `C:\Program Files (x86)\Mantra\`
2. Look for MIS100 folder
3. Check `config.xml` or `RDService.config` for port number

### 3. Update Configuration (If Needed)

If your iris scanner is on a different port, update `src/config/config.js`:

```javascript
rdservice: {
  iris: {
    url: 'https://127.0.0.1:YOUR_IRIS_PORT',  // Change port number
    timeout: 15000
  }
}
```

Or set environment variable:
```bash
# In PowerShell
$env:RDSERVICE_IRIS_URL = "https://127.0.0.1:11102"
```

### 4. Restart Bridge Server

```bash
# Stop current server (Ctrl + C)
npm start
```

---

## 🧪 Testing Iris Capture

### Test 1: Device Info

```bash
curl -X GET http://localhost:3030/api/deviceInfo
```

Expected response should show iris device:
```json
{
  "success": true,
  "data": {
    "RDService": {
      "$": {
        "status": "READY",
        "info": "Mantra MIS100 Iris Authentication Device"
      }
    }
  }
}
```

### Test 2: Iris Capture

```bash
curl -X POST http://localhost:3030/api/captureIris \
  -H "Content-Type: application/json" \
  -d '{"timeout": 15000}'
```

**Expected Behaviors:**

✅ **Success (After Scanning Both Eyes):**
```json
{
  "success": true,
  "errorCode": 0,
  "errorMessage": "Success.",
  "qScore": 75,
  "type": "iris",
  "templates": {
    "raw": "[Base64 Encrypted Data]",
    ...
  }
}
```

⏱️ **Timeout (No Scan Performed):**
```json
{
  "success": false,
  "errorCode": 120,
  "errorMessage": "Capture timeout - device did not respond"
}
```
*This is normal if you don't place eyes in front of scanner*

❌ **Connection Error:**
```json
{
  "success": false,
  "errorCode": 100,
  "errorMessage": "RDService not running or not accessible"
}
```
*Check if iris RDService is running and port is correct*

---

## 🔍 Troubleshooting

### Issue 1: "RDService not running" (Error 100)

**Causes:**
- Iris RDService not started
- Wrong port configuration
- Device not connected

**Solutions:**
1. Check Task Manager for RDService processes
2. Run diagnostic: `node test-iris-connection.js`
3. Restart RDService:
   ```bash
   # Find RDService path and restart it
   net stop "Mantra RDService"
   net start "Mantra RDService"
   ```
4. Verify USB connection of MIS100V2 device

### Issue 2: Timeout (Error 120)

**Causes:**
- No eyes placed in front of scanner
- Scanner not ready
- Scanner hardware issue

**Solutions:**
1. Place both eyes in front of iris scanner
2. Wait for scanner to initialize (check LED indicators)
3. Clean scanner lens
4. Increase timeout in capture request:
   ```javascript
   { timeout: 30000 } // 30 seconds
   ```

### Issue 3: Wrong Device (Fingerprint Instead of Iris)

**Symptom:** Capture expects fingerprint, not iris

**Cause:** Iris RDService is on same port as fingerprint (11101)

**Solution:**
- Check if you have separate RDService for iris
- Both devices need separate RDService instances on different ports
- Reinstall MIS100V2 drivers to set up separate service

### Issue 4: SSL Certificate Errors

**Symptom:** UNABLE_TO_VERIFY_LEAF_SIGNATURE or SSL errors

**Solution:** Already handled! The bridge bypasses SSL verification:
```javascript
httpsAgent: new https.Agent({
  rejectUnauthorized: false  // ✅ Handles self-signed certs
})
```

### Issue 5: Quality Score Too Low

**Symptom:** qScore < 50

**Solutions:**
1. Clean iris scanner lens
2. Ensure proper lighting (not too bright, not too dark)
3. Position eyes correctly in front of scanner
4. Remove glasses if wearing them
5. Keep eyes wide open during scan

---

## 📝 Iris PID Options (Technical Details)

The bridge automatically sends correct XML for iris capture:

```xml
<?xml version="1.0"?>
<PidOptions ver="1.0">
  <Opts 
    fCount="0"     <!-- No fingerprint -->
    fType="0" 
    iCount="2"     <!-- Both eyes -->
    pCount="0"     <!-- No photo -->
    pgCount="2" 
    format="0" 
    pidVer="2.0" 
    timeout="15000" 
    pTimeout="20000" 
    posh="UNKNOWN" 
    env="P" />
  <CustOpts>
    <Param name="mantrakey" value="" />
  </CustOpts>
</PidOptions>
```

**Key Parameters for Iris:**
- `iCount="2"` - Capture both eyes
- `fCount="0"` - No fingerprint
- `timeout="15000"` - 15 seconds (iris takes longer than fingerprint)

---

## 🔄 Multi-Device Architecture

```
Frontend (http://localhost:3001)
    ↓
Bridge Server (http://localhost:3030)
    ↓
    ├── /api/captureFingerprint → RDService :11101 → MFS110 Device
    ├── /api/captureIris         → RDService :11102 → MIS100V2 Device
    └── /api/capturePhotograph   → RDService :11103 → Face Device
```

**How it works:**
1. Each device has its own RDService on a different port
2. Bridge server routes requests to correct RDService based on capture type
3. Each RDService communicates with its physical device
4. Bridge returns unified JSON response format

---

## ✅ Verification Checklist

Before using iris capture in production, verify:

- [ ] MIS100V2 device shows in Device Manager
- [ ] Iris RDService is running (Task Manager)
- [ ] Diagnostic test passes (`node test-iris-connection.js`)
- [ ] Device info returns iris scanner details
- [ ] Test capture completes successfully (with actual eye scan)
- [ ] Quality score is acceptable (> 50%)
- [ ] Bridge server logs show correct port being used
- [ ] Both eyes are captured (iCount="2")

---

## 🆘 Still Not Working?

If iris capture still fails after following all steps:

### Check This:

1. **Do you actually have MIS100V2 hardware?**
   - Verify physical device is connected via USB
   - Check for green/blue LED indicator on device

2. **Is RDService installed for iris?**
   - Look in: `C:\Program Files\Mantra\`
   - Should have separate folder for MIS100

3. **Are drivers installed?**
   - Download from: Mantra official website
   - Version should be 1.4.x or higher

4. **Port conflict?**
   - Run: `netstat -ano | findstr "1110"`
   - Check if multiple services using same port

### Get Detailed Logs:

Run bridge server with detailed logging:
```bash
# Set log level
$env:DEBUG = "*"
npm start
```

Then attempt iris capture and check logs for exact error.

### Alternative: Manual RDService Test

Test iris RDService directly (bypass bridge):

```bash
# PowerShell
$xml = '<?xml version="1.0"?> <PidOptions ver="1.0"> <Opts fCount="0" fType="0" iCount="2" pCount="0" pgCount="2" format="0" pidVer="2.0" timeout="15000" pTimeout="20000" posh="UNKNOWN" env="P" /> </PidOptions>'

Invoke-WebRequest -Uri https://127.0.0.1:11102/rd/capture `
  -Method POST `
  -ContentType "text/xml; charset=UTF-8" `
  -Body $xml `
  -SkipCertificateCheck
```

If this works, bridge configuration is the issue.
If this fails, RDService or device is the issue.

---

## 📞 Support Resources

- **Mantra Support**: support@mantratec.com
- **Driver Downloads**: https://www.mantratec.com/downloads
- **RDService Issues**: Check Windows Event Viewer → Application logs
- **Bridge Issues**: Check `biometric-bridge` console logs

---

**Last Updated:** October 29, 2025  
**Bridge Version:** 1.0.0  
**Supported Device:** Mantra MIS100V2 Iris Scanner  
**RDService Version:** 1.4.x or higher
