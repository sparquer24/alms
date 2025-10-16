# Biometric Bridge Server

A local bridge server that facilitates communication between web browsers and RDService (biometric device driver) for capturing fingerprints, iris scans, and photographs.

## 🆕 Now with MVC Architecture!

The server has been refactored to follow **Model-View-Controller (MVC)** pattern for better maintainability and scalability.

**📚 Read the full architecture documentation:** [MVC_ARCHITECTURE.md](./MVC_ARCHITECTURE.md)

## Overview

The Biometric Bridge Server acts as an intermediary that:
1. Receives HTTP requests from the Next.js frontend
2. Translates them to XML requests for RDService
3. Communicates with RDService (running on port 11100)
4. Transforms XML responses to JSON
5. Returns structured data to the frontend

## Architecture

```
Browser (Next.js) ←→ Bridge Server (Port 3030) ←→ RDService (Port 11100) ←→ Device SDK ←→ Hardware
     (JSON/HTTP)       MVC Architecture        (XML/HTTP)
```

## 📁 Project Structure (MVC)

```
biometric-bridge/
├── src/
│   ├── config/              # Configuration
│   ├── controllers/         # Request handlers
│   ├── services/            # Business logic
│   ├── routes/              # API routes
│   ├── middleware/          # Express middleware
│   ├── utils/               # Helper functions
│   ├── app.js              # Express app
│   └── server.js           # Entry point
├── bridge-server.js        # Legacy (deprecated)
└── swagger.js              # Swagger config
```

See [MVC_ARCHITECTURE.md](./MVC_ARCHITECTURE.md) for detailed documentation

## Installation & Setup

### Prerequisites

1. **Node.js** (v16 or higher)
2. **RDService** installed and running
   - Default port: `11100`
   - Download from device manufacturer (e.g., Mantra, Morpho)
3. **Biometric Device Drivers** installed
4. **Connected Biometric Devices**
   - Fingerprint scanner (e.g., Mantra MFS110)
   - Iris scanner (e.g., Mantra MIS100)

### Install Dependencies

From the project root:

```bash
npm install
```

This will install dependencies for all workspaces including the bridge server.

### Configuration

The bridge server uses environment variables (optional):

Create `.env` file in `biometric-bridge/` directory:

```env
BRIDGE_PORT=3030
RDSERVICE_URL=http://127.0.0.1:11100
FRONTEND_URL=http://localhost:3001
```

**Defaults:**
- Bridge Port: `3030`
- RDService URL: `http://127.0.0.1:11100`
- Frontend URL: `http://localhost:3001`

## Running the Server

### Development Mode

Start all services (backend, frontend, and bridge):

```bash
npm run dev
```

This will start:
- Backend on port 5000
- Frontend on port 3001
- **Bridge on port 3030**

### Start Bridge Only

```bash
npm run dev:bridge
```

Or directly:

```bash
cd biometric-bridge
npm start
```

### Verify Bridge is Running

1. Open browser: http://localhost:3030/health
   - Should return: `{"status":"ok","service":"biometric-bridge","timestamp":"..."}`

2. Check RDService connectivity: http://localhost:3030/api/rdservice/status
   - Should return connection status

## API Endpoints

### Health Check
```
GET /health
```
Returns bridge server health status.

**Response:**
```json
{
  "status": "ok",
  "service": "biometric-bridge",
  "timestamp": "2025-10-14T10:30:00.000Z"
}
```

### RDService Status
```
GET /api/rdservice/status
```
Check if RDService is running and accessible.

**Response:**
```json
{
  "connected": true,
  "rdserviceUrl": "http://127.0.0.1:11100",
  "response": "<RDService info XML>"
}
```

### Capture Fingerprint
```
GET /api/captureFingerprint
POST /api/captureFingerprint
```
Captures fingerprint/thumb impression.

**Query Parameters (optional):**
- `timeout`: Capture timeout in milliseconds (default: 10000)

**Response:**
```json
{
  "success": true,
  "errorCode": 0,
  "errorMessage": "Capture Success",
  "qScore": 85,
  "type": "fingerprint",
  "templates": {
    "raw": "base64_encoded_encrypted_data",
    "sessionKey": "encrypted_session_key",
    "isoTemplate": null
  },
  "deviceInfo": {
    "model": "MFS110",
    "manufacturer": "MANTRA.MSIPL",
    "serialNumber": "2345678",
    "rdsVersion": "1.0.5"
  },
  "timestamp": "2025-10-14T10:30:45+05:30",
  "hmac": "integrity_hash"
}
```

### Capture Iris
```
GET /api/captureIris
POST /api/captureIris
```
Captures iris scan (both eyes).

**Query Parameters (optional):**
- `timeout`: Capture timeout in milliseconds (default: 15000)

### Capture Photograph
```
GET /api/capturePhotograph
POST /api/capturePhotograph
```
Captures face photograph.

### Get Device Info
```
GET /api/deviceInfo
```
Retrieves information about connected biometric devices.

## Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| 0 | Success | - |
| 100 | Device not ready | Check device connection |
| 110 | Device not found | Install drivers, connect device |
| 111 | Device busy | Wait and retry |
| 120 | Capture timeout | User didn't place finger/eye in time |
| 300 | Poor quality | Clean device, better positioning |
| 700 | Invalid PID options | Check request format |
| 999 | Bridge/unknown error | Check logs |

## Quality Score Thresholds

- **Fingerprint:** Minimum 60%
- **Iris:** Minimum 70%
- **Photograph:** Minimum 50%

## Frontend Integration

The bridge is already integrated into the BiometricInformation component.

### Using the Service

