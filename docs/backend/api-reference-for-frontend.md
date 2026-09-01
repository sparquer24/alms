# ALMS Backend API Reference for Frontend Developers

This document provides a consolidated reference of all backend API endpoints, required payloads, parameters, and response formats for the ALMS project. Use this as a guide for frontend integration.

---

## Basics

**Base URL:**

```
https://api.example.com
```

**Common Headers:**

| Header           | Value Example                                 |
|------------------|-----------------------------------------------|
| Content-Type     | application/json                              |
| Authorization    | Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... |

**Sample:**

```http
GET /api/auth/getMe HTTP/1.1
Host: api.example.com
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Status Codes Reference

| Status | Meaning                        |
|--------|---------------------------------|
| 200    | OK / Success                    |
| 400    | Bad Request                     |
| 401    | Unauthorized                    |
| 403    | Forbidden                       |
| 404    | Not Found                       |
| 409    | Conflict (e.g., duplicate data) |
| 500    | Internal Server Error           |

---

## Authentication

### Login
- **POST** `/api/auth/login`

#### Request Body

| Field     | Type   | Required | Format/Notes         |
|-----------|--------|----------|----------------------|
| username  | string | Yes      |                      |
| password  | string | Yes      |                      |

**Example:**
```json
{
  "username": "adminuser",
  "password": "MySecretPass123"
}
```

#### Success Response
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "user": {
    "id": "user123",
    "username": "adminuser",
    "roles": ["admin"]
  }
}
```

#### Error Responses
| Status | Example Message                |
|--------|-------------------------------|
| 400    | "Missing username or password"|
| 401    | "Invalid credentials"         |
| 500    | "Internal server error"       |

### Get Profile
- **GET** `/api/auth/getMe`
- **Headers:**
  - `Authorization: Bearer <token>`

#### Success Response
```json
{
  "id": "user123",
  "username": "adminuser",
  "roles": ["admin"]
}
```

#### Error Responses
| Status | Example Message         |
|--------|------------------------|
| 401    | "Unauthorized"         |

### Verify Token
- **GET** `/api/auth/verify`
- **Headers:** `Authorization: Bearer <token>`
- **Success Response:**
  ```json
  { "valid": true, "user": { ... } }
  ```
- **Error Responses:**
  - 401 Unauthorized

---

## User Management

### Create User
- **POST** `/api/users`

#### Request Body Fields
| Field      | Type    | Required | Format/Notes                |
|------------|---------|----------|-----------------------------|
| username   | string  | Yes      |                             |
| password   | string  | Yes      |                             |
| email      | string  | Yes      | Valid email                 |
| role       | string  | Yes      | e.g., "admin", "user"      |
| fullName   | string  | No       |                             |
| phone      | string  | No       |                             |

**Example:**
```json
{
  "username": "john.doe",
  "password": "Password123!",
  "email": "john.doe@example.com",
  "role": "user",
  "fullName": "John Doe",
  "phone": "+91-9876543210"
}
```

#### Success Response
```json
{
  "success": true,
  "data": {
    "id": "user456",
    "username": "john.doe",
    "email": "john.doe@example.com",
    "role": "user",
    "fullName": "John Doe",
    "phone": "+91-9876543210"
  }
}
```

#### Error Responses
| Status | Example Message                |
|--------|-------------------------------|
| 400    | "Invalid email format"        |
| 401    | "Unauthorized"                |
| 404    | "Role not found"              |
| 500    | "Internal server error"       |

### Get Users
- **GET** `/api/users?role=roleName&page=1&limit=10`

#### Query Parameters
| Param   | Type   | Required | Description                  |
|---------|--------|----------|------------------------------|
| role    | string | No       | Filter by role               |
| page    | number | No       | Page number (default: 1)     |
| limit   | number | No       | Items per page (default: 10) |

#### Success Response
```json
{
  "success": true,
  "data": [
    {
      "id": "user456",
      "username": "john.doe",
      "role": "user"
    },
    ...
  ],
  "page": 1,
  "limit": 10,
  "total": 50
}
```

