# Admin Dashboard Navigation - Testing & Verification Guide

## 🧪 Manual Testing Procedures

### Test 1: Admin Login & Dashboard Access
**Objective**: Verify admin user can access dashboard with all menu items visible

**Steps**:
1. Navigate to `/login`
2. Login with admin credentials
3. Verify redirect to `/admin` or admin dashboard
4. Check sidebar displays all 4 menu items:
   - ✓ User Management (Users icon)
   - ✓ Role Mapping (Shield icon)
   - ✓ Analytics (Chart icon)
   - ✓ Flow Mapping (GitBranch icon)

**Expected Result**: All menu items visible with correct icons

---

### Test 2: Menu Item Navigation
**Objective**: Verify each menu item navigates to correct page

**Steps**:
1. Click "User Management" → Should navigate to `/admin/userManagement`
2. Click "Role Mapping" → Should navigate to `/admin/roleMapping`
3. Click "Analytics" → Should navigate to `/admin/analytics`
4. Click "Flow Mapping" → Should navigate to `/admin/flowMapping`

**Expected Result**: Each page loads without blank screens or delays

---

### Test 3: Active Menu Highlighting
**Objective**: Verify active menu item highlights current page

**Steps**:
1. Navigate to `/admin/userManagement`
2. Verify "User Management" is highlighted (blue background)
3. Click "Role Mapping"
4. Verify "Role Mapping" is now highlighted
5. Verify previous item is no longer highlighted

**Expected Result**: Only current page's menu item is highlighted

---

### Test 4: Page Refresh Persistence
**Objective**: Verify menu state persists after page refresh

**Steps**:
1. Navigate to `/admin/analytics`
2. Verify "Analytics" is highlighted
3. Press F5 to refresh the page
4. Verify "Analytics" menu item remains highlighted
5. Verify the Analytics page content is still displayed

**Expected Result**: Menu selection and content persist after refresh

---

### Test 5: Smooth Navigation (No Flicker)
**Objective**: Verify transitions are smooth without UI flicker

**Steps**:
1. Open browser DevTools (F12)
2. Go to Performance tab
3. Record performance while:
   - Click User Management
   - Wait for load
   - Click Role Mapping
   - Wait for load
   - Click Analytics
4. Review recording for Layout Shifts or repaints

**Expected Result**: No visible flicker, smooth transitions, minimal repaints

---

### Test 6: Page Load Speed (Preloading)
**Objective**: Verify pages load instantly due to preloading

**Steps**:
1. Open DevTools Network tab
2. Record load time when clicking menu items
3. Times should be <100ms (already preloaded)
4. No new chunk downloads should occur

**Expected Result**: Instant navigation, no loading spinners

---

### Test 7: URL-to-Sidebar Sync
**Objective**: Verify URL changes sync with sidebar

**Steps**:
1. Manually type `/admin/roleMapping` in address bar
2. Verify "Role Mapping" is highlighted in sidebar
3. Type `/admin/flowMapping` in address bar
4. Verify "Flow Mapping" is highlighted in sidebar

**Expected Result**: Sidebar correctly reflects URL pathname

---

### Test 8: Non-Admin Access Prevention
**Objective**: Verify non-admin users can't access admin pages

**Steps**:
1. Login as non-admin user (ZS, DCP, etc.)
2. Try to navigate to `/admin/userManagement`
3. Should redirect to home or appropriate dashboard

**Expected Result**: Access denied, redirect to non-admin area

---

### Test 9: Menu Item Count Verification
**Objective**: Verify all 4 menu items are present

**Steps**:
1. Open sidebar
2. Count visible menu items under admin section
3. Items should be: User Management, Role Mapping, Analytics, Flow Mapping
4. Count items with CSS selector: `nav ul li` in sidebar

**Expected Result**: Exactly 4 admin menu items visible

---

### Test 10: Session Storage Verification
**Objective**: Verify active menu key is stored in sessionStorage

**Steps**:
1. Open DevTools Console
2. Navigate to `/admin/roleMapping`
3. Execute: `sessionStorage.getItem('activeAdminMenuKey')`
4. Should return: `'roleMapping'`
5. Navigate to `/admin/flowMapping`
6. Execute: `sessionStorage.getItem('activeAdminMenuKey')`
7. Should return: `'flowMapping'`

