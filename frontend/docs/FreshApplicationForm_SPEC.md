## Fresh Application Form — Specification

This document describes the `FreshApplicationForm` React component located at `frontend/src/components/FreshApplicationForm.tsx`.
It lists the form steps, all fields (grouped by step), validations, file upload behavior, APIs called by the form, payload shapes, error handling, and recommended next steps for backend or frontend work.

---

## Quick overview

- Component props: `onSubmit(formData: FormData)`, `onCancel()`
- Draft key (localStorage): `alms-license-draft`
- Main client-side API clients used:
  - `ApplicationApi` (create/getAll/getById/...) — `frontend/src/config/APIClient.ts`
  - `DocumentApi` (upload/getAll/delete)
  - `ReportApi` (generatePdf)
  - `WeaponsService` — `/Weapons` endpoint
  - Raw `apiClient` calls for location endpoints: `/locations/states`, `/locations/districts`, `/locations/police-stations`

This form is a multi-step wizard. The UI step titles (and indices) are:

1. Personal Information
2. Address Details
3. Occupation & Business
4. Criminal History
5. License Details
6. Biometric Information
7. Documents Upload
8. Preview
9. Declaration

Each step has field-level and step-level validation. All steps are re-validated on final submission.

---

## Fields (grouped by step)

Notes: field names below are the state keys used in the component's `formData` object.

### Step 1 — Personal Information
- `aliceAcknowledgementNumber` (string)
- `applicantName` (string) — required
- `applicantMiddleName` (string)
- `applicantLastName` (string)
- `applicantMobile` (string) — required, validated as 10 digits `/^[0-9]{10}$/`
- `applicantEmail` (string) — required, simple email regex `/^\S+@\S+\.\S+$/`
- `fatherName` (string) — required
- `motherName`, `maritalStatus`, `nationality` (defaults to 'Indian')
- `panNumber`, `aadharNumber`, `applicantIdType` (e.g. 'aadhar'), `applicantIdNumber` — if `applicantIdType === 'aadhar'` then `applicantIdNumber` must be exactly 12 digits
- `applicantGender` (string) — required
- `applicantDateOfBirth` (string/date) — required
- `dateOfBirthInWords`, `placeOfBirth`, `applicationFilledBy`

### Step 2 — Address Details
- Present address fields:
  - `applicantAddress` (string) — required
  - `presentState` (string) — required
  - `presentDistrict` (string) — required
  - `presentPincode` (string) — required
  - `presentPoliceStation` (string) — required
  - `jurisdictionPoliceStation` (string) — required
  - cascading selector IDs: `presentStateId`, `presentDistrictId`, `presentZoneId`, `presentDivisionId`, `presentStationId`
- Permanent address fields (can be `sameAsPresent` boolean):
  - `permanentAddress`, `permanentState`, `permanentDistrict`, `permanentPincode`, `permanentPoliceStation`
  - cascading IDs: `permanentStateId`, `permanentDistrictId`, `permanentZoneId`, `permanentDivisionId`, `permanentStationId`
  - `sameAsPresent` toggles autofill of permanent fields
  - `residingSince` (date string)

### Step 3 — Occupation & Business
- `occupation` (string) — required
- `officeBusinessAddress`, `officeBusinessState`, `officeBusinessDistrict`, `officePhone`, `officeMobile`, `residencePhone`, `alternativeMobile`
- `cropProtectionLocation`, `cultivatedArea`

### Step 4 — Criminal History
- `criminalHistory`: array of records. Each record has:
  - `convicted` (boolean)
  - `isCriminalCasePending` ('Yes'|'No')
  - `firNumber`, `policeStation`, `sectionOfLaw`, `dateOfOffence`, `caseStatus`

Validation: when `isCriminalCasePending === 'Yes'` the FIR, police station, section, date, and status are required for that record.

### Step 5 — License Details
- `applicationType` ('New License' default)
- `weaponType` (string) — required
- `weaponId` (number) — optional, used when specific weapon selected
- `weaponReason` (string) — required (purpose for weapon)
- `licenseType` (string), `licenseValidity`
- `licenseHistory` (array) — entries contain previous license metadata; when `hasPreviousLicense === 'yes'` several fields become required (previousLicenseNumber, issueDate, expiry, issuingAuthority, renewal details)

### Step 6 — Biometric Information
- `signature` (base64 data URL or string)
- `irisScan` (base64 data URL or string)
- `photograph` (base64 data URL or string)

The form includes default small base64 placeholders when these are not provided.

### Step 7 — Documents Upload
- Upload flags and file placeholders stored in `documentFiles` state map. Keys used by the form:
  - `idProofUploaded` (Aadhaar)
  - `addressProofUploaded`
  - `photographUploaded`
  - `panCardUploaded`
  - `characterCertificateUploaded`
  - `medicalCertificateUploaded`
  - `trainingCertificateUploaded`
  - `otherStateLicenseUploaded`

Upload UI stores an object with shape `{ file: File, preview: string }` in `documentFiles[docKey]`.