#### Error Responses
| Status | Example Message         |
|--------|------------------------|
| 400    | "Invalid query params" |
| 401    | "Unauthorized"         |
| 404    | "Role not found"       |
| 500    | "Internal server error"|

---

## Application Form

### Create Application
- **POST** `/api/application-form`

#### Request Body Fields
| Field                | Type    | Required | Format/Notes                |
|----------------------|---------|----------|-----------------------------|
| applicantName        | string  | Yes      |                             |
| aadharNumber         | string  | Yes      | 12-digit string             |
| dob                  | string  | Yes      | YYYY-MM-DD                  |
| address              | string  | Yes      |                             |
| stateId              | number  | Yes      |                             |
| districtId           | number  | Yes      |                             |
| policeStationId      | number  | Yes      |                             |
| phone                | string  | Yes      |                             |
| email                | string  | No       |                             |
| ...other fields...   | ...     | ...      |                             |

**Example:**
```json
{
  "applicantName": "Ravi Kumar",
  "aadharNumber": "123456789012",
  "dob": "1990-01-15",
  "address": "123 Main Street, Hyderabad",
  "stateId": 1,
  "districtId": 10,
  "policeStationId": 5,
  "phone": "+91-9876543210",
  "email": "ravi.kumar@example.com"
}
```

#### Success Response
```json
{
  "success": true,
  "message": "Arms License Application created successfully",
  "data": {
    "id": "app789",
    "applicantName": "Ravi Kumar",
    "status": "Pending",
    ...other fields...
  }
}
```

#### Error Responses
| Status | Example Message                        |
|--------|---------------------------------------|
| 409    | "Duplicate aadhar number"             |
| 400    | "Invalid data"                        |
| 500    | "Internal server error"               |

### Get All Applications
- **GET** `/api/application-form`

#### Query Parameters
| Param   | Type   | Required | Description                  |
|---------|--------|----------|------------------------------|
| page    | number | No       | Page number (default: 1)     |
| limit   | number | No       | Items per page (default: 10) |
| status  | string | No       | Filter by status             |

**Example:**
```
GET /api/application-form?page=2&limit=5&status=Pending
```

#### Success Response
```json
{
  "success": true,
  "message": "Applications retrieved successfully",
  "data": [
    {
      "id": "app789",
      "applicantName": "Ravi Kumar",
      "status": "Pending"
    },
    ...
  ],
  "page": 2,
  "limit": 5,
  "total": 23
}
```

#### Error Response
| Status | Example Message         |
|--------|------------------------|
| 400    | "Invalid query params" |

### Get Application by ID
- **GET** `/api/application-form/:id`

#### Success Response
```json
{
  "success": true,
  "message": "Application retrieved successfully",
  "data": {
    "id": "app789",
    "applicantName": "Ravi Kumar",
    "status": "Pending",
    ...other fields...
  }
}
```

#### Error Responses
| Status | Example Message         |
|--------|------------------------|
| 404    | "Application not found"|
| 403    | "Access denied"        |
| 400    | "Invalid ID"           |

### Helpers
- **GET** `/api/application-form/helpers/states` — List of states
  - **Success Response:**
    ```json
    { "success": true, "message": "States retrieved successfully", "data": [ ... ] }
    ```
  - **Error Response:**
    - 400 Bad Request

- **GET** `/api/application-form/helpers/districts/:stateId` — Districts for a state
  - **Success Response:**
    ```json
    { "success": true, "message": "Districts retrieved successfully", "data": [ ... ] }
    ```
  - **Error Response:**
    - 400 Bad Request

- **GET** `/api/application-form/helpers/police-stations/:divisionId` — Police stations for a division
  - **Success Response:**
    ```json
    { "success": true, "message": "Police stations retrieved successfully", "data": [ ... ] }
    ```
  - **Error Response:**
    - 400 Bad Request

- **GET** `/api/application-form/helpers/validate-ids` — Validate IDs
  - **Success Response:**
    ```json
    { "success": true, "message": "ID validation completed", "data": { ... } }
    ```
  - **Error Response:**
    - 400 Bad Request

