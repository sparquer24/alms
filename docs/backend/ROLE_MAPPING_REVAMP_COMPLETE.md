# Role Mapping Page - Complete Revamp Implementation

## Overview

The `/admin/roleMapping` page has been completely revamped with full backend integration, improved UI/UX, and comprehensive role management features. This document outlines all the changes made.

---

## Backend Enhancements

### 1. Roles Controller (`backend/src/modules/roles/roles.controller.ts`)

**New Endpoints:**

#### GET `/roles`
- Fetch all roles with advanced filtering
- **Query Parameters:**
  - `id`: Filter by specific role ID
  - `search`: Search by role name or code
  - `status`: Filter by status (`active`/`inactive`)
  - `page`: Page number for pagination (default: 1)
  - `limit`: Items per page (default: 10)
  - `sortBy`: Sort field (`name`, `code`, `created_at`, `updated_at`)
  - `sortOrder`: Sort direction (`asc`/`desc`)

#### GET `/roles/:id`
- Fetch a specific role by ID

#### POST `/roles`
- Create a new role
- **Request Body:**
  ```json
  {
    "name": "Inspector",
    "code": "inspector",  // auto-generated from name if not provided
    "dashboard_title": "Inspector Dashboard",
    "description": "Role for inspectors",
    "permissions": {},
    "can_forward": true,
    "can_FLAF": true,
    "can_generate_ground_report": true,
    "menu_items": ["userManagement", "reports"]
  }
  ```

#### PUT `/roles/:id`
- Update an existing role
- All fields are optional

#### DELETE `/roles/:id`
- Soft-delete a role (sets `is_active` to false)

#### PATCH `/roles/:id/deactivate`
- Deactivate a role

#### PATCH `/roles/:id/activate`
- Activate a role

### 2. Roles Service (`backend/src/modules/roles/roles.service.ts`)

**Key Features:**

- **Advanced Querying**: Supports filtering, searching, pagination, and sorting
- **Slug Generation**: Auto-generates URL-friendly role codes from role names
- **Validation**: Ensures unique role codes and validates required fields
- **Soft Delete**: Implements soft-delete pattern for data retention
- **Audit Trail**: Automatic tracking of `created_at` and `updated_at` timestamps

**Methods:**

```typescript
// Get roles with filtering and pagination
getRoles(params: GetRolesParams): Promise<{
  data: Roles[];
  total: number;
  page: number;
  limit: number;
}>

// Get single role by ID
getRoleById(id: number): Promise<Roles | null>

// Create new role
createRole(roleData: any): Promise<Roles>

// Update existing role
updateRole(id: number, roleData: any): Promise<Roles>

// Soft-delete role
deleteRole(id: number): Promise<Roles>

// Deactivate role
deactivateRole(id: number): Promise<Roles>

// Activate role
activateRole(id: number): Promise<Roles>
```

---

## Frontend Components

### 1. RoleTable Component (`frontend/src/components/admin/RoleTable.tsx`)

A reusable, sortable table component for displaying roles.

**Features:**
- ✅ Sortable columns (click headers to sort)
- ✅ Pagination controls
- ✅ Status badge (Active/Inactive)
- ✅ Audit info columns (Created, Updated)
- ✅ Action buttons (Edit, Delete, Activate/Deactivate, View Permissions)
- ✅ Loading and empty states
- ✅ Responsive design

**Props:**
```typescript
interface RoleTableProps {
  roles: Role[];
  isLoading?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (field: string) => void;
  onEdit?: (role: Role) => void;
  onDelete?: (role: Role) => void;
  onToggleStatus?: (role: Role) => void;
  onViewPermissions?: (role: Role) => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}
```

### 2. RoleFormModal Component (`frontend/src/components/admin/RoleFormModal.tsx`)

Modal for creating and editing roles.

**Features:**
- ✅ Form validation with error messages
- ✅ Auto-generation of role code (slug) from name
- ✅ Inline permission matrix
- ✅ Status toggle for existing roles
- ✅ Collapsible permissions section
- ✅ Create and Edit modes

**Fields:**
- Role Name (required)
- Role Code (auto-generated, unique)
- Dashboard Title (required)
- Description (optional)
- Status (Active/Inactive toggle)
- Permissions & Capabilities (expandable matrix)

### 3. PermissionMatrix Component (`frontend/src/components/admin/PermissionMatrix.tsx`)

Comprehensive permission management component.

**Features:**
- ✅ Organized permission categories:
  - Capabilities (can_forward, can_FLAF, can_generate_ground_report, etc.)
  - View Permissions (view forms, applications, reports, etc.)
  - Action Permissions (submit, forward, approve, reject, etc.)
- ✅ Select/deselect all permissions in a category
- ✅ Permission summary with count
- ✅ Read-only mode for viewing permissions
- ✅ Interactive checkboxes with visual feedback

