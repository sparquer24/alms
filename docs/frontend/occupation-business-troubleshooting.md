# 🔧 OccupationBusiness Component - Troubleshooting Guide

## 📋 Issue: Occupation-Business Not Working

**Date:** October 13, 2025  
**Status:** Debugging in progress

---

## ✅ Debug Logging Added

I've added comprehensive console logging to help identify the issue:

### 1. **OccupationBusiness Component Logs**

```typescript
// When form state or location state changes
🔵 Occupation form state: { occupation, officeAddress, officeState, officeDistrict, ... }
🔵 Location state: selectedState, selectedDistrict

// When syncing state
🟢 Syncing officeState: "1"
🟢 Syncing officeDistrict: "5"
```

### 2. **ApplicationService Logs**

```typescript
// When extracting data from GET response
🔵 Extracting occupation data: { occupation, officeAddress, stateId, districtId, ... }
🟢 Extracted occupation form data: { occupation, officeAddress, officeState, officeDistrict, ... }

// When preparing PATCH payload
🟠 Preparing occupation payload from form data: { occupation, officeAddress, officeState, officeDistrict, ... }
🟢 Final occupation payload: { occupationAndBusiness: { occupation, officeAddress, stateId, districtId, ... } }
```

---

## 🔍 Common Issues & Solutions

### Issue 1: Dropdowns Not Loading States
**Symptom:** State dropdown is empty or shows "Loading states..." forever

**Check:**
1. Open browser DevTools Console
2. Look for errors related to Location API
3. Check Network tab for failed requests to `/locations/states`

**Solution:**
- Verify Location API is running
- Check CORS configuration
- Verify `useLocationHierarchy` hook is properly initialized

### Issue 2: Form Data Not Loading from GET API
**Symptom:** Navigating to `/occupation-business?id=14` shows empty form

**Check Console Logs:**
```
🔵 Extracting occupation data: { ... }
🟢 Extracted occupation form data: { ... }
```

**Possible Causes:**
- Backend returns wrong data structure
- `applicationData.occupationAndBusiness` is null/undefined
- IDs not being converted properly

**Solution:**
- Check backend response structure in Network tab
- Verify `extractSectionData` mapping is correct
- Ensure backend has saved occupation data for this application ID

### Issue 3: Dropdowns Don't Show Selected Values
**Symptom:** Data loads but dropdowns remain empty

**Check Console Logs:**
```
🔵 Occupation form state: { officeState: "1", officeDistrict: "5" }
🔵 Location state: "", ""
🟢 Syncing officeState: "1"
```

**Possible Causes:**
- `useEffect` sync not triggering
- Location hierarchy not loading based on saved IDs
- Timing issue between data load and location load

**Solution:**
- Verify `isLoading` dependency in useEffect
- Check if `locationActions.setSelectedState` triggers district load
- Ensure form state has string IDs, not numbers

### Issue 4: PATCH API Fails
**Symptom:** Clicking "Next" or "Save to Draft" shows error

**Check Console Logs:**
```
🟠 Preparing occupation payload from form data: { ... }
🟢 Final occupation payload: { occupationAndBusiness: { ... } }
```

**Check Network Tab:**
- Look at PATCH request payload
- Verify `stateId` and `districtId` are integers (not strings)
- Check response status and error message

**Possible Causes:**
- IDs sent as strings instead of integers
- Missing required fields
- Wrong payload structure

**Solution:**
- Verify `parseInt()` is working correctly
- Check if validation is blocking submission
- Verify backend DTO expectations

---

## 🧪 Step-by-Step Testing

### Test 1: New Application (No Data)

1. **Navigate to:** `/forms/createFreshApplication/occupation-business`
   - ✅ State dropdown should load automatically
   - ✅ District dropdown should be disabled

2. **Select State:**
   - ✅ District dropdown should enable
   - ✅ District dropdown should load districts for that state

3. **Fill Form and Click Next:**
   - ✅ Check console: "🟢 Final occupation payload"
   - ✅ Check Network tab: PATCH request with integer IDs
   - ✅ Should navigate to next page with ID in URL

### Test 2: Existing Application (With Data)

1. **Navigate to:** `/forms/createFreshApplication/occupation-business?id=14`
   - ✅ Check console: "🔵 Extracting occupation data"
   - ✅ Check console: "🟢 Extracted occupation form data"
   - ✅ Check console: "🔵 Occupation form state"

