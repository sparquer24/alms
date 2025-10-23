# Fresh Application Form - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Routing Structure](#routing-structure)
4. [Form Components](#form-components)
5. [State Management](#state-management)
6. [API Integration](#api-integration)
7. [Data Flow & Workflow](#data-flow--workflow)
8. [Shared Components](#shared-components)
9. [Hooks](#hooks)
10. [Services](#services)
11. [Navigation Flow](#navigation-flow)

---

## Overview

The Fresh Application Form is a multi-step wizard for users to apply for an arms license. It consists of 10 steps covering personal information, address details, occupation, criminal/license history, biometric data, document uploads, preview, and final declaration.

**Base Route:** `/forms/createFreshApplication/[step]`

**Form Sections:**
1. Personal Information
2. Address Details
3. Occupation/Business
4. Criminal History
5. License History
6. License Details
7. Biometric Information
8. Documents Upload
9. Preview
10. Declaration & Submit

---

## Architecture

### Technology Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **State Management:** React Context + Custom Hooks
- **API Communication:** Axios (via custom services)
- **Styling:** Tailwind CSS
- **UI Icons:** React Icons (Lucide)

### Folder Structure
```
frontend/src/
├── app/
│   └── forms/
│       └── createFreshApplication/
│           └── [step]/
│               └── page.tsx          # Main routing page
├── components/
│   └── forms/
│       ├── elements/                 # Reusable UI components
│       │   ├── Input.tsx
│       │   ├── Checkbox.tsx
│       │   ├── LocationHierarchy.tsx
│       │   ├── StepHeader.tsx
│       │   └── footer.tsx
│       └── freshApplication/         # Form step components
│           ├── PersonalInformation.tsx
│           ├── AddressDetails.tsx
│           ├── OccupationBussiness.tsx
│           ├── CriminalHistory.tsx
│           ├── LicenseHistory.tsx
│           ├── LicenseDetails.tsx
│           ├── BiometricInformation.tsx
│           ├── DocumentsUpload.tsx
│           ├── Preview.tsx
│           ├── Declaration.tsx
│           └── FreshApplicationFormContext.tsx
├── hooks/
│   ├── useApplicationForm.ts         # Main form state management hook
│   └── useLocationHierarchy.ts       # Location dropdown management
├── services/
│   └── weapons.ts                    # Weapons API service
├── api/
│   ├── applicationService.ts         # Application CRUD operations
│   └── axiosConfig.ts                # Axios setup
└── config/
    └── formRoutes.ts                 # Route configuration
```

---

## Routing Structure

### Dynamic Route: `/forms/createFreshApplication/[step]`

The `[step]` parameter is dynamic and maps to slugified step names.

**File:** `frontend/src/app/forms/createFreshApplication/[step]/page.tsx`

### Step Slugs Mapping

| Step Number | Step Name                 | Slug                           |
|-------------|---------------------------|--------------------------------|
| 0           | Personal Information      | `personal-information`         |
| 1           | Address Details           | `address-details`              |
| 2           | Occupation/Business       | `occupation-and-business`      |
| 3           | Criminal History          | `criminal-history`             |
| 4           | License History           | `license-history`              |
| 5           | License Details           | `license-details`              |
| 6           | Biometric Information     | `biometric-information`        |
| 7           | Documents Upload          | `documents-upload`             |
| 8           | Preview                   | `preview`                      |
| 9           | Declaration & Submit      | `declaration`                  |

### Slug Generation Logic

```typescript
const stepToSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
```

### Route Handler

The main page component (`page.tsx`) handles:
- Unwrapping dynamic params with `React.use()`
- Matching slug to step component
- Rendering `StepHeader` with navigation
- Rendering active step component
- Managing step navigation via URL changes

**Example URL Flow:**
```
/forms/createFreshApplication/personal-information
/forms/createFreshApplication/address-details?id=APP12345
/forms/createFreshApplication/occupation-and-business?id=APP12345
```

---

## Form Components

### 1. PersonalInformation.tsx

**Purpose:** Collect basic personal details of the applicant.

**Fields:**
- Acknowledgement Number
- First Name, Middle Name, Last Name
- Application filled by (Zonal Superintendent)
- Parent/Spouse Name
- Sex (Radio: Male/Female)
- Place of Birth
- Date of Birth
- PAN Number
- Aadhar Number
- DOB in Words

**Features:**
- ✅ API Integration: `useApplicationForm` hook
- ✅ Validation: Required fields checked before saving
- ✅ Creates new application (POST) on first save
- ✅ Returns `applicantId` for subsequent steps
- ✅ Displays Application ID after creation
- ✅ Success/Error messages

**API Calls:**
- `POST /api/application-form` - Create new application
- `GET /api/application-form/:id` - Load existing data (if editing)

**Navigation:**
- Next → Address Details (with applicantId in URL)

---

### 2. AddressDetails.tsx

**Purpose:** Capture present and permanent addresses with location hierarchy.

**Fields:**
- Present Address (textarea)
- Present Location Hierarchy (State, District, Zone, Division, Police Station)
- Present Since
- "Same as Present" Checkbox
- Permanent Address (textarea)
- Permanent Location Hierarchy
- Contact Numbers (Office, Residence, Mobile, Alternative)

**Features:**
- ✅ API Integration: `useApplicationForm` hook
- ✅ Location dropdowns: `LocationHierarchy` component
- ✅ Auto-populate permanent address from present address
- ✅ Updates existing application (PUT)
- ✅ Loading state for existing data

**API Calls:**
- `GET /api/application-form/:id` - Load existing data
- `PUT /api/application-form/:id` - Update address details

**Navigation:**
- Previous → Personal Information
- Next → Occupation/Business

---

### 3. OccupationBussiness.tsx

**Purpose:** Capture occupation and business details.

**Fields:**
- Occupation
- Office/Business Address (textarea)
- Office State
- Office District
- Crop Location (if license for crop protection)
- Area of Land Under Cultivation

**Features:**
- ⚠️ **Not Yet Integrated with API**
- Uses local state only
- Renders FormFooter component

**Navigation:**
- Previous → Address Details
- Next → Criminal History

---

### 4. CriminalHistory.tsx

**Purpose:** Record any criminal history, bonds, or prohibitions.

**Sections:**
- (a) Convicted: Yes/No
  - If Yes: Multiple provisions can be added
    - FIR Number, Section, Police Station
    - Unit, District, State
    - Offence, Sentence, Date of Sentence
- (b) Bond: Yes/No (for keeping peace)
  - Date of Sentence, Period
- (c) Prohibited: Yes/No (prohibited from having arms)
  - Date of Sentence, Period

**Features:**
- ⚠️ **Not Yet Integrated with API**
- Dynamic provision addition/removal
- Conditional rendering based on Yes/No selection

**Navigation:**
- Previous → Occupation/Business
- Next → License History

---

### 5. LicenseHistory.tsx

**Purpose:** Record previous license applications, suspensions, family licenses, etc.

**Sections:**
- Applied Before: Yes/No
  - Date, Authority, Result, Status
  - File upload for rejection letter
- Suspended/Revoked: Yes/No
  - Authority, Reason
- Family Members with License: Yes/No
  - Name, License Number, Weapons (multiple selections)
- Safe Place for Weapons: Yes/No
  - Details
- Training: Yes/No
  - Training details

**Features:**
- ✅ Fetches weapons list from API: `WeaponsService.getAll()`
- ⚠️ **Partially Integrated** (uses context, but API save incomplete)
- Dynamic family member addition with weapon selection
- File validation (5MB limit)
- Uses `useFormContext` for applicant state

**API Calls:**
- `GET /api/Weapons` - Fetch available weapons

**Navigation:**
- Previous → Criminal History
- Next → License Details

---

### 6. LicenseDetails.tsx

**Purpose:** Specify license type, weapon type, and coverage area.

**Fields:**
- Need for License (dropdown: Self-Protection, Sports, Heirloom Policy)
- Arms Option (radio: Restricted, Permissible)
- Weapon Type (dropdown: fetched from API)
- Areas to Carry Arms (checkboxes: District, State, Throughout India)
- Special Claims for Consideration (textarea + file upload)

**Features:**
- ✅ Fetches weapons list from API: `WeaponsService.getAll()`
- ⚠️ **Not Yet Integrated with API for saving**
- Weapon selection populates weapon ID and name

**API Calls:**
- `GET /api/Weapons` - Fetch weapons

**Navigation:**
- Previous → License History
- Next → Biometric Information

---

### 7. BiometricInformation.tsx

**Purpose:** Upload biometric documents.

**Fields:**
- Signature/Thumb Impression (file upload)
- Iris Scan (file upload)
- Photograph (file upload)

**Features:**
- ⚠️ **Not Yet Integrated with API**
- File selection (stored in local state)

**Navigation:**
- Previous → License Details
- Next → Documents Upload

---

### 8. DocumentsUpload.tsx

**Purpose:** Upload supporting documents.

**Document Types:**
- Aadhar Card
- PAN Card
- Training Certificate
- Other State Arms License
- Existing Arms License
- Safe Custody
- Medical Reports

**Additional Fields:**
- Claims for special consideration
- Place/Area for license
- Details if wild beasts are a threat

**Features:**
- ⚠️ **Not Yet Integrated with API**
- Multiple file uploads per document type
- File size validation (1MB limit)
- File type restriction (.jpg, .png, .svg, .zip)
- File preview with removal option

**Navigation:**
- Previous → Biometric Information
- Next → Preview

---

### 9. Preview.tsx

**Purpose:** Display all collected data for review before submission.

**Features:**
- ✅ Uses `useFreshApplicationForm` context
- Checks for missing sections
- Displays all form data grouped by section
- Warns user if sections are incomplete
- Read-only view with formatted data

**Sections Displayed:**
- Personal Information
- Address Information
- Occupation & Business
- Criminal History
- License Details
- License History
- Biometric Information
- Documents Status

**Navigation:**
- Previous → Documents Upload
- Next → Declaration

---

### 10. Declaration.tsx

**Purpose:** Final declaration and submission.

**Checkboxes:**
- I declare the information is true and correct
- I understand false information has legal consequences
- I agree to abide by terms and conditions

**Features:**
- ⚠️ **Not Yet Integrated with API**
- Uses `FormFooter` with `isDeclarationStep` flag
- Submit button (functionality pending)

**Navigation:**
- Previous → Preview
- Submit → Final API submission (not implemented yet)

---

## State Management

### Context: FreshApplicationFormContext

**File:** `frontend/src/components/forms/freshApplication/FreshApplicationFormContext.tsx`

**Purpose:** Global state container for all form data across steps.

**Structure:**
```typescript
export interface FreshApplicationFormData {
  personalInformation: Record<string, any>;
  addressDetails: Record<string, any>;
  occupationBusiness: Record<string, any>;
  criminalHistory: Record<string, any>;
  licenseDetails: Record<string, any>;
  licenseHistory: Record<string, any>;
  biometricInformation: Record<string, any>;
  documentsUpload: Record<string, any>;
}
```

**Provider:** `FreshApplicationFormProvider`

**Hook:** `useFreshApplicationForm()`

**Usage:**
```typescript
const { formData, setFormData } = useFreshApplicationForm();
```

**⚠️ Current Status:**
- Only used by Preview.tsx
- Most components use `useApplicationForm` hook instead
- This context is **NOT actively integrated** with API calls

---

## API Integration

### ApplicationService

**File:** `frontend/src/api/applicationService.ts`

**Methods:**

#### 1. `createApplication(personalData)`
- **HTTP Method:** POST
- **Endpoint:** `/api/application-form`
- **Purpose:** Create new application (Personal Information step)
- **Returns:** `{ success: true, applicationId: string }`

#### 2. `updateApplication(applicantId, formData, section)`
- **HTTP Method:** PUT
- **Endpoint:** `/api/application-form/:applicantId`
- **Purpose:** Update existing application
- **Sections:** personal, address, occupation, criminal, license-history, license-details
- **Payload:** Prepared based on section

#### 3. `getApplication(applicantId)`
- **HTTP Method:** GET
- **Endpoint:** `/api/application-form/:applicantId`
- **Purpose:** Fetch existing application data

**Payload Preparation:**

Each section has specific payload transformation:
- **Personal:** Sex → uppercase, dateOfBirth → ISO string
- **Address:** permanentAddress, currentAddress objects
- **Occupation:** occupation, employerName, businessDetails, annualIncome
- **Criminal:** criminalHistory object
- **License History:** licenseHistory object
- **License Details:** licenseType, category, validityPeriod

---

### WeaponsService

**File:** `frontend/src/services/weapons.ts`

**Methods:**

#### `getAll(params?)`
- **HTTP Method:** GET
- **Endpoint:** `/api/Weapons`
- **Purpose:** Fetch all available weapons
- **Returns:** Array of `{ id, name }`

**Usage:** License History and License Details components fetch weapons on mount.

---

## Data Flow & Workflow

### Application Creation Flow

```
1. User navigates to /forms/createFreshApplication/personal-information
2. PersonalInformation component renders
3. User fills in personal details
4. User clicks "Next" or "Save to Draft"
5. useApplicationForm.saveFormData() is called
6. POST /api/application-form with personal data
7. Backend creates application, returns applicationId (e.g., "APP12345")
8. Frontend stores applicantId in state
9. User navigates to next step with URL: /forms/createFreshApplication/address-details?id=APP12345
```

### Application Update Flow

```
1. User navigates to step with applicantId in URL
2. Component extracts applicantId from searchParams
3. useApplicationForm hook automatically calls GET /api/application-form/:id
4. Existing data loaded and merged with initial state
5. User edits fields
6. User clicks "Next" or "Save to Draft"
7. useApplicationForm.saveFormData() is called
8. PUT /api/application-form/:id with section-specific data
9. Backend updates application
10. User navigates to next step with applicantId preserved
```

### Navigation with ID Persistence

```typescript
// From useApplicationForm hook
const navigateToNext = (nextRoute: string, currentApplicantId?: string) => {
  const idToUse = currentApplicantId || applicantId;
  if (idToUse) {
    router.push(`${nextRoute}?id=${idToUse}`);
  } else {
    router.push(nextRoute);
  }
};
```

**Example:**
```
Step 1: /forms/createFreshApplication/personal-information
        → Create App → ID: APP12345

Step 2: /forms/createFreshApplication/address-details?id=APP12345
        → Update App

Step 3: /forms/createFreshApplication/occupation-and-business?id=APP12345
        → Update App
```

---

## Shared Components

### StepHeader

**File:** `frontend/src/components/forms/elements/StepHeader.tsx`

**Props:**
- `steps: string[]` - Array of step names
- `currentStep: number` - Index of current step
- `onStepClick?: (step: number) => void` - Handler for step navigation

**Features:**
- Displays all steps in a horizontal tab layout
- Highlights current step
- Allows clicking on any step to navigate
- Responsive with horizontal scrolling
- Fixed header at top of page

---

### FormFooter

**File:** `frontend/src/components/forms/elements/footer.tsx`

**Props:**
- `isDeclarationStep?: boolean` - Changes button layout for final step
- `onSaveToDraft?: () => void`
- `onNext?: () => void`
- `onPrevious?: () => void`
- `onSubmit?: () => void`
- `isLoading?: boolean`

**Features:**
- Displays application form schedule reference
- Note about reviewing data
- Standard layout: Save to Draft, Previous, Next
- Declaration layout: Previous, Submit
- Loading states for buttons

---

### Input Component

**File:** `frontend/src/components/forms/elements/Input.tsx`

**Props:**
- `label: string`
- `name: string`
- `value: string`
- `onChange: (e) => void`
- `placeholder?: string`
- `type?: string`
- `required?: boolean`
- `className?: string`

**Features:**
- Styled text input with underline border
- Focus states
- Required indicator

---

### Checkbox Component

**File:** `frontend/src/components/forms/elements/Checkbox.tsx`

**Props:**
- `label: string`
- `name: string`
- `checked: boolean`
- `onChange: (checked: boolean) => void`
- `disabled?: boolean`
- `className?: string`

**Features:**
- Custom styled checkbox
- Label text alignment
- Disabled state

---

### LocationHierarchy Component

**File:** `frontend/src/components/forms/elements/LocationHierarchy.tsx`

**Props:**
- `prefix: string` - Field name prefix (e.g., "present" or "permanent")
- `values: object` - Current location values
- `onChange: (field, value) => void`
- `disabled?: boolean`

**Features:**
- Cascading dropdowns: State → District → Zone → Division → Police Station
- Uses `useLocationHierarchy` hook
- Fetches location data from API
- Auto-loads child locations when parent changes

---

## Hooks

### useApplicationForm

**File:** `frontend/src/hooks/useApplicationForm.ts`

**Purpose:** Main hook for managing form state, validation, API calls, and navigation.

**Parameters:**
- `initialState: object` - Default form values
- `formSection: string` - Section identifier (personal, address, etc.)
- `validationRules?: function` - Optional validation function

**Returns:**
```typescript
{
  form: object,                    // Current form state
  setForm: function,                // Set form state
  applicantId: string | null,       // Application ID
  isSubmitting: boolean,            // Save in progress
  submitError: string | null,       // Error message
  submitSuccess: string | null,     // Success message
  isLoading: boolean,               // Data loading state
  handleChange: function,           // Input change handler
  handleNestedChange: function,     // Nested object change handler
  saveFormData: function,           // Save form to API
  navigateToNext: function,         // Navigate with ID
  setSubmitError: function,
  setSubmitSuccess: function,
}
```

**Key Features:**
- Automatically extracts `applicantId` from URL query params
- Loads existing data on mount (for non-personal steps)
- Handles both POST (create) and PUT (update) operations
- Validates data before saving
- Returns saved `applicantId` after save
- Manages loading, error, and success states

**Usage Example:**
```typescript
const {
  form,
  applicantId,
  handleChange,
  saveFormData,
  navigateToNext
} = useApplicationForm({
  initialState: { firstName: '', lastName: '' },
  formSection: 'personal',
  validationRules: validatePersonalInfo
});

const handleNext = async () => {
  const savedId = await saveFormData();
  if (savedId) {
    navigateToNext(FORM_ROUTES.ADDRESS_DETAILS, savedId);
  }
};
```

---

### useLocationHierarchy

**File:** `frontend/src/hooks/useLocationHierarchy.ts`

**Purpose:** Manage location dropdown cascading (State → District → Zone → Division → Police Station).

**Returns:**
```typescript
[
  locationState: {
    states: [],
    districts: [],
    zones: [],
    divisions: [],
    policeStations: []
  },
  locationActions: {
    loadStates: function,
    loadDistricts: function,
    loadZones: function,
    loadDivisions: function,
    loadPoliceStations: function
  }
]
```

**Features:**
- Fetches location data from backend API
- Clears child selections when parent changes
- Caches loaded data

---

## Services

### Weapons Service

**File:** `frontend/src/services/weapons.ts`

**API Endpoint:** `/api/Weapons`

**Purpose:** Fetch available weapon types for dropdown selections.

**Usage:**
```typescript
import { WeaponsService } from '../../../services/weapons';

useEffect(() => {
  const loadWeapons = async () => {
    const list = await WeaponsService.getAll();
    setWeapons(list);
  };
  loadWeapons();
}, []);
```

---

## Navigation Flow

### Step-by-Step Navigation

```
Step 0: Personal Information
  ↓ [Create Application, Get applicantId]
Step 1: Address Details
  ↓ [Update Application with ID]
Step 2: Occupation/Business
  ↓ [Update Application with ID]
Step 3: Criminal History
  ↓ [Update Application with ID]
Step 4: License History
  ↓ [Update Application with ID]
Step 5: License Details
  ↓ [Update Application with ID]
Step 6: Biometric Information
  ↓ [Update Application with ID]
Step 7: Documents Upload
  ↓ [Update Application with ID]
Step 8: Preview
  ↓ [Review All Data]
Step 9: Declaration
  ↓ [Final Submit - Submit Application]
```

### URL Structure with ID

- **Without ID (New Application):**
  ```
  /forms/createFreshApplication/personal-information
  ```

- **With ID (Existing Application):**
  ```
  /forms/createFreshApplication/address-details?id=APP12345
  /forms/createFreshApplication/occupation-and-business?id=APP12345
  ```

### Route Configuration

**File:** `frontend/src/config/formRoutes.ts`

```typescript
export const FORM_ROUTES = {
  PERSONAL_INFO: '/forms/createFreshApplication/personal-information',
  ADDRESS_DETAILS: '/forms/createFreshApplication/address-details',
  OCCUPATION_DETAILS: '/forms/createFreshApplication/occupation-and-business-details',
  CRIMINAL_HISTORY: '/forms/createFreshApplication/criminal-history',
  LICENSE_HISTORY: '/forms/createFreshApplication/license-history',
  LICENSE_DETAILS: '/forms/createFreshApplication/license-details',
};
```

---

## Integration Status

### ✅ Fully Integrated Components
1. **PersonalInformation** - POST to create, GET to load, PUT to update
2. **AddressDetails** - GET to load, PUT to update

### ⚠️ Partially Integrated Components
3. **OccupationBussiness** - Local state only, no API calls
4. **CriminalHistory** - Local state only, no API calls
5. **LicenseHistory** - Fetches weapons from API, but doesn't save to API
6. **LicenseDetails** - Fetches weapons from API, but doesn't save to API
7. **BiometricInformation** - Local state only, no API calls
8. **DocumentsUpload** - Local state only, no API calls

### ✅ Read-Only Components
9. **Preview** - Reads from context (FreshApplicationFormContext)
10. **Declaration** - Local state only, final submit not implemented

---

## API Endpoints Used

### Application Form APIs

| HTTP Method | Endpoint                           | Purpose                          | Used By                |
|-------------|------------------------------------|----------------------------------|------------------------|
| POST        | `/api/application-form`            | Create new application           | PersonalInformation    |
| GET         | `/api/application-form/:id`        | Get application by ID            | All update steps       |
| PUT         | `/api/application-form/:id`        | Update application               | All update steps       |

### Helper APIs

| HTTP Method | Endpoint                                       | Purpose                     | Used By             |
|-------------|------------------------------------------------|-----------------------------|---------------------|
| GET         | `/api/Weapons`                                 | Get weapon types            | LicenseHistory, LicenseDetails |
| GET         | `/api/application-form/helpers/states`         | Get states                  | LocationHierarchy   |
| GET         | `/api/application-form/helpers/districts/:id`  | Get districts by state      | LocationHierarchy   |

---

## Validation

### Personal Information Validation

```typescript
const validatePersonalInfo = (formData: any) => {
  const validationErrors = [];
  if (!formData.firstName?.trim()) validationErrors.push('First name is required');
  if (!formData.lastName?.trim()) validationErrors.push('Last name is required');
  if (!formData.parentOrSpouseName?.trim()) validationErrors.push('Parent/Spouse name is required');
  if (!formData.sex) validationErrors.push('Please select sex');
  return validationErrors;
};
```

### Address Information Validation

```typescript
const validateAddressInfo = (formData: any) => {
  const validationErrors = [];
  if (!formData.presentAddress?.trim()) validationErrors.push('Present address is required');
  if (!formData.presentState?.trim()) validationErrors.push('Present state is required');
  if (!formData.presentDistrict?.trim()) validationErrors.push('Present district is required');
  if (!formData.permanentAddress?.trim()) validationErrors.push('Permanent address is required');
  return validationErrors;
};
```

---

## Known Issues & TODO

### Issues
1. **Context Not Fully Used:** `FreshApplicationFormContext` is only used by Preview. Most components use `useApplicationForm` hook directly.
2. **Incomplete API Integration:** Steps 3-8 do not save to API yet.
3. **Final Submit Not Implemented:** Declaration step has no submit functionality.
4. **No File Upload Service:** File uploads (biometric, documents) are stored in local state but never sent to backend.
5. **No Draft Management:** "Save to Draft" saves to API but there's no way to list or resume drafts.

### TODO
- [ ] Integrate remaining steps (3-8) with API
- [ ] Implement file upload service for documents and biometric data
- [ ] Add final submit endpoint call in Declaration step
- [ ] Implement draft listing and resume functionality
- [ ] Add form validation for all steps
- [ ] Add error boundary for error handling
- [ ] Implement progress saving indicator
- [ ] Add confirmation dialog before navigating away from unsaved form

---

## Authentication

All API calls require authentication. The `useApplicationForm` hook checks:
```typescript
if (!isAuthenticated || !token) {
  throw new Error('Please log in to continue');
}
```

**Token Source:** `useAuth()` hook from `frontend/src/config/auth`

---

## Error Handling

### API Errors

Handled in `useApplicationForm` hook:
```typescript
try {
  response = await ApplicationService.createApplication(form);
} catch (error: any) {
  console.error('❌ Error saving form data:', error);
  
  if (error.message === 'Authentication required') {
    setSubmitError('Authentication expired. Please log in again.');
    setTimeout(() => router.push('/login'), 2000);
  } else {
    setSubmitError(error.message || 'An error occurred while saving data.');
  }
}
```

### Validation Errors

Displayed as error messages above the form:
```tsx
{submitError && (
  <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
    {submitError}
  </div>
)}
```

### Success Messages

```tsx
{submitSuccess && (
  <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
    {submitSuccess}
  </div>
)}
```

---

## Summary

The Fresh Application Form is a sophisticated multi-step form system that:
- Uses Next.js App Router with dynamic routing
- Manages state across steps using custom hooks
- Persists data to backend API incrementally
- Tracks applications by unique `applicantId`
- Provides smooth navigation with ID persistence
- Supports validation, error handling, and success feedback
- Offers reusable UI components for consistency

**Current Status:** Steps 1-2 are fully integrated with API. Steps 3-10 need API integration completion. The architecture is solid and extensible for future enhancements.