**Permissions Included:**

**Capabilities:**
- can_forward: Forward applications
- can_FLAF: Fresh License Application Form access
- can_generate_ground_report: Generate ground reports
- can_re_enquiry: Conduct re-enquiries
- can_create_freshLicence: Create fresh licenses
- can_access_settings: Access system settings

**View Permissions:**
- canViewFreshForm: View fresh forms
- canViewForwarded: View forwarded applications
- canViewReturned: View returned applications
- canViewRedFlagged: View red-flagged applications
- canViewDisposed: View disposed applications
- canViewSent: View sent applications
- canViewFinalDisposal: View final disposal
- canViewReports: View reports

**Action Permissions:**
- canSubmitApplication: Submit applications
- canCaptureUIN: Capture UIN
- canCaptureBiometrics: Capture biometrics
- canUploadDocuments: Upload documents
- canForwardToACP/SHO/DCP/AS/CP: Forward to specific departments
- canConductEnquiry: Conduct enquiries
- canAddRemarks: Add remarks
- canApproveTA: Approve TA
- canApproveAI: Approve AI
- canReject: Reject applications
- canRequestResubmission: Request resubmission
- canGeneratePDF: Generate PDFs

### 4. ConfirmationDialog Component (`frontend/src/components/admin/ConfirmationDialog.tsx`)

Modal confirmation dialogs for destructive actions.

**Features:**
- ✅ Multiple dialog types (delete, deactivate, warning, info)
- ✅ Clear warning messages
- ✅ Cannot-undo warning for delete/deactivate
- ✅ Loading state during confirmation
- ✅ Customizable button text

**Usage:**
```typescript
setConfirmationDialog({
  isOpen: true,
  config: {
    title: 'Delete Role',
    message: 'Are you sure you want to delete this role?',
    type: 'delete',
    confirmText: 'Delete',
    onConfirm: async () => { /* handle delete */ },
  }
})
```

---

## Updated Role Mapping Page (`frontend/src/app/admin/roleMapping/page.tsx`)

### Features Implemented

#### 1. Full CRUD Operations
- **Create**: Add new roles with auto-generated codes
- **Read**: Fetch and display roles with advanced filtering
- **Update**: Edit existing roles and their permissions
- **Delete**: Soft-delete roles with confirmation

#### 2. Search & Filtering
- **Search**: Find roles by name or code
- **Status Filter**: Filter by Active/Inactive status
- **Dynamic Filtering**: Filters applied in real-time with pagination reset

#### 3. Sorting
- **Multi-column Sorting**: Sort by name, code, created_at, updated_at
- **Sort Direction**: Toggle between ascending/descending
- **Visual Indicators**: Arrow indicators show current sort field and direction

#### 4. Pagination
- **Page Navigation**: Previous/Next buttons
- **Page Info**: Display current page and total pages
- **Configurable Limit**: 10 items per page

#### 5. Audit Information
- **Created At**: Timestamp of role creation
- **Updated At**: Timestamp of last modification
- **Status**: Active/Inactive indicator with badge

#### 6. Confirmation Dialogs
- **Delete Confirmation**: Prevents accidental deletion
- **Deactivate Confirmation**: Prevents accidental deactivation
- **Cannot-Undo Warning**: Clear messaging about irreversible actions

#### 7. Error Handling
- **API Error Display**: Shows error alerts with retry option
- **Form Validation**: Client-side validation with error messages
- **Toast Notifications**: Success/error messages after actions

#### 8. Loading States
- **Table Loading**: Skeleton state while fetching data
- **Button Loading**: Visual feedback during save/delete operations
- **Mutation States**: Proper state management for all async operations

#### 9. UI/UX Improvements
- **Clean Card Layout**: Modern, organized interface
- **Consistent Spacing**: Uses design system tokens
- **Color-Coded Actions**: Different colors for different action types
  - Blue: Edit/Primary actions
  - Orange: Warnings
  - Red: Delete actions
  - Green: Activate actions
- **Responsive Design**: Works on all screen sizes
- **Dark/Light Theme Support**: Integrates with admin theme context

### State Management

Uses React Query for server state management:
- Query caching for improved performance
- Automatic refetching after mutations
- Error handling and retry logic
- Loading states for UI feedback

---

## Integration Points

### 1. API Service (`frontend/src/services/admin/roles.ts`)

Existing service methods used:
- `getRoles(params)`: Fetch roles with filters
- `createRole(data)`: Create new role
- `updateRole(id, data)`: Update role
- `deleteRole(id)`: Delete role

### 2. Admin Components (`frontend/src/components/admin/index.ts`)

All new components exported:
- `RoleTable`
- `RoleFormModal`
- `PermissionMatrix`
- `ConfirmationDialog`

### 3. Styling System

