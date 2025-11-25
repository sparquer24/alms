# Flow Mapping Page - Complete Implementation Guide

## Overview
The Flow Mapping page has been completely enhanced with role-based workflow mapping, circular dependency validation, workflow visualization, and full backend integration.

## 🎯 Completed Features

### ✅ 1. Backend Implementation

#### Database Model (Prisma Schema)
- **New Model: `RoleFlowMapping`**
  - `id`: Primary key
  - `currentRoleId`: Reference to current role (unique - one mapping per role)
  - `nextRoleIds`: Array of role IDs that can receive workflows
  - `updatedBy`: User ID who last updated the mapping
  - `updatedByUser`: Relationship to Users table (select user details)
  - `updatedAt`: Timestamp of last update
  - `createdAt`: Timestamp of creation

- **Updated Model: `Roles`**
  - Added `currentRoleFlowMappings`: Relationship to RoleFlowMapping (as current role)
  - Added `nextRoleFlowMappings`: Relationship to RoleFlowMapping (as next roles)

- **Updated Model: `Users`**
  - Added `flowMappingUpdates`: Relationship to RoleFlowMapping (who updated the mapping)

#### API Endpoints (Flow Mapping Controller)

1. **GET `/flow-mapping/:roleId`**
   - Retrieves flow mapping for a specific role
   - Returns current role details, next role IDs, and audit information
   - Returns empty mapping if not yet configured

2. **GET `/flow-mapping`**
   - Retrieves all flow mappings in the system
   - Includes role and user details

3. **PUT `/flow-mapping/:roleId`**
   - Creates or updates flow mapping for a role
   - Validates circular dependencies before saving
   - Updates audit information (updated_by, updated_at)

4. **POST `/flow-mapping`**
   - Creates a new flow mapping
   - Validates that role exists and next roles are valid

5. **POST `/flow-mapping/validate`**
   - Validates a proposed flow mapping without saving
   - Returns validation result and any circular dependency info
   - Used for client-side validation

6. **DELETE `/flow-mapping/:roleId`**
   - Removes flow mapping for a role

7. **GET `/flow-mapping/:roleId/next-roles`**
   - Gets the next roles that a given role can forward to
   - Useful for UI rendering of available forwards

8. **POST `/flow-mapping/:sourceRoleId/duplicate/:targetRoleId`**
   - Duplicates flow mapping from source role to target role
   - Validates for circular dependencies

9. **POST `/flow-mapping/:roleId/reset`**
   - Resets flow mapping (clears all next role IDs)
   - Useful for starting over

#### Circular Dependency Detection Algorithm
- **Algorithm**: Depth-First Search (DFS)
- **Process**:
  1. Create an adjacency map of all role-to-role flows
  2. Add the proposed new mapping to the map
  3. Perform DFS from the current role
  4. If we encounter a role that's in the recursion stack, a cycle is detected
  5. Return the cycle path (e.g., "1 → 2 → 3 → 1")
- **Returns**: Circle detection status and path if cycle exists

### ✅ 2. Frontend Components

#### Main Page Component (`/app/admin/flowMapping/page.tsx`)

**Features:**
- ✓ React Query integration for data fetching and mutations
- ✓ Real API integration (no mock data)
- ✓ Role-based mapping (select currentRole → choose multiple nextRoleIds)
- ✓ Form validation with error messages
- ✓ Circular dependency validation before saving
- ✓ Loading states and error handling
- ✓ Toast notifications for success/error/info

**State Management:**
- `currentRole`: Selected role that will forward applications
- `nextRoles`: Multiple roles that can receive from current role
- `formErrors`: Real-time validation errors
- `showDuplicateModal`: Controls duplicate mapping modal
- `duplicateSource`: Source role for duplication

**Mutations Implemented:**
1. **validateFlowMutation**: Validates mapping for circular dependencies
2. **saveFlowMappingMutation**: Saves the mapping to backend
3. **resetMappingMutation**: Resets mapping to empty
4. **duplicateMappingMutation**: Duplicates from another role

