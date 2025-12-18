# Flow Mapping - Architecture & Visual Overview

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       FRONTEND (Next.js)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │ /admin/flowMapping/page.tsx                               │   │
│  │ ├─ Role Selection (react-select)                         │   │
│  │ ├─ Next Roles Multi-Select                              │   │
│  │ ├─ Form Validation                                       │   │
│  │ ├─ Circular Dependency Check                            │   │
│  │ └─ Toast Notifications                                   │   │
│  └───────────────────────────────────────────────────────────┘   │
│                              ↓ API Calls                         │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │ React Query (TanStack Query)                              │   │
│  │ ├─ useQuery: Fetch roles, fetch mapping                 │   │
│  │ └─ useMutation: Save, validate, reset, duplicate        │   │
│  └───────────────────────────────────────────────────────────┘   │
│                              ↓ HTTP                              │
└─────────────────────────────────────────────────────────────────┘
                             HTTP
              ┌──────────────────────────────┐
              │ REST API Endpoints           │
              │ http://localhost:3001/api/   │
              └──────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (NestJS)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │ FlowMappingController                                     │   │
│  │ ├─ GET /flow-mapping/:roleId                            │   │
│  │ ├─ PUT /flow-mapping/:roleId                            │   │
│  │ ├─ POST /flow-mapping                                    │   │
│  │ ├─ POST /flow-mapping/validate                          │   │
│  │ ├─ POST /flow-mapping/:roleId/reset                     │   │
│  │ ├─ POST /flow-mapping/:src/duplicate/:tgt              │   │
│  │ ├─ GET /flow-mapping/:roleId/next-roles                │   │
│  │ └─ DELETE /flow-mapping/:roleId                         │   │
│  └───────────────────────────────────────────────────────────┘   │
│                              ↓                                    │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │ FlowMappingService                                        │   │
│  │ ├─ getFlowMapping()                                      │   │
│  │ ├─ createOrUpdateFlowMapping()                           │   │
│  │ ├─ validateFlowMapping()                                 │   │
│  │ ├─ detectCircularDependency() ⭐ (DFS Algorithm)        │   │
│  │ ├─ duplicateFlowMapping()                                │   │
│  │ ├─ resetFlowMapping()                                    │   │
│  │ └─ deleteFlowMapping()                                   │   │
│  └───────────────────────────────────────────────────────────┘   │
│                              ↓                                    │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │ Prisma Client (ORM)                                       │   │
│  └───────────────────────────────────────────────────────────┘   │
│                              ↓ SQL Queries                       │
└─────────────────────────────────────────────────────────────────┘
                         SQL
         ┌────────────────────────────────┐
         │   PostgreSQL Database          │
         │                                │
         │ Tables:                        │
         │ ├─ RoleFlowMapping (NEW)      │
         │ ├─ Roles                       │
         │ └─ Users                       │
         └────────────────────────────────┘
```

---

## 📊 Data Flow Diagram

### Save Flow
```
User Input
    ↓
Role Selection
    ↓
Next Roles Selection
    ↓
Form Validation ✓
    ↓
Validate API Call (check circular)
    ↓ Valid?
Save API Call (PUT /flow-mapping/:roleId)
    ↓
Database Update
    ↓
React Query Cache Invalidation
    ↓
UI Refresh with New Data
    ↓
Success Toast
```

### Circular Dependency Detection Flow
```
Proposed Mapping: A → [B, C]

Get All Existing Mappings
    ↓
Create Adjacency Map
    ↓
Add Proposed Mapping
    ↓
DFS from Role A
    ├─ Visit B
    │  ├─ Visit B's next roles
    │  └─ Track recursion stack
    ├─ Visit C
    │  └─ Track recursion stack
    └─ Check if A appears in stack
       
If A found in stack → Cycle detected! ❌
If A not found → Valid mapping ✓
```

---

## 🗄️ Database Schema

### RoleFlowMapping Table
```
┌─────────────────────────────────┐
│    RoleFlowMapping              │
├─────────────────────────────────┤
│ id              INT (PK)        │ ← Primary Key
│ currentRoleId   INT (FK, UNIQ)  │ ← Foreign Key to Roles
│ nextRoleIds     INT[]           │ ← PostgreSQL Array
│ updatedBy       INT (FK, NULL)  │ ← Foreign Key to Users
│ updatedAt       TIMESTAMP       │ ← Auto-updated
│ createdAt       TIMESTAMP       │ ← Auto-set
└─────────────────────────────────┘
        ↓ Relationships ↓
    ┌───────────────┐        ┌──────────────┐
    │   Roles       │        │    Users     │
    ├───────────────┤        ├──────────────┤
    │ id (PK)       │        │ id (PK)      │
    │ name          │        │ username     │
    │ code          │        │ email        │
    │ ...           │        │ ...          │
    └───────────────┘        └──────────────┘