2. **Verify Form Populated:**
   - ✅ Occupation field filled
   - ✅ Office Address filled
   - ✅ State dropdown shows selected state
   - ✅ District dropdown shows selected district
   - ✅ Crop fields filled (if any)

3. **Modify and Save:**
   - ✅ Change state → District clears
   - ✅ Select new district
   - ✅ Click Next → PATCH with updated IDs

---

## 🔍 What to Check in Browser Console

Open DevTools (F12) and look for these logs in order:

### On Page Load with ID:
```
1. 🟢 Loading existing data (GET) for applicantId: 14, section: occupation
2. 📄 Full application response: { ... }
3. 🔵 Extracting occupation data: { occupation: "...", stateId: 1, districtId: 5 }
4. 🟢 Extracted occupation form data: { occupation: "...", officeState: "1", officeDistrict: "5" }
5. 📋 Extracted section data for occupation: { ... }
6. ✅ Section data loaded and merged
7. 🔵 Occupation form state: { occupation: "...", officeState: "1", officeDistrict: "5" }
8. 🟢 Syncing officeState: "1"
9. 🟢 Syncing officeDistrict: "5"
```

### On Click Next/Save:
```
1. 🟠 Preparing occupation payload from form data: { ... }
2. 🟢 Final occupation payload: { occupationAndBusiness: { stateId: 1, districtId: 5 } }
3. 🚀 Saving form data (POST/PATCH): occupation
```

---

## ❌ Common Error Messages

### Error 1: "Cannot read property 'stateId' of undefined"
**Meaning:** `occupationAndBusiness` object is null or undefined in backend response

**Fix:** Check if backend has saved occupation data for this application

### Error 2: "District dropdown not loading"
**Meaning:** State ID not triggering district fetch

**Fix:** Check `handleStateChange` is called and `locationActions.setSelectedState` works

### Error 3: "PATCH request validation error"
**Meaning:** Backend rejecting payload structure

**Fix:** 
- Verify payload matches backend DTO
- Check all required fields are present
- Ensure IDs are integers, not strings

---

## 📊 Network Tab Verification

### GET Request
**URL:** `/application-form?applicationId=14`

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": 14,
    "occupationAndBusiness": {
      "occupation": "Software Engineer",
      "officeAddress": "Tech Park",
      "stateId": 1,
      "districtId": 5,
      "cropLocation": "Farm",
      "areaUnderCultivation": 10.5
    }
  }
}
```

### PATCH Request
**URL:** `/application-form/14`

**Expected Payload:**
```json
{
  "occupationAndBusiness": {
    "occupation": "Software Engineer",
    "officeAddress": "Tech Park",
    "stateId": 1,        // ⚠️ Must be integer
    "districtId": 5,     // ⚠️ Must be integer
    "cropLocation": "Farm",
    "areaUnderCultivation": 10.5
  }
}
```

---

## 🛠️ Quick Fixes

### Fix 1: If state dropdown is empty
```typescript
// Check in browser console:
locationState.states  // Should have array of states
locationState.loadingStates  // Should be false
locationState.error  // Should be null
```

### Fix 2: If form data not loading
```typescript
// In useApplicationForm.ts, verify:
const sectionData = ApplicationService.extractSectionData(response.data, 'occupation');
console.log('Section data:', sectionData);  // Should have officeState and officeDistrict as strings
```

### Fix 3: If sync not working
```typescript
// In OccupationBusiness.tsx, check:
console.log('Form officeState:', form.officeState);  // Should be "1", not 1
console.log('Location selectedState:', locationState.selectedState);
```

---

## 📝 Next Steps

1. **Open browser and navigate to occupation-business page**
2. **Open DevTools Console (F12)**
3. **Look for the console logs mentioned above**
4. **Share the console output or error messages you see**
5. **Check Network tab for failed requests**

---

## 🆘 If Still Not Working

Please provide:
1. Console error messages (if any)
2. Network request/response for GET and PATCH
3. Screenshot of the form showing the issue
4. Browser console logs starting from page load

This will help identify the exact issue!

---

**Last Updated:** October 13, 2025  
**Status:** 🔍 Debugging in progress with enhanced logging
