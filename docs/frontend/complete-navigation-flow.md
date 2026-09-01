# Fresh Application Form - Complete Navigation Flow ✅

## 🎯 Overview

This document describes the complete navigation flow with GET/PATCH API calls for all form tabs.

**Date:** October 13, 2025  
**Status:** ✅ Fully Implemented

---

## 📋 Tab List (10 Steps)

1. **Personal Information** (Step 1)
2. **Address Details** (Step 2)
3. **Occupation/Business** (Step 3)
4. **Criminal History** (Step 4)
5. **License History** (Step 5)
6. **License Details** (Step 6)
7. **Biometric Information** (Step 7)
8. **Documents Upload** (Step 8)
9. **Preview** (Step 9)
10. **Declaration & Submit** (Step 10)

---

## 🔄 Navigation Flow Logic

### Button Actions:

#### 1. **Save to Draft** Button
- Calls: `PATCH /application-form/:id`
- Stays on current tab
- Shows success/error message

#### 2. **Previous** Button
- Calls: `GET /application-form?applicationId=:id` (to refresh current tab data)
- Navigates to: Previous tab with `?id=:applicationId` in URL
- Previous tab will auto-load its data on mount (if ID exists)

#### 3. **Next** Button
- Calls: `PATCH /application-form/:id` (to save current tab data)
- Then navigates to: Next tab with `?id=:applicationId` in URL
- Next tab will auto-call: `GET /application-form?applicationId=:id` on mount (if ID exists)

---