File validation rules (client-side):
- Allowed MIME types: `application/pdf`, `image/jpeg`, `image/png`
- Per-file max size: 5 MB (5 * 1024 * 1024 bytes)

Step 7 validation requires `idProofUploaded`, `addressProofUploaded`, and `photographUploaded` to be true.

### Step 8 — Preview
- No new fields; renders a preview of the current `formData` and uploaded documents

### Step 9 — Declaration
- Declaration object `declaration` contains booleans:
  - `agreeToTruth`, `understandLegalConsequences`, `agreeToTerms` — all required for submission
- Global `hasSubmittedTrueInfo` must be `true` on final submit

---

## Client-side helpers and behaviors

- `setValueByPath(obj, path, value)` — helper used to set nested fields using dot-paths (e.g. `declaration.agreeToTruth`)
- `documentFiles` keeps actual `File` objects and preview blobs (object URL) for image preview. Previews are revoked on unmount.
- `save as draft` uses `localStorage.setItem('alms-license-draft', JSON.stringify({ formData, formStep, lastSaved }))`
- `handleFillTestData()` creates an example payload and small placeholder base64 images for local testing
- `handleNextStep()` calls `validateCurrentStep()` and advances the `formStep` only if validation passes

---

## File upload and compression behavior

`uploadFilesAndGetUrls()`:

- Iterates `documentFiles` and converts each file to a base64 data URL before adding to `fileUploads[]`.
- Aggressive image compression path:
  - Images are loaded into a canvas and resized down to max 300x300 (maintaining aspect ratio) and compressed with quality 0.3
  - If resulting base64 string > ~100000 chars (~75KB), falls back to a 100x100 thumbnail with quality 0.2
- Non-image files (PDF) are replaced with a small placeholder base64 PDF string (to avoid very large payloads)
- For documents that are flagged as uploaded in `formData` but no `File` exists in `documentFiles` (test data path), a tiny 1x1 PNG base64 is generated as a placeholder.
- The function computes an estimated total payload size (base64 length -> bytes) and if > 1000 KB (~1 MB) it returns an empty array to avoid 413 errors (server rejects large requests). It warns at > 500 KB.

File upload mapping used in payload (client side):

```
fileTypeMap: {
  idProofUploaded: 'AADHAR_CARD',
  panCardUploaded: 'PAN_CARD',
  addressProofUploaded: 'OTHER',
  photographUploaded: 'OTHER',
  characterCertificateUploaded: 'OTHER',
  medicalCertificateUploaded: 'MEDICAL_REPORT',
  trainingCertificateUploaded: 'TRAINING_CERTIFICATE',
  otherStateLicenseUploaded: 'OTHER_STATE_LICENSE'
}
```

Each `fileUploads` item created by `uploadFilesAndGetUrls()` is an object with keys roughly like:

- `fileName` — string
- `fileSize` — number
- `fileType` — mapped string (see above)
- `fileUrl` — base64 data URL (string)

This `fileUploads` array is included in the main application payload as `fileUploads`.

---

## APIs called by the component (endpoints & usage)

Location endpoints (used to populate cascading dropdowns):
- GET `/locations/states` — list of states
- GET `/locations/districts` with payload `{ stateId }` — list districts for a state
- GET `/locations/police-stations` — list police stations

Weapons:
- GET `/Weapons` — used by `WeaponsService.getAll()` (note: the path is capitalized and comes from `WeaponsService`)

Application API (from `frontend/src/config/APIClient.ts`):
- GET `/application-form` — ApplicationApi.getAll(params)
- GET `/application-form/?applicationId={id}` — ApplicationApi.getById(id)
- POST `/application-form` — ApplicationApi.create(payload) — used on submit
  - The client builds a `payload` using `createPayload(formData, userId, fileUploads)` — see payload summary below

Document API (used elsewhere in app and available):
- POST `/applications/{applicationId}/documents` — `DocumentApi.upload(applicationId, file, documentType)` (uses multipart upload)
- GET `/applications/{applicationId}/documents` — to list documents
- DELETE `/applications/{applicationId}/documents/{documentId}` — delete

Report / PDF endpoints:
- GET `/applications/{applicationId}/pdf` — returns a PDF blob (used by `ReportApi.generatePdf`)

Other APIs called indirectly:
- Auth endpoints like `/auth/getMe`, `/auth/me`, login endpoints — via `AuthApi`

Notes on retry logic and 413 handling:
- On POST `/application-form`, if the client detects a 413 (payload too large) error, it automatically retries the same call with `fileUploads = []` (i.e., without attachments). It then informs the user to upload files separately.

---

## API payload (client-side `createPayload` summary)

The `createPayload(formData, userId, fileUploads)` function constructs a large object containing these groups (summarized):