Uses design system tokens:
- `AdminSpacing`: Consistent spacing values
- `AdminBorderRadius`: Consistent border radius
- `AdminLayout`: Layout constants
- `AdminThemeContext`: Color theme support

---

## Usage Examples

### Creating a Role

1. Click "Create New Role" button
2. Fill in role name (code auto-generates)
3. Enter dashboard title
4. Add optional description
5. Click "Permissions & Capabilities" to expand
6. Select desired permissions
7. Click "Create Role"

### Editing a Role

1. Click "Edit" button on role row
2. Modify fields as needed
3. Update permissions if required
4. Click "Update Role"

### Deleting a Role

1. Click "Delete" button on role row
2. Confirm deletion in dialog
3. Role is soft-deleted

### Deactivating a Role

1. Click "Deactivate" button on role row
2. Confirm deactivation in dialog
3. Role status changes to Inactive

### Viewing Permissions

1. Click "Perms" button on role row
2. View all assigned permissions in read-only mode
3. Close modal

---

## Data Flow

```
User Action
    ↓
Page Handler (handleAddRole, handleEditRole, etc.)
    ↓
Form Modal (RoleFormModal)
    ↓
Form Validation
    ↓
API Call (AdminRoleService)
    ↓
Backend Endpoint (RolesController/RolesService)
    ↓
Prisma Database Query
    ↓
Response ↓ React Query
    ↓
Notification + Refetch
    ↓
Table Update (RoleTable)
```

---

## Error Handling

### Backend
- Validates required fields
- Checks for unique role codes
- Returns descriptive error messages
- Returns appropriate HTTP status codes

### Frontend
- Form validation with user-friendly messages
- API error display with retry option
- Toast notifications for all operations
- Fallback UI for loading/error states
- Error boundaries for component errors

---

## Performance Optimizations

- **React Query Caching**: Reduces unnecessary API calls
- **Pagination**: Limits data transfer and rendering
- **Lazy Rendering**: Components render only when visible
- **Memoization**: Prevents unnecessary re-renders
- **Debounced Search**: Reduces API calls during typing (in filter component)

---

## Future Enhancements

Possible improvements:
1. Bulk actions (delete/activate multiple roles)
2. Role duplication/templates
3. Permission dependency validation
4. Audit log for role changes
5. Role assignment to users
6. Custom permission creation
7. Export/import roles
8. Activity timeline

---

## Testing Checklist

- [ ] Create role with auto-generated code
- [ ] Edit existing role
- [ ] Delete role with confirmation
- [ ] Deactivate/activate role
- [ ] View permissions for role
- [ ] Search by role name
- [ ] Search by role code
- [ ] Filter by status
- [ ] Sort by different columns
- [ ] Pagination works correctly
- [ ] Form validation errors display
- [ ] Error states display correctly
- [ ] Success notifications appear
- [ ] Loading states show properly
- [ ] Modal closes on cancel
- [ ] Permission matrix selections persist
- [ ] Responsive design on mobile

---

## File Structure

```
backend/
├── src/modules/roles/
│   ├── roles.controller.ts (UPDATED)
│   ├── roles.service.ts (UPDATED)
│   └── roles.module.ts

frontend/
├── src/
│   ├── app/admin/roleMapping/
│   │   └── page.tsx (COMPLETELY REVAMPED)
│   ├── components/admin/
│   │   ├── RoleTable.tsx (NEW)
│   │   ├── RoleFormModal.tsx (NEW)
│   │   ├── PermissionMatrix.tsx (NEW)
│   │   ├── ConfirmationDialog.tsx (NEW)
│   │   └── index.ts (UPDATED)
│   └── services/admin/
│       └── roles.ts (EXISTING)
```

---

## Deployment Notes

1. Run database migrations if schema changes needed
2. Ensure new backend endpoints are deployed first
3. Clear React Query cache on frontend deployment
4. Test all CRUD operations in staging
5. Verify API authentication/authorization
6. Monitor error logs post-deployment

---

## API Response Format

### Get Roles Response

```json
{
  "data": [
    {
      "id": 1,
      "name": "Admin",
      "code": "admin",
      "dashboard_title": "Admin Dashboard",
      "description": "System administrator",
      "is_active": true,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-20T14:45:00Z",
      "permissions": {
        "can_forward": true,
        "can_FLAF": true,
        "canViewReports": true
      }
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 10
}
```

### Create/Update Role Response

```json
{
  "id": 3,
  "name": "Inspector",
  "code": "inspector",
  "dashboard_title": "Inspector Dashboard",
  "description": "Field inspector role",
  "is_active": true,
  "created_at": "2024-01-21T09:00:00Z",
  "updated_at": "2024-01-21T09:00:00Z",
  "permissions": {
    "can_generate_ground_report": true,
    "can_re_enquiry": true
  }
}
```

---

**Version**: 1.0.0  
**Last Updated**: January 21, 2024  
**Status**: Complete & Ready for Deployment