- **GET** `/api/application-form/helpers/check-aadhar/:aadharNumber` — Check Aadhar existence
  - **Success Response:**
    ```json
    { "success": true, "message": "Aadhar number already exists in system", "data": { "exists": true } }
    ```
    or
    ```json
    { "success": true, "message": "Aadhar number is available", "data": { "exists": false } }
    ```
  - **Error Response:**
    - 400 Bad Request

---

## Locations

### Get States
- **GET** `/api/locations/states`
  - **Success Response:**
    ```json
    { "success": true, "message": "States retrieved successfully", "data": [ ... ], "count": 2 }
    ```
  - **Error Responses:**
    - 400 Bad Request
    - 401 Unauthorized
    - 404 Not Found
    - 500 Internal Server Error

- **GET** `/api/locations/states/:id`
  - **Success Response:**
    ```json
    { "success": true, "message": "State retrieved successfully", "data": { ... } }
    ```
  - **Error Responses:**
    - 400 Bad Request
    - 401 Unauthorized
    - 404 Not Found
    - 500 Internal Server Error

### Get Districts
- **GET** `/api/locations/districts?stateId=1`
  - **Success Response:**
    ```json
    { "success": true, "message": "Districts retrieved successfully", "data": [ ... ] }
    ```
  - **Error Responses:**
    - 400 Bad Request
    - 401 Unauthorized
    - 404 Not Found
    - 500 Internal Server Error

- **GET** `/api/locations/districts/:id`
  - **Success Response:**
    ```json
    { "success": true, "message": "District retrieved successfully", "data": { ... } }
    ```
  - **Error Responses:**
    - 400 Bad Request
    - 401 Unauthorized
    - 404 Not Found
    - 500 Internal Server Error

### Get Zones
- **GET** `/api/locations/zones?districtId=1`
  - **Success Response:**
    ```json
    { "success": true, "message": "Zones retrieved successfully", "data": [ ... ] }
    ```
  - **Error Responses:**
    - 400 Bad Request
    - 401 Unauthorized
    - 404 Not Found
    - 500 Internal Server Error

- **GET** `/api/locations/zones/:id`
  - **Success Response:**
    ```json
    { "success": true, "message": "Zone retrieved successfully", "data": { ... } }
    ```
  - **Error Responses:**
    - 400 Bad Request
    - 401 Unauthorized
    - 404 Not Found
    - 500 Internal Server Error

### Get Divisions
- **GET** `/api/locations/divisions?zoneId=1`
  - **Success Response:**
    ```json
    { "success": true, "message": "Divisions retrieved successfully", "data": [ ... ] }
    ```
  - **Error Responses:**
    - 400 Bad Request
    - 401 Unauthorized
    - 404 Not Found
    - 500 Internal Server Error

- **GET** `/api/locations/divisions/:id`
  - **Success Response:**
    ```json
    { "success": true, "message": "Division retrieved successfully", "data": { ... } }
    ```
  - **Error Responses:**
    - 400 Bad Request
    - 401 Unauthorized
    - 404 Not Found
    - 500 Internal Server Error

### Get Police Stations
- **GET** `/api/locations/police-stations?divisionId=1`
  - **Success Response:**
    ```json
    { "success": true, "message": "Police stations retrieved successfully", "data": [ ... ] }
    ```
  - **Error Responses:**
    - 400 Bad Request
    - 401 Unauthorized
    - 404 Not Found
    - 500 Internal Server Error

- **GET** `/api/locations/police-stations/:id`
  - **Success Response:**
    ```json
    { "success": true, "message": "Police station retrieved successfully", "data": { ... } }
    ```
  - **Error Responses:**
    - 400 Bad Request
    - 401 Unauthorized
    - 404 Not Found
    - 500 Internal Server Error

### Get Location Hierarchy
- **GET** `/api/locations/hierarchy`
  - **Success Response:**
    ```json
    { "success": true, "message": "Location hierarchy retrieved successfully", "data": [ ... ] }
    ```
  - **Error Responses:**
    - 400 Bad Request
    - 401 Unauthorized
    - 404 Not Found
    - 500 Internal Server Error

---

## Workflow


### Workflow Action
- **POST** `/api/workflow/action`