## 🔀 Complete Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│ Step 1: Personal Information                                      │
│ URL: /personal-information                                        │
├──────────────────────────────────────────────────────────────────┤
│ On Mount:                                                         │
│   - No ID in URL → Don't call GET                                │
│                                                                   │
│ On "Next" Button:                                                 │
│   ① PATCH /application-form/personal-details (if updating)       │
│      OR POST /application-form/personal-details (if new)         │
│   ② Get applicationId: 14                                        │
│   ③ Navigate to: /address-details?id=14                          │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ Step 2: Address Details                                           │
│ URL: /address-details?id=14                                       │
├──────────────────────────────────────────────────────────────────┤
│ On Mount:                                                         │
│   ① ID exists → Call GET /application-form?applicationId=14     │
│   ② Extract presentAddress & permanentAddress data              │
│   ③ Populate form fields                                         │
│                                                                   │
│ On "Previous" Button:                                             │
│   ① Call GET /application-form?applicationId=14                 │
│   ② Navigate to: /personal-information?id=14                    │
│                                                                   │
│ On "Next" Button:                                                 │
│   ① PATCH /application-form/14 (with presentAddress, etc.)      │
│   ② Navigate to: /occupation-business?id=14                     │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ Step 3: Occupation/Business                                       │
│ URL: /occupation-business?id=14                                   │
├──────────────────────────────────────────────────────────────────┤
│ On Mount:                                                         │
│   ① ID exists → Call GET /application-form?applicationId=14     │
│   ② Extract occupationAndBusiness data                          │
│   ③ Populate form fields                                         │
│                                                                   │
│ On "Previous" Button:                                             │
│   ① Call GET /application-form?applicationId=14                 │
│   ② Navigate to: /address-details?id=14                         │
│                                                                   │
│ On "Next" Button:                                                 │
│   ① PATCH /application-form/14 (with occupationAndBusiness)     │
│   ② Navigate to: /criminal-history?id=14                        │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ Step 4: Criminal History                                          │
│ URL: /criminal-history?id=14                                      │
├──────────────────────────────────────────────────────────────────┤
│ On Mount:                                                         │
│   ① ID exists → Call GET /application-form?applicationId=14     │
│   ② Extract criminalHistories array                             │
│   ③ Populate form fields                                         │
│                                                                   │
│ On "Previous" Button:                                             │
│   ① Call GET /application-form?applicationId=14                 │
│   ② Navigate to: /occupation-business?id=14                     │
│                                                                   │
│ On "Next" Button:                                                 │
│   ① PATCH /application-form/14 (with criminalHistories)         │
│   ② Navigate to: /license-history?id=14                         │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ Step 5: License History                                           │
│ URL: /license-history?id=14                                       │
├──────────────────────────────────────────────────────────────────┤
│ On Mount:                                                         │
│   ① ID exists → Call GET /application-form?applicationId=14     │
│   ② Extract licenseHistories array                              │
│   ③ Populate form fields                                         │
│                                                                   │
│ On "Previous" Button:                                             │
│   ① Call GET /application-form?applicationId=14                 │
│   ② Navigate to: /criminal-history?id=14                        │
│                                                                   │
│ On "Next" Button:                                                 │
│   ① PATCH /application-form/14 (with licenseHistories)          │
│   ② Navigate to: /license-details?id=14                         │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ Step 6: License Details                                           │
│ URL: /license-details?id=14                                       │
├──────────────────────────────────────────────────────────────────┤
│ On Mount:                                                         │
│   ① ID exists → Call GET /application-form?applicationId=14     │
│   ② Extract licenseDetails array                                │
│   ③ Populate form fields                                         │
│                                                                   │
│ On "Previous" Button:                                             │
│   ① Call GET /application-form?applicationId=14                 │
│   ② Navigate to: /license-history?id=14                         │
│                                                                   │
│ On "Next" Button:                                                 │
│   ① PATCH /application-form/14 (with licenseDetails)            │
│   ② Navigate to: /biometric-information?id=14                   │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ Step 7: Biometric Information                                     │
│ URL: /biometric-information?id=14                                 │
├──────────────────────────────────────────────────────────────────┤
│ On Mount:                                                         │
│   ① ID exists → Call GET /application-form?applicationId=14     │
│   ② Extract biometric data (if any)                             │
│                                                                   │
│ On "Previous" Button:                                             │
│   ① Call GET /application-form?applicationId=14                 │
│   ② Navigate to: /license-details?id=14                         │
│                                                                   │
│ On "Next" Button:                                                 │
│   ① POST /application-form/:id/upload-file (for each file)      │
│   ② Navigate to: /documents-upload?id=14                        │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ Step 8: Documents Upload                                          │
│ URL: /documents-upload?id=14                                      │
├──────────────────────────────────────────────────────────────────┤
│ On Mount:                                                         │
│   ① ID exists → Call GET /application-form?applicationId=14     │
│   ② Check uploaded documents                                    │
│                                                                   │
│ On "Previous" Button:                                             │
│   ① Call GET /application-form?applicationId=14                 │
│   ② Navigate to: /biometric-information?id=14                   │
│                                                                   │
│ On "Next" Button:                                                 │
│   ① POST /application-form/:id/upload-file (for each file)      │
│   ② Navigate to: /preview?id=14                                 │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ Step 9: Preview                                                   │
│ URL: /preview?id=14                                               │
├──────────────────────────────────────────────────────────────────┤
│ On Mount:                                                         │
│   ① Call GET /application-form?applicationId=14                 │
│   ② Display all form data in read-only mode                     │
│                                                                   │
│ On "Previous" Button:                                             │
│   ① Navigate to: /documents-upload?id=14                        │
│                                                                   │
│ On "Next" Button:                                                 │
│   ① Navigate to: /declaration?id=14                             │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ Step 10: Declaration & Submit                                     │
│ URL: /declaration?id=14                                           │
├──────────────────────────────────────────────────────────────────┤
│ On Mount:                                                         │
│   ① Show declaration text and checkbox                          │
│                                                                   │
│ On "Previous" Button:                                             │
│   ① Navigate to: /preview?id=14                                 │
│                                                                   │
│ On "Submit" Button:                                               │
│   ① PATCH /application-form/14 (with workflowStatusId: 2)       │
│   ② Show success message                                        │
│   ③ Redirect to dashboard or confirmation page                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 💡 Key Implementation Details

### 1. URL Query Parameter Pattern
- All tabs (except Step 1 initial) use: `?id=:applicationId`
- Example: `/address-details?id=14`

### 2. Auto-Load Logic (in useApplicationForm hook)
```typescript
useEffect(() => {
  const urlApplicantId = searchParams?.get('applicantId') || searchParams?.get('id');
  if (urlApplicantId) {
    setApplicantId(urlApplicantId);
    if (formSection !== 'personal') {
      loadExistingData(urlApplicantId);  // ✅ Auto-call GET
    }
  }
}, [searchParams, formSection]);
```

