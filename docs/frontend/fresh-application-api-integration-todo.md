# Fresh Application Form - API Integration TODO List

## 📋 Overview
This document outlines all changes needed to align the frontend implementation with the actual backend API endpoints.

---

## 🔍 Current vs Expected Implementation

### Current Implementation Issues

| Issue | Current State | Expected State |
|-------|--------------|----------------|
| **POST Endpoint** | Using `/application-form` | Should use `/application-form/personal-details` |
| **PATCH Endpoint** | Using `PUT /application-form/:id` with `putData()` | Should use `PATCH /application-form/:id` with `patchData()` |
| **GET Endpoint** | Using `GET /application-form/:id` | Should use `GET /application-form?applicationId=:id` (query param) |
| **Response Key** | Expecting `response.applicationId` | Backend returns `applicationId` directly in response |
| **Previous Button** | Calls GET API on every previous click | Should only call GET when navigating back |
| **Data Extraction** | Not extracting section-specific data from GET response | Should extract only relevant section data |

---

## ✅ TODO List

### 🎯 **PHASE 1: Fix API Service Layer** (`applicationService.ts`)

#### **Task 1.1: Update POST endpoint for personal details**
- **File:** `frontend/src/api/applicationService.ts`
- **Method:** `createApplication()`
- **Change Required:**
  - ❌ Current: `return await postData('/application-form', cleanPayload);`
  - ✅ Expected: `return await postData('/application-form/personal-details', cleanPayload);`
- **Impact:** Personal Information component
- **Priority:** 🔴 HIGH

---