#### Request Body Fields
| Field          | Type    | Required | Format/Notes                                 |
|----------------|---------|----------|----------------------------------------------|
| applicationId  | string  | Yes      |                                              |
| actionType     | string  | Yes      | See Action Types below                       |
| nextUserId     | string  | Sometimes| Required for forward/assign actions          |
| remarks        | string  | No       |                                              |
| attachments    | array   | No       | See below                                    |
| currentUserId  | string  | Yes      |                                              |
| currentRoleId  | string  | Yes      |                                              |

**Attachment Object:**
| Field        | Type   | Required | Notes                |
|--------------|--------|----------|----------------------|
| name         | string | Yes      |                      |
| type         | string | Yes      | e.g., "photo", "report"|
| contentType  | string | Yes      | MIME type            |
| url          | string | Yes      |                      |

#### Example Request (Forward with Attachments)
```json
{
  "applicationId": "abc123",
  "actionType": "forward",
  "nextUserId": "user456",
  "remarks": "Forwarding to next officer for review.",
  "attachments": [
    {
      "name": "police_report.pdf",
      "type": "report",
      "contentType": "application/pdf",
      "url": "https://alms-files.s3.amazonaws.com/police_report_abc123.pdf"
    },
    {
      "name": "applicant_photo.jpg",
      "type": "photo",
      "contentType": "image/jpeg",
      "url": "https://alms-files.s3.amazonaws.com/applicant_photo_abc123.jpg"
    }
  ],
  "currentUserId": "user123",
  "currentRoleId": "2"
}
```

#### Example Success Response
```json
{
  "success": true,
  "message": "Action completed successfully",
  "data": {
    "id": "abc123",
    "statusId": 3,
    "currentUserId": "user456",
    "previousUserId": "user123",
    "remarks": "Forwarding to next officer for review.",
    "attachments": [
      {
        "name": "police_report.pdf",
        "type": "report",
        "contentType": "application/pdf",
        "url": "https://alms-files.s3.amazonaws.com/police_report_abc123.pdf"
      },
      {
        "name": "applicant_photo.jpg",
        "type": "photo",
        "contentType": "image/jpeg",
        "url": "https://alms-files.s3.amazonaws.com/applicant_photo_abc123.jpg"
      }
    ],
    "updatedAt": "2025-08-11T06:30:00.000Z"
    // ...other application fields
  }
}
```

#### Action Types Guide

| actionType   | When to Use                                 |
|--------------|---------------------------------------------|
| forward      | Move application to next user/role          |
| approve      | Approve the application                     |
| reject       | Reject the application                      |
| assign       | Assign to a specific user                   |
| revert       | Send back to previous user/role             |
| request-info | Request additional information/clarification|

**Note:**
- `nextUserId` is required for `forward` and `assign` actions.
- Attachments must include all required fields.

#### Error Responses
| Status | Example Message                                 |
|--------|------------------------------------------------|
| 404    | "Application not found"                        |
| 400    | "Invalid action type: not found in Actions table."|
| 400    | "Each attachment must have name, type, contentType, and url."|
| 403    | "Access denied"                                |
| 500    | "Internal server error"                        |

---

## Error Handling Tips

| Status | Frontend Handling Suggestion                                  |
|--------|--------------------------------------------------------------|
| 401    | Redirect to login, clear session, show login expired message |
| 400    | Show validation error to user, highlight invalid fields      |
| 403    | Show access denied message, restrict UI                      |
| 404    | Show not found message, redirect or display empty state      |
| 409    | Show duplicate/conflict error, prompt user to change input   |
| 500    | Show generic error, suggest retry or contact support         |

---

## Testing & Mock Data

- **Postman Collection:** [Download Link](https://www.getpostman.com/collections/your-collection-link)
- **Sample Mock Data:**
  - See above request/response examples for realistic payloads.
  - Use tools like [Mockoon](https://mockoon.com/) or [json-server](https://github.com/typicode/json-server) for local API mocking.

---

---

## General Notes
- All endpoints return JSON.
- Most endpoints require `Authorization: Bearer <token>` header.
- Error responses follow this format:
  ```json
  { "success": false, "message": "...", "error": "..." }
  ```
- Refer to backend DTOs for detailed field requirements.

---

For more details, see the individual API docs in this folder.