**Expected Result**: SessionStorage correctly tracks active menu

---

## 🔍 Automated Testing Examples

### Jest Test - Menu Items Load
```typescript
import { render } from '@testing-library/react';
import { Sidebar } from '@/components/Sidebar';

describe('Admin Sidebar Menu', () => {
  it('should render all admin menu items', () => {
    const { getByText } = render(<Sidebar />);
    expect(getByText('User Management')).toBeInTheDocument();
    expect(getByText('Role Mapping')).toBeInTheDocument();
    expect(getByText('Analytics')).toBeInTheDocument();
    expect(getByText('Flow Mapping')).toBeInTheDocument();
  });
});
```

### Playwright Test - Navigation Flow
```typescript
import { test, expect } from '@playwright/test';

test('admin should navigate through menu items', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('[name="username"]', 'admin');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');
  
  // Verify menu items
  await expect(page.locator('text=User Management')).toBeVisible();
  await expect(page.locator('text=Role Mapping')).toBeVisible();
  await expect(page.locator('text=Analytics')).toBeVisible();
  await expect(page.locator('text=Flow Mapping')).toBeVisible();
  
  // Navigate and verify
  await page.click('text=Analytics');
  await expect(page).toHaveURL('/admin/analytics');
  
  await page.click('text=Flow Mapping');
  await expect(page).toHaveURL('/admin/flowMapping');
});
```

---

## ✅ Pre-Deployment Checklist

- [ ] All TypeScript errors resolved
- [ ] Backend seed files updated with flowMapping
- [ ] All 4 admin pages load correctly
- [ ] Menu items appear in correct order
- [ ] Active menu highlighting works
- [ ] Page refresh maintains state
- [ ] Navigation is smooth (no flicker)
- [ ] Pages load instantly (preloading works)
- [ ] Non-admin users cannot access admin pages
- [ ] SessionStorage correctly tracks active menu
- [ ] No console errors or warnings
- [ ] Responsive design works on mobile
- [ ] Menu icons display correctly
- [ ] Admin layout properly wraps pages
- [ ] Role-based restrictions enforced

---

## 🐛 Troubleshooting Guide

### Issue: Menu items not showing
**Solution**:
1. Verify user is logged in as ADMIN
2. Check browser console for errors
3. Verify roleConfig is being loaded: `window.localStorage.getItem('activeNavItem')`
4. Clear browser cache and reload

### Issue: Pages show blank screen
**Solution**:
1. Check if pages are exported correctly (default export required)
2. Verify page components don't have TypeScript errors
3. Check browser console for errors
4. Ensure pages are in correct folders: `/admin/{pageName}/page.tsx`

### Issue: Menu doesn't highlight after click
**Solution**:
1. Verify admin layout is wrapping the pages
2. Check if `setActiveMenuKey` is being called
3. Verify sessionStorage is enabled in browser
4. Check if pathname sync is working in useEffect

### Issue: Page refresh loses active menu
**Solution**:
1. Verify sessionStorage is not being cleared
2. Check if AdminMenuContext is properly initialized
3. Verify `getAdminMenuKeyFromPath` is working correctly
4. Check browser console for storage errors

### Issue: Pages load slowly
**Solution**:
1. Verify preloadAdminPages() is being called
2. Check network tab for slow resources
3. Verify requestIdleCallback is supported
4. Check for large component bundles

---

## 📊 Performance Metrics to Track

| Metric | Target | Current |
|--------|--------|---------|
| Menu item render time | <50ms | ? |
| Page transition time | <100ms | ? |
| Initial load time | <1s | ? |
| Time to Interactive | <2s | ? |
| Layout shifts (CLS) | 0 | ? |
| Lighthouse score | >90 | ? |

---

## 🔗 Related Documentation

- Admin Dashboard Fix Complete: `ADMIN_DASHBOARD_FIX_COMPLETE.md`
- Integration Guide: `ADMIN_DASHBOARD_INTEGRATION_GUIDE.md`
- Verification Script: `verify-admin-dashboard.ps1`

---

## 📞 Support

For issues not covered here:
1. Check browser DevTools Console for errors
2. Review network tab for failed requests
3. Inspect Elements to verify DOM structure
4. Check Redux DevTools for state issues
5. Review component props and context values