### 3. Previous Button Logic
```typescript
const handlePrevious = async () => {
  if (applicantId) {
    await loadExistingData(applicantId);  // ✅ Refresh current data
    navigateToNext(PREVIOUS_ROUTE, applicantId);
  } else {
    router.back();
  }
};
```

### 4. Next Button Logic
```typescript
const handleNext = async () => {
  const savedApplicantId = await saveFormData();  // ✅ PATCH current data
  
  if (savedApplicantId) {
    navigateToNext(NEXT_ROUTE, savedApplicantId);  // ✅ Navigate with ID
  }
};
```

### 5. Save to Draft Logic
```typescript
const handleSaveToDraft = async () => {
  await saveFormData();  // ✅ PATCH without navigation
};
```

---

## 📊 API Call Summary

| Action | API Call | When | Purpose |
|--------|----------|------|---------|
| Tab Mount (with ID) | GET /application-form?applicationId=:id | Automatic on mount | Load existing data for current tab |
| Previous Button | GET /application-form?applicationId=:id | Before navigation | Refresh current data |
| Next Button | PATCH /application-form/:id | Before navigation | Save current tab data |
| Save to Draft | PATCH /application-form/:id | On button click | Save without moving |
| Submit (Step 10) | PATCH /application-form/:id | Final submission | Change workflow status |

---

## ✅ Implementation Status

| Step | Component | GET Logic | PATCH Logic | Navigation | Status |
|------|-----------|-----------|-------------|------------|--------|
| 1 | PersonalInformation | ✅ Skip if no ID | ✅ POST/PATCH | ✅ | ✅ Complete |
| 2 | AddressDetails | ✅ Auto-load | ✅ PATCH | ✅ Previous + Next | ✅ Complete |
| 3 | OccupationBusiness | ✅ Auto-load | ✅ PATCH | ✅ Previous + Next | ✅ Complete |
| 4 | CriminalHistory | ⏳ Needs impl | ⏳ Needs impl | ⏳ Needs impl | ⏳ Pending |
| 5 | LicenseHistory | ⏳ Partially done | ⏳ Needs impl | ⏳ Needs impl | ⏳ Pending |
| 6 | LicenseDetails | ⏳ Partially done | ⏳ Needs impl | ⏳ Needs impl | ⏳ Pending |
| 7 | BiometricInformation | ⏳ Needs impl | ⏳ File upload | ⏳ Needs impl | ⏳ Pending |
| 8 | DocumentsUpload | ⏳ Needs impl | ⏳ File upload | ⏳ Needs impl | ⏳ Pending |
| 9 | Preview | ⏳ Needs impl | ❌ Read-only | ✅ | ⏳ Pending |
| 10 | Declaration | ❌ No GET needed | ⏳ Final submit | ✅ | ⏳ Pending |

---

## 🧪 Testing Flow

### Complete Flow Test:
1. ✅ Open `/personal-information` (no ID)
2. ✅ Fill form, click Next → POST, get ID=14
3. ✅ Auto-navigate to `/address-details?id=14`
4. ✅ Verify GET called automatically, form populated
5. ✅ Click Previous → GET called, navigate to `/personal-information?id=14`
6. ✅ Click Next → PATCH called, navigate to `/address-details?id=14`
7. ✅ Fill address, click Next → PATCH called, navigate to `/occupation-business?id=14`
8. ✅ Verify GET called automatically, form populated
9. ✅ Fill occupation, click Next → PATCH called, navigate to `/criminal-history?id=14`
10. ⏳ Continue through all remaining tabs...

---

## 📚 Related Files

- `frontend/src/api/applicationService.ts` - API service with PATCH payload structure
- `frontend/src/hooks/useApplicationForm.ts` - Hook with GET/PATCH logic
- `frontend/src/config/formRoutes.ts` - Route definitions
- `frontend/src/components/forms/freshApplication/AddressDetails.tsx` - Reference implementation
- `frontend/src/components/forms/freshApplication/OccupationBussiness.tsx` - ✅ Updated

---

**Last Updated:** October 13, 2025  
**Status:** ✅ Steps 1-3 Complete, Steps 4-10 Pending Integration
