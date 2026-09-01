# Fresh Application Form - API Integration Changes Summary

## 🎯 Quick Overview

This document provides a high-level summary of changes needed to align the frontend with the actual backend APIs.

---

## 🔴 Critical Changes Required

### 1. **API Endpoint Corrections**

| Component | Current Endpoint | Correct Endpoint | Method |
|-----------|------------------|------------------|--------|
| Personal Info (Create) | `POST /application-form` | `POST /application-form/personal-details` | POST |
| All Updates | `PUT /application-form/:id` | `PATCH /application-form/:id` | PATCH |
| Get Application | `GET /application-form/:id` | `GET /application-form?applicationId=:id` | GET |

### 2. **Expected API Flow**

```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: Personal Information                                     │
├─────────────────────────────────────────────────────────────────┤
│ User fills form → Clicks "Next"                                 │
│ ↓                                                                │
│ POST /application-form/personal-details                          │
│ ↓                                                                │
│ Response: { success: true, applicationId: 123 }                 │
│ ↓                                                                │
│ Navigate to: /address-details?id=123                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Step 2+: Address, Occupation, etc.                              │
├─────────────────────────────────────────────────────────────────┤
│ On "Next" button:                                               │
│   → PATCH /application-form/:applicationId                      │
│   → Navigate to next step with same ID                          │
│                                                                  │
│ On "Previous" button:                                           │
│   → GET /application-form?applicationId=:id                     │
│   → Extract relevant section data                               │
│   → Navigate to previous step                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📝 Key Changes by File

### `applicationService.ts` (API Layer)
- ✅ Change POST to `/application-form/personal-details`
- ✅ Replace `putData()` with `patchData()`
- ✅ Change GET to use query param: `?applicationId=:id`
- ✅ Add `extractSectionData()` method for parsing GET responses

### `useApplicationForm.ts` (Hook)
- ✅ Update `loadExistingData()` to extract section-specific data
- ✅ Export `loadExistingData` for component access
- ✅ Use extracted data instead of full response

### Components (PersonalInformation, AddressDetails, etc.)
- ✅ AddressDetails: Call GET API on "Previous" button
- ✅ All components: Implement proper PATCH on "Next"
- ✅ Components 3-8: Integrate with `useApplicationForm` hook
- ✅ File upload components: Implement file upload service

---

## 🔧 Implementation Steps

### Phase 1: Fix Core API Service (Day 1) 🔴
1. Update POST endpoint path
2. Change PUT to PATCH
3. Fix GET endpoint with query param
4. Add data extraction utility

### Phase 2: Update Hook (Day 2) 🟡
1. Modify data loading logic
2. Export helper functions
3. Test with existing components

### Phase 3: Fix Existing Components (Day 3) 🟡
1. Update AddressDetails Previous button
2. Verify PersonalInformation POST
3. Test navigation flow

### Phase 4: Integrate Remaining Components (Days 4-6) 🟡
1. OccupationBusiness
2. CriminalHistory
3. LicenseHistory
4. LicenseDetails
5. BiometricInformation
6. DocumentsUpload

### Phase 5: File Uploads (Day 7) 🔴
1. Create file upload service
2. Integrate with BiometricInformation
3. Integrate with DocumentsUpload

### Phase 6: Preview & Submit (Day 8) 🔴
1. Update Preview to fetch from API
2. Implement final submission
3. Handle workflow status change

### Phase 7: Testing (Day 9) 🟢
1. Test complete flow
2. Test Previous/Next navigation
3. Test data persistence
4. Test file uploads

---

## 💡 Important Notes

### Current State
- ❌ Using wrong POST endpoint
- ❌ Using PUT instead of PATCH
- ❌ GET endpoint using path param instead of query param
- ❌ Not extracting section-specific data from GET response
- ❌ Steps 3-8 not integrated with API
- ❌ File uploads not implemented

### After Changes
- ✅ Correct POST endpoint for personal details
- ✅ PATCH for all updates
- ✅ GET with query parameter
- ✅ Section-specific data extraction
- ✅ All steps integrated with API
- ✅ File upload functionality

---

## 🎯 Success Criteria

After implementation, the following should work:

1. ✅ User fills Personal Info → POST creates application → Get applicationId
2. ✅ User navigates to Address Details with ID in URL
3. ✅ User fills Address Details → PATCH updates application
4. ✅ User clicks Previous → GET fetches data → Address data displayed
5. ✅ User navigates through all 10 steps
6. ✅ Each step saves via PATCH
7. ✅ Each Previous button loads via GET
8. ✅ Files upload successfully
9. ✅ Preview shows all data from API
10. ✅ Declaration submits and changes workflow status

---

## 📊 Impact Assessment

| Area | Files Affected | Lines Changed (Est.) | Complexity | Priority |
|------|----------------|---------------------|------------|----------|
| API Service | 1 | ~50 lines | Low | 🔴 High |
| Hook | 1 | ~30 lines | Medium | 🔴 High |
| PersonalInfo | 1 | ~10 lines | Low | 🟢 Low |
| AddressDetails | 1 | ~20 lines | Medium | 🟡 Medium |
| Other Components | 6 | ~300 lines | High | 🟡 Medium |
| File Upload | 3 | ~150 lines | High | 🔴 High |
| Testing | All | N/A | Medium | 🟢 Low |

**Total Estimated Effort:** 5-7 working days

---

## 🚨 Breaking Changes

### API Response Structure
- **Before:** `response.data` contained partial data
- **After:** `response.data` contains complete application object
- **Impact:** Need to extract section-specific data

### Update Method
- **Before:** `PUT` replaces entire resource
- **After:** `PATCH` updates specific fields
- **Impact:** More efficient, less data transfer

### GET Endpoint
- **Before:** `/application-form/:id` (path parameter)
- **After:** `/application-form?applicationId=:id` (query parameter)
- **Impact:** URL structure change

---

## ✅ Pre-Implementation Checklist

- [ ] Review complete TODO list
- [ ] Understand backend API structure
- [ ] Backup current code
- [ ] Set up feature branch
- [ ] Review backend DTO interfaces
- [ ] Understand data transformation requirements
- [ ] Plan testing strategy

---

## 📚 Related Documents

- `fresh-application-form-documentation.md` - Complete system documentation
- `fresh-application-api-integration-todo.md` - Detailed task list
- `docs/backend/application-form-api.md` - Backend API documentation

---

**Status:** 📝 Ready for Implementation  
**Priority:** 🔴 High  
**Estimated Time:** 5-7 days  
**Risk Level:** Medium (well-defined changes)

---

## 🤝 Next Steps

1. Review this summary with the team
2. Review detailed TODO list
3. Get approval to proceed
4. Start with Phase 1 (API Service Layer)
5. Test incrementally after each phase
6. Update documentation as you go

Good luck! 🚀