#### **Task 1.2: Change PUT to PATCH for updates**
- **File:** `frontend/src/api/applicationService.ts`
- **Method:** `updateApplication()`
- **Changes Required:**
  1. Replace `putData()` with `patchData()`
  2. Remove the `section` field from payload (backend doesn't need it)
  3. Update method documentation
  
- **Before:**
  ```typescript
  return await putData(url, fullPayload);
  ```
- **After:**
  ```typescript
  return await patchData(url, cleanPayload);
  ```
- **Impact:** All update operations (Address, Occupation, etc.)
- **Priority:** 🔴 HIGH

---

#### **Task 1.3: Update GET endpoint to use query parameter**
- **File:** `frontend/src/api/applicationService.ts`
- **Method:** `getApplication()`
- **Changes Required:**
  - ❌ Current: `const url = '/application-form/${applicantId}';`
  - ✅ Expected: `const url = '/application-form?applicationId=${applicantId}';`
  
- **Before:**
  ```typescript
  static async getApplication(applicantId: string) {
    const url = `/application-form/${applicantId}`;
    console.log('🟢 Fetching application (GET):', url);
    return await fetchData(url);
  }
  ```
  
- **After:**
  ```typescript
  static async getApplication(applicantId: string) {
    const url = `/application-form?applicationId=${applicantId}`;
    console.log('🟢 Fetching application (GET):', url);
    return await fetchData(url);
  }
  ```
- **Impact:** All components that load existing data
- **Priority:** 🔴 HIGH

---

#### **Task 1.4: Add section-specific data extraction method**
- **File:** `frontend/src/api/applicationService.ts`
- **New Method:** `extractSectionData()`
- **Purpose:** Extract only relevant data from GET response for specific form sections
- **Implementation:**
  ```typescript
  /**
   * Extract section-specific data from complete application response
   * @param applicationData - Complete application data from GET API
   * @param section - Section to extract
   * @returns Section-specific data
   */
  static extractSectionData(applicationData: any, section: string) {
    if (!applicationData) return null;
    
    switch (section) {
      case 'personal':
        return applicationData.personalDetails || {};
      case 'address':
        return {
          presentAddress: applicationData.presentAddress || {},
          permanentAddress: applicationData.permanentAddress || {},
        };
      case 'occupation':
        return applicationData.occupationAndBusiness || {};
      case 'criminal':
        return {
          criminalHistories: applicationData.criminalHistories || [],
        };
      case 'license-history':
        return {
          licenseHistories: applicationData.licenseHistories || [],
        };
      case 'license-details':
        return applicationData.licenseDetails || {};
      default:
        return applicationData;
    }
  }
  ```
- **Priority:** 🟡 MEDIUM

---

### 🎯 **PHASE 2: Update Hook Logic** (`useApplicationForm.ts`)

#### **Task 2.1: Fix loadExistingData to extract section-specific data**
- **File:** `frontend/src/hooks/useApplicationForm.ts`
- **Method:** `loadExistingData()`
- **Changes Required:**
  1. Use the new `extractSectionData()` method
  2. Only merge section-specific data with initial state
  
- **Before:**
  ```typescript
  if (response.success && response.data) {
    setForm((prev: any) => ({ ...prev, ...response.data }));
    console.log('✅ Existing data loaded and merged');
  }
  ```
  
- **After:**
  ```typescript
  if (response.success && response.data) {
    // Extract only section-specific data
    const sectionData = ApplicationService.extractSectionData(response.data, formSection);
    setForm((prev: any) => ({ ...prev, ...sectionData }));
    console.log('✅ Section-specific data loaded and merged:', formSection, sectionData);
  }
  ```
- **Priority:** 🟡 MEDIUM

---

#### **Task 2.2: Update saveFormData to handle PATCH correctly**
- **File:** `frontend/src/hooks/useApplicationForm.ts`
- **Method:** `saveFormData()`
- **Changes Required:**
  1. Remove comments about "Using PUT since PATCH doesn't exist"
  2. Confirm PATCH is now used
  3. Update console logs
  
- **Update logs from:**
  ```typescript
  console.log('🟡 Calling updateApplication (PATCH) for non-personal section:', formSection);
  ```
  
- **To:**
  ```typescript
  console.log('🟡 Calling PATCH /application-form/:id for section:', formSection);
  ```
- **Priority:** 🟢 LOW

---

### 🎯 **PHASE 3: Update PersonalInformation Component**

#### **Task 3.1: Verify POST response handling**
- **File:** `frontend/src/components/forms/freshApplication/PersonalInformation.tsx`
- **Method:** `handleNext()`
- **Current State:** ✅ Already correctly extracts `applicationId` from response
- **Verification Needed:** Test that response structure matches
  ```typescript
  const savedApplicantId = await saveFormData();
  // Should get applicationId from: { success: true, applicationId: 123, message: '...' }
  ```
- **Priority:** 🟢 LOW (Verification only)

---

### 🎯 **PHASE 4: Update AddressDetails Component**

#### **Task 4.1: Implement GET on Previous button click**
- **File:** `frontend/src/components/forms/freshApplication/AddressDetails.tsx`
- **Method:** `handlePrevious()`
- **Changes Required:**
  1. Call GET API before navigating to previous step
  2. Don't just navigate with existing ID
  
- **Before:**
  ```typescript
  const handlePrevious = () => {
    if (applicantId) {
      navigateToNext(FORM_ROUTES.PERSONAL_INFO, applicantId);
    } else {
      router.back();
    }
  };
  ```
  
- **After:**
  ```typescript
  const handlePrevious = async () => {
    if (applicantId) {
      // Fetch latest data before going back
      try {
        await loadExistingData(applicantId);
      } catch (error) {
        console.error('Error loading data on previous:', error);
      }
    }
    // Navigate back
    navigateToNext(FORM_ROUTES.PERSONAL_INFO, applicantId);
  };
  ```
- **Note:** Need to expose `loadExistingData` from `useApplicationForm` hook
- **Priority:** 🟡 MEDIUM

---

#### **Task 4.2: Verify PATCH on Next button**
- **File:** `frontend/src/components/forms/freshApplication/AddressDetails.tsx`
- **Method:** `handleNext()`
- **Current State:** ✅ Already correctly calls `saveFormData()` which will use PATCH
- **Verification Needed:** Test that PATCH is called correctly
- **Priority:** 🟢 LOW (Verification only)

---

### 🎯 **PHASE 5: Extend to Other Components**

#### **Task 5.1: Integrate OccupationBussiness.tsx with API**
- **File:** `frontend/src/components/forms/freshApplication/OccupationBussiness.tsx`
- **Changes Required:**
  1. Remove local state management
  2. Use `useApplicationForm` hook
  3. Add validation rules
  4. Implement handleNext, handlePrevious, handleSaveToDraft
  5. Wire up FormFooter with handlers
  
- **Implementation Pattern:** Follow AddressDetails.tsx pattern
- **Priority:** 🟡 MEDIUM

---

#### **Task 5.2: Integrate CriminalHistory.tsx with API**
- **File:** `frontend/src/components/forms/freshApplication/CriminalHistory.tsx`
- **Changes Required:**
  1. Remove local state management
  2. Use `useApplicationForm` hook
  3. Transform local data structure to match backend DTO
  4. Implement PATCH on Next
  5. Implement GET on Previous
  
- **Backend DTO Structure:**
  ```typescript
  criminalHistories: [
    {
      isConvicted: boolean,
      offence?: string,
      sentence?: string,
      dateOfSentence?: Date,
      isBondExecuted?: boolean,
      bondDate?: Date,
      bondPeriod?: string,
      isProhibited?: boolean,
      prohibitionDate?: Date,
      prohibitionPeriod?: string
    }
  ]
  ```
- **Priority:** 🟡 MEDIUM

---

#### **Task 5.3: Integrate LicenseHistory.tsx with API**
- **File:** `frontend/src/components/forms/freshApplication/LicenseHistory.tsx`
- **Changes Required:**
  1. Currently uses `useFormContext` - switch to `useApplicationForm`
  2. Implement `transformFormData()` to match backend DTO
  3. Call PATCH API on save
  4. Handle file uploads (if backend endpoint exists)
  
- **Backend DTO Structure:**
  ```typescript
  licenseHistories: [
    {
      type: 'APPLICATION' | 'SUSPENSION' | 'FAMILY_LICENSE' | 'SAFE_PLACE' | 'TRAINING',
      dateAppliedFor?: Date,
      authority?: string,
      result?: string,
      status?: string,
      reason?: string,
      familyMemberName?: string,
      licenseNumber?: string,
      weaponIds?: number[],
      details?: string
    }
  ]
  ```
- **Priority:** 🟡 MEDIUM

---

#### **Task 5.4: Integrate LicenseDetails.tsx with API**
- **File:** `frontend/src/components/forms/freshApplication/LicenseDetails.tsx`
- **Changes Required:**
  1. Use `useApplicationForm` hook
  2. Map form fields to backend DTO
  3. Implement PATCH on save
  
- **Backend DTO Structure:**
  ```typescript
  licenseDetails: {
    purposeOfLicense: 'SELF_PROTECTION' | 'SPORTS' | 'HEIRLOOM',
    weaponCategory: 'RESTRICTED' | 'PERMISSIBLE',
    weaponId: number,
    coverageArea: 'DISTRICT' | 'STATE' | 'INDIA',
    specialClaims?: string
  }
  ```
- **Priority:** 🟡 MEDIUM

---

#### **Task 5.5: Integrate BiometricInformation.tsx with API**
- **File:** `frontend/src/components/forms/freshApplication/BiometricInformation.tsx`
- **Changes Required:**
  1. Research backend file upload endpoint
  2. Implement file upload service
  3. Upload files on Next button click
  4. Store file URLs/IDs in application
  
- **Priority:** 🔴 HIGH (file uploads are critical)

---

#### **Task 5.6: Integrate DocumentsUpload.tsx with API**
- **File:** `frontend/src/components/forms/freshApplication/DocumentsUpload.tsx`
- **Changes Required:**
  1. Use backend file upload endpoint
  2. Upload multiple files per document type
  3. Store file metadata in application
  4. Implement file removal
  
- **Backend Endpoint:** `POST /application-form/:applicationId/upload-file`
- **Priority:** 🔴 HIGH

---

#### **Task 5.7: Update Preview.tsx to fetch from API**
- **File:** `frontend/src/components/forms/freshApplication/Preview.tsx`
- **Changes Required:**
  1. Remove dependency on `FreshApplicationFormContext`
  2. Call GET API to fetch complete application data
  3. Display all sections from API response
  4. Add refresh button
  
- **Priority:** 🟡 MEDIUM

---

#### **Task 5.8: Implement Declaration & Final Submit**
- **File:** `frontend/src/components/forms/freshApplication/Declaration.tsx`
- **Changes Required:**
  1. Add final validation checks
  2. Update workflow status on submit
  3. Call PATCH with `workflowStatusId: 3` (INITIATED status)
  4. Show confirmation modal
  5. Redirect to success page
  
- **API Call:**
  ```typescript
  PATCH /application-form/:applicationId
  Body: { workflowStatusId: 3 }
  ```
- **Priority:** 🔴 HIGH

---

### 🎯 **PHASE 6: Expose loadExistingData in Hook**

#### **Task 6.1: Export loadExistingData from useApplicationForm**
- **File:** `frontend/src/hooks/useApplicationForm.ts`
- **Changes Required:**
  1. Make `loadExistingData` accessible outside the hook
  2. Return it in the hook's return object
  
- **Add to return statement:**
  ```typescript
  return {
    form,
    setForm,
    applicantId,
    isSubmitting,
    submitError,
    submitSuccess,
    isLoading,
    handleChange,
    handleNestedChange,
    saveFormData,
    navigateToNext,
    loadExistingData,  // ← Add this
    setSubmitError,
    setSubmitSuccess,
  };
  ```
- **Priority:** 🟡 MEDIUM

---

### 🎯 **PHASE 7: File Upload Implementation**

#### **Task 7.1: Create file upload service**
- **File:** `frontend/src/api/fileUploadService.ts` (NEW)
- **Methods Required:**
  - `uploadFile(applicationId, file, fileType, description?)`
  - `deleteFile(fileId)`
  - `getFiles(applicationId)`
  
- **Backend Endpoint:**
  ```typescript
  POST /application-form/:applicationId/upload-file
  Body: {
    file: File (multipart/form-data),
    fileType: 'AADHAR' | 'PAN' | 'PHOTO' | 'SIGNATURE' | 'IRIS' | etc.,
    description?: string
  }
  Response: {
    success: true,
    fileId: number,
    fileUrl: string
  }
  ```
- **Priority:** 🔴 HIGH

---

### 🎯 **PHASE 8: Testing & Validation**

#### **Task 8.1: Test Personal Information flow**
- [ ] Fill form and click Next
- [ ] Verify POST to `/application-form/personal-details`
- [ ] Verify `applicationId` is received
- [ ] Verify navigation to Address Details with ID in URL

---

#### **Task 8.2: Test Address Details flow**
- [ ] Fill form and click Next
- [ ] Verify PATCH to `/application-form/:id`
- [ ] Click Previous
- [ ] Verify GET is called with query param
- [ ] Verify address data is loaded correctly

---

#### **Task 8.3: Test complete flow end-to-end**
- [ ] Start from Personal Information
- [ ] Complete all steps
- [ ] Verify data persistence at each step
- [ ] Click Previous at various steps
- [ ] Verify data loads correctly
- [ ] Submit final application
- [ ] Verify workflow status changes

---

## 📝 Summary of Key Changes

### API Service Changes
1. ✅ Change POST endpoint: `/application-form` → `/application-form/personal-details`
2. ✅ Change method: `putData()` → `patchData()`
3. ✅ Change GET endpoint: `/application-form/:id` → `/application-form?applicationId=:id`
4. ✅ Add `extractSectionData()` method

### Hook Changes
1. ✅ Update `loadExistingData()` to use `extractSectionData()`
2. ✅ Export `loadExistingData` for component use
3. ✅ Update console logs

### Component Changes
1. ✅ AddressDetails: Call GET on Previous button
2. ✅ All components (3-8): Integrate with `useApplicationForm` hook
3. ✅ All components: Implement PATCH on Next, GET on Previous
4. ✅ BiometricInformation & DocumentsUpload: Implement file uploads
5. ✅ Preview: Fetch data via GET API
6. ✅ Declaration: Implement final submit with workflow status update

---

## 🎯 Implementation Priority

### 🔴 HIGH PRIORITY (Do First)
1. Task 1.1: Fix POST endpoint
2. Task 1.2: Change PUT to PATCH
3. Task 1.3: Fix GET endpoint with query param
4. Task 7.1: Create file upload service
5. Task 5.5 & 5.6: Implement file uploads
6. Task 5.8: Implement final submit

### 🟡 MEDIUM PRIORITY (Do Next)
1. Task 1.4: Add extractSectionData method
2. Task 2.1: Update loadExistingData
3. Task 4.1: Implement GET on Previous
4. Task 5.1-5.4: Integrate remaining form components
5. Task 5.7: Update Preview component
6. Task 6.1: Export loadExistingData

### 🟢 LOW PRIORITY (Verification/Polish)
1. Task 2.2: Update console logs
2. Task 3.1: Verify POST response
3. Task 4.2: Verify PATCH on Next
4. Phase 8: All testing tasks

---

## 🚀 Recommended Implementation Order

1. **Day 1:** Phase 1 (API Service Layer) - Tasks 1.1, 1.2, 1.3, 1.4
2. **Day 2:** Phase 2 (Hook Updates) - Tasks 2.1, 2.2
3. **Day 3:** Phase 4 (AddressDetails) - Tasks 4.1, 4.2
4. **Day 4:** Phase 7 (File Upload) - Task 7.1
5. **Day 5:** Phase 5.1-5.4 (Form Components Integration)
6. **Day 6:** Phase 5.5-5.6 (File Upload Components)
7. **Day 7:** Phase 5.7-5.8 (Preview & Submit)
8. **Day 8:** Phase 6 & Phase 8 (Final touches & Testing)

---

## 📌 Notes

- All changes should maintain backward compatibility where possible
- Add proper error handling for all API calls
- Implement loading states for better UX
- Add success/error toasts for user feedback
- Update documentation after each phase completion
- Write unit tests for critical functions

---

## ✅ Completion Checklist

- [ ] Phase 1: API Service Layer (4 tasks)
- [ ] Phase 2: Hook Logic (2 tasks)
- [ ] Phase 3: PersonalInformation (1 task)
- [ ] Phase 4: AddressDetails (2 tasks)
- [ ] Phase 5: Other Components (8 tasks)
- [ ] Phase 6: Hook Exports (1 task)
- [ ] Phase 7: File Uploads (1 task)
- [ ] Phase 8: Testing (3 tasks)

**Total Tasks: 22**

---

**Document Created:** October 10, 2025
**Last Updated:** October 10, 2025
**Status:** 📝 Ready for Implementation
