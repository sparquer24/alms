# ALMS Renewal Module — Frontend Analysis

> **Document Version:** 1.0  
> **Scope:** Frontend only (Next.js/React TypeScript application)  
> **Date:** July 2026

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Complete API Inventory](#2-complete-api-inventory)
3. [Flow Diagrams](#3-flow-diagrams)
4. [Status Transitions](#4-status-transitions)
5. [Pages & Components](#5-pages--components)
6. [API Service Layer](#6-api-service-layer)
7. [Hooks & Business Logic](#7-hooks--business-logic)
8. [File Upload Handling](#8-file-upload-handling)
9. [Role-Based Actions & Permissions](#9-role-based-actions--permissions)
10. [Error Handling](#10-error-handling)
11. [External Integrations](#11-external-integrations)
12. [Validation Rules](#12-validation-rules)
13. [Key Files Reference](#13-key-files-reference)

---

## 1. Architecture Overview

### 1.1 Layer Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    PAGES (Next.js App Router)             │
│  /forms/renewal        /renewalApplication/[id]          │
│  /public/renewal/[id]  /inbox                            │
├──────────────────────────────────────────────────────────┤
│               COMPONENTS (React Components)               │
│  RenewalFormPageContent       RenewalApplicationDetails   │
│  RenewalProceedingsForm       RenewalHeader               │
│  RenewalSummary               Section Components          │
├──────────────────────────────────────────────────────────┤
│                  HOOKS (Custom React Hooks)               │
│  useRenewalWorkflow    usePrefilledDocumentSync           │
├──────────────────────────────────────────────────────────┤
│            SERVICES (Business Logic Layer)                │
│  RenewalWorkflowService                                   │
├──────────────────────────────────────────────────────────┤
│             API SERVICE LAYER (Data Access)                │
│  RenewalService       LicenseService                      │
│  ApplicationService   FileUploadService                   │
├──────────────────────────────────────────────────────────┤
│              API CLIENT (HTTP Transport)                  │
│  ApiClient (authenticatedApiClient.ts)                    │
│  axiosInstance + interceptors                             │
└──────────────────────────────────────────────────────────┘
```

### 1.2 File Tree

```
frontend/src/
├── api/
│   ├── renewalService.ts          # Core Renewal API service
│   ├── applicationService.ts      # Fresh Application API (used by renewal for prefill)
│   ├── fileUploadService.ts       # File uploads for fresh apps
│   ├── licenseService.ts          # Actually in services/ directory
│   ├── cancelService.ts           # Cancel flow (interconnected)
│   ├── locationApi.ts             # Location dropdowns
│   ├── axiosConfig.ts             # HTTP config
│   └── APIs.ts                    # Endpoint constants
│
├── app/ (Next.js App Router)
│   ├── forms/renewal/page.tsx     # MAIN renewal form page (~198K chars)
│   ├── renewalApplication/
│   │   └── [id]/page.tsx          # Renewal details page
│   ├── public/renewal/
│   │   └── [id]/page.tsx          # Public renewal view
│   └── inbox/
│       ├── page.tsx               # Inbox (lists renewal apps)
│       └── [type]/page.tsx        # Filtered inbox
│
├── components/
│   ├── forms/renewal/
│   │   ├── RenewalHeader.tsx      # Header with summary card
│   │   ├── RenewalSummary.tsx     # Summary card display
│   │   └── sections/
│   │       ├── PersonalDetailsSection.tsx
│   │       ├── AddressDetailsSection.tsx
│   │       ├── OccupationSection.tsx
│   │       ├── CriminalHistory.tsx
│   │       ├── LicenseHistory.tsx
│   │       ├── LicenseDetailsSection.tsx
│   │       ├── BiometricInformation.tsx
│   │       ├── DocumentsSection.tsx
│   │       └── DeclarationSection.tsx
│   ├── renewal/
│   │   ├── RenewalApplicationDetailsPage.tsx  # Details view
│   │   └── renewalapplicationdetailsheader.tsx
│   └── RenewalProceedingsForm.tsx  # Workflow action form
│
├── services/
│   ├── renewalWorkflowService.ts  # Workflow business logic
│   └── licenseService.ts          # License API service
│
├── hooks/
│   ├── useRenewalWorkflow.ts      # Workflow state management
│   └── usePrefilledDocumentSync.ts # Auto-upload prefilled docs
│
├── utils/
│   ├── renewalFileUpload.ts       # File upload utilities
│   ├── applicationFormatters.ts   # Data formatters
│   ├── applicationMapper.ts       # Data mapping
│   ├── formDataLoader.ts          # Form data loading
│   └── validations.ts             # Validation rules
│
└── types/
    └── index.ts                   # LicenseData, ApplicationData types
```

---

## 2. Complete API Inventory

All APIs called by the frontend Renewal module, ordered by execution sequence.

### 2.1 Verification & Initial Prefill

| # | Method | Endpoint | Called From | Purpose |
|---|--------|----------|-------------|---------|
| 1 | `GET` | `/api/licenses/:licenseId` | `checkBiometricRequirement()` → `LicenseService.getLicenseById()` | Verify license exists, fetch applicant details & biometric templates for prefill |

### 2.2 Renewal CRUD

| # | Method | Endpoint | Called From | Purpose | Payload |
|---|--------|----------|-------------|---------|---------|
| 2 | `POST` | `/api/renewal-forms` | `RenewalService.createRenewalForm()` | Create DRAFT renewal | `{ freshLicenseId, licenseNumber, firstName, lastName, ...all form fields }` |
| 3 | `GET` | `/api/renewal-forms/:id` | `RenewalService.getRenewalForm()` | Load existing renewal data | — |
| 4 | `PATCH` | `/api/renewal-forms?applicationId=:id` | `RenewalService.updateRenewalForm()` | Save section progress | `{ personalDetails, addressDetails, ...section payload }` |
| 5 | `POST` | `/api/renewal-forms/:id/upload-file` | `RenewalService.uploadDocument()` | Upload a document file | `{ fileType, fileUrl, fileName, fileSize }` |
| 6 | `DELETE` | `/api/renewal-forms/file/:fileId` | `RenewalService.deleteRenewalFile()` | Delete an uploaded file | — |

### 2.3 Workflow APIs

| # | Method | Endpoint | Called From | Purpose | Payload |
|---|--------|----------|-------------|---------|---------|
| 7 | `GET` | `/api/workflow/statuses-actions` | `RenewalService.getWorkflowStatusesAndActions()` | Get available statuses & actions for workflow UI | — |
| 8 | `POST` | `/api/workflow/action` | `RenewalService.handleWorkflowAction()` | Perform workflow action (submit, forward, approve, reject, etc.) | `{ applicationId, actionId, nextUserId?, remarks, attachments?, applicationType }` |
| 9 | `GET` | `/api/workflow/applications?applicationType=RenewalApplicationForm` | `RenewalService.getRenewalApplications()` | List renewal applications in inbox | — |
| 10 | `GET` | `/api/users-in-hierarchy/:applicationId?applicationType=RenewalApplicationForm` | `RenewalProceedingsForm` | Get available users to forward to | — |

### 2.4 Supporting APIs (Called During Form Load)

| # | Method | Endpoint | Called From | Purpose |
|---|--------|----------|-------------|---------|
| 11 | `GET` | `/api/licenses/:id` | `RenewalService.getRenewalForm()` (currently misrouted) | Currently used as temporary replacement for renewal-forms GET |
| — | `GET` | `/api/renewal-forms?search=:licenseNumber` | `RenewalService.findRenewalByLicenseNumber()` | **Being removed** — pre-check for existing renewal before POST |
| — | `GET` | `/api/application-form?applicationId=:id` | `ApplicationService.getApplication()` | **Being removed** — no longer needed since License API provides data |
| — | `GET` | `/api/application-form?applicationId=:id` | `FileUploadService.getFiles()` | **Being removed** — duplicate file fetch |

### 2.5 API Response Shapes

#### `GET /api/licenses/:id` → LicenseData
```typescript
{
  id: number;
  licenseNumber: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  parentOrSpouseName?: string;
  sex?: string;
  dateOfBirth?: string;
  aadharNumber?: string;
  panNumber?: string;
  applicantMobile?: string;
  applicantEmail?: string;
  presentAddressLine?: string;
  presentState?: string;
  presentDistrict?: string;
  // ... full LicenseData type
  biometricData?: {
    fingerprints?: Array<{ position: string; template: string }>;
    signature?: string;
    irisScan?: string;
  };
  endorsedWeapons?: Array<{ id: number; name: string }>;
}
```

#### `POST /api/renewal-forms` → RenewalFormResponse
```typescript
{
  id: number;
  acknowledgementNo: string;
  licenseNumber: string;
  // ... all saved form fields
}
```

#### `POST /api/workflow/action` → WorkflowResponse
```typescript
{
  success: boolean;
  message: string;
  data?: {
    applicationId: number;
    newStatus: string;
    // ... workflow history entry
  };
}
```

---

## 3. Flow Diagrams

### 3.1 New Renewal Flow (First-Time Creation)

```
USER                    FRONTEND                          BACKEND
  │                        │                                 │
  │  1. Enter License ID   │                                 │
  │───────────────────────>│                                 │
  │                        │                                 │
  │  2. Click "Verify"     │                                 │
  │───────────────────────>│                                 │
  │                        │  3. GET /api/licenses/:id       │
  │                        │────────────────────────────────>│
  │                        │                                 │
  │                        │  ◄── License Data (name, bio,   │
  │                        │        address, license#)       │
  │                        │                                 │
  │  4. Show applicant     │                                 │
  │     details + bio      │                                 │
  │     verification       │                                 │
  │◄───────────────────────│                                 │
  │                        │                                 │
  │  5. Biometric verify   │                                 │
  │     (OR skip if no     │                                 │
  │      fingerprints)     │                                 │
  │───────────────────────>│                                 │
  │                        │                                 │
  │                        │  6. POST /api/renewal-forms     │
  │                        │     (DRAFT with prefill data)  │
  │                        │────────────────────────────────>│
  │                        │                                 │
  │                        │  ◄── 201 Created { id, ackNo } │
  │                        │                                 │
  │                        │  7. POST /api/renewal-forms/    │
  │                        │     :id/upload-file (prefilled  │
  │                        │     document sync)              │
  │                        │────────────────────────────────>│
  │                        │                                 │
  │  8. Show renewal form  │                                 │
  │     with prefilled     │                                 │
  │     data               │                                 │
  │◄───────────────────────│                                 │
```

### 3.2 Existing Renewal Load Flow (Navigating Back)

```
USER                    FRONTEND                          BACKEND
  │                        │                                 │
  │  1. Navigate to        │                                 │
  │     /forms/renewal?    │                                 │
  │     renewalId=123      │                                 │
  │───────────────────────>│                                 │
  │                        │                                 │
  │                        │  2. GET /api/renewal-forms/123  │
  │                        │────────────────────────────────>│
  │                        │                                 │
  │                        │  ◄── Renewal Data (all saved   │
  │                        │        sections, docs, status)  │
  │                        │                                 │
  │  3. Show renewal form  │                                 │
  │     with all saved     │                                 │
  │     data               │                                 │
  │◄───────────────────────│                                 │
```

### 3.3 Section-by-Section Save Flow

```
USER                    FRONTEND                          BACKEND
  │                        │                                 │
  │  1. Edit section       │                                 │
  │     (e.g., Personal)   │                                 │
  │───────────────────────>│                                 │
  │                        │                                 │
  │                        │  2. PATCH /api/renewal-forms    │
  │                        │     ?applicationId=123          │
  │                        │     { personalDetails: {...} }  │
  │                        │────────────────────────────────>│
  │                        │                                 │
  │                        │  ◄── 200 OK                    │
  │                        │                                 │
  │  3. Show success toast │                                 │
  │◄───────────────────────│                                 │
```

### 3.4 Workflow Action Flow (Processing)

```
OFFICER                 FRONTEND                          BACKEND
  │                        │                                 │
  │  1. Open renewal in    │                                 │
  │     inbox              │                                 │
  │───────────────────────>│                                 │
  │                        │                                 │
  │                        │  2. GET /api/workflow/          │
  │                        │     statuses-actions            │
  │                        │────────────────────────────────>│
  │                        │                                 │
  │                        │  ◄── Available statuses &       │
  │                        │        actions for role         │
  │                        │                                 │
  │  3. Select Action:     │                                 │
  │     "Forward"/         │                                 │
  │     "Approve"/         │                                 │
  │     "Reject"           │                                 │
  │───────────────────────>│                                 │
  │                        │                                 │
  │                        │  4. GET /api/users-in-          │
  │                        │     hierarchy/:id?              │
  │                        │     applicationType=            │
  │                        │     RenewalApplicationForm      │
  │                        │────────────────────────────────>│
  │                        │                                 │
  │                        │  ◄── Available next users       │
  │                        │                                 │
  │  5. Fill remarks +     │                                 │
  │     attachments        │                                 │
  │───────────────────────>│                                 │
  │                        │                                 │
  │                        │  6. POST /api/workflow/action   │
  │                        │     { applicationId, actionId,  │
  │                        │       nextUserId, remarks,      │
  │                        │       attachments,              │
  │                        │       applicationType:          │
  │                        │       "RenewalApplicationForm" }│
  │                        │────────────────────────────────>│
  │                        │                                 │
  │                        │  ◄── 200 OK (action recorded +  │
  │                        │        status transition)       │
  │                        │                                 │
  │  6. Success toast      │                                 │
  │◄───────────────────────│                                 │
```

---

## 4. Status Transitions

### 4.1 Complete Status Lifecycle

```
                    ┌──────────┐
                    │  DRAFT   │  (Initial creation)
                    └────┬─────┘
                         │  User submits
                    ┌────▼─────┐
             ┌──────│INITIATED │  (Submitted for review)
             │      └────┬─────┘
             │           │  Forwarded
             │      ┌────▼─────┐
             │      │FORWARDED │  (Moving through hierarchy)
             │      └────┬─────┘
             │           │
    ┌────────┼───────────┼──────────────────────────┐
    │        │           │                          │
    │   ┌────▼─────┐  ┌──▼────────┐          ┌─────▼──────┐
    │   │ APPROVED │  │ REJECTED  │          │RED_FLAGGED │
    │   └────┬─────┘  └────┬──────┘          └─────┬──────┘
    │        │             │                       │
    │   ┌────▼─────┐  ┌───▼────────┐         ┌─────▼──────┐
    │   │ CLOSED   │  │ DISPOSED   │         │ RETURNED   │
    │   └──────────┘  └────────────┘         └─────┬──────┘
    │                                              │
    │                                              │  (back to officer)
    │                                         ┌────▼─────┐
    │                                         │FORWARDED │
    │                                         └──────────┘
    │
    │  Alternative path:
    │      ┌──────────┐
    │      │RE_ENQUIRY│  (Request more info)
    │      └────┬─────┘
    │           │
    │      ┌────▼─────┐
    │      │FORWARDED │  (Resubmitted)
    │      └──────────┘
    │
    │      ┌───────────┐
    │      │GROUND_    │  (SHO generates ground report)
    │      │REPORT     │
    │      └────┬──────┘
    │           │
    │      ┌────▼─────┐
    │      │FORWARDED │
    │      └──────────┘
```

### 4.2 Status Transition Triggers

| Current Status | Action | Next Status | Triggered By |
|----------------|--------|-------------|--------------|
| `DRAFT` | Submit (INITIATE) | `INITIATED` | Applicant/User |
| `INITIATED` | Forward | `FORWARDED` | Verifier (SHO) |
| `FORWARDED` | Forward | `FORWARDED` | Any officer |
| `FORWARDED` | Approve | `APPROVED` | Approver (ACP/DCP/CP) |
| `FORWARDED` | Reject | `REJECTED` | Any officer |
| `FORWARDED` | Red Flag | `RED_FLAGGED` | Any officer |
| `FORWARDED` | Request More Info | `RE_ENQUIRY` | Any officer |
| `APPROVED` | Close | `CLOSED` | ZS (Zone Superintendent) |
| `REJECTED` | Close | `CLOSED` | ZS |
| `RED_FLAGGED` | Return | `FORWARDED` | Any officer |
| `RE_ENQUIRY` | Resubmit/Forward | `FORWARDED` | Applicant/Officer |
| `GROUND_REPORT` | Forward (with letter) | `FORWARDED` | SHO |

### 4.3 Status Codes from Backend

```typescript
type WorkflowStatus =
  | 'DRAFT'
  | 'INITIATED'
  | 'FORWARDED'
  | 'APPROVED'
  | 'REJECTED'
  | 'RED_FLAGGED'
  | 'RETURNED'
  | 'DISPOSED'
  | 'RE_ENQUIRY'
  | 'GROUND_REPORT'
  | 'CLOSED';
```

---

## 5. Pages & Components

### 5.1 Page Inventory

| Page | Route | Purpose | Key State |
|------|-------|---------|-----------|
| **Renewal Form** | `/forms/renewal` | Main multi-step renewal form | `verificationStatus`, `formData`, `expandedSections` |
| **Renewal Details** | `/renewalApplication/[id]` | View submitted renewal details | `application`, `loading` |
| **Public Renewal** | `/public/renewal/[id]` | Public-facing view | — |
| **Inbox** | `/inbox` | List pending renewal apps | — |
| **Inbox Filtered** | `/inbox/[type]` | Filtered inbox view | — |

### 5.2 Form Sections (in `/forms/renewal/page.tsx`)

The renewal form is a single-page multi-section accordion with the following sections:

| Section | Component | Fields | Save Method |
|---------|-----------|--------|-------------|
| 1. Personal Details | `PersonalDetailsSection` | firstName, lastName, DOB, PAN, Aadhaar, mobile, email, etc. | PATCH on section complete |
| 2. Address Details | `AddressDetailsSection` | Present & Permanent address, state/district/zone/division/PS, pincode | PATCH on section complete |
| 3. Occupation | `OccupationSection` | Occupation type, business address, crop protection, area | PATCH on section complete |
| 4. Criminal History | `CriminalHistory` | Conviction status, bond, prohibition, FIR details | PATCH on section complete |
| 5. License History | `LicenseHistory` | Previous licenses, family licenses, training, safe custody | PATCH on section complete |
| 6. License Details | `LicenseDetailsSection` | Weapon type, purpose, area of validity, ammunition | PATCH on section complete |
| 7. Biometric Info | `BiometricInformation` | Fingerprint, signature, iris scan | PATCH on section complete |
| 8. Documents | `DocumentsSection` | ID proof, address proof, photo, PAN, certificates | Upload-file POST per document |
| 9. Declaration | `DeclarationSection` | Agree to truth, legal consequences, terms | PATCH on submit |

### 5.3 Component Hierarchy

```
RenewalFormPage (page.tsx)
├── RenewalHeader
│   └── RenewalSummary (Cards: App ID, Renewal ID, Applicant, License#, Status, Date)
├── [Verification Screen]
│   ├── License ID Input
│   ├── Verify Button
│   ├── Applicant Details Card
│   └── Biometric Verification Modal
│       ├── Fingerprint Preview Modal
│       └── Capturing Modal
├── [Form Sections Accordion]
│   ├── PersonalDetailsSection
│   ├── AddressDetailsSection
│   ├── OccupationSection
│   ├── CriminalHistory
│   ├── LicenseHistory
│   ├── LicenseDetailsSection
│   ├── BiometricInformation
│   ├── DocumentsSection
│   └── DeclarationSection
└── [Submit & Preview]
    ├── Preview Modal
    └── Success Modal

RenewalApplicationDetailsPage
├── RenewalApplicationDetailsHeader
└── Info Cards Grid

RenewalProceedingsForm
├── Action Type Select (react-select)
├── Next Officer Select (react-select)
├── Remarks Editor (TiptapRichTextEditor)
├── Ground Report Editor (SHO only) (TiptapRichTextEditor)
├── Attachments Upload
└── Submit Button
```

---

## 6. API Service Layer

### 6.1 `RenewalService` (`frontend/src/api/renewalService.ts`)

| Method | API Call | Description |
|--------|----------|-------------|
| `findRenewalByLicenseNumber(licenseNumber)` | `GET /renewal-forms?search=:licenseNumber` | Search existing renewals (being deprecated) |
| `createRenewalForm(payload)` | `POST /renewal-forms` | Create DRAFT renewal |
| `getRenewalForm(applicationId)` | `GET /licenses/:applicationId` | Get renewal data **(Note: currently misrouted to licenses)** |
| `updateRenewalForm(applicationId, payload, options?)` | `PATCH /renewal-forms?applicationId=:id` | Update renewal (PATCH) |
| `uploadDocument(applicationId, fileType, file)` | `POST /renewal-forms/:id/upload-file` | Upload document |
| `uploadDocumentPayload(applicationId, fileType, payload)` | `POST /renewal-forms/:id/upload-file` | Upload document from payload |
| `deleteRenewalFile(fileId)` | `DELETE /renewal-forms/file/:fileId` | Delete uploaded file |
| `getWorkflowStatusesAndActions()` | `GET /workflow/statuses-actions` | Get workflow config |
| `getRenewalApplications(filters?)` | `GET /workflow/applications?applicationType=RenewalApplicationForm` | List renewals |
| `handleWorkflowAction(applicationId, actionId, ...)` | `POST /workflow/action` | Perform workflow action |
| `submitRenewalForWorkflow(applicationId, actionId)` | `POST /workflow/action` | Submit for review |
| `forwardRenewalApplication(applicationId, actionId, nextUserId, remarks)` | `POST /workflow/action` | Forward to next user |
| `approveRenewalApplication(applicationId, actionId, remarks)` | `POST /workflow/action` | Approve |
| `rejectRenewalApplication(applicationId, actionId, remarks)` | `POST /workflow/action` | Reject |
| `requestInfoRenewalApplication(applicationId, actionId, remarks)` | `POST /workflow/action` | Request more info |

### 6.2 `RenewalWorkflowService` (`frontend/src/services/renewalWorkflowService.ts`)

Business logic layer wrapping `RenewalService` with:
- Automatic `actionId` resolution via `getActionIdByCode(actionCode)`
- Toast notifications on success/failure
- Error handling and re-throwing

| Method | Action Code Resolved | Description |
|--------|---------------------|-------------|
| `submitRenewalForWorkflow(applicationId)` | `INITIATE` | Submit for review |
| `forwardRenewalApplication(applicationId, nextUserId, remarks)` | `FORWARD` | Forward |
| `approveRenewalApplication(applicationId, remarks)` | `APPROVED` | Approve |
| `rejectRenewalApplication(applicationId, remarks)` | `REJECT` | Reject |
| `requestInfoRenewalApplication(applicationId, remarks)` | `REQUEST_MORE_INFO` | Request info |
| `disposeRenewalApplication(applicationId, remarks)` | `DISPOSE` | Dispose |
| `raiseRedFlagRenewalApplication(applicationId, remarks)` | `RED_FLAG` | Red flag |

### 6.3 `LicenseService` (`frontend/src/services/licenseService.ts`)

Used for initial prefill of renewal form:

| Method | API Call | Usage in Renewal |
|--------|----------|------------------|
| `getLicenseById(id)` | `GET /licenses/:id` | Verify license & prefetch applicant data |
| `getLicenseByNumber(licenseNumber)` | `GET /licenses/by-number/:licenseNumber` | Lookup by license number |
| `getLicenseSourceApplication(licenseId)` | `GET /licenses/:id/source-application` | Get original application data |

### 6.4 `ApplicationService` (`frontend/src/api/applicationService.ts`)

Used in renewal for:
- `getApplication(id)` → `GET /application-form?applicationId=:id` — **Being removed** from renewal flow
- `getLicense(id)` → `GET /licenses/:id` — **Being replaced** with LicenseService
- `extractSectionData(data, section)` — Data transformation helper

---

## 7. Hooks & Business Logic

### 7.1 `useRenewalWorkflow` Hook

```typescript
interface UseRenewalWorkflowReturn {
  statuses: WorkflowStatus[];       // Available statuses from backend
  actions: WorkflowAction[];         // Available actions for current role
  loading: boolean;
  error: string | null;
  
  performAction: (payload: WorkflowActionPayload) => Promise<any>;
  submitApplication: (applicationId: number) => Promise<any>;
  forwardApplication: (applicationId, nextUserId, remarks) => Promise<any>;
  approveApplication: (applicationId, remarks) => Promise<any>;
  rejectApplication: (applicationId, remarks) => Promise<any>;
  requestAdditionalInfo: (applicationId, remarks) => Promise<any>;
  refresh: () => Promise<void>;
}
```

**State machine within the hook:**
```
idle → loading (fetch statuses/actions) → ready
ready → performing (action API call) → success/error → ready
```

### 7.2 `usePrefilledDocumentSync` Hook

```typescript
function usePrefilledDocumentSync(
  renewalId: string,
  formData: Record<string, any>,
  onPatch: (patch) => void,
  onError?: (message) => void,
  onStatus?: (message) => void,
  scope?: 'documents' | 'evidence' | 'all'
): { isSyncingPrefilled: boolean; hasPendingPrefilled: boolean }
```

**Purpose:** Automatically uploads documents that were prefilled from the license data but don't yet have a renewal file ID. Uses `syncPendingRenewalDocuments()` for the actual upload.

**Trigger conditions:**
1. `renewalId` is truthy
2. Form data has `fileUrl` without `id` (pending documents)
3. Signature hasn't been synced before (dedup via `syncedSignaturesRef`)

### 7.3 Form State Management

The renewal form uses a centralized `formData` state of type `RenewalFormState` (78 fields):

```typescript
type RenewalFormState = {
  renewalApplicationId: string;
  applicationId: string;
  licenseId?: number;
  freshLicenseId?: number;
  licenseNumber: string;
  acknowledgementNo: string;
  applicantName: string;
  // ... (70+ more fields for all form sections)
  declaration: { agreeToTruth: boolean; understandLegalConsequences: boolean; agreeToTerms: boolean };
  hasSubmittedTrueInfo: boolean;
};
```

**Key functions:**

| Function | Purpose | 
|----------|---------|
| `buildRenewalPayload(formData)` | Transform form state → flat POST payload for creation |
| `buildRenewalPatchPayload(formData)` | Transform form state → nested PATCH payload for updates |
| `buildFieldStateFromFreshApplication(applicationId, data)` | Transform License API response → form state for prefill |
| `buildRootDataFromRenewal(data)` | Transform renewal record → form state |
| `mergeRenewalStateOverFresh(fresh, renewal, renewalData)` | Merge fresh app data with renewal data |
| `extractData(response)` | Unwrap API response envelope |

---

## 8. File Upload Handling

### 8.1 Upload Flow

```
User selects file → FileReader reads as dataURL → 
  → image compression (canvas, max 1200px, JPEG 0.7 quality) →
  → POST /api/renewal-forms/:id/upload-file { fileType, fileUrl, fileName, fileSize } →
  → Returns { id, fileUrl, fileType, ... }
```

### 8.2 File Type Mapping

| Form Field | API fileType |
|------------|-------------|
| `idProofUploaded` | `AADHAR_CARD` |
| `panCardUploaded` | `PAN_CARD` |
| `trainingCertificateUploaded` | `TRAINING_CERTIFICATE` |
| `medicalCertificateUploaded` | `MEDICAL_REPORT` |
| `otherStateLicenseUploaded` | `OTHER_STATE_LICENSE` |
| `existingArmsLicenseUploaded` | `EXISTING_LICENSE` |
| `safeCustodyUploaded` | `SAFE_CUSTODY` |
| `photographUploaded` | `PHOTOGRAPH` |
| `signature` | `SIGNATURE_THUMB` |
| `irisScan` | `IRIS_SCAN` |
| `specialEvidenceUploaded` | `CLAIM_DOCS` |

### 8.3 Prefilled Document Sync

Documents copied from the License API response (source application) need to be re-uploaded to the renewal record:

```
1. Detect prefilled docs: formData[field].fileUrl exists but no .id
2. Fetch file as blob with auth header
3. Convert blob to base64 dataUrl
4. POST /renewal-forms/:id/upload-file with the dataUrl
5. Update form state with returned file id
```

### 8.4 Document Upload Functions

| Function | File | Purpose |
|----------|------|---------|
| `uploadRenewalDocument(renewalId, fieldName, file, existingFileId?)` | `renewalFileUpload.ts` | Upload new file (with optional delete of old) |
| `uploadRenewalDocumentFromExisting(renewalId, fieldName, meta)` | `renewalFileUpload.ts` | Re-upload existing/prefilled file |
| `syncPendingRenewalDocuments(renewalId, formData, options?)` | `renewalFileUpload.ts` | Upload all pending prefilled docs |
| `applyPrefilledDocumentUploads(renewalId, formData)` | `renewalFileUpload.ts` | Convenience wrapper for initial load |
| `deleteRenewalDocument(fileId)` | `renewalFileUpload.ts` | Delete document |
| `hasPendingRenewalDocuments(formData)` | `renewalFileUpload.ts` | Check if any docs need syncing |
| `collectRenewalFileIds(renewalData)` | `renewalFileUpload.ts` | Extract file IDs from renewal record |

---

## 9. Role-Based Actions & Permissions

### 9.1 Role Definitions

| Role | Code | Typical Actions |
|------|------|----------------|
| **Applicant** | `APPLICANT` | Create renewal, save draft, submit |
| **Sub-Inspector / SHO** | `SHO` | Verify, forward, generate ground report |
| **Zone Superintendent** | `ZS` | Close approved/rejected applications |
| **ACP** | `ACP` | Forward, approve, reject |
| **DCP** | `DCP` | Forward, approve, reject |
| **Commissioner of Police** | `CP` | Final approval |
| **Arms Superintendent** | `ARMS_SUPDT` | Forward, approve |
| **Arms Seat** | `ARMS_SEAT` | Forward, verify documents |
| **ADO** | `ADO` | Forward, verify |
| **CADO** | `CADO` | Forward |
| **AS** | `AS` | Forward |
| **JTCP** | `JTCP` | Forward |
| **Admin** | `ADMIN` | Full access |

### 9.2 Action Availability by Status

```
DRAFT:         [Submit]
INITIATED:     [Forward, Reject, Request More Info]
FORWARDED:     [Forward, Approve, Reject, Red Flag, Request More Info, Ground Report(SHO)]
APPROVED:      [Close(ZS)]
REJECTED:      [Close(ZS)]
RED_FLAGGED:   [Return, Forward]
RE_ENQUIRY:    [Forward, Reject]
GROUND_REPORT: [Forward]
CLOSED:        [—]
DISPOSED:      [—]
```

### 9.3 Frontend Permission Check

The `RenewalProceedingsForm` component uses:
- **Cookie-based role detection**: `getCookie('role')` to determine current user's role
- **Action filtering**: The `actions` array from `GET /workflow/statuses-actions` is filtered by the backend based on role
- **Conditional rendering**: SHO role shows Ground Report editor; ZS with special status auto-selects user

---

## 10. Error Handling

### 10.1 Error Handling Strategy

| Layer | Strategy | Example |
|-------|----------|---------|
| **API Service** | Try/catch with error re-throw | `RenewalService.createRenewalForm()` |
| **Workflow Service** | Error wrap + toast | `RenewalWorkflowService.submitRenewalForWorkflow()` |
| **Hook** | Error state + console.error | `useRenewalWorkflow` sets `error` state |
| **Component** | Error state + UI display | `RenewalApplicationDetailsPage` shows error card |
| **Form Page** | Conditional error render | `setError` → error banner in UI |

### 10.2 Specific Error Scenarios

| Scenario | Handling | Location |
|----------|----------|----------|
| License not found | `LicenseService.getLicenseById()` returns `null` → error message "No license data found" | `checkBiometricRequirement()` |
| Duplicate renewal (409) | Catch in `createDraftRenewalFromFreshApplication()` → fallback to `loadExistingRenewalByLicenseNumber()` | `page.tsx` |
| API auth failure (401) | `ApiClient` auto-redirects to `/login` | `authenticatedApiClient.ts` |
| Network error | Axios error → caught in service → displayed in UI | All levels |
| Validation errors | Per-section error objects (`personalErrors`, `addressErrors`, etc.) | Form sections |
| Workflow action failure | Toast error with message from backend | `RenewalWorkflowService` |

### 10.3 Error Message Patterns

```typescript
// API Service Level - re-throw with original message
throw new Error(errorMsg);  // Where errorMsg = err.message

// Hook Level - set error state
setError(errorMsg);
toast.error(errorMsg);

// Component Level - display in UI
{error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

// Validation Level - per-field errors
setPersonalErrors({ firstName: 'First name is required' });
```

---

## 11. External Integrations

### 11.1 Mantra SDK (Biometric Device)

Used for fingerprint capture and verification during the renewal flow.

| Function | Source | Description |
|----------|--------|-------------|
| `MantraSDKService.initialize()` | Device SDK | Initialize fingerprint scanner |
| `MantraSDKService.isDeviceConnected()` | Device SDK | Check device connectivity |
| `MantraSDKService.getConnectedDeviceList()` | Device SDK | List connected devices |
| `MantraSDKService.captureFinger(quality, timeout)` | Device SDK | Capture fingerprint |
| `MantraSDKService.getImage(position)` | Device SDK | Get fingerprint image |
| `MantraSDKService.getTemplate()` | Device SDK | Get fingerprint template |
| `MantraSDKService.verifyTemplate(template1, template2, threshold)` | Device SDK | Match fingerprints |

**Usage flow:**
1. After License API returns biometric data → extract enrolled fingerprint templates
2. Prompt user to scan fingerprint on device
3. Match scanned template against enrolled templates (threshold: 65)
4. If match → verified; else → retry

### 11.2 Tiptap Rich Text Editor

Used in `RenewalProceedingsForm` for:
- **Remarks input**: Rich text with formatting
- **Ground Report (SHO)**: Generated as styled document

### 11.3 jsPDF (PDF Generation)

Used for generating Ground Report as PDF:
- SHO enters ground report in Tiptap editor
- `generatePdfBase64Async()` converts HTML content to PDF
- PDF is sent as base64 attachment in workflow action payload
- Fallback: send as HTML base64 if PDF generation fails

---

## 12. Validation Rules

### 12.1 Per-Section Validation

| Section | Key Validations | Component |
|---------|----------------|-----------|
| **Personal** | Required: firstName, lastName, DOB, gender, mobile, email format, PAN format, Aadhaar (12 digits) | `PersonalDetailsSection` |
| **Address** | Required: presentAddress, state, district, zone, division, policeStation, pincode, residingSince | `AddressDetailsSection` |
| **Occupation** | Required: occupation, officeBusinessAddress, state, district | `OccupationSection` |
| **Criminal** | At least one FIR detail if convicted | `CriminalHistory` |
| **License History** | Conditional: family details if family member has license, safe custody details if applicable | `LicenseHistory` |
| **License Details** | Required: weaponType, purpose, area of validity | `LicenseDetailsSection` |
| **Documents** | Required: idProof, photograph, address proof (others conditional) | `DocumentsSection` |
| **Declaration** | All three checkboxes must be checked | `DeclarationSection` |

### 12.2 Workflow Action Validation

In `RenewalProceedingsForm.handleSubmit()`:

```typescript
const errors: Record<string, string> = {};
if (!selectedAction) errors.action = 'Please select an action type.';
if (!remarks.trim()) errors.remarks = 'Please add remarks before submitting.';
if (!nextUser && !isCloseForZS) errors.nextUser = 'Please select the next proceeding officer.';
if (role === 'SHO' && !draftLetter.trim()) 
  errors.draftLetter = 'Ground Report Letter is required for submission.';
```

### 12.3 File Validation

```typescript
// In renewalFileUpload.ts
const maxOriginalSize = 10 * 1024 * 1024; // 10MB
if (file.size > maxOriginalSize) throw new Error('File too large');

// In RenewalProceedingsForm
const maxSize = 10 * 1024 * 1024; // 10MB for workflow attachments
const invalidFiles = files.filter(f => f.size > maxSize);
```

---

## 13. Key Files Reference

### 13.1 All Frontend Renewal Files

| File | Lines | Purpose |
|------|-------|---------|
| `src/app/forms/renewal/page.tsx` | ~4700 | Main renewal form page (all sections, verification, save logic) |
| `src/app/renewalApplication/[id]/page.tsx` | ~200 | Submitted renewal details view |
| `src/api/renewalService.ts` | ~270 | All Renewal API calls |
| `src/services/renewalWorkflowService.ts` | ~260 | Workflow business logic |
| `src/services/licenseService.ts` | ~200 | License API service (prefill data) |
| `src/hooks/useRenewalWorkflow.ts` | ~200 | Workflow state hook |
| `src/hooks/usePrefilledDocumentSync.ts` | ~120 | Auto-document sync hook |
| `src/utils/renewalFileUpload.ts` | ~260 | Document upload utilities |
| `src/components/RenewalProceedingsForm.tsx` | ~500 | Workflow action form component |
| `src/components/renewal/RenewalApplicationDetailsPage.tsx` | ~250 | Details page component |
| `src/components/renewal/renewalapplicationdetailsheader.tsx` | ~130 | Details page header |
| `src/components/forms/renewal/RenewalHeader.tsx` | ~30 | Form header |
| `src/components/forms/renewal/RenewalSummary.tsx` | ~50 | Summary card |
| `src/components/forms/renewal/sections/*.tsx` | 9 files | Form section components |

### 13.2 Data Flow Summary

```
                    ┌─────────────────────────────┐
                    │     License API Response     │
                    │  (GET /api/licenses/:id)     │
                    │  { firstName, lastName,      │
                    │    licenseNumber,             │
                    │    address, biometrics,       │
                    │    endorsedWeapons, ... }     │
                    └─────────────┬───────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────────┐
                    │   buildFieldStateFromFresh   │
                    │   Application(licenseId,     │
                    │     licenseData)             │
                    │   → RenewalFormState         │
                    └─────────────┬───────────────┘
                                  │
                    ┌─────────────▼───────────────┐
                    │   createDraftRenewalFromFresh│
                    │   Application()             │
                    │                              │
                    │   1. buildRenewalPayload()   │
                    │   2. POST /api/renewal-forms │
                    │   3. applyPrefilledDocuments │
                    │   4. Set form state + route  │
                    └─────────────┬───────────────┘
                                  │
                    ┌─────────────▼───────────────┐
                    │   Section-by-Section Saves   │
                    │                              │
                    │   User edits → PATCH /api/   │
                    │   renewal-forms?appId=:id    │
                    │   { sectionPayload }         │
                    └─────────────┬───────────────┘
                                  │
                    ┌─────────────▼───────────────┐
                    │   Submit for Workflow        │
                    │                              │
                    │   1. PATCH (isSubmit=true)   │
                    │   2. POST /api/workflow/     │
                    │      action (INITIATE action)│
                    └─────────────┬───────────────┘
                                  │
                    ┌─────────────▼───────────────┐
                    │   Workflow Processing        │
                    │                              │
                    │   Officer → Select Action →  │
                    │   POST /api/workflow/action  │
                    │   → Status Transition        │
                    └─────────────────────────────┘
```

---

## End of Document
