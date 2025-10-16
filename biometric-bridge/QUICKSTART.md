# Biometric Bridge - Quick Start Guide

## Setup in 5 Minutes

### Step 1: Prerequisites ✓

Before starting, ensure you have:

- [ ] Node.js installed (v16+)
- [ ] RDService installed from device manufacturer
- [ ] Device drivers installed
- [ ] Biometric device(s) connected via USB

### Step 2: Install Dependencies

From the project root (`LMS/`):

```bash
npm install
```

### Step 3: Start Development Environment

```bash
npm run dev
```

This starts:
- ✅ Backend (port 5000)
- ✅ Frontend (port 3001)
- ✅ **Bridge Server (port 3030)**

### Step 4: Verify Bridge is Running

Open your browser and check:

**Health Check:**
http://localhost:3030/health

Expected: `{"status":"ok",...}`

**RDService Status:**
http://localhost:3030/api/rdservice/status

Expected: `{"connected":true,...}`

### Step 5: Test Biometric Capture

1. Navigate to the Biometric Information form in your app
2. Look for the green "Device Ready" indicator
3. Click "Capture Fingerprint" button
4. Place finger on the scanner
5. Wait for capture confirmation

## Troubleshooting

### Bridge Won't Start

```bash
# Check if port 3030 is in use
netstat -ano | findstr :3030

# Kill the process if needed
taskkill /PID <PID> /F
```

### RDService Not Connected

1. **Check RDService is running:**
   - Open Task Manager
   - Look for RDService.exe or MantraService.exe

2. **Test RDService directly:**
   ```bash
   curl http://127.0.0.1:11100/rd/info
   ```

3. **Restart RDService:**
   - Windows Services → Find RDService → Restart
   - Or restart from device software

### Device Not Found

1. Check USB connection
2. Verify drivers installed (Device Manager)
3. Reconnect device
4. Restart computer if needed

## Common Error Messages

| Message | Solution |
|---------|----------|
| "Bridge disconnected" | Start bridge server: `npm run dev:bridge` |
| "Device not found (110)" | Check RDService running, device connected |
| "Quality too low" | Clean scanner, better placement, retry |
| "Capture timeout" | User didn't place finger in time |

## Testing Without Device

If you don't have a physical device yet:

1. Check bridge health endpoint works
2. Verify API structure with mock responses
3. Enable "Manual Upload" fallback in UI
4. Use the manual file upload for testing

## Next Steps

✅ Bridge working → Test all three biometric types:
- Fingerprint/Thumb
- Iris scan
- Photograph

✅ All captures working → Integrate with backend:
- Send captured data to backend API
- Implement verification logic
- Store in database

## Need Help?

- Check full documentation: `biometric-bridge/README.md`
- View logs in the terminal (look for `[bridge]` prefix)
- Check browser console for frontend errors
- Review `bridge-server.js` for debugging

## Configuration

Optional: Create `.env` file in `biometric-bridge/` directory:

```bash
cp biometric-bridge/.env.example biometric-bridge/.env
```

Edit values if needed (defaults work for most setups).

## Architecture Overview

```
Your Browser
    ↕ HTTP (JSON)
Bridge Server (localhost:3030)
    ↕ HTTP (XML)
RDService (localhost:11100)
    ↕ SDK
Device Hardware
```

The bridge automatically converts between JSON (for your app) and XML (for RDService).

## Success Indicators

✅ Terminal shows: `Biometric Bridge Server Started`
✅ Health endpoint returns OK
✅ RDService status shows `"connected": true`
✅ UI shows green "Device Ready" indicator
✅ Capture buttons are enabled
✅ Clicking capture shows "Capturing..." animation
✅ Successful capture shows quality score

## Production Notes

For production deployment:
- Run bridge as Windows service
- Set up auto-start on system boot
- Configure proper error logging
- Set up monitoring/alerts

See `README.md` for production setup instructions.