```typescript
import { biometricService } from '@/services/biometricService';

// Check if bridge is available
const isHealthy = await biometricService.checkHealth();

// Capture fingerprint
const response = await biometricService.captureFingerprint();

// Validate quality
const validation = biometricService.validateQuality(response);
if (!validation.valid) {
  console.error(validation.message);
}
```

## Troubleshooting

### Bridge Server Won't Start

**Error:** `Port 3030 already in use`

**Solution:**
```bash
# Windows
netstat -ano | findstr :3030
taskkill /PID <PID> /F

# Change port in .env
BRIDGE_PORT=3031
```

### RDService Not Found (Error 100/110)

**Symptoms:**
- `ECONNREFUSED` error
- Device not found

**Solutions:**
1. Check if RDService is running:
   ```bash
   curl http://127.0.0.1:11100/rd/info
   ```

2. Verify RDService port in Windows Services or Task Manager

3. Restart RDService:
   - Windows: Services → Find RDService → Restart
   - Or check device manufacturer's documentation

4. Check firewall settings (allow port 11100)

### Device Not Detected

**Solutions:**
1. Check physical connection (USB)
2. Reinstall device drivers
3. Restart computer
4. Check Device Manager for hardware issues
5. Try different USB port

### Poor Quality Captures (Error 300)

**Solutions:**
1. Clean the scanner surface
2. Ensure proper finger/eye placement
3. Good lighting for photographs
4. Avoid wet/oily fingers
5. Multiple capture attempts

### CORS Errors in Browser

**Solution:**
The bridge server has CORS enabled for `localhost:3000` and `localhost:3001`.

If using different ports, update `bridge-server.js`:
```javascript
app.use(cors({
  origin: ['http://localhost:YOUR_PORT'],
  // ...
}));
```

### Bridge Shows as "Offline" in UI

**Checklist:**
1. Verify bridge is running: `http://localhost:3030/health`
2. Check browser console for errors
3. Verify BRIDGE_URL in frontend env:
   ```
   NEXT_PUBLIC_BRIDGE_URL=http://localhost:3030
   ```
4. Check network tab in browser DevTools

## Testing

### Test RDService Direct Connection
```bash
curl -X POST http://127.0.0.1:11100/rd/info
```

### Test Bridge Endpoints
```bash
# Health check
curl http://localhost:3030/health

# RDService status
curl http://localhost:3030/api/rdservice/status

# Capture fingerprint (requires device)
curl http://localhost:3030/api/captureFingerprint
```

### Test from Browser Console
```javascript
// Check bridge health
fetch('http://localhost:3030/health')
  .then(r => r.json())
  .then(console.log);

// Test fingerprint capture
fetch('http://localhost:3030/api/captureFingerprint')
  .then(r => r.json())
  .then(console.log);
```

## Logs & Debugging

### Enable Detailed Logging

Edit `bridge-server.js` and add more console.log statements as needed.

### View Real-time Logs

When running with `npm run dev`, bridge logs are prefixed with `[bridge]` in the console.

### Common Log Messages

- `Capturing fingerprint...` - Capture initiated
- `Received response from RDService` - RDService responded
- `Capture successful - Quality: 85%` - Success
- `fingerprint capture error: ECONNREFUSED` - RDService not running

## Production Deployment

### Windows Service Setup

To run bridge as a Windows service:

1. Install `node-windows`:
   ```bash
   npm install -g node-windows
   ```

2. Create service script `install-service.js`:
   ```javascript
   const Service = require('node-windows').Service;
   
   const svc = new Service({
     name: 'Biometric Bridge',
     description: 'Bridge server for biometric device communication',
     script: 'C:\\path\\to\\LMS\\biometric-bridge\\bridge-server.js'
   });
   
   svc.on('install', () => {
     svc.start();
   });
   
   svc.install();
   ```

3. Run: `node install-service.js`

### Auto-start on Login (Alternative)

Add to Windows Startup folder:
```
shell:startup
```

Create shortcut to:
```
C:\path\to\node.exe C:\path\to\LMS\biometric-bridge\bridge-server.js
```

## Security Considerations

⚠️ **IMPORTANT SECURITY NOTES:**

1. **Local-only Access**: Bridge binds to `127.0.0.1` (localhost) only
2. **No Network Exposure**: Should NOT be accessible from network
3. **CORS Restricted**: Only allows requests from specified frontend URLs
4. **No Authentication**: Relies on local-only access for security
5. **Encrypted Data**: Biometric templates remain encrypted from RDService
6. **No Logging of Templates**: Never log raw biometric data

## Data Flow

1. **User Action**: Clicks "Capture Fingerprint" in browser
2. **Frontend**: Calls `biometricService.captureFingerprint()`
3. **HTTP Request**: `GET http://localhost:3030/api/captureFingerprint`
4. **Bridge**: Builds XML PidOptions
5. **Bridge**: `POST http://127.0.0.1:11100/rd/capture` with XML
6. **RDService**: Communicates with device SDK
7. **Device SDK**: Interacts with hardware
8. **Hardware**: Captures biometric
9. **Device SDK → RDService**: Returns encrypted data
10. **RDService → Bridge**: XML PidData response
11. **Bridge**: Parses XML, extracts data, transforms to JSON
12. **Bridge → Frontend**: JSON BiometricResponse
13. **Frontend**: Validates quality, displays result
14. **Frontend → Backend** (optional): Sends for verification/storage

## Support

For issues with:
- **Bridge Server**: Check this README, logs, and GitHub issues
- **RDService**: Contact device manufacturer support
- **Device Drivers**: Device manufacturer support
- **Hardware**: Device manufacturer support

## License

ISC
