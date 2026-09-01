# Analytics Testing Guide

## Quick Start

### 1. Start the Backend
```bash
cd c:\Users\preml\Desktop\office\alms\backend
npm run dev
```
Backend runs on `http://localhost:3001` with API prefix `/api`

### 2. Start the Frontend
```bash
cd c:\Users\preml\Desktop\office\alms\frontend
npm run dev
```
Frontend runs on `http://localhost:5000`

### 3. Navigate to Analytics
Open your browser: `http://localhost:5000/admin/analytics`

## What to Test

### ✅ Data Loading
- [ ] Page loads with data from the last 30 days
- [ ] All 4 charts load with data
- [ ] Summary stats (5 cards) show numbers
- [ ] Admin activity feed shows recent activities

### ✅ Date Filtering
- [ ] Change "From Date" input - data updates automatically
- [ ] Change "To Date" input - data updates automatically
- [ ] Click "Last 30 Days" button - dates reset and data reloads
- [ ] No infinite API calls (open DevTools → Network tab)

### ✅ Refresh Button
- [ ] Click refresh button - data reloads
- [ ] Button becomes disabled during loading
- [ ] Button re-enables after data loads

### ✅ Loading States
- [ ] When data is loading, skeleton placeholders appear
- [ ] After loading, actual data is displayed
- [ ] Cards have smooth transitions

### ✅ Charts
- [ ] "Applications Over Time" bar chart displays weekly data
- [ ] "Role-wise Load" pie chart shows role distribution
- [ ] "Status Distribution" horizontal bar chart shows states
- [ ] Charts have smooth animations

### ✅ Interactive Drill-Down
- [ ] Click a bar in Applications chart → side panel opens
- [ ] Click a slice in Role chart → side panel opens
- [ ] Click a bar in Status chart → side panel opens
- [ ] Side panel shows detailed data
- [ ] Close button closes the panel
- [ ] Clicking backdrop closes the panel

### ✅ Export Functionality
- [ ] Click CSV button on any chart → downloads CSV file
- [ ] CSV file has proper formatting and escaping
- [ ] Click Export CSV in side panel → exports drill-down data
- [ ] Click Export Excel in side panel → downloads XLSX file
- [ ] Excel file opens properly in Excel/Google Sheets

### ✅ Dark/Light Mode
- [ ] Toggle system dark mode → charts adapt colors
- [ ] Background changes from light to dark
- [ ] Text remains readable in both modes
- [ ] Charts have proper contrast

### ✅ Error Handling
- [ ] If API fails, error message appears in card
- [ ] Error boundary catches chart rendering errors
- [ ] Page doesn't crash on errors
- [ ] Can still use other features if one fails

### ✅ Responsiveness
- [ ] Test on mobile (375px width) → single column layout
- [ ] Test on tablet (768px width) → 2 column layout
- [ ] Test on desktop (1440px) → proper grid layout
- [ ] All elements are touch-friendly on mobile

## API Endpoints to Test Manually

### 1. Applications by Week
```bash
curl "http://localhost:3001/api/analytics/applications?fromDate=2025-01-01&toDate=2025-12-31"
```

### 2. Role Load
```bash
curl "http://localhost:3001/api/analytics/role-load?fromDate=2025-01-01&toDate=2025-12-31"
```

### 3. Application States
```bash
curl "http://localhost:3001/api/analytics/states?fromDate=2025-01-01&toDate=2025-12-31"
```

### 4. Admin Activities
```bash
curl "http://localhost:3001/api/analytics/admin-activities?fromDate=2025-01-01&toDate=2025-12-31"
```

## DevTools Debugging

### Check Network Requests
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "analytics"
4. Each action should make 1 request (not continuous)

### Check Console
1. Open DevTools Console
2. Should have no continuous error messages
3. May see loading messages but not repeated

### Check Performance
1. Open DevTools Performance tab
2. Click record, interact with page for 5 seconds, stop
3. Look for long task times (should be minimal)

## Expected Data

Since data comes from your database, you should see:
- **Applications:** Count of FreshLicenseApplicationPersonalDetails records
- **Roles:** Count by role code from linked users
- **States:** Count by approval status flags
- **Activities:** Recent workflow history entries

## Common Issues & Fixes

### Issue: "All API calls fail"
**Fix:** Ensure backend is running on port 3001 and database is connected

### Issue: "No data appears"
**Fix:** Check if database has any records in FreshLicenseApplicationPersonalDetails table

### Issue: "Charts not rendering"
**Fix:** Check console for errors, ensure date format is YYYY-MM-DD

### Issue: "Continuous API calls"
**Fix:** Already fixed! The issue was with useCallback dependencies

### Issue: "Excel export fails"
**Fix:** Ensure xlsx package is installed: `npm install xlsx`

## Performance Baseline

**Expected API Response Times:**
- Applications: < 500ms
- Role Load: < 500ms
- States: < 500ms
- Activities: < 200ms (limited to 100 records)

**Expected Page Load Time:**
- First load: 2-3 seconds
- Filter change: 1-2 seconds
- Refresh: 1-2 seconds

## Success Criteria

✅ All tests pass
✅ No continuous API calls
✅ Data loads correctly
✅ Charts display properly
✅ Drill-down works
✅ Export works
✅ Dark mode works
✅ Responsive layout works
✅ No console errors
✅ Performance is acceptable
