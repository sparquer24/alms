# Preview Screen - Testing Guide

## Quick Test Checklist

### ✅ Test 1: Initial Load
**Steps:**
1. Complete all form sections
2. Navigate to Preview tab
3. Observe data display

**Expected:**
- All sections visible
- Data matches what was entered
- Location names displayed (not IDs)
- Edit buttons present on each section

---

### ✅ Test 2: Page Refresh
**Steps:**
1. On Preview screen, press `F5` or `Ctrl+R`
2. Wait for page reload

**Expected:**
- Loading spinner appears briefly
- All data re-fetched from backend
- Data displayed correctly
- No loss of information

**URL should contain:**
```
/forms/createFreshApplication/preview?applicationId=XXX
```

---

### ✅ Test 3: Edit Personal Information
**Steps:**
1. Click Edit (✏️) on "Personal Information" section
2. Modify first name
3. Click "Save to Draft"
4. Navigate back to Preview

**Expected:**
- Form opens with existing data
- Changes can be made
- After save, redirects or allows navigation back
- Preview shows updated first name

---

### ✅ Test 4: Edit Address Details
**Steps:**
1. Click Edit on "Address Details" section
2. Change present address line
3. Change state selection
4. Save changes
5. Return to Preview

**Expected:**
- Address form opens with pre-filled data
- Dropdowns show correct selections
- After save, updated address visible in Preview
- New state name displayed (not ID)

---

### ✅ Test 5: Edit Occupation
**Steps:**
1. Click Edit on "Occupation & Business"
2. Modify occupation field
3. Save and return to Preview

**Expected:**
- Occupation form opens with data
- Changes saved successfully
- Preview reflects new occupation

---

### ✅ Test 6: Missing Application ID
**Steps:**
1. Navigate to `/forms/createFreshApplication/preview` (no ID)
2. Or use invalid ID

**Expected:**
- Error message displayed
- "Go to Personal Information" button visible
- Clicking button navigates to start of form

---

### ✅ Test 7: Network Error Handling
**Steps:**
1. Open browser dev tools
2. Go to Network tab
3. Set throttling to "Offline"
4. Refresh Preview page

**Expected:**
- Error message: "Failed to load application data"
- No application crash
- Graceful error display

---

### ✅ Test 8: Location Name Resolution
**Steps:**
1. View Preview with complete address data
2. Check Present Address section
3. Check Permanent Address section
4. Check Occupation section

**Expected:**
- State: Shows name like "West Bengal" (not "1")
- District: Shows name like "Kolkata" (not "1")
- Zone: Shows name like "South Zone" (not "1")
- Division: Shows name (not ID)
- Police Station: Shows name (not ID)

---

### ✅ Test 9: Array Data Display
**Steps:**
1. Fill License Details with multiple weapon IDs: [4, 5, 6]
2. View Preview

**Expected:**
- Requested Weapon IDs: "4, 5, 6" (comma-separated)

---

### ✅ Test 10: Date Formatting
**Steps:**
1. Enter Date of Birth: "1990-05-10"
2. View Preview

**Expected:**
- Display: "10 May 1990" (formatted, not ISO string)

---

### ✅ Test 11: Boolean Display
**Steps:**
1. In Criminal History, set "Convicted" to Yes
2. Set "Bond Executed" to No
3. View Preview

**Expected:**
- Convicted: "Yes"
- Bond Executed: "No"
(Not true/false or 1/0)

---

### ✅ Test 12: Empty Field Hiding
**Steps:**
1. Leave Middle Name blank in Personal Info
2. View Preview

**Expected:**
- Middle Name field not displayed
- No "N/A" or empty value shown
- Only filled fields visible

---

### ✅ Test 13: Multiple Criminal/License Histories
**Steps:**
1. Add multiple criminal history entries
2. Add multiple license history entries
3. View Preview

**Expected:**
- Each entry displayed separately
- Clear separation between entries
- All details visible

---

### ✅ Test 14: Responsive Design
**Steps:**
1. View Preview on desktop (>768px width)
2. View on mobile (<768px width)

**Expected:**
- Desktop: 2-column grid for data
- Mobile: Single column layout
- All data readable on both
- Edit buttons accessible

---

### ✅ Test 15: Scrolling
**Steps:**
1. View Preview with all sections filled
2. Scroll through content

**Expected:**
- Header stays at top
- Footer stays at bottom
- Content scrolls smoothly
- Custom scrollbar visible

---

## Debug Commands

### Check Application ID in Console
```javascript
console.log(localStorage.getItem('applicationId'));
console.log(new URLSearchParams(window.location.search).get('applicationId'));
```

### Check API Response
```javascript
// In browser console on Preview page
// Look for console logs starting with:
// 🔵 Fetching application data
// 🟢 Application data fetched
```

### Verify Location API Calls
```javascript
// Network tab → Filter by "locations"
// Should see calls like:
// GET /api/locations/states/1
// GET /api/locations/districts/1
```

---

## Common Issues & Solutions

### Issue: "No application ID found"
**Solution:** 
- Check if Personal Info was completed and saved
- Verify localStorage has 'applicationId'
- Check URL for applicationId parameter

### Issue: Location names not showing (showing IDs)
**Solution:**
- Check Network tab for failed location API calls
- Verify backend location endpoints are working
- Check console for error messages

### Issue: Page refresh loses data
**Solution:**
- Ensure applicationId is in URL or localStorage
- Check that GET API is being called on refresh
- Verify API returns data correctly

### Issue: Edit button doesn't navigate
**Solution:**
- Check console for routing errors
- Verify FORM_ROUTES paths are correct
- Check if applicationId is being passed in URL

---

## API Endpoints to Verify

### Application Data
```
GET /api/application-form?applicationId={id}
Status: 200 OK
Response: Complete application JSON
```

### Location Endpoints
```
GET /api/locations/states/{id}
GET /api/locations/districts/{id}
GET /api/locations/zones/{id}
GET /api/locations/divisions/{id}
GET /api/locations/police-stations/{id}
```

---

## Browser Console Expected Logs

```
🔵 Fetching application data for ID: {applicationId}
🟢 Application data fetched: {data object}
🔵 Extracting location names...
🟢 Location names fetched and cached
✅ Preview rendered successfully
```

---

## Performance Benchmarks

- **Initial Load**: < 2 seconds
- **Page Refresh**: < 1.5 seconds
- **Location API Calls**: < 500ms total
- **Edit Navigation**: < 100ms

---

## Accessibility Testing

### Screen Reader
- [ ] Section headings announced
- [ ] Edit buttons have descriptive labels
- [ ] Data fields have proper labels

### Keyboard Navigation
- [ ] Tab through edit buttons
- [ ] Enter key activates edit
- [ ] Escape key works if applicable

---

**Last Updated**: January 2025  
**Tester**: [Your Name]  
**Status**: Ready for Testing
