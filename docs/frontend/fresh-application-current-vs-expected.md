# Fresh Application Form - Current vs Expected API Flow

## 🔄 Visual Comparison

### ❌ Current Implementation (INCORRECT)

```
┌───────────────────────────────────────────────────────────────────┐
│ STEP 1: Personal Information                                      │
├───────────────────────────────────────────────────────────────────┤
│ User clicks "Next"                                                │
│         ↓                                                          │
│   POST /application-form  ← WRONG ENDPOINT                        │
│         ↓                                                          │
│   Response: { applicationId: 123 }                                │
│         ↓                                                          │
│   /address-details?id=123                                         │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│ STEP 2: Address Details                                           │
├───────────────────────────────────────────────────────────────────┤
│ On Load:                                                          │
│   • Extracts id=123 from URL                                      │
│   • Calls GET /application-form/123  ← WRONG (path param)        │
│   • Loads ALL data (not section-specific)                         │
│                                                                   │
│ User clicks "Next":                                               │
│   • PUT /application-form/123  ← WRONG METHOD (should be PATCH)  │
│   • Payload includes section field                                │
│                                                                   │
│ User clicks "Previous":                                           │
│   • Just navigates back (NO API CALL)  ← WRONG                   │
│   • Data not refreshed                                            │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│ STEPS 3-8: Other Forms                                            │
├───────────────────────────────────────────────────────────────────┤
│ ❌ NOT INTEGRATED WITH API                                        │
│ ❌ Using local state only                                         │
│ ❌ Data not persisted                                             │
└───────────────────────────────────────────────────────────────────┘
```

---

### ✅ Expected Implementation (CORRECT)

```
┌───────────────────────────────────────────────────────────────────┐
│ STEP 1: Personal Information                                      │
├───────────────────────────────────────────────────────────────────┤
│ User clicks "Next"                                                │
│         ↓                                                          │
│   POST /application-form/personal-details  ← CORRECT              │
│         ↓                                                          │
│   Response: { success: true, applicationId: 123 }                 │
│         ↓                                                          │
│   /address-details?id=123                                         │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│ STEP 2: Address Details                                           │
├───────────────────────────────────────────────────────────────────┤
│ On Load:                                                          │
│   • Extracts id=123 from URL                                      │
│   • Calls GET /application-form?applicationId=123  ← CORRECT     │
│   • Extracts ONLY address section data  ← NEW                    │
│   • Merges with initial state                                     │
│                                                                   │
│ User clicks "Next":                                               │
│   • PATCH /application-form/123  ← CORRECT METHOD                │
│   • Payload: { presentAddress: {...}, permanentAddress: {...} }  │
│   • Navigate to /occupation-business?id=123                       │
│                                                                   │
│ User clicks "Previous":                                           │
│   • GET /application-form?applicationId=123  ← NEW               │
│   • Extract personal details section                              │
│   • Navigate to /personal-information?id=123                      │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│ STEPS 3-8: Other Forms (Occupation, Criminal, License, etc.)      │
├───────────────────────────────────────────────────────────────────┤
│ Same pattern as Address Details:                                  │
│                                                                   │
│ On Load:                                                          │
│   • GET /application-form?applicationId=123                       │
│   • Extract section-specific data                                 │
│                                                                   │
│ On Next:                                                          │
│   • PATCH /application-form/123                                   │
│   • Section-specific payload                                      │
│                                                                   │
│ On Previous:                                                      │
│   • GET /application-form?applicationId=123                       │
│   • Navigate with refreshed data                                  │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│ STEP 9: Preview                                                   │
├───────────────────────────────────────────────────────────────────┤
│   • GET /application-form?applicationId=123                       │
│   • Display ALL sections from response                            │
│   • Read-only view                                                │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│ STEP 10: Declaration & Submit                                     │
├───────────────────────────────────────────────────────────────────┤
│ User clicks "Submit":                                             │
│   • Validate all checkboxes                                       │
│   • PATCH /application-form/123                                   │
│   • Payload: { workflowStatusId: 3 }  ← Changes to INITIATED     │
│   • Show success message                                          │
│   • Redirect to dashboard                                         │
└───────────────────────────────────────────────────────────────────┘
```

---

## 📊 API Endpoint Comparison

### Personal Information (Step 1)

| Operation | Current | Expected |
|-----------|---------|----------|
| **Create** | `POST /application-form` | `POST /application-form/personal-details` |
| **Response** | `{ applicationId: 123 }` | `{ success: true, applicationId: 123, message: '...' }` |

### All Other Steps (Steps 2-10)

| Operation | Current | Expected |
|-----------|---------|----------|
| **Load Data** | `GET /application-form/:id` | `GET /application-form?applicationId=:id` |
| **Update** | `PUT /application-form/:id` | `PATCH /application-form/:id` |
| **On Previous** | No API call | `GET /application-form?applicationId=:id` |

---

## 🔄 Data Flow Comparison

### Current Flow (INCORRECT)