- `firstName`, `middleName`, `lastName`, `filledBy`, `parentOrSpouseName`, `sex`, `placeOfBirth`, `dateOfBirth`, `panNumber`, `aadharNumber`, `dobInWords`
- `stateId`, `districtId` (for present address)
- `currentUserId`, `currentRoleId` (defaults used on client)
- `presentAddress` — object with `addressLine`, `stateId`, `districtId`, `policeStationId`, `sinceResiding` (ISO date)
- `permanentAddress` — object with similar shape
- `contactInfo` — `telephoneOffice`, `telephoneResidence`, `mobileNumber`, `officeMobileNumber`, `alternativeMobile`
- `occupationInfo` — `occupation`, `officeAddress`, `stateId`, `districtId`, `cropLocation`, `areaUnderCultivation` (integer)
- `biometricData` — `signatureImageUrl`, `irisScanImageUrl`, `photoImageUrl` (base64 strings or placeholders)
- `criminalHistory` — array (copied from form)
- `licenseHistory` — array (copied)
- `licenseRequestDetails` — object including `needForLicense`, `weaponCategory`, `requestedWeaponIds` (array of string ids), `areaOfValidity` (derived from `carryArea`)
- `fileUploads` — array (see previous section) containing `fileName`, `fileSize`, `fileType`, `fileUrl`

Important conversion helpers used by the client:
- `getStateId(name)` and `getDistrictId(name)` — map names to numeric IDs fetched from the locations API; default to `1` if not found
- `getPoliceStationId(name)` — maps police station name to id from `policeStations` list
- `getWeaponIds(weaponType)` — maps common names to weapon ids or uses `weaponId` if selected

---

## Validation rules (summary)

Per-step `validateCurrentStep()` enforces:

- Step 0: applicantName, applicantMobile (10 digits), applicantEmail (basic regex), applicantGender, applicantDateOfBirth, fatherName, applicantIdNumber (12 digits if Aadhaar)
- Step 1: applicantAddress, presentState, presentDistrict, presentPincode, presentPoliceStation, jurisdictionPoliceStation. If `sameAsPresent === false`, permanent address fields are required.
- Step 2: occupation required
- Step 3: criminal history entries must include FIR/police details when `isCriminalCasePending === 'Yes'`
- Step 4: weaponType and weaponReason required; license history entries have conditional required fields when they indicate previous licenses
- Step 6: idProofUploaded, addressProofUploaded, photographUploaded required
- Step 8 (final declaration): declarations `agreeToTruth`, `understandLegalConsequences`, `agreeToTerms` must be true and `hasSubmittedTrueInfo` must be true

On final submit, `validateAllStepsForSubmission()` re-runs all checks and populates `errors` state with any missing fields.

---

## Error handling and UX notes

- The form sets `apiError` (string) and `apiErrorDetails` (object) for API failures. It tries to extract helpful messages from nested responses (many shapes attempted: `.details.response.error`, `.details.response.message`, `.details.message`, `.error`, `.message`).
- If a server returns HTTP 413 (Request too large) the component retries submission without `fileUploads` and warns the user that files must be uploaded separately.
- Client-side file type/size validation prevents obviously invalid files. The aggressive compression attempt aims to avoid 413s but will drop files if total payload estimate is too large.

---

## Integration & developer notes / recommendations

- Backend should accept the `fileUploads` array where each item can be a base64 data URL or a smaller representation. Prefer a separate multipart upload endpoint (`DocumentApi.upload`) for reliable handling of large files.
- The client already includes `DocumentApi.upload(applicationId, file, documentType)` — consider invoking this endpoint after `ApplicationApi.create` to upload each document individually (multipart) instead of embedding base64 in `fileUploads`. This is more robust and avoids 413.
- Location endpoint pagination/large dataset handling: the client expects `/locations/states`, `/locations/districts` with `{ stateId }` and `/locations/police-stations` (flat list). Ensure these endpoints provide `id` and `name` fields.
- Weapons API path is `/Weapons` (capital W) in `WeaponsService`. Confirm casing and available fields in the backend for consistent mapping.
- The client maps many values (weaponType -> IDs, state/district names -> ids) — stabilize canonical enums/IDs in the backend to avoid client fallbacks to `1`.

---

## Edge cases to consider

- Users attach several large PDFs/images — current client will drop files and submit application without them; a better UX is to submit the application then show a per-document upload flow that uses `DocumentApi.upload` and retries.
- Intermittent location API failures — the client has fallbacks for districts/policeStations but these are static lists. Backend should aim for high availability or cache results server-side.
- Aadhaar validation: client checks 12 digits only. Additional server-side validation (checksum) would be recommended.

---

## Where to find the code

- Form component: `frontend/src/components/FreshApplicationForm.tsx`
- API clients: `frontend/src/config/APIClient.ts` and `frontend/src/config/authenticatedApiClient.ts`
- Weapons service: `frontend/src/services/weapons.ts`
- Helper usages & application services: `frontend/src/services/applicationFormService.ts`, `frontend/src/services/sidebarApiCalls.ts`

---

If you'd like, I can:

- convert the `fileUploads` base64 flow to a multipart post-submit uploader using `DocumentApi.upload` (recommended),
- extract a smaller machine-readable JSON schema for the payload to share with the backend team,
- or produce a printable checklist for data entry / QA testers.

Requested next step? Reply which of the above (or others) you'd like me to implement.
