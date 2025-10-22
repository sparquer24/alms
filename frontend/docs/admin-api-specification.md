# Admin API Specification

This document provides a comprehensive reference for all backend endpoints required for the ADMIN role in the ALMS system. Each API is organized by feature/module.

---

## Flow Mapping

### 1. Save Flow Mapping

**Endpoint URL:** `/flow-mapping`

**HTTP Method:** POST

**Description:** Saves the flow mapping configuration for a specific user.

**Request Parameters:**

- **Path Params:** None
- **Query Params:** None

**Request Body:**
```json
{
  "currentUser": {
    "value": 1,
    "label": "Alice Johnson (Manager, New York)"
  },
  "nextUsers": [
    {
      "value": 2,
      "label": "Bob Smith (Developer, San Francisco)"
    },
    {
      "value": 3,
      "label": "Charlie Brown (Designer, Chicago)"
    }
  ]
}
```

**Response Format:**

- **Success Response:**
```json
{
  "message": "Flow mapping saved successfully."
}
```

- **Error Response:**
```json
{
  "error": "Failed to save flow mapping."
}
```

**Status Codes:**

- `200`: Flow mapping saved successfully.
- `400`: Invalid request body.
- `401`: Unauthorized access.
- `500`: Internal server error.

**Authorization:** Bearer Token

**Roles that can access:** ADMIN

---

## User Management

### 2. Get All Users

**Endpoint URL:** `/users`

**HTTP Method:** GET

**Description:** Retrieves a list of all users in the system.

**Request Parameters:**

- **Path Params:** None
- **Query Params:**
  - `role` (optional): Filter users by role.

**Request Body:** None

**Response Format:**

- **Success Response:**
```json
[
  {
    "id": 1,
    "name": "Alice Johnson",
    "role": "Manager",
    "office": "New York"
  },
  {
    "id": 2,
    "name": "Bob Smith",
    "role": "Developer",
    "office": "San Francisco"
  }
]
```

- **Error Response:**
```json
{
  "error": "Failed to retrieve users."
}
```

**Status Codes:**

- `200`: Users retrieved successfully.
- `400`: Invalid query parameters.
- `401`: Unauthorized access.
- `500`: Internal server error.

**Authorization:** Bearer Token

**Roles that can access:** ADMIN

---

### 3. Delete User

**Endpoint URL:** `/users/{id}`

**HTTP Method:** DELETE

**Description:** Deletes a user from the system.

**Request Parameters:**

- **Path Params:**
  - `id` (required): The ID of the user to delete.
- **Query Params:** None

**Request Body:** None

**Response Format:**

- **Success Response:**
```json
{
  "message": "User deleted successfully."
}
```

- **Error Response:**
```json
{
  "error": "Failed to delete user."
}
```

**Status Codes:**

- `200`: User deleted successfully.
- `400`: Invalid user ID.
- `401`: Unauthorized access.
- `404`: User not found.
- `500`: Internal server error.

**Authorization:** Bearer Token

**Roles that can access:** ADMIN

---

## Reports

### 4. Generate Report

**Endpoint URL:** `/reports/generate`

**HTTP Method:** POST

**Description:** Generates a report based on the provided criteria.

**Request Parameters:**

- **Path Params:** None
- **Query Params:** None

**Request Body:**
```json
{
  "reportType": "monthly",
  "startDate": "2025-06-01",
  "endDate": "2025-06-30"
}
```

**Response Format:**

- **Success Response:**
```json
{
  "message": "Report generated successfully.",
  "reportUrl": "https://example.com/reports/monthly-report.pdf"
}
```

- **Error Response:**
```json
{
  "error": "Failed to generate report."
}
```

**Status Codes:**

- `200`: Report generated successfully.
- `400`: Invalid request body.
- `401`: Unauthorized access.
- `500`: Internal server error.

**Authorization:** Bearer Token

**Roles that can access:** ADMIN

---

## Settings

### 5. Update Settings

**Endpoint URL:** `/settings`

**HTTP Method:** PUT

**Description:** Updates system settings.

**Request Parameters:**

- **Path Params:** None
- **Query Params:** None

**Request Body:**
```json
{
  "settingKey": "theme",
  "settingValue": "dark"
}
```

**Response Format:**

- **Success Response:**
```json
{
  "message": "Settings updated successfully."
}
```

- **Error Response:**
```json
{
  "error": "Failed to update settings."
}
```

**Status Codes:**

- `200`: Settings updated successfully.
- `400`: Invalid request body.
- `401`: Unauthorized access.
- `500`: Internal server error.

**Authorization:** Bearer Token

**Roles that can access:** ADMIN

---

This document will be updated as new APIs are added or existing ones are modified.