```

### Relationships
```
Roles (1) ──→ RoleFlowMapping (1)    One role = one mapping (unique)
                     ↓
              RoleFlowMapping (M) ──→ Users (1)    Many mappings can be updated by one user
```

---

## 🎨 UI Component Hierarchy

```
FlowMappingPage
├─ AdminToolbar (sticky header)
│  └─ Title & Description
│
├─ AdminCard (Main Form)
│  ├─ Current Role Selection
│  │  └─ React Select Component
│  │
│  ├─ Next Roles Multi-Select
│  │  └─ React Select Component (isMulti)
│  │
│  ├─ WorkflowGraphPreview (SVG Diagram)
│  │  ├─ Current Role Node (Green)
│  │  ├─ Next Role Nodes (Blue)
│  │  ├─ Arrows
│  │  └─ Legend
│  │
│  ├─ Audit Information Block
│  │  ├─ Last Updated
│  │  └─ Updated By
│  │
│  └─ Action Buttons
│     ├─ Save Mapping (Primary)
│     ├─ Reset Mapping (Danger)
│     ├─ Duplicate Mapping (Info)
│     └─ Clear All (Secondary)
│
├─ Duplicate Modal (When Active)
│  ├─ Target Role Selection
│  ├─ Cancel Button
│  └─ Duplicate Button
│
└─ Information Cards (Bottom)
   ├─ How It Works
   ├─ Features
   └─ Current Status
```

---

## 🔄 State Management

### React Component State
```typescript
const [currentRole, setCurrentRole]                    // Selected role
const [nextRoles, setNextRoles]                        // Multi-selected roles
const [duplicateSource, setDuplicateSource]            // For duplicate operation
const [showDuplicateModal, setShowDuplicateModal]      // Modal visibility
const [formErrors, setFormErrors]                      // Validation errors
```

### React Query State
```typescript
// Queries (Fetching Data)
const { data: allRoles }              // All available roles
const { data: currentFlowMapping }    // Current role's mapping

// Mutations (Changing Data)
const validateFlowMutation            // Validate for cycles
const saveFlowMappingMutation         // Save mapping
const resetMappingMutation            // Reset mapping
const duplicateMappingMutation        // Duplicate mapping
```

---

## 🔐 Validation Layers

### Layer 1: Frontend Form Validation
```
User Input
    ↓
├─ Current role required? ✓
├─ Next roles selected? ✓
├─ Self-reference check? ✓
└─ Field-level errors? ✓
    ↓ All pass?
API Call
```

### Layer 2: API Validation (DTOs)
```
Request Body
    ↓
├─ currentRoleId is integer? ✓
├─ nextRoleIds is array? ✓
├─ nextRoleIds has min 1 item? ✓
├─ All items are integers? ✓
└─ Unknown fields rejected? ✓
    ↓ All pass?
Service Logic
```

### Layer 3: Business Logic Validation
```
Service Function
    ↓
├─ Role exists in database? ✓
├─ All next roles exist? ✓
├─ Circular dependency check ✓ (DFS)
└─ Unique constraint check? ✓
    ↓ All pass?
Database Update
```

---

## 🎯 Use Case Flows

### Use Case 1: Create New Mapping
```
START
  ↓
[User selects role]
  ↓
[System loads existing mapping or shows empty]
  ↓
[User selects multiple next roles]
  ↓
[User clicks Save]
  ↓
Form Validation → ✓
  ↓
API Validation → ✓
  ↓
Circular Check → ✓ (No cycle)
  ↓
Save to Database
  ↓
Invalidate Query Cache
  ↓
Reload UI with new data
  ↓
Show Success Toast
  ↓
END
```

### Use Case 2: Circular Dependency Detected
```
START
  ↓
[User tries to create circular mapping]
  ↓
Form passes validation
  ↓
Validate API Call
  ↓
DFS Algorithm runs
  ↓
❌ Cycle detected: A → B → C → A
  ↓
Return validation error
  ↓
Frontend receives error
  ↓
Show Error Toast with cycle path
  ↓
Prevent save
  ↓
END
```

### Use Case 3: Duplicate Mapping
```
START
  ↓
[User has existing mapping on Role A]
  ↓
