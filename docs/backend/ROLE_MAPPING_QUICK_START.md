# Role Mapping - Quick Start Guide

## Overview

The `/admin/roleMapping` page has been completely revamped with professional role management features including:

- Full CRUD operations (Create, Read, Update, Delete)
- Advanced search and filtering
- Permission matrix management
- Confirmation dialogs for safety
- Responsive, modern UI

---

## Getting Started

### Installation

No additional installation needed! All components are already in place.

### Starting the Application

```bash
# Terminal 1: Start Backend
cd backend
npm run start:dev

# Terminal 2: Start Frontend
cd frontend
npm run dev
```

### Accessing the Page

Navigate to: `http://localhost:3000/admin/roleMapping`

---

## Quick Actions

### 1. Create a New Role ⭐

1. Click **"+ Create New Role"** button (top right)
2. Fill in the form:
   - **Role Name**: Enter a role name (e.g., "Field Inspector")
   - **Role Code**: Auto-generates from name (can edit)
   - **Dashboard Title**: The title shown on dashboard (required)
   - **Description**: Optional description of the role
3. (Optional) Click **"Permissions & Capabilities"** to expand and select permissions
4. Click **"Create Role"** button
5. ✅ Success! Role appears in table

**Time to create**: ~30 seconds

---

### 2. Edit a Role ✏️

1. Find the role in the table
2. Click **"Edit"** button (orange)
3. Modify any fields you want to change
4. Update permissions if needed
5. Click **"Update Role"**
6. ✅ Changes saved!

**Time to edit**: ~1 minute

---

### 3. View Role Permissions 👁️

1. Find the role in the table
2. Click **"Perms"** button (light blue)
3. Modal shows all permissions organized by category
4. View counts: "X of Y enabled" per category
5. Close modal

No changes can be made from this view.

---

### 4. Deactivate a Role ⚠️

1. Find the role in the table
2. If Active: Click **"Deactivate"** button (pink)
3. If Inactive: Click **"Activate"** button (green)
4. Confirm in dialog
5. ✅ Status changed!

**Note**: This doesn't delete the role, just marks it as inactive.

---

### 5. Delete a Role 🗑️

1. Find the role in the table
2. Click **"Delete"** button (red)
3. Read the confirmation message
4. Click **"Delete"** in the confirmation dialog
5. ✅ Role soft-deleted (can be recovered)

**Note**: This is a soft-delete. The role can be recovered by an administrator.

---

### 6. Search for a Role 🔍

1. Type in the search box at top
2. Can search by:
   - Role name: "Admin", "Inspector"
   - Role code: "admin", "inspector"
3. Table updates immediately
4. Results are case-insensitive

---

### 7. Filter by Status 🎯

1. Use the **"Status"** dropdown filter
2. Options:
   - **All Statuses**: Show all roles
   - **Active**: Show only active roles
   - **Inactive**: Show only inactive roles
3. Table updates immediately
4. Works together with search

---

### 8. Sort the Table 📊

1. Click any column header to sort:
   - Role Name
   - Code
   - Status
   - Created
   - Updated
2. Click again to reverse sort direction
3. Arrow (↑↓) shows sort field and direction

**Sorting available on**: Name, Code, Created Date, Updated Date

---

### 9. Navigate Pages 📖

1. Table shows 10 roles per page by default
2. Use pagination at bottom:
   - **Previous**: Go to previous page
   - **Page X of Y**: Shows current position
   - **Next**: Go to next page
3. Disabled buttons at edges

---

## Permission Categories

### Capabilities (6 total)

Core role abilities:

- **can_forward**: Forward applications
- **can_FLAF**: Fresh Application Form access
- **can_generate_ground_report**: Generate ground reports
- **can_re_enquiry**: Conduct re-enquiries
- **can_create_freshLicence**: Create fresh licenses
- **can_access_settings**: Access system settings

### View Permissions (8 total)

What the role can see:

- canViewFreshForm
- canViewForwarded
- canViewReturned
- canViewRedFlagged
- canViewDisposed
- canViewSent
- canViewFinalDisposal
- canViewReports

### Action Permissions (12 total)

What actions the role can perform:

- canSubmitApplication
- canCaptureUIN
- canCaptureBiometrics
- canUploadDocuments
- canForwardTo\* (ACP, SHO, DCP, AS, CP)
- canConductEnquiry
- canAddRemarks
- canApproveTA
- canApproveAI
- canReject
- canRequestResubmission
- canGeneratePDF

---

## Tips & Tricks

### 💡 Auto-Generate Role Codes

- Type a role name
- Code auto-generates to lowercase with underscores
- Example: "Senior Inspector" → "senior_inspector"
- Can manually edit if needed

### 💡 Bulk Permission Selection

- Click category header checkbox to select all in that category
- Uncheck to deselect all
- Much faster than individual checkboxes

### 💡 Permission Count Summary

- See "X of Y" enabled for each category
- Helps understand role permissions at a glance
- Summary at bottom shows total permissions enabled

