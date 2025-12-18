# Mantra MFS 500 Fingerprint Integration - Complete Step-by-Step Guide

**Last Updated:** December 15, 2025  
**Status:** ✅ COMPLETE AND PRODUCTION-READY  
**Version:** 1.0

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Prerequisites & Requirements](#prerequisites--requirements)
3. [Installation & Setup](#installation--setup)
4. [Configuration](#configuration)
5. [Frontend Implementation](#frontend-implementation)
6. [Backend API Reference](#backend-api-reference)
7. [Features & Usage](#features--usage)
8. [Settings & Diagnostics](#settings--diagnostics)
9. [Troubleshooting](#troubleshooting)
10. [API Response Formats](#api-response-formats)

---

## System Architecture

### Three-Layer Architecture

```
┌────────────────────────────────────────────────────┐
│  LAYER 1: Browser (Next.js Frontend)               │
│  ├─ User Interface                                 │
│  ├─ Mantra SDK Integration (Client-side)          │
│  └─ BiometricInformation Component                │
└────────────────────────┬─────────────────────────┘
                         │ (HTTPS/HTTP - Templates only)
                         ↓
┌────────────────────────────────────────────────────┐
│  LAYER 2: NestJS Backend Server                    │
│  ├─ REST API Endpoints                             │
│  ├─ Template Encryption (AES-256-GCM)             │
│  ├─ Fingerprint Matching Logic                     │
│  └─ Audit Logging                                  │
└────────────────────────┬─────────────────────────┘
                         │ (Database)
                         ↓
┌────────────────────────────────────────────────────┐
│  LAYER 3: Mantra SDK Service (Windows)             │
│  ├─ localhost:8030 (HTTPS)                        │
│  ├─ MorFin Auth Client Service                    │
│  └─ Physical Device Control                        │
└────────────────────────┬─────────────────────────┘
                         │ (USB)
                         ↓
┌────────────────────────────────────────────────────┐
│  HARDWARE: Mantra MFS 500 Fingerprint Device       │
│  ├─ Captures fingerprints                         │
│  ├─ Generates templates                           │
│  └─ Connected via USB                             │
└────────────────────────────────────────────────────┘
```

### Data Flow

```
User Captures Fingerprint
    ↓
Frontend calls MantraSDKService.captureFinger()
    ↓
SDK Service communicates with localhost:8030
    ↓
Mantra Service controls physical device
    ↓
Device captures fingerprint and returns:
  - Quality score (0-100)
  - NFIQ score (1-5)
  - Template data (WSQInfo)
  - Bitmap image (ImgData)
    ↓
Frontend displays preview image
    ↓
User accepts/rejects
    ↓
Frontend sends template to Backend API
    ↓
Backend encrypts and stores in database
    ↓
Enrollment complete ✓
```

---

## Prerequisites & Requirements

### Hardware
- **Device:** Mantra MFS 500 fingerprint scanner
- **Connection:** USB port on Windows machine
- **OS:** Windows 7 or later

### Software
- **Node.js:** v16 or later
- **npm:** v7 or later
- **Frontend:** Next.js 15.3.3
- **Backend:** NestJS 10.x

### Network
- **Mantra Service:** https://localhost:8030 (local only)
- **Backend:** http://localhost:3000 (or configured port)
- **Frontend:** http://localhost:5000 (or configured port)

### Access Requirements
- Administrator rights (for Windows service installation)
- Environment variable management access
- USB device access rights

---

## Installation & Setup

### Step 1: Install Mantra MFS 500 Service (Windows)

#### 1.1 Download and Install
```bash
# 1. Download Mantra MFS 500 SDK from official website
# 2. Extract the installer package
# 3. Run MorFinAuthSetup.exe as Administrator
# 4. Follow on-screen installation wizard
# 5. Select "MorFin Auth Client Service" for auto-start
```

#### 1.2 Verify Installation
```bash
# Check if service is running
Services.msc → Find "MorFin Auth Client Service"

# OR via PowerShell
Get-Service "MorFin Auth Client Service" | Format-List

# Test connectivity
curl -k https://localhost:8030/api/device/status

# Should return a response (if device connected)
```

#### 1.3 Connect Device
```bash
# 1. Connect Mantra MFS 500 via USB
# 2. Open Device Manager
# 3. Look for "Mantra MFS 500" under Input Devices
# 4. If not visible, install drivers from Mantra package
# 5. Restart Mantra service if needed
```

### Step 2: Backend Setup

#### 2.1 Generate Encryption Key
```bash
# Generate a secure 32-byte encryption key
openssl rand -hex 32

# Output example (save this):
# a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

#### 2.2 Configure Backend Environment
```bash
cd backend

# Create/Edit .env file
cat >> .env << EOF

# ===================================
# BIOMETRIC CONFIGURATION
# ===================================

# Encryption key (from step 2.1)
BIOMETRIC_ENCRYPTION_KEY=your-32-byte-hex-key-here

# Mantra SDK Server
MANTRA_SDK_URL=https://localhost:8030
MANTRA_SDK_TIMEOUT=15000

# Biometric Settings
BIOMETRIC_QUALITY_THRESHOLD=60
BIOMETRIC_MATCH_THRESHOLD=65
BIOMETRIC_CAPTURE_TIMEOUT=10000
BIOMETRIC_VERIFY_TIMEOUT=10000

# Encryption Algorithm
BIOMETRIC_ENCRYPTION_ALGORITHM=aes-256-gcm

# Audit Logging
BIOMETRIC_AUDIT_ENABLED=true
BIOMETRIC_AUDIT_LOG_LEVEL=INFO
EOF
```

#### 2.3 Verify Backend Module
```bash
# Check if BiometricModule is imported in app.module.ts
grep -n "BiometricModule" backend/src/modules/app.module.ts

# If not present, add:
# import { BiometricModule } from './biometric/biometric.module';
# 
# In imports array:
# BiometricModule,
```

#### 2.4 Start Backend
```bash
cd backend
npm install  # If needed
npm run dev

# Should output:
# [Nest] ... - 12/15/2025, 10:30:00 AM   LOG [NestFactory] Starting Nest application...
# [Nest] ... - 12/15/2025, 10:30:02 AM   LOG [InstanceLoader] BiometricModule dependencies initialized
```

### Step 3: Frontend Setup

#### 3.1 Configure Frontend Environment
```bash
cd frontend

# Create .env.local file
cat > .env.local << EOF

# ===================================
# MANTRA SDK FRONTEND CONFIGURATION
# ===================================

# Mantra SDK Server URL
NEXT_PUBLIC_MANTRA_SDK_URL=https://localhost:8030

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Biometric Settings
NEXT_PUBLIC_BIOMETRIC_QUALITY_THRESHOLD=60
NEXT_PUBLIC_BIOMETRIC_MATCH_THRESHOLD=65
EOF
```

#### 3.2 Verify Frontend Dependencies
```bash
cd frontend

# Check if required packages are installed
npm list react-toastify

# If missing, install:
npm install react-toastify
```

#### 3.3 Start Frontend
```bash
cd frontend
npm run dev

# Should output:
# ▲ Next.js 15.3.3
# - Local:        http://localhost:5000
# - Environments: .env.local
```

### Step 4: Test Installation

#### 4.1 Browser Test
```bash
# 1. Open http://localhost:5000 in browser
# 2. Navigate to application
# 3. Find "Biometric Information" form
# 4. Should show device status (green ✓ if connected)
```

#### 4.2 Device Connectivity Test
```bash
# 1. In Biometric form, click ⚙️ Settings button
# 2. Click "Check Device" button
# 3. Should show green success result with device info
# 4. If red error, see Troubleshooting section
```

#### 4.3 Full Capture Test
```bash
# 1. Click "Scan Fingerprint" button
# 2. Place finger on device
# 3. Should show preview modal with:
#    - Fingerprint image
#    - Quality score
#    - Accept/Retake buttons
# 4. Click "Accept & Enroll"
# 5. Should show success message and add to enrolled list
```

---

## Setup on Another Laptop

### Complete Setup Guide for New Development Machine

If you need to set up the Mantra MFS 500 integration on a different laptop/workstation, follow these steps:

### Prerequisites Check

```bash
# 1. Verify Node.js and npm are installed
node --version   # Should be v16 or later
npm --version    # Should be v7 or later

# 2. Verify Git is installed
git --version

# 3. On Windows: Open PowerShell as Administrator
# (You'll need admin rights for service installation)
```

### Step 1: Clone the Repository

```bash
# Navigate to your development folder
cd C:\Users\YourUsername\Desktop\

# Clone the repository
git clone https://github.com/sparquer24/alms.git
cd alms

# Check out the biometric branch
git checkout feat/add-biometric
```

### Step 2: Install Mantra Service (Windows - New Machine)

#### 2.1 Download SDK
```bash
# 1. Visit Mantra official website: https://www.mantrasoft.com/
# 2. Download: "Mantra MFS 500 Web SDK"
# 3. Choose: Windows version
# 4. Save the installer (e.g., MorFinAuthSetup.exe)
```

#### 2.2 Install SDK
```bash
# 1. Right-click MorFinAuthSetup.exe → Run as Administrator
# 2. Follow installation wizard:
#    - Accept license terms
#    - Choose installation path (default: C:\Mantra\)
#    - Check "Install MorFin Auth Client Service"
#    - Complete installation
# 3. Service will auto-start after installation
```

#### 2.3 Verify Installation
```bash
# Open Services
services.msc

# Look for: "MorFin Auth Client Service"
# Status should be: Running
# Startup type should be: Automatic

# Test connectivity
curl -k https://localhost:8030/api/device/status
# Should return response (may show device not connected initially)
```

#### 2.4 Connect Hardware
```bash
# 1. Connect Mantra MFS 500 fingerprint device via USB
# 2. Open Device Manager
#    devmgmt.msc
# 3. Look under "Input Devices" or "Other devices"
# 4. Should show: "Mantra MFS 500" or similar
# 5. If drivers needed: Right-click → Install drivers from Mantra folder
# 6. Restart computer (if drivers installed)
```

### Step 3: Setup Backend on New Machine

#### 3.1 Install Dependencies
```bash
cd backend
npm install
```

#### 3.2 Create Environment File
```bash
# Create .env file in backend directory
cat > .env << EOF
# Database configuration (from your existing setup)
DATABASE_URL=your_database_url

# JWT and Auth
JWT_SECRET=your_jwt_secret

# ===================================
# BIOMETRIC CONFIGURATION
# ===================================

# Generate a NEW encryption key (don't reuse from another machine)
BIOMETRIC_ENCRYPTION_KEY=$(openssl rand -hex 32)

# Mantra SDK Server (Windows service running locally)
MANTRA_SDK_URL=https://localhost:8030
MANTRA_SDK_TIMEOUT=15000

# Biometric Settings
BIOMETRIC_QUALITY_THRESHOLD=60
BIOMETRIC_MATCH_THRESHOLD=65
BIOMETRIC_CAPTURE_TIMEOUT=10000
BIOMETRIC_VERIFY_TIMEOUT=10000

# Encryption Algorithm (do not change)
BIOMETRIC_ENCRYPTION_ALGORITHM=aes-256-gcm

# Audit Logging
BIOMETRIC_AUDIT_ENABLED=true
BIOMETRIC_AUDIT_LOG_LEVEL=INFO

# Environment
NODE_ENV=development
EOF
```

#### 3.3 Run Database Migrations
```bash
# Apply any pending migrations
npm run prisma:migrate deploy

# Generate Prisma client
npm run prisma:generate
```

#### 3.4 Start Backend
```bash
npm run dev

# Should output:
# ✓ [Nest] Application listening on port 3000
# ✓ BiometricModule dependencies initialized
```

### Step 4: Setup Frontend on New Machine

#### 4.1 Install Dependencies
```bash
cd frontend
npm install
```

#### 4.2 Create Environment File
```bash
# Create .env.local in frontend directory
cat > .env.local << EOF

# ===================================
# MANTRA SDK FRONTEND CONFIGURATION
# ===================================

# Mantra SDK Service (must match backend MANTRA_SDK_URL)
NEXT_PUBLIC_MANTRA_SDK_URL=https://localhost:8030

# Backend API URL (match your backend port)
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Biometric Settings (should match backend)
NEXT_PUBLIC_BIOMETRIC_QUALITY_THRESHOLD=60
NEXT_PUBLIC_BIOMETRIC_MATCH_THRESHOLD=65

# Next.js configuration
NEXT_PUBLIC_APP_NAME=ALMS
EOF
```

#### 4.3 Verify Files Exist
```bash
# Check that the biometric services exist
ls -la src/services/mantraSDKService.ts
ls -la src/services/biometricAPIService.ts

# Check that BiometricInformation component exists
ls -la src/components/forms/freshApplication/BiometricInformation.tsx
```

#### 4.4 Start Frontend
```bash
npm run dev

# Should output:
# ▲ Next.js 15.3.3
# - Local:        http://localhost:5000
# - Environments: .env.local
```

### Step 5: Verify Complete Setup

#### 5.1 Check All Services Running
```bash
# Terminal 1: Backend running
# Terminal 2: Frontend running
# Mantra service: Services.msc shows Running

# Check port availability
netstat -ano | findstr ":3000"    # Backend
netstat -ano | findstr ":5000"    # Frontend
netstat -ano | findstr ":8030"    # Mantra
```

#### 5.2 Browser Test
```bash
# 1. Open browser: http://localhost:5000
# 2. Login to application
# 3. Navigate to: Biometric Information form
# 4. Should show device status (green if device connected)
```

#### 5.3 Run Diagnostics
```bash
# In Biometric form:
# 1. Click ⚙️ Settings button
# 2. Run "Check Device" test
#    - Should be green (connected) if device plugged in
#    - Red (not connected) is normal if device not plugged in
# 3. Run "Get Info" test
#    - Should show device information
```

#### 5.4 Capture Fingerprint
```bash
# 1. Plug in Mantra MFS 500 device
# 2. Open Biometric Information form
# 3. Click "Scan Fingerprint"
# 4. Place finger on device
# 5. Should show preview modal with:
#    - Fingerprint image
#    - Quality percentage
#    - File size in KB
# 6. Click "Accept & Enroll"
# 7. Should show success message
```

### Step 6: Common Issues on New Machine

#### Issue: "Service not found" when installing

```bash
# Solution: Run PowerShell as Administrator
# Right-click PowerShell → "Run as Administrator"
# Then run installer again
```

#### Issue: Drivers not installing

```bash
# Solution: 
# 1. Unplug device
# 2. Restart computer
# 3. Plug device back in
# 4. Let Windows install drivers automatically
# 5. Or manually install from Mantra SDK drivers folder
```

#### Issue: Certificate error on localhost:8030

```bash
# Solution: This is expected for self-signed certificates
# In browser, accept the security warning
# Or bypass in curl:
curl -k https://localhost:8030/api/device/status
```

#### Issue: Different encryption key on different machines

```bash
# IMPORTANT: Each machine should have its OWN encryption key
# DO NOT copy .env from another machine
# Each BIOMETRIC_ENCRYPTION_KEY is machine-specific

# Generate new key for each machine:
openssl rand -hex 32

# Update .env with the new key
```

#### Issue: Database connection error

```bash
# Solution: Verify DATABASE_URL in .env
# Should point to the same database server
# If local database: Ensure it's running on this machine

# Test connection:
npm run prisma:db:push
```

### Step 7: Team Development Tips

#### For Multiple Developers

```bash
# Each developer should:
# 1. Generate their own BIOMETRIC_ENCRYPTION_KEY
# 2. NOT commit .env files to git
# 3. Use .env.example as template (if provided)

# .gitignore should include:
.env
.env.local
.env.production.local
```

#### Sharing Configuration

```bash
# Create .env.example (DO NOT include secrets)
cat > backend/.env.example << EOF
BIOMETRIC_ENCRYPTION_KEY=GENERATE_YOUR_OWN_32_BYTE_KEY_HERE
MANTRA_SDK_URL=https://localhost:8030
BIOMETRIC_QUALITY_THRESHOLD=60
BIOMETRIC_MATCH_THRESHOLD=65
EOF

# Developers copy and fill in their own values:
cp backend/.env.example backend/.env
# Then edit .env with their own values
```

#### Database Migrations

```bash
# When pulling code with schema changes:
cd backend
npm run prisma:migrate deploy

# If conflicts occur:
npm run prisma:migrate resolve --rolled-back MIGRATION_NAME
```

### Step 8: Troubleshooting Setup Issues

#### Backend won't start

```bash
# Check for port 3000 already in use
netstat -ano | findstr ":3000"

# If in use, kill process or use different port:
$PORT=3001 npm run dev

# Check logs for errors
# Look for: "BIOMETRIC_ENCRYPTION_KEY is required"
# Solution: Verify .env file has encryption key
```

#### Frontend won't start

```bash
# Check for port 5000 already in use
netstat -ano | findstr ":5000"

# If in use, use different port:
npm run dev -- -p 5001

# Check .env.local exists and is formatted correctly
cat frontend/.env.local
```

#### Device shows disconnected even when plugged in

```bash
# 1. Check Device Manager: devmgmt.msc
# 2. Look for "Mantra MFS 500" device
# 3. If not present: Drivers not installed
#    - Download drivers from Mantra website
#    - Right-click device in Device Manager → Update driver
#    - Restart computer
# 4. If present: Service may not be running
#    - services.msc → Start "MorFin Auth Client Service"
```

### Step 9: Quick Reference Checklist

- [ ] Node.js v16+ installed
- [ ] npm v7+ installed
- [ ] Git installed
- [ ] Mantra SDK installed and service running
- [ ] Mantra device drivers installed
- [ ] Device appears in Device Manager
- [ ] Backend .env created with unique BIOMETRIC_ENCRYPTION_KEY
- [ ] Frontend .env.local created
- [ ] Database migrations applied
- [ ] Backend running on port 3000
- [ ] Frontend running on port 5000
- [ ] Device status shows connected (if device plugged in)
- [ ] Settings → Check Device test passes
- [ ] Can capture and enroll fingerprint

### Summary

Setting up on a new machine requires:

1. **Mantra SDK Service** (Windows-specific, one-time install)
2. **Backend Configuration** (unique encryption key per machine)
3. **Frontend Configuration** (.env.local with SDK URL)
4. **Database Access** (shared or local)
5. **Hardware Connection** (USB device + drivers)

Each developer's machine is independent with its own encryption key. The main shared resource is the database.

---

---

## Configuration

### Environment Variables Reference

#### Backend (.env)

| Variable | Default | Purpose | Example |
|----------|---------|---------|---------|
| `BIOMETRIC_ENCRYPTION_KEY` | Required | AES-256 encryption key | `a1b2c3d4e5f6...` |
| `MANTRA_SDK_URL` | `https://localhost:8030` | Mantra service URL | `https://localhost:8030` |
| `MANTRA_SDK_TIMEOUT` | `15000` | API timeout (ms) | `15000` |
| `BIOMETRIC_QUALITY_THRESHOLD` | `60` | Min quality (0-100) | `60` |
| `BIOMETRIC_MATCH_THRESHOLD` | `65` | Min match score | `65` |
| `BIOMETRIC_CAPTURE_TIMEOUT` | `10000` | Capture timeout (ms) | `10000` |
| `BIOMETRIC_VERIFY_TIMEOUT` | `10000` | Verify timeout (ms) | `10000` |
| `BIOMETRIC_AUDIT_ENABLED` | `true` | Enable audit logs | `true` |
| `BIOMETRIC_AUDIT_LOG_LEVEL` | `INFO` | Log level | `INFO`, `WARN`, `ERROR` |

#### Frontend (.env.local)

| Variable | Default | Purpose | Example |
|----------|---------|---------|---------|
| `NEXT_PUBLIC_MANTRA_SDK_URL` | `https://localhost:8030` | SDK service URL | `https://localhost:8030` |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000/api` | Backend API URL | `http://localhost:3000/api` |
| `NEXT_PUBLIC_BIOMETRIC_QUALITY_THRESHOLD` | `60` | Min quality % | `60` |
| `NEXT_PUBLIC_BIOMETRIC_MATCH_THRESHOLD` | `65` | Min match score | `65` |

### Development vs Production

#### Development
```bash
# .env (development)
BIOMETRIC_ENCRYPTION_KEY=dev-key-min-32-chars-only-dev
NODE_ENV=development
BIOMETRIC_AUDIT_ENABLED=true
DEBUG=biometric:*
MANTRA_SDK_URL=https://localhost:8030
```

#### Production
```bash
# .env (production)
BIOMETRIC_ENCRYPTION_KEY=${SECURE_VAULT_KEY}  # Load from secrets manager
NODE_ENV=production
BIOMETRIC_AUDIT_ENABLED=true
BIOMETRIC_AUDIT_LOG_LEVEL=WARN
HTTPS_ONLY=true
MANTRA_SDK_URL=https://biometric-service.internal:8030
```

---

## Frontend Implementation

### File Structure

```
frontend/
├── src/
│   ├── services/
│   │   ├── mantraSDKService.ts         (NEW - SDK wrapper)
│   │   └── biometricAPIService.ts      (NEW - Backend API)
│   ├── components/forms/freshApplication/
│   │   └── BiometricInformation.tsx    (MODIFIED - Enhanced)
│   └── app/
│       └── layout.tsx                   (MODIFIED - Script tag)
└── .env.local                           (NEW - Configuration)
```

### Key Services

#### MantraSDKService
**File:** `frontend/src/services/mantraSDKService.ts`

**Purpose:** Wrapper around Mantra Web SDK (morfinauth.js)

**Key Methods:**
```typescript
// Initialize SDK
static async initialize(): Promise<boolean>

// Check device connection
static async isDeviceConnected(): Promise<MantraDeviceStatus>

// Capture fingerprint
static async captureFinger(
  quality: number,      // 0-100, default 60
  timeout: number       // milliseconds, default 10000
): Promise<MantraFingerprintResult>

// Get fingerprint image
static async getImage(format: string): Promise<string>
// format: "0" = BMP, "1" = WSQ

// Get template
static async getTemplate(): Promise<string>

// Verify templates match
static async matchFinger(
  quality: number,
  timeout: number,
  template1: string,
  template2: string
): Promise<{isMatched: boolean, score: number}>

// Get device info
static async getDeviceInfo(): Promise<MantraDeviceInfo>
```

**Usage Example:**
```typescript
// Initialize
const ready = await MantraSDKService.initialize();

// Check device
const status = await MantraSDKService.isDeviceConnected();
if (status.isConnected) {
  // Capture fingerprint
  const result = await MantraSDKService.captureFinger(60, 10000);
  console.log(`Quality: ${result.quality}%, NFIQ: ${result.nfiq}`);
  
  // Get image for preview
  const image = await MantraSDKService.getImage('0');
  // Use as data:image/bmp;base64,{image}
}
```

#### BiometricAPIService
**File:** `frontend/src/services/biometricAPIService.ts`

**Purpose:** Handle backend API communication

**Key Methods:**
```typescript
// Enroll fingerprint
static async enrollFingerprint(
  applicantId: string,
  fingerPosition: string,
  captureData: MantraFingerprintResult,
  description?: string
): Promise<BiometricStorageResponse>

// Verify fingerprint
static async verifyFingerprint(
  applicantId: string,
  captureData: MantraFingerprintResult,
  matchThreshold?: number
): Promise<BiometricVerificationResponse>

// Get enrolled fingerprints
static async getEnrolledFingerprints(
  applicantId: string
): Promise<BiometricEnrollment[]>

// Delete fingerprint
static async deleteEnrolledFingerprint(
  applicantId: string,
  fingerprintId: string
): Promise<{success: boolean, message: string}>

// Get audit logs
static async getBiometricAuditLogs(
  applicantId: string,
  limit?: number
): Promise<BiometricAuditLog[]>
```

**Usage Example:**
```typescript
// Enroll after capturing
const enrollResponse = await BiometricAPIService.enrollFingerprint(
  applicantId,
  'RIGHT_THUMB',
  captureResult,
  'Captured via Mantra SDK'
);

if (enrollResponse.success) {
  console.log('Enrolled:', enrollResponse.fingerprintId);
}

// Verify later
const verifyResponse = await BiometricAPIService.verifyFingerprint(
  applicantId,
  newCaptureResult,
  65  // match threshold
);

if (verifyResponse.success && verifyResponse.isMatch) {
  console.log(`Match! Score: ${verifyResponse.matchScore}`);
}
```

### BiometricInformation Component

**File:** `frontend/src/components/forms/freshApplication/BiometricInformation.tsx`

**Features Implemented:**

1. **Device Status Display**
   - Shows device connection status
   - Green indicator when connected
   - Red indicator when disconnected

2. **Fingerprint Capture**
   - "Scan Fingerprint" button
   - Real-time quality feedback
   - Preview modal with image
   - Accept/Retake options

3. **Enrolled Fingerprints List**
   - Shows all enrolled fingers
   - Position, quality, enrollment date
   - Delete button for each

4. **Fingerprint Verification**
   - "Verify Fingerprint" button
   - Captures and compares against enrolled
   - Shows match result and score

5. **Settings & Diagnostics**
   - 8 diagnostic tests
   - Tests device connectivity
   - Tests API endpoints
   - Visual feedback with color-coded results

**State Variables:**
```typescript
// SDK and device
const [mantraSDKReady, setMantraSDKReady] = useState(false);
const [fingerprintDeviceConnected, setFingerprintDeviceConnected] = useState(false);

// Capture state
const [fingerprintCapturing, setFingerprintCapturing] = useState(false);
const [fingerprintPreviewImage, setFingerprintPreviewImage] = useState<string | null>(null);
const [pendingCaptureResult, setPendingCaptureResult] = useState<any>(null);
const [pendingFingerPosition, setPendingFingerPosition] = useState('RIGHT_THUMB');

// Enrolled fingerprints
const [enrolledFingerprints, setEnrolledFingerprints] = useState<any[]>([]);

// Settings/Diagnostics
const [showDeviceSettings, setShowDeviceSettings] = useState(false);
const [diagnosticResults, setDiagnosticResults] = useState<any>({});
const [diagnosticLoading, setDiagnosticLoading] = useState<string | null>(null);
```

---

## Backend API Reference

### Base URL
```
POST http://localhost:3000/api/biometric/
```

### Authentication
All endpoints require Bearer token:
```
Authorization: Bearer <JWT_TOKEN>
```

### Endpoints

#### 1. Enroll Fingerprint

```
POST /api/biometric/enroll/:applicantId
```

**Request:**
```json
{
  "fingerPosition": "RIGHT_THUMB",
  "template": "base64_template_data",
  "quality": 85,
  "isoTemplate": "iso_template_data",
  "captureTime": "2025-12-15T10:30:00Z",
  "description": "Captured via Mantra SDK"
}
```

**Response (Success):**
```json
{
  "success": true,
  "fingerprintId": "fp_123abc",
  "message": "Fingerprint enrolled successfully",
  "enrolledAt": "2025-12-15T10:30:15Z"
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Failed to enroll fingerprint",
  "error": "Application not found"
}
```

#### 2. Verify Fingerprint

```
POST /api/biometric/verify/:applicantId
```

**Request:**
```json
{
  "template": "base64_captured_template",
  "quality": 82,
  "isoTemplate": "iso_template_data",
  "captureTime": "2025-12-15T10:35:00Z",
  "matchThreshold": 65
}
```

**Response (Match):**
```json
{
  "success": true,
  "isMatch": true,
  "matchScore": 92,
  "matchedFingerPosition": "RIGHT_THUMB",
  "message": "Fingerprint matched at position: RIGHT_THUMB"
}
```

**Response (No Match):**
```json
{
  "success": true,
  "isMatch": false,
  "matchScore": 45,
  "message": "No matching fingerprint found"
}
```

#### 3. Get Enrolled Fingerprints

```
GET /api/biometric/enrolled/:applicantId
```

**Response:**
```json
{
  "success": true,
  "fingerprints": [
    {
      "id": "fp_123abc",
      "fingerPosition": "RIGHT_THUMB",
      "quality": 85,
      "enrolledAt": "2025-12-15T10:30:15Z",
      "description": "Captured via Mantra SDK"
    },
    {
      "id": "fp_456def",
      "fingerPosition": "RIGHT_INDEX",
      "quality": 92,
      "enrolledAt": "2025-12-15T10:35:20Z",
      "description": null
    }
  ]
}
```

**Note:** Returns public data only. Does NOT include:
- `template` (encrypted template)
- `templateHash` (verification hash)
- `isoTemplate` (ISO format template)

#### 4. Delete Fingerprint

```
DELETE /api/biometric/:applicantId/:fingerprintId
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Fingerprint deleted successfully"
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Fingerprint not found"
}
```

#### 5. Get Audit Logs

```
GET /api/biometric/audit-logs/:applicantId?limit=50
```

**Response:**
```json
{
  "success": true,
  "auditLogs": [
    {
      "id": "al_789xyz",
      "action": "ENROLLMENT",
      "fingerPosition": "RIGHT_THUMB",
      "status": "SUCCESS",
      "timestamp": "2025-12-15T10:30:15Z",
      "userId": "user_123",
      "details": {
        "quality": 85,
        "nfiq": 2
      }
    },
    {
      "id": "al_790xyz",
      "action": "VERIFICATION",
      "fingerPosition": "RIGHT_THUMB",
      "status": "SUCCESS",
      "timestamp": "2025-12-15T10:35:20Z",
      "userId": "user_123",
      "details": {
        "matchScore": 92,
        "matched": true
      }
    }
  ]
}
```

---

## Features & Usage

### Capturing Fingerprints

#### Step 1: Initialize Device
```typescript
// Component mount effect
useEffect(() => {
  const initialize = async () => {
    const ready = await MantraSDKService.initialize();
    setMantraSDKReady(ready);
    
    if (ready) {
      const status = await MantraSDKService.isDeviceConnected();
      setFingerprintDeviceConnected(status.isConnected);
    }
  };
  initialize();
}, []);
```

#### Step 2: Capture Fingerprint
```typescript
const handleCaptureFingerprintMantra = async (fingerPosition: string) => {
  if (!mantraSDKReady || !fingerprintDeviceConnected) {
    toast.error('Device not available. Check Settings.');
    return;
  }

  try {
    setFingerprintCapturing(true);
    
    // Step 1: Check device status
    const deviceStatus = await MantraSDKService.isDeviceConnected();
    if (!deviceStatus.isConnected) {
      throw new Error('Device disconnected');
    }

    // Step 2: Prompt user
    toast.info('📍 Place your finger on the device');

    // Step 3: Capture
    const captureResult = await MantraSDKService.captureFinger(60, 10000);
    if (!captureResult.success) {
      throw new Error(captureResult.errorMessage);
    }

    toast.success(`✓ Quality: ${captureResult.quality}%`);

    // Step 4: Get image
    const image = await MantraSDKService.getImage('0');
    if (image) {
      setFingerprintPreviewImage(`data:image/bmp;base64,${image}`);
    }

    // Step 5: Show preview
    setPendingCaptureResult(captureResult);
    setPendingFingerPosition(fingerPosition);
    setShowFingerprintPreviewModal(true);

  } catch (error) {
    toast.error(`Capture failed: ${error.message}`);
  } finally {
    setFingerprintCapturing(false);
  }
};
```

#### Step 3: Accept and Enroll
```typescript
const handleAcceptFingerprintPreview = async () => {
  if (!pendingCaptureResult || !applicantId) {
    toast.error('Invalid data');
    return;
  }

  try {
    setFingerprintCapturing(true);

    // Send to backend
    const response = await BiometricAPIService.enrollFingerprint(
      applicantId,
      pendingFingerPosition,
      pendingCaptureResult,
      'Captured via Mantra SDK'
    );

    if (response.success) {
      toast.success('✓ Fingerprint enrolled');

      // Refresh list
      const fingerprints = await BiometricAPIService.getEnrolledFingerprints(applicantId);
      setEnrolledFingerprints(fingerprints);

      // Close modal
      setShowFingerprintPreviewModal(false);
      setFingerprintPreviewImage(null);
      setPendingCaptureResult(null);
    } else {
      throw new Error(response.message);
    }

  } catch (error) {
    toast.error(`Enrollment failed: ${error.message}`);
  } finally {
    setFingerprintCapturing(false);
  }
};
```

### Verifying Fingerprints

```typescript
const handleVerifyFingerprint = async () => {
  if (!mantraSDKReady || enrolledFingerprints.length === 0) {
    toast.error('No enrolled fingerprints');
    return;
  }

  try {
    setFingerprintCapturing(true);

    // Capture new fingerprint
    const captureResult = await MantraSDKService.captureFinger(60, 10000);
    if (!captureResult.success) {
      throw new Error('Capture failed');
    }

    // Send to backend for verification
    const response = await BiometricAPIService.verifyFingerprint(
      applicantId,
      captureResult,
      65  // match threshold
    );

    if (response.success) {
      if (response.isMatch) {
        toast.success(`✓ Match! Score: ${response.matchScore}`);
      } else {
        toast.warning(`No match. Score: ${response.matchScore}`);
      }
    }

  } catch (error) {
    toast.error(`Verification failed: ${error.message}`);
  } finally {
    setFingerprintCapturing(false);
  }
};
```

### Deleting Fingerprints

```typescript
const handleDeleteFingerprint = async (fingerprintId: string) => {
  if (!applicantId) return;

  try {
    const response = await BiometricAPIService.deleteEnrolledFingerprint(
      applicantId,
      fingerprintId
    );

    if (response.success) {
      toast.success('Fingerprint deleted');

      // Refresh list
      const fingerprints = await BiometricAPIService.getEnrolledFingerprints(applicantId);
      setEnrolledFingerprints(fingerprints);
    } else {
      throw new Error(response.message);
    }

  } catch (error) {
    toast.error(`Delete failed: ${error.message}`);
  }
};
```

---

## Settings & Diagnostics

### 8 Diagnostic Tests

The Settings modal provides 8 tests to troubleshoot device connectivity:

| # | Test | Purpose | Success Indicator |
|---|------|---------|-------------------|
| 1 | Check Device | Device connection | Green: Connected = true |
| 2 | Get Connected Device | Devices in list | Green: MFS500 in list |
| 3 | Get Supported Device | System supports device | Green: Device in supported list |
| 4 | Get Info | Device initialization | Green: Device info returned |
| 5 | Capture | Fingerprint scan | Green: Quality score shown |
| 6 | Get Image | Image retrieval | Green: Image data returned |
| 7 | Get Template | Template generation | Green: Template data returned |
| 8 | Match | Fingerprint matching | Green: Match score shown |

### Opening Settings Modal

```typescript
// Button in component
<button 
  onClick={() => setShowDeviceSettings(true)}
  className="bg-gray-600 text-white px-3 py-1 rounded"
>
  ⚙️ Settings
</button>

// Modal opens showing device status and test buttons
```

### Running a Diagnostic Test

```typescript
const runDiagnostic = async (testName: string, testFn: () => Promise<any>) => {
  try {
    setDiagnosticLoading(testName);
    const result = await testFn();
    
    setDiagnosticResults(prev => ({
      ...prev,
      [testName]: {
        success: true,
        result: result,
        timestamp: new Date().toLocaleTimeString()
      }
    }));

  } catch (error) {
    setDiagnosticResults(prev => ({
      ...prev,
      [testName]: {
        success: false,
        error: error.message,
        timestamp: new Date().toLocaleTimeString()
      }
    }));
  } finally {
    setDiagnosticLoading(null);
  }
};
```

### Interpreting Results

**Success (Green Box):**
```json
{
  "ErrorCode": "0",
  "ErrorDescription": "Success",
  "connected": true,
  "deviceInfo": {...}
}
```

**Failure (Red Box):**
```json
{
  "ErrorCode": "-2027",
  "ErrorDescription": "Device not connected",
  "connected": false
}
```

---

## Troubleshooting

### Issue: Device Not Connected

**Symptoms:**
- Red ✗ in device status
- "Check Device" test fails
- Error: "Device not connected"

**Solutions:**

1. **Check USB Connection**
   ```bash
   # Windows Device Manager
   # Look for "Mantra MFS 500" under Input Devices
   # If not present: USB cable may be faulty
   ```

2. **Restart Mantra Service**
   ```bash
   # Method 1: Services.msc
   Services.msc → "MorFin Auth Client Service" → Right-click → Restart
   
   # Method 2: PowerShell
   Restart-Service "MorFin Auth Client Service"
   ```

3. **Reinstall Drivers**
   ```bash
   # 1. Download latest drivers from Mantra website
   # 2. Go to Device Manager
   # 3. Right-click device → Update Driver
   # 4. Browse to downloaded drivers
   # 5. Restart computer
   ```

### Issue: SDK Not Initialized

**Symptoms:**
- Component shows: "SDK not ready"
- Device status always shows disconnected
- Browser console: `window.morfinauth is undefined`

**Solutions:**

1. **Check Script Tag**
   ```typescript
   // In frontend/src/app/layout.tsx
   <script src="https://localhost:8030/morfinauth.js"></script>
   ```

2. **Check Browser Console**
   ```bash
   # Open DevTools (F12)
   # Console tab
   console.log(window.morfinauth);
   # Should exist (not undefined)
   ```

3. **Check Network Tab**
   ```bash
   # DevTools → Network tab
   # Reload page
   # Look for morfinauth.js request
   # Should return 200 OK
   # If error: Mantra service may not be running
   ```

4. **Verify Mantra Service URL**
   ```bash
   # Check .env.local
   NEXT_PUBLIC_MANTRA_SDK_URL=https://localhost:8030
   
   # Test in browser console
   fetch('https://localhost:8030/api/device/status')
     .then(r => r.json())
     .then(d => console.log(d))
   ```

### Issue: Fingerprint Quality Too Low

**Symptoms:**
- Capture fails with error "-2029"
- Message: "Quality too low"
- No image captured

**Solutions:**

1. **Clean Device**
   ```bash
   # Use soft, dry cloth
   # Wipe the scanning surface gently
   # Avoid liquids or abrasive materials
   ```

2. **Improve Finger Placement**
   ```bash
   # 1. Place entire fingertip on device
   # 2. Apply gentle, even pressure
   # 3. Hold steady for 2-3 seconds
   # 4. Keep finger flat (not angled)
   ```

3. **Lower Quality Threshold**
   ```bash
   # Edit backend/.env
   BIOMETRIC_QUALITY_THRESHOLD=50  # From 60
   
   # Restart backend
   npm run dev
   ```

### Issue: Capture Hangs or Times Out

**Symptoms:**
- "Scan Fingerprint" button stays loading
- Times out after 10 seconds
- No error message

**Solutions:**

1. **Check Device is Powered**
   ```bash
   # Device should have LED indicators
   # If no LEDs lit: Check power cable
   ```

2. **Increase Timeout**
   ```bash
   # Edit backend/.env
   BIOMETRIC_CAPTURE_TIMEOUT=20000  # From 10000
   
   # Or in frontend call
   const result = await MantraSDKService.captureFinger(60, 20000);
   ```

3. **Restart Service**
   ```bash
   Restart-Service "MorFin Auth Client Service"
   ```

### Issue: Enrollment API Returns 400/500 Error

**Symptoms:**
- Capture works, preview shows
- Click "Accept & Enroll" → Error from backend
- Check logs show validation error

**Solutions:**

1. **Check Backend Logs**
   ```bash
   # Look for error messages in backend console
   # Common: "Application not found"
   # Check applicantId is correct
   ```

2. **Verify API Configuration**
   ```bash
   # Check .env.local
   NEXT_PUBLIC_API_URL=http://localhost:3000/api
   
   # Test API
   curl -X GET http://localhost:3000/api/biometric/enrolled/test-id \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

3. **Check Backend Module Import**
   ```bash
   # Verify BiometricModule in app.module.ts
   grep -A5 "BiometricModule" backend/src/modules/app.module.ts
   ```

### Issue: Encryption Key Error

**Symptoms:**
- Backend won't start
- Error: "BIOMETRIC_ENCRYPTION_KEY is required"
- Or: "Invalid encryption key"

**Solutions:**

1. **Regenerate Key**
   ```bash
   openssl rand -hex 32
   # Copy output
   ```

2. **Update .env**
   ```bash
   cd backend
   # Edit .env or .env.local
   BIOMETRIC_ENCRYPTION_KEY=<paste-new-key>
   ```

3. **Restart Backend**
   ```bash
   npm run dev
   ```

### Issue: No Image Displayed in Preview

**Symptoms:**
- Fingerprint captures successfully
- Preview modal shows but image is empty/broken
- Shows "Image (0 KB)"

**Solutions:**

1. **Check Image Data Format**
   ```bash
   # Open DevTools Console
   # After capture, check:
   console.log(typeof fingerprintPreviewImage);  // Should be 'string'
   console.log(fingerprintPreviewImage.substring(0, 30));  // Should start with 'data:image/bmp;base64,'
   ```

2. **Verify Device Returns Image**
   ```bash
   # In Settings modal, run "Get Image" test
   # If fails: Device may not support image output
   # Try: Get Template test instead
   ```

3. **Check Image Data Size**
   ```bash
   # If image is too small (< 100 bytes):
   # Capture may have failed silently
   # Try capturing again with better finger placement
   ```

---

## API Response Formats

### Mantra MFS 500 API Response Structure

All Mantra endpoints return JSON in this format:

```json
{
  "ErrorCode": "0",              // "0" = success, negative = error
  "ErrorDescription": "Success", // Human-readable status
  "Quality": 85,                 // Fingerprint quality (0-100)
  "Nfiq": 2,                     // NFIQ score (1-5, higher = better)
  "ImgData": "base64data...",    // Image or template data
  "IsMatched": true,             // (For match endpoint only)
  "Score": 92                    // (For match endpoint only)
}
```

### Error Codes Reference

| Code | Message | Cause | Fix |
|------|---------|-------|-----|
| `"0"` | Success | Operation succeeded | None |
| `-2027` | Device not connected | USB disconnected | Check USB, restart service |
| `-2028` | Device error | Hardware error | Restart device, update firmware |
| `-2029` | Quality too low | Bad fingerprint quality | Clean device, improve placement |
| `-2030` | Timeout | Operation took too long | Increase timeout, restart device |
| Other | Check ErrorDescription | Various | See ErrorDescription message |

### Response Examples

#### Capture Success
```json
{
  "ErrorCode": "0",
  "ErrorDescription": "Success",
  "Quality": 85,
  "Nfiq": 2,
  "ImgData": "Qk06AAAAAJmGAAAoAAAAYAA..."
}
```

#### Capture Failure - Quality
```json
{
  "ErrorCode": "-2029",
  "ErrorDescription": "Quality too low",
  "Quality": 35,
  "Nfiq": 0,
  "ImgData": ""
}
```

#### Match Success
```json
{
  "ErrorCode": "0",
  "ErrorDescription": "Success",
  "IsMatched": true,
  "Score": 92
}
```

#### Match Failure
```json
{
  "ErrorCode": "0",
  "ErrorDescription": "Success",
  "IsMatched": false,
  "Score": 45
}
```

---

## Quick Reference

### Common Commands

```bash
# Check Mantra service status
Get-Service "MorFin Auth Client Service"

# Restart Mantra service
Restart-Service "MorFin Auth Client Service"

# Generate encryption key
openssl rand -hex 32

# Start backend
cd backend && npm run dev

# Start frontend
cd frontend && npm run dev

# Test API connectivity
curl -k https://localhost:8030/api/device/status

# Check backend logs
# (Look for error messages in terminal)

# Monitor device in Device Manager
# devmgmt.msc
```

### File Locations

```
Frontend:
  - Services: frontend/src/services/
  - Component: frontend/src/components/forms/freshApplication/BiometricInformation.tsx
  - Config: frontend/.env.local

Backend:
  - Module: backend/src/modules/biometric/
  - Config: backend/.env

Documentation:
  - This guide: docs/frontend/MANTRA_MFS500_COMPLETE_GUIDE.md
```

---

## Support & Further Reading

### Documentation Files
- **MANTRA_QUICK_REFERENCE.md** - Quick lookup for common tasks
- **BIOMETRIC_ENVIRONMENT_SETUP.md** - Detailed configuration guide
- **MANTRA_API_COMPLETE_REFERENCE.md** - Complete API endpoint reference
- **SETTINGS_MODAL_QUICK_REFERENCE.md** - Diagnostics modal guide

### Key Files to Review
- `frontend/src/services/mantraSDKService.ts` - SDK implementation
- `frontend/src/services/biometricAPIService.ts` - Backend API calls
- `frontend/src/components/forms/freshApplication/BiometricInformation.tsx` - UI component
- `backend/src/modules/biometric/biometric.controller.ts` - API endpoints

### Contact & Issues
- Check browser DevTools Console for detailed errors
- Use Settings → Diagnostics to isolate device issues
- Review backend logs for API errors
- Check .env configuration for typos

---

**Last Updated:** December 15, 2025  
**Version:** 1.0  
**Status:** ✅ Production Ready