[User clicks Duplicate Mapping]
  ↓
[Modal shows: copy from A to which role?]
  ↓
[User selects Role B]
  ↓
[User clicks Duplicate]
  ↓
Get Role A's mapping
  ↓
Validate Role B doesn't create cycle
  ↓
Create new mapping for Role B
  ↓
Both roles now have same next roles
  ↓
Show Success Toast
  ↓
END
```

---

## 📈 Performance Considerations

### Database Query Performance
```
Operation                    Complexity    Typical Time
─────────────────────────────────────────────────────
Get mapping                  O(1)          < 10ms
Get all mappings             O(n)          < 50ms (n=role count)
Circular check (DFS)         O(n + m)      < 100ms (m=mapping count)
Save mapping                 O(1)          < 20ms
Delete mapping               O(1)          < 10ms
```

### Frontend Performance
```
Component              Size (Bundle)    Render Time
──────────────────────────────────────────────────
WorkflowGraphPreview   ~2KB            < 5ms
Page Component         ~8KB            < 20ms
React Select           ~48KB (total)   < 10ms
Total Impact           ~50KB added
```

---

## 🔌 Integration Points

### Backend Integration
```
FlowMappingModule
    ├─ Registers in AppModule
    ├─ Provides endpoints
    ├─ Uses PrismaService
    └─ Exposes FlowMappingService
```

### Frontend Integration
```
flowMapping/page.tsx
    ├─ Uses AdminTheme
    ├─ Uses Admin Components
    ├─ Uses React Query
    ├─ Uses WorkflowGraphPreview
    └─ Calls /api/flow-mapping endpoints
```

### Theme Integration
```
useAdminTheme()
    ├─ colors.text.primary
    ├─ colors.text.secondary
    ├─ colors.border
    ├─ colors.background
    ├─ colors.status.success
    ├─ colors.status.info
    ├─ colors.status.error
    └─ Applied to all components
```

---

## 🧪 Testing Strategy

### Unit Tests (Backend)
```
FlowMappingService
├─ Test: getFlowMapping() returns correct data
├─ Test: Circular dependency detection works
├─ Test: Invalid roles rejected
├─ Test: Validation rejects self-reference
└─ Test: Duplicate creates correct mapping
```

### Integration Tests (Frontend)
```
FlowMappingPage
├─ Test: Roles load from API
├─ Test: Form validation works
├─ Test: Save sends correct data
├─ Test: Error messages display
└─ Test: Workflow diagram renders
```

### E2E Tests
```
User Journey
├─ Load page
├─ Select role
├─ Select next roles
├─ Submit form
├─ Verify success
└─ Verify data persisted
```

---

## 📋 API Contract

### Request/Response Examples

**Save Mapping**
```
PUT /flow-mapping/1

Request:
{
  "nextRoleIds": [2, 3],
  "updatedBy": 5
}

Response:
{
  "success": true,
  "message": "Flow mapping updated successfully",
  "data": { ... }
}
```

**Validate Mapping**
```
POST /flow-mapping/validate

Request:
{
  "currentRoleId": 1,
  "nextRoleIds": [2, 3]
}

Response:
{
  "success": true,
  "data": {
    "isValid": true,
    "hasCircularDependency": false,
    "circlePath": null,
    "message": "Flow mapping is valid"
  }
}
```

---

## 🎓 Design Patterns Used

### Backend
- **Service Pattern**: Business logic in service layer
- **DTO Pattern**: Data validation with DTOs
- **Repository Pattern**: Prisma as ORM
- **Error Handling**: HTTP exceptions with proper status codes

### Frontend
- **Custom Hooks**: useQuery, useMutation from React Query
- **Component Composition**: Reusable admin components
- **State Lifting**: Form state managed at page level
- **Separation of Concerns**: API calls in mutations

### Algorithm
- **DFS Algorithm**: Detects cycles in graph
- **Adjacency List**: Efficient graph representation

---

## 🚀 Deployment Checklist

```
Pre-Deployment
├─ Database migration tested
├─ API endpoints verified
├─ Frontend loads without errors
├─ All validations working
├─ Error handling tested
└─ Performance acceptable

Deployment
├─ Run Prisma migration
├─ Build backend
├─ Build frontend
├─ Start services
├─ Run smoke tests
└─ Verify endpoints accessible

Post-Deployment
├─ Monitor API response times
├─ Check error logs
├─ Verify data persistence
├─ Test all operations
└─ Gather user feedback
```

---

**Architecture Complete ✨**

This system is designed for reliability, maintainability, and scalability.