#### Workflow Visualization Component (`WorkflowGraphPreview.tsx`)

**Features:**
- Visual SVG-based diagram
- Current role shown in green (success color)
- Next roles shown in blue (info color)
- Arrows showing workflow direction
- Auto-positioning of nodes in circular arrangement
- Legend showing role types
- Responsive to theme colors

**Rendering:**
- Current role at center
- Next roles distributed in a circle around current role
- Animated arrows pointing from current to next roles
- Labels with role code and full name

### ✅ 3. UI/UX Improvements

#### Form Controls
- **React Select** for multi-select with theme support
- Clean, responsive layout using grid system
- Disabled states when loading or validation fails
- Real-time error display below inputs

#### Visual Components
- **Audit Block**: Shows when mapping was last updated and by whom
- **Workflow Diagram**: SVG preview of the flow
- **Status Cards**: Display current configuration status
- **Feature Cards**: Explain available features
- **Help Cards**: Guide users through the process

#### Responsive Design
- Grid-based card layout (auto-fit columns)
- Flex-based form fields
- Mobile-friendly button arrangement
- Proper spacing and typography

#### Theme Integration
- Uses `AdminTheme` context for colors
- Supports dark/light themes
- Consistent with admin dashboard design
- Proper contrast ratios

### ✅ 4. Features

**✓ Role-Based Workflow Mapping**
- Select current role that forwards applications
- Choose multiple next roles that can receive
- One mapping per role (unique constraint)

**✓ Circular Dependency Prevention**
- Real-time validation on form submission
- DFS algorithm detects cycles before saving
- User-friendly error messages
- Shows cycle path if detected

**✓ Workflow Visualization**
- SVG diagram showing role connections
- Color-coded nodes (green for current, blue for next)
- Directional arrows showing flow
- Legend and labels

**✓ Audit Trail**
- Tracks who updated the mapping (`updated_by`)
- Timestamp of last update (`updated_at`)
- User details in UI (name, email)
- Creation timestamp

**✓ Data Operations**
- **Duplicate Mapping**: Copy configuration from one role to another
- **Reset Mapping**: Clear all next roles for a configuration
- **View Existing**: Load and display current mapping
- **Delete**: Remove entire mapping

**✓ Form Validation**
- Check role selection
- Check next roles selection
- Prevent self-reference
- Real-time error display
- Validation messages

**✓ Error Handling**
- Toast notifications for all operations
- Loading states during API calls
- Graceful error messages
- Fallback UI states

## 🔧 Technical Details

### Backend Stack
- **Framework**: NestJS
- **Database**: PostgreSQL with Prisma
- **Validation**: class-validator, class-transformer
- **API Docs**: Swagger

### Frontend Stack
- **Framework**: Next.js 15
- **State Management**: React Query (TanStack Query)
- **UI Components**: Custom admin components
- **Form**: React Select
- **Notifications**: React Hot Toast
- **Styling**: Inline styles with theme system

### Data Flow

**Save Flow:**
1. User selects current role
2. Loads existing mapping or shows empty state
3. User selects multiple next roles
4. Form validation runs
5. Submit triggers validateFlowMutation
6. If valid, triggers saveFlowMappingMutation
7. API saves to database
8. Query cache invalidates
9. UI updates with new mapping

**Duplicate Flow:**
1. User selects source role (current mapping)
2. Clicks "Duplicate Mapping"
3. Modal opens to select target role
4. Submit triggers duplicateMappingMutation
5. Backend validates for circular dependencies
6. If valid, creates new mapping for target role
7. Cache invalidates and UI updates

## 📋 API Integration

### Environment Configuration
```
API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
```