```
Personal Info → POST → applicationId
                ↓
Address Details → Load: GET (path param)
                → Save: PUT (entire object)
                → Previous: No API call ❌
                ↓
Other Steps → Not integrated ❌
                ↓
Preview → Reads from context (stale data) ❌
                ↓
Submit → Not implemented ❌
```

### Expected Flow (CORRECT)

```
Personal Info → POST /personal-details → applicationId
                ↓
Address Details → Load: GET ?applicationId=X
                → Extract: address section only
                → Save: PATCH with address data
                → Previous: GET ?applicationId=X
                ↓
Occupation → Load: GET ?applicationId=X
           → Extract: occupation section
           → Save: PATCH with occupation data
           → Previous: GET ?applicationId=X
                ↓
Criminal History → Load: GET ?applicationId=X
                 → Extract: criminal section
                 → Save: PATCH with criminal data
                 → Previous: GET ?applicationId=X
                ↓
License History → Load: GET ?applicationId=X
                → Extract: license history section
                → Save: PATCH with license data
                → Previous: GET ?applicationId=X
                ↓
License Details → Load: GET ?applicationId=X
                → Extract: license details section
                → Save: PATCH with license details
                → Previous: GET ?applicationId=X
                ↓
Biometric → Load: GET ?applicationId=X
          → Upload files: POST /upload-file
          → Save: PATCH with file references
          → Previous: GET ?applicationId=X
                ↓
Documents → Load: GET ?applicationId=X
          → Upload files: POST /upload-file
          → Save: PATCH with file references
          → Previous: GET ?applicationId=X
                ↓
Preview → GET ?applicationId=X (fresh data)
        → Display all sections
                ↓
Declaration → PATCH { workflowStatusId: 3 }
            → Submit application
            → Success!
```

---

## 🎯 Key Differences

### 1. POST Endpoint
- ❌ **Current:** `/application-form`
- ✅ **Expected:** `/application-form/personal-details`

### 2. Update Method
- ❌ **Current:** `PUT` (replaces entire resource)
- ✅ **Expected:** `PATCH` (updates specific fields)

### 3. GET Endpoint
- ❌ **Current:** `/application-form/:id` (path parameter)
- ✅ **Expected:** `/application-form?applicationId=:id` (query parameter)

### 4. Data Loading
- ❌ **Current:** Loads once on mount, uses all data
- ✅ **Expected:** Loads on mount AND on previous, extracts section-specific data

### 5. Previous Button
- ❌ **Current:** Just navigates (no API call)
- ✅ **Expected:** Calls GET API first, then navigates

### 6. Section Integration
- ❌ **Current:** Only Personal & Address integrated
- ✅ **Expected:** All 10 steps integrated

### 7. File Uploads
- ❌ **Current:** Files stored in local state only
- ✅ **Expected:** Files uploaded to server via API

### 8. Preview
- ❌ **Current:** Reads from React Context (may be stale)
- ✅ **Expected:** Fetches fresh data from API

### 9. Submit
- ❌ **Current:** Not implemented
- ✅ **Expected:** PATCH to update workflow status

---

## 📋 Implementation Checklist

### Phase 1: Core API Fixes ✅
- [ ] Change POST endpoint to `/application-form/personal-details`
- [ ] Replace `putData()` with `patchData()` in `updateApplication()`
- [ ] Change GET endpoint to use query param `?applicationId=:id`
- [ ] Add `extractSectionData()` utility method

### Phase 2: Hook Updates ✅
- [ ] Update `loadExistingData()` to use `extractSectionData()`
- [ ] Export `loadExistingData` from hook
- [ ] Update state merging logic

### Phase 3: Component Updates ✅
- [ ] Fix AddressDetails to call GET on Previous
- [ ] Integrate OccupationBusiness with API
- [ ] Integrate CriminalHistory with API
- [ ] Integrate LicenseHistory with API
- [ ] Integrate LicenseDetails with API
- [ ] Integrate BiometricInformation with file upload
- [ ] Integrate DocumentsUpload with file upload
- [ ] Update Preview to fetch from API
- [ ] Implement Declaration submit functionality

### Phase 4: Testing ✅
- [ ] Test Personal Info POST
- [ ] Test Address Details PATCH & GET
- [ ] Test Previous button data refresh
- [ ] Test all steps integration
- [ ] Test file uploads
- [ ] Test complete end-to-end flow
- [ ] Test workflow status change on submit

---

## 🚀 Quick Start

1. **Start Here:** `fresh-application-api-integration-todo.md`
   - Detailed task-by-task breakdown
   - Code examples for each change
   - Priority levels and dependencies

2. **Summary:** `fresh-application-api-integration-summary.md`
   - High-level overview
   - Impact assessment
   - Timeline estimation

3. **Reference:** `fresh-application-form-documentation.md`
   - Complete system documentation
   - Current architecture
   - Component details

---

## 📞 Support

If you have questions during implementation:
1. Review the detailed TODO list
2. Check the backend API documentation
3. Review the current code comments
4. Test incrementally after each change

---

**Created:** October 10, 2025  
**Status:** 📝 Ready for Implementation  
**Estimated Time:** 5-7 days  

Good luck with the implementation! 🎉