### 💡 Combine Filters

- Use search + status filter together
- Example: Search for "inspector" + filter by "active"
- Creates powerful queries

### 💡 Sort + Filter

- Sort while filtering
- Sorting works on filtered results
- Great for finding specific roles quickly

---

## Common Workflows

### Adding a New Role Type

**Workflow**: Admin → Inspector role

1. Click "Create New Role"
2. Name: "Field Inspector"
3. Dashboard Title: "Inspector Dashboard"
4. Description: "Responsible for on-ground verification"
5. Expand Permissions & select:
   - can_generate_ground_report ✓
   - can_re_enquiry ✓
   - canViewFreshForm ✓
   - canConductEnquiry ✓
6. Click "Create Role"
7. Done! Inspectors can now use this role

**Time**: ~2 minutes

---

### Updating Role Permissions

**Workflow**: Give Inspector permission to submit forms

1. Search for "Inspector" role
2. Click "Edit"
3. Click "Permissions & Capabilities" to expand
4. Check "canSubmitApplication"
5. Click "Update Role"
6. Done! Inspectors now have submit permission

**Time**: ~1 minute

---

### Auditing Active Roles

**Workflow**: See all currently active roles

1. Filter Status: "Active"
2. Sort by "Updated" (newest first)
3. Review recent updates
4. Check permissions if needed
5. All done!

**Time**: ~1 minute

---

## Troubleshooting

### Issue: Role code already exists

**Solution**:

- Role codes must be unique
- Edit the code to something different
- Try adding a number or suffix

### Issue: Form won't submit

**Solution**:

- Check for red error messages
- Role Name is required
- Dashboard Title is required
- Fix the highlighted fields

### Issue: Changes not showing

**Solution**:

- Try refreshing the page
- Check for error notifications
- Look at browser console for errors

### Issue: Can't delete role

**Solution**:

- Role might be in use by users
- Try deactivating instead
- Contact administrator if needed

---

## Keyboard Shortcuts

| Shortcut | Action                              |
| -------- | ----------------------------------- |
| `Esc`    | Close any open modal                |
| `Tab`    | Navigate form fields                |
| `Enter`  | Submit form (when on submit button) |

---

## Status Indicators

### Color Meanings

| Color     | Meaning           |
| --------- | ----------------- |
| 🟢 Green  | Active/Success    |
| 🔴 Red    | Delete/Error      |
| 🟠 Orange | Warning/Update    |
| 🔵 Blue   | Primary/Edit      |
| ⚫ Gray   | Inactive/Disabled |

---

## Performance Tips

✅ **Do This:**

- Search to filter roles
- Use status filter
- Sort large lists

❌ **Avoid This:**

- Creating 100s of roles at once
- Very long descriptions
- Special characters in codes

---

## FAQ

**Q: Is deleting a role permanent?**
A: No! It's a soft-delete. The role is marked as inactive but data is preserved. Administrators can recover it if needed.

**Q: Can I change a role code after creating it?**
A: Yes, you can edit it while editing the role, but make sure the new code is unique.

**Q: How many permissions can a role have?**
A: All of them! You can enable any combination of the 26 available permissions.

**Q: Are changes to roles immediate?**
A: Yes! Once you click "Create Role", "Update Role", etc., the changes are instant.

**Q: Can I search by description?**
A: Currently only name and code. Use status filter to narrow results.

**Q: How do I assign users to a role?**
A: That's done in the Users management page, not here. This page is only for role configuration.

**Q: What if two roles have the same name?**
A: That's allowed! Role codes must be unique, but names can match.

---

## Support

For issues or questions:

1. Check the documentation files:
   - `ROLE_MAPPING_REVAMP_COMPLETE.md`
   - `ROLE_MAPPING_IMPLEMENTATION_SUMMARY.md`
2. Review error messages (they're designed to be helpful)
3. Check browser console for technical errors
4. Contact your administrator

---

## What's New vs Old

| Feature              | Old     | New                 |
| -------------------- | ------- | ------------------- |
| Add Role             | ✓       | ✓✓ (Better UI)      |
| Edit Role            | ✗       | ✓                   |
| Delete Role          | ✓       | ✓ (Safer)           |
| Deactivate           | ✗       | ✓                   |
| Permissions          | ✗       | ✓ (26 permissions)  |
| Search               | Limited | ✓ (Name + Code)     |
| Filter               | ✗       | ✓ (Status)          |
| Sort                 | ✗       | ✓ (Multi-column)    |
| Pagination           | ✗       | ✓                   |
| Audit Info           | ✗       | ✓ (Created/Updated) |
| Confirmation Dialogs | ✗       | ✓                   |
| Validation           | ✗       | ✓ (With errors)     |
| Dark Theme           | ✗       | ✓                   |

---

## Version History

- **v1.0** (Current): Complete revamp with full CRUD, permissions, and improved UI
- **v0.1** (Previous): Basic role listing only

---

**Ready to go!** 🚀

Start managing roles like a pro. All features are production-ready.
