# Fresh, Renewal & Cancellation — Interconnection Analysis

> **Date:** July 1, 2026
> **Scope:** Cross-reference of database models, frontend types, workflow engine, UI/UX patterns, data flow, and identified gaps between the three application types.

---

## Table of Contents

1. [Database-Level Interconnections](#1-database-level-interconnections)
2. [Workflow Engine — Unified vs Separate](#2-workflow-engine--unified-vs-separate)
3. [Shared Types & Interfaces](#3-shared-types--interfaces)
4. [UI/UX Patterns — Shared vs Distinct](#4-uiux-patterns--shared-vs-distinct)
5. [Data Flow Between the Three](#5-data-flow-between-the-three)
6. [Common Terms & User-Facing Language](#6-common-terms--user-facing-language)
7. [Identified Gaps & Inconsistencies](#7-identified-gaps--inconsistencies)
8. [System Architecture Diagram](#8-system-architecture-diagram)

---

## 1. Database-Level Interconnections

### Prisma Entity Relationships

```
FreshLicenseApplicationPersonalDetails
  │
  ├─── id ─────────────────────────────────────► CancelFormRequests.freshLicenseId
  │     (source application for cancellation)
  │
  ├─── id ─────────── "FreshLicenseRenewalLink" ► RenewalFormPersonalDetails.freshLicenseId
  │     (source application for renewal — links via freshLicenseId FK)
  │
  ├─── acknowledgementNo ─── (matches) ─────────► RenewalFormPersonalDetails.licenseNumber
  │     (renewal uses fresh app's acknowledgementNo as its licenseNumber)
  │
  ├─── FLAFBiometricDatas ─────────────────────► [Used by cancellation & renewal for verification]
  │     (fingerprint templates stored here; both forms READ only for verification)
  │
  └─── FLAFFileUploads ───────────────────────► [Documents inherited/pre-filled into renewal]
```

### Key Linkage Rules

| Link                     | How It Works                                                                                                                                                                            |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Fresh → Renewal**      | `RenewalFormPersonalDetails.freshLicenseId` → `FreshLicenseApplicationPersonalDetails.id`. Also, `RenewalFormPersonalDetails.licenseNumber` = original fresh app's `acknowledgementNo`. |
| **Fresh → Cancellation** | `CancelFormRequests.freshLicenseId` → `FreshLicenseApplicationPersonalDetails.id`. The cancellation targets a specific fresh license to cancel it.                                      |
| **Biometric Link**       | Both forms **read** biometric templates from `FLAFBiometricDatas` (fresh app) for verification. Renewal also **creates** new `RenewalBiometricDatas` for re-enrollment.                 |
| **Workflow History**     | Three separate tables, same structure, different FK targets: `FreshLicenseApplicationsFormWorkflowHistories`, `RenewalApplicationsFormWorkflowHistories`, `CancelWorkflowHistories`.    |

### Workflow History Table Comparison

| Field                 | Fresh                                                         | Renewal                                           | Cancel                                    |
| --------------------- | ------------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------- |
| **Table**             | `FreshLicenseApplicationsFormWorkflowHistories`               | `RenewalApplicationsFormWorkflowHistories`        | `CancelWorkflowHistories`                 |
| **FK to application** | `applicationId` → `FreshLicenseApplicationPersonalDetails.id` | `applicationId` → `RenewalFormPersonalDetails.id` | `applicationId` → `CancelFormRequests.id` |
| **Action takers**     | `previousUserId`, `nextUserId` → `Users`                      | Same                                              | Same                                      |
| **Roles**             | `previousRoleId`, `nextRoleId` → `Roles`                      | Same                                              | Same                                      |
| **Action lookup**     | `actionesId` → `Actiones`                                     | Same                                              | Same                                      |
| **Attachments**       | `attachments` (JSON)                                          | Same                                              | Same                                      |

---

## 2. Workflow Engine — Unified vs Separate

### Endpoint Architecture

```
POST /workflow/action   ← UNIFIED: used by Fresh, Renewal, AND Cancel
POST /cancel-forms/:id/action   ← SEPARATE: only used by Cancel (dual path)
```

### Frontend Service Comparison

Both `RenewalWorkflowService` and `CancelWorkflowService` have **identical method signatures** and both hit the **same `/workflow/action`** endpoint:

| Method                     | RenewalWorkflowService | CancelWorkflowService | Same? |
| -------------------------- | ---------------------- | --------------------- | ----- |
| `performAction()`          | ✅                     | ✅                    | ✅    |
| `forwardApplication()`     | ✅                     | ✅                    | ✅    |
| `approveApplication()`     | ✅                     | ✅                    | ✅    |
| `rejectApplication()`      | ✅                     | ✅                    | ✅    |
| `requestInfoApplication()` | ✅                     | ✅                    | ✅    |

### Dual-Path Problem in Cancellation

Cancellation has a **dual-path** architecture for approvals:

1. **Primary path:** `POST /workflow/action` — For standard workflow history
2. **Fallback path:** `POST /cancel-forms/:id/action` — For actually updating the original application status to CANCELLED

Both paths are called in sequence (see `cancelWorkflowService.ts` lines 82-113), which creates a potential race condition:

```typescript
// Primary action
const result = await CancelService.handleWorkflowAction(...)

// Fallback — direct action on the same request
try {
  await CancelService.processCancelAction(applicationId, { action: 'APPROVED', remarks })
} catch (e) {
  console.warn("Direct approve action failed/not needed", e)
}
```

### Action ID Resolution

Both services use the same helper to resolve action names to IDs:

```typescript
private static async getActionIdByCode(actionCode: string): Promise<number> {
  const data = await RenewalService.getWorkflowStatusesAndActions();
  const actions = data?.actions || [];

  let action = actions.find(
    (a: any) => a.code?.toUpperCase() === actionCode.toUpperCase()
  );

  // Fallback: INITIATE → INITIATED
  if (!action && actionCode?.toUpperCase() === 'INITIATE') {
    action = actions.find((a: any) => a.code?.toUpperCase() === 'INITIATED');
  }

  return action.id;
}
```

---

## 3. Shared Types & Interfaces

### `ApplicationData` — The Universal Type

`frontend/src/types/index.ts` defines `ApplicationData` as the **single unified type** used by the application detail page for all three form types:

```typescript
interface ApplicationData {
  // Personal (shared across all)
  firstName;
  middleName;
  lastName;
  parentOrSpouseName;
  sex;
  dateOfBirth;
  placeOfBirth;
  panNumber;
  aadharNumber;

  // Addresses (shared structure, separate DB tables)
  presentAddress; // Same shape for fresh & renewal
  permanentAddress; // Same shape for fresh & renewal
  occupationAndBusiness; // Same shape

  // License (shared structure)
  licenseDetails; // needForLicense, armsCategory, areaOfValidity, requestedWeapons
  licenseHistories; // hasAppliedBefore, previousResult, etc.
  criminalHistories; // isConvicted, firDetails, etc.

  // Workflow (shared)
  workflowStatus: { id; code; name };
  currentUser: { id; username };

  // Type discriminator
  applicationType: string; // "FreshApplication" | "Renewal" | "CancelApplication"

  // Status — shared enum
  status?: ApplicationStatus;
}
```

### Shared `ApplicationStatus` Enum

```typescript
type ApplicationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "returned"
  | "red-flagged"
  | "disposed"
  | "initiated"
  | "cancelled"
  | "re-enquiry"
  | "ground-report"
  | "closed"
  | "recommended"
  | "under_review"
  | "forwarded"
  | "final_disposal"
  | "sent";
```

### Type Mapping in `applicationMapper.ts`

```typescript
const statusMap: Record<string, ApplicationData["status"]> = {
  forwarded: "pending",
  returned: "returned",
  red_flagged: "red-flagged",
  initiated: "initiated",
  approved: "approved",
  rejected: "rejected",
  cancelled: "cancelled",
  // ... plus all uppercase variants
};
```

> ⚠️ **Note:** There is **no separate `CancellationData` type.** The detail page uses `ApplicationData` for everything, with `applicationType` as the discriminator.

---

## 4. UI/UX Patterns — Shared vs Distinct

### Shared Components (Same across all forms)

| Component                     | Used In                           | Notes                                 |
| ----------------------------- | --------------------------------- | ------------------------------------- |
| `PersonalDetailsSection`      | Fresh & Renewal forms             | Same fields, same layout              |
| `AddressDetailsSection`       | Fresh & Renewal forms             | Same `LocationHierarchy` component    |
| `OccupationSection`           | Fresh & Renewal forms             | Same fields                           |
| `CriminalHistory`             | Fresh & Renewal forms             | Same FIR details structure            |
| `LicenseHistory`              | Fresh & Renewal forms             | Same fields                           |
| `LicenseDetailsSection`       | Fresh & Renewal forms             | Same weapon selection, ammunition     |
| `BiometricInformation`        | Fresh & Renewal forms             | Same Mantra SDK, same modals          |
| `ProceedingsForm`             | **All** — application detail page | Same action processor                 |
| `EnhancedApplicationTimeline` | **All** — application detail page | Reads `workflowHistories` generically |
| `StatusBadge`                 | **All** — everywhere              | Uses `getStatusStyle()` for colors    |
| `ProcessApplicationModal`     | **All** — detail page             | Same forward/approve/reject/flag      |

### Distinct Pages

| Page                   | Path                                         | Application Type         | Entry Point                     |
| ---------------------- | -------------------------------------------- | ------------------------ | ------------------------------- |
| Fresh Application Form | `/forms/createFreshApplication/...`          | `FreshApplication`       | New application                 |
| Renewal Form           | `/forms/renewal?applicationId=X&renewalId=Y` | `Renewal`                | From fresh app detail → "Renew" |
| Cancel Form (Submit)   | `/cancelForm/new?applicationId=X`            | `CancelApplication`      | From fresh app → "Cancel"       |
| Cancel Form (List)     | `/cancelForm`                                | Lists cancel requests    | From sidebar menu               |
| Application Detail     | `/application/:id?type=renewal`              | **Both** fresh & renewal | From inbox / search             |

### Header & Sidebar

- **Header:** Shared across all pages. Shows breadcrumbs + status badge + search.
- **Sidebar:** The sidebar has a hardcoded check for `/cancelForm` routes to highlight the correct menu item:

```typescript
// From Sidebar.tsx
if (pathname.startsWith("/cancelForm")) {
  const cancelKey = "cancelform";
  setActiveItem(cancelKey);
}
```

---

## 5. Data Flow Between the Three

### Fresh → Renewal Flow

```
Fresh Application (approved)
  │
  ├── User clicks "Renew" (from inbox or application detail page)
  │   └──> Navigates to /forms/renewal?applicationId=FRESH_ID
  │
  ├── checkBiometricRequirement(FRESH_ID)
  │   └──> Reads FLAFBiometricDatas from fresh application
  │         ├── If fingerprints exist → require verification
  │         └── If no fingerprints → skip to form directly
  │
  ├── Pre-fills ALL fields from fresh application:
  │   ├── Personal details (names, DOB, PAN, Aadhar)
  │   ├── Addresses (both present & permanent)
  │   ├── Occupation & Business
  │   ├── License details (weapons, ammunition, etc.)
  │   ├── License history (previous applications)
  │   ├── Criminal history (FIR details)
  │   └── Biometric data references (for verification)
  │
  ├── Creates RenewalFormPersonalDetails record
  │   ├── freshLicenseId = FRESH_ID
  │   └── licenseNumber = freshApp.acknowledgementNo
  │
  └── User updates: address, occupation, criminal history, weapons, fresh photograph
```

### Fresh → Cancellation Flow

```
Fresh Application (approved / active)
  │
  ├── User clicks "Cancel" / goes to /cancelForm/new
  │
  ├── checkBiometricRequirement(FRESH_ID)
  │   └──> Reads FLAFBiometricDatas from fresh application
  │         ├── If fingerprints exist → require verification (match against stored template)
  │         └── If no fingerprints → skip verification
  │
  ├── Creates CancelFormRequests record
  │   └── freshLicenseId = FRESH_ID
  │   └── status = 'PENDING'
  │
  └── On approval (via workflow action):
      ├── Updates fresh application workflowStatus → CANCELLED
      └── Creates workflow history on both cancel request AND fresh application
```

### Renewal → License Merge Flow

```
Renewal (approved)
  │
  ├── On merge:
  │   ├── Reads updated data from RenewalFormPersonalDetails
  │   └── Updates FreshLicenseApplicationPersonalDetails with:
  │       ├── Personal details (if changed)
  │       ├── Addresses (present & permanent)
  │       ├── Occupation
  │       └── License details
  │
  └── Creates LicensesMergeAuditLog record
      ├── freshLicenseId, renewalLicenseId
      └── mergedFields (list of field names that were updated)
```

---

## 6. Common Terms & User-Facing Language

### Terminology Mapping

| Concept              | Fresh Form                                      | Renewal Form                               | Cancel Form                                | Detail Page                           |
| -------------------- | ----------------------------------------------- | ------------------------------------------ | ------------------------------------------ | ------------------------------------- |
| **Application Type** | `FreshApplication`                              | `Renewal` / `Renewal`                      | `Cancel Application`                       | `applicationType` field               |
| **License Number**   | `acknowledgementNo`                             | `licenseNumber` (from fresh's ack)         | N/A                                        | `acknowledgementNo`, `licenseNumber`  |
| **Applicant Name**   | `firstName + middleName + lastName`             | Same                                       | Fetched from fresh                         | Same                                  |
| **Status**           | `workflowStatus.name`                           | `workflowStatus.name`                      | `status` string field + `workFlowStatusId` | `workflowStatus` object               |
| **Current User**     | `currentUser.username`                          | Same                                       | `requester.username`                       | `currentUser.username`                |
| **Workflow History** | `FreshLicenseApplicationsFormWorkflowHistories` | `RenewalApplicationsFormWorkflowHistories` | `CancelWorkflowHistories`                  | **All mapped to** `workflowHistories` |
| **Biometric Data**   | `FLAFBiometricDatas.biometricData`              | `RenewalBiometricDatas.biometricData`      | Read-only from fresh                       | `biometricData` field                 |
| **Document Uploads** | `FLAFFileUploads`                               | `RenewalFileUploads`                       | None yet                                   | Mapped generically in `documents[]`   |
| **Route Pattern**    | `/application/:id`                              | `/application/:id?type=renewal`            | `/cancelForm/:id`                          | `/application/:id`                    |

### Field Name Variations (legacy/optional aliases)

The `ApplicationData` type tracks multiple potential field names to handle API variations:

| Concept            | Primary Field                         | Aliases                                               |
| ------------------ | ------------------------------------- | ----------------------------------------------------- |
| Date of Birth      | `dateOfBirth`                         | `dob`                                                 |
| Gender             | `sex`                                 | `gender`                                              |
| Applicant Name     | `firstName`, `middleName`, `lastName` | `applicantName` (combined)                            |
| Mobile             | `applicantMobile`                     | `mobileNumber`, `phoneNumber`                         |
| Email              | `applicantEmail`                      | `email`                                               |
| License Number     | `licenseNumber`                       | `almsLicenseId`, `licenseId`, `previousLicenseNumber` |
| Acknowledgement No | `acknowledgementNo`                   | `ackNo`                                               |

---

## 7. Identified Gaps & Inconsistencies

### Gap 1: 🔴 Cancellation Has No File Uploads for Supporting Documents

The user's requirement says applicants must provide "Supporting documents" for cancellation, but:

- **Frontend:** `SubmitCancelForm.tsx` has zero file upload capability
- **Backend:** `CancelFormRequests` model has no `fileUploads`, `attachments`, or `documents` relation
- **Schema:** No `CancelFormFileUploads` table exists

### Gap 2: 🔴 Cancellation Doesn't Capture Firearm Surrender Details

The user's requirement says applicants must provide "Firearm surrender details," but the form only has:

- ✅ `cancellationReason` (text)
- ❌ No fields for:
  - Surrendered weapon(s) — make, model, serial number
  - Date of surrender
  - Place / authority to whom surrendered
  - Surrender receipt or acknowledgment number

### Gap 3: 🟡 Detail Page `handleProcessApplication` Uses Mock Logic

In `ApplicationDetailClient.tsx` (lines ~227–265), the `handleProcessApplication` function uses `setTimeout` to simulate API calls instead of calling real endpoints:

```typescript
// Simulate API call delay
await new Promise((resolve) => setTimeout(resolve, 1500));
// Update local state only
const updatedApplication = { ...application };
```

This code path is **never actually reached** for real processing because `ProceedingsForm` handles the actual workflow. But the mock code creates confusion.

### Gap 4: 🟡 Cancellation Has Dual Status System

- **Fresh / Renewal:** Use `workflowStatusId` → `Statuses` table (normalized)
- **Cancel:** Has BOTH a `status` string field (`PENDING`, `APPROVED`, `REJECTED`) AND a `workFlowStatusId` FK to `Statuses`

This dual approach creates inconsistency in status tracking and reporting.

### Gap 5: 🟡 Detail Page Doesn't Support Cancellation Requests

- `/application/:id` handles fresh (default) and renewal (`?type=renewal`)
- Cancellation requests have their **own separate** detail page at `/cancelForm/:id`
- There is **no unified view** that shows cancellation details within the same layout

### Gap 6: 🟡 Multiple Optional/Legacy Field Names in ApplicationData

The `ApplicationData` type has grown many optional aliases over time. While functional, this is fragile:

- Any new API format needs new aliases added
- TypeScript doesn't enforce which field is the "source of truth"
- Example: `dateOfBirth` / `dob`, `gender` / `sex`, `firstName` / `applicantName` all coexist

### Gap 7: 🟡 CancelForm Menu Item Is Hardcoded in Sidebar

```typescript
if (pathname.startsWith('/cancelForm')) {
  const cancelKey = 'cancelform';
```

This string-based routing is not driven by the menu configuration and would break if the route changes.

### Gap 8: 🟢 Cancel Workflow Service Calls Two Endpoints for Approval

```typescript
// Called in sequence — potential race condition
await CancelService.handleWorkflowAction(...)      // POST /workflow/action
await CancelService.processCancelAction(...)        // POST /cancel-forms/:id/action
```

These two calls should be wrapped in a single backend transaction instead of depending on sequential client calls.

---

## 8. System Architecture Diagram

```
                      ┌──────────────────────────────────┐
                      │      Fresh Application           │
                      │      (source of truth)           │
                      │                                  │
                      │  ┌──────────────────────────┐    │
                      │  │ FLAFBiometricDatas        │    │
                      │  │  • fingerprints[].template│────┼───┐
                      │  │  • signature               │    │   │
                      │  │  • irisScan                │    │   │
                      │  └──────────────────────────┘    │   │
                      │                                  │   │
                      │  ┌──────────────────────────┐    │   │
                      │  │ FLAFFileUploads            │    │   │
                      │  │  • AADHAR_CARD            │    │   │
                      │  │  • PHOTOGRAPH             │    │   │
                      │  │  • MEDICAL_REPORT, etc.   │    │   │
                      │  └──────────────────────────┘    │   │
                      └────────────┬─────────────────────┘   │
                                   │                        │
              ┌────────────────────┼────────────────┐       │
              ▼                    ▼                │       │
   ┌────────────────────┐  ┌────────────────┐       │       │
   │   Renewal Form     │  │  Cancellation   │       │       │
   │                    │  │                 │       │       │
   │ Pre-fills from     │  │ Reads bio for   │       │       │
   │ fresh application: │  │ verification ───┼───────┼───────┘
   │  • Personal        │  └────────┬────────┘       │
   │  • Addresses       │          │                │
   │  • Occupation      │          │ On approve:    │
   │  • License det.    │          ▼                │
   │  • Criminal hist.  │  ┌──────────────────┐     │
   │  • License hist.   │  │ Fresh status →   │     │
   │                    │  │ CANCELLED        │     │
   │ Captures new:      │  └──────────────────┘     │
   │  • Fresh biometric │                          │
   │  • Fresh photo     │                          │
   │  • Updated data    │                          │
   └────────┬───────────┘                          │
            │                                      │
            │ On approve + merge:                  │
            ▼                                      │
   ┌────────────────────┐                          │
   │  LicensesMerge     │                          │
   │  AuditLog          │                          │
   │  (updates fresh    │                          │
   │   record with      │                          │
   │   renewal data)    │                          │
   └────────────────────┘                          │
                                                   │
                    ┌──────────────────────────────┘
                    ▼
   ┌──────────────────────────────────┐
   │   Application Detail Page        │
   │   (/application/:id)             │
   │                                  │
   │  ┌──────────────────────────┐    │
   │  │ SectionCard (Personal)    │    │
   │  │ SectionCard (Addresses)   │    │
   │  │ SectionCard (License)     │    │
   │  │ SectionCard (Criminal)    │    │
   │  │ SectionCard (Occupation)  │    │
   │  │ DocumentTable             │    │
   │  └──────────────────────────┘    │
   │                                  │
   │  ┌──────────────────────────┐    │
   │  │ ProceedingsForm          │    │
   │  │  * Forward / Approve     │    │
   │  │  * Reject / Return       │    │
   │  │  * Flag / Dispose        │    │
   │  └──────────────────────────┘    │
   │                                  │
   │  ┌──────────────────────────┐    │
   │  │ EnhancedApplication      │    │
   │  │ Timeline                 │    │
   │  │  • workflowHistories[]   │    │
   │  │  • User actions          │    │
   │  │  • Attachments           │    │
   │  └──────────────────────────┘    │
   └──────────────────────────────────┘
```

---

## Appendix: Key File References

| File                                                                      | Purpose                                        |
| ------------------------------------------------------------------------- | ---------------------------------------------- |
| `backend/prisma/schema.prisma`                                            | All database models and relationships          |
| `backend/src/modules/CancelForm/cancel-form.service.ts`                   | Backend cancellation logic                     |
| `backend/src/modules/renewal/renewal-form.service.ts`                     | Backend renewal logic (including merge)        |
| `backend/src/modules/FLAWorkflow/workflow.service.ts`                     | Unified workflow engine                        |
| `frontend/src/types/index.ts`                                             | `ApplicationData` shared type                  |
| `frontend/src/types/api.ts`                                               | `APIApplication`, `ApiResponse` types          |
| `frontend/src/utils/applicationMapper.ts`                                 | API → UI status mapping                        |
| `frontend/src/utils/applicationFormatters.ts`                             | Formatting utilities                           |
| `frontend/src/app/application/[id]/ApplicationDetailClient.tsx`           | Unified detail page                            |
| `frontend/src/app/forms/renewal/page.tsx`                                 | Renewal form (includes biometric verification) |
| `frontend/src/components/cancelForm/SubmitCancelForm.tsx`                 | Cancellation form                              |
| `frontend/src/services/cancelWorkflowService.ts`                          | Cancel workflow service                        |
| `frontend/src/services/renewalWorkflowService.ts`                         | Renewal workflow service                       |
| `frontend/src/hooks/useRenewalWorkflow.ts`                                | Renewal workflow hook                          |
| `frontend/src/components/forms/renewal/sections/BiometricInformation.tsx` | Biometric capture component                    |
| `frontend/src/components/ProceedingsForm.tsx`                             | Shared action processor                        |
