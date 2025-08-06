# FLA Workflow Service Documentation

## Overview
This document describes the current implementation of the workflow logic for the Fresh License Application (FLA) process in the backend service. It covers the main workflow API, its purpose, usage, requirements, and details on how users can interact with it.

---

## What Has Been Done So Far
- Implemented a `WorkflowService` in the backend (`workflow.service.ts`) to handle workflow actions for license applications.
- The main method, `handleUserAction`, processes workflow actions such as forwarding, rejecting, or requesting a ground report for an application.
- The service updates application status, tracks user/role transitions, and logs workflow history for auditability.

---

## APIs Available
Currently, there is **one main API** for workflow actions:

### 1. `POST /workflow/action`
- **Purpose:** Allows authorized users to perform workflow actions (forward, reject, ground report) on a license application.
- **Service Method:** `handleUserAction`

#### What This API Does
- Fetches the application by ID.
- Validates the action type and user permissions.
- Updates the application's status, current/previous user and role, and remarks.
- Logs the action in the workflow history table.

---

## How to Call the API

### Endpoint
```
POST /workflow/action
```

### Request Body
```
{
  "applicationId": "string",         // Required: ID of the application
  "actionType": "forward" | "reject" | "ground_report", // Required: Action to perform
  "nextUserId": "string",            // Optional: Next user ID (required for 'forward')
  "remarks": "string",                // Required: Remarks for the action
  "currentUserId": "string",         // Required: ID of the user performing the action
  "currentRoleId": "string"          // Required: Role ID of the user performing the action
}
```

### Example Request
```
POST /workflow/action
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

{
  "applicationId": "abc123",
  "actionType": "forward",
  "nextUserId": "user456",
  "remarks": "Forwarding to next officer",
  "currentUserId": "user123",
  "currentRoleId": "2"
}
```

### Response
- Returns the updated application object on success.
- Throws appropriate errors for invalid actions, missing permissions, or not found.

---

## Requirements
- **Authentication:** JWT-based authentication is required. The user must be logged in and provide a valid token.
- **Authorization:** Only users with appropriate roles and permissions can perform certain actions. (Permission logic should be implemented as per business rules.)
- **Inputs:**
  - `applicationId` (string, required)
  - `actionType` (string, required: 'forward', 'reject', or 'ground_report')
  - `nextUserId` (string, required for 'forward')
  - `remarks` (string, required)
  - `currentUserId` (string, required)
  - `currentRoleId` (string, required)

---

## API Explanation

### `handleUserAction`
- **Purpose:** Handles workflow transitions for a license application.
- **Parameters:**
  - `applicationId`: The ID of the application to act on.
  - `actionType`: The workflow action ('forward', 'reject', 'ground_report').
  - `nextUserId`: The user ID to forward to (only for 'forward').
  - `remarks`: Remarks for the action.
  - `currentUserId`: The user performing the action.
  - `currentRoleId`: The role of the user performing the action.
- **Process:**
  1. Fetches the application by ID.
  2. Validates the action type and user permissions.
  3. Determines the new status and user/role assignments based on the action.
  4. Updates the application record.
  5. Logs the action in the workflow history table.
- **Returns:** The updated application object.
- **Errors:**
  - `NotFoundException` if the application does not exist.
  - `BadRequestException` for invalid action types.
  - `ForbiddenException` for unauthorized actions (permission logic to be implemented).
  - `InternalServerErrorException` for missing status codes or user/role issues.

---

## Notes
- The permission logic for who can perform which action is currently a placeholder and should be implemented as per business requirements.
- The workflow history is maintained for audit and traceability.
- The API is designed to be extensible for additional workflow actions in the future.

---

For further details, refer to the implementation in `backend/src/modules/FLAWorkflow/workflow.service.ts`.