### Endpoints Used

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/roles` | Fetch all available roles |
| GET | `/flow-mapping/:roleId` | Get mapping for role |
| PUT | `/flow-mapping/:roleId` | Save/update mapping |
| POST | `/flow-mapping/validate` | Validate mapping |
| POST | `/flow-mapping/:roleId/reset` | Reset mapping |
| POST | `/flow-mapping/:sourceId/duplicate/:targetId` | Duplicate mapping |

## 🔐 Security & Validation

### Backend Validation
- Role existence verification
- Role ID array validation
- Circular dependency detection
- Unique constraint on currentRoleId

### Frontend Validation
- Form field requirements
- Self-reference prevention
- Role availability checking
- Error boundary for crash protection

## 📊 Data Models

### FlowMapping Response
```typescript
{
  id: number | null,
  currentRoleId: number,
  currentRole: {
    id: number,
    name: string,
    code: string,
    is_active: boolean
  },
  nextRoleIds: number[],
  updatedBy: number | null,
  updatedByUser: {
    id: number,
    username: string,
    email: string
  } | null,
  updatedAt: string | null,
  createdAt: string | null
}
```

### API Response Format
```typescript
{
  success: boolean,
  data?: any,
  message?: string
}
```

## 🚀 Deployment Notes

1. **Database Migration Required**
   - Run Prisma migration to add RoleFlowMapping model
   ```bash
   npx prisma migrate dev --name add_flow_mapping
   ```

2. **Backend Setup**
   - Module automatically included in AppModule
   - Controller endpoints are ready
   - No additional configuration needed

3. **Frontend Setup**
   - Component uses environment variable for API URL
   - React Select styling integrated with theme
   - No additional packages needed (all installed)

## 🧪 Testing Scenarios

1. **Happy Path**
   - Select role A
   - Select roles B, C as next
   - Save successfully

2. **Circular Detection**
   - Setup A → B → C
   - Try to add C → A
   - Should show circular dependency error

3. **Self-Reference**
   - Select role A
   - Try to add A to next roles
   - Should show validation error

4. **Duplicate**
   - Copy mapping from role A to role B
   - Both should have same next roles

5. **Reset**
   - Setup mapping
   - Click reset
   - Confirm dialog appears
   - Mapping cleared

## 📝 File Structure

```
backend/
  src/
    modules/
      flowMapping/
        dto/
          flow-mapping.dto.ts      # DTOs for validation
        flow-mapping.controller.ts  # API endpoints
        flow-mapping.service.ts     # Business logic
        flow-mapping.module.ts      # Module definition

frontend/
  src/
    app/
      admin/
        flowMapping/
          page.tsx                  # Main page component
    components/
      admin/
        WorkflowGraphPreview.tsx    # Visualization component
        index.ts                    # Component exports
```

## ✨ Key Improvements Over Original

1. **From Mock to Real Data**: Replaced hardcoded users with actual role data from API
2. **User-Level to Role-Level**: Changed from user-based to role-based mapping
3. **Simple to Complex**: Added circular dependency detection
4. **No Visualization**: Added workflow diagram preview
5. **No Audit**: Added update tracking with user info
6. **Limited UI**: Enhanced with react-select, better errors, cards
7. **One Operation**: Added duplicate and reset operations
8. **No Validation**: Comprehensive form validation
9. **No Error Handling**: Full error handling with toasts

## 🎨 UI/UX Enhancements

- Card-based layout for better organization
- Color-coded roles in visualization
- Clear visual hierarchy with headings
- Responsive grid layout
- Proper spacing and typography
- Loading states and disabled states
- Inline error messages
- Toast notifications
- Modal for duplicate operation
- Helpful guide cards

## 🔄 Next Steps (Optional)

1. Add role groups/hierarchy support
2. Add workflow templates
3. Add bulk mapping operations
4. Add mapping history/audit log view
5. Add mapping export/import
6. Add role-based access control to endpoints
7. Add rate limiting
8. Add caching layer

---

**Status**: ✅ Complete and Ready for Integration
**Last Updated**: November 21, 2025
