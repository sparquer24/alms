# ALMS Backend API Documentation

This document describes the main API endpoints for the Arms License Management System (ALMS) backend, including example requests, required payloads, path parameters, and query parameters.

---

## Authentication APIs

### 1. Login
- **Endpoint:** `POST /api/auth/login`
- **Payload Example:**
  ```json
  {
    "username": "john.doe",
    "password": "yourPassword123"
  }
  ```
- **Response Example:**
  ```json
  { "token": "<JWT_TOKEN>" }
  ```

### 2. Logout
- **Endpoint:** `POST /api/auth/logout`
- **No payload required.**
- **Response Example:**
  ```json
  { "message": "Logged out." }
  ```

### 3. Get Current User
- **Endpoint:** `GET /api/auth/me`
- **Headers:** `Authorization: Bearer <token>`
- **Response Example:**
  ```json
  {
    "id": 1,
    "username": "john.doe",
    "email": "john@example.com",
    "role": "SHO"
  }
  ```

---

## User APIs

### 4. Get Users
- **Endpoint:** `GET /api/users`
- **Query Parameters:**
  - `role` (optional): Filter users by role name (e.g., `SHO`, `ACP`)
- **Example:** `/api/users?role=SHO`
- **Response Example:**
  ```json
  [
    {
      "id": 1,
      "username": "john.doe",
      "email": "john@example.com",
      "role": "SHO"
    },
    {
      "id": 2,
      "username": "jane.smith",
      "email": "jane@example.com",
      "role": "ACP"
    }
  ]
  ```

---

## Application APIs

### 5. Get Applications
- **Endpoint:** `GET /api/applications`
- **Query Parameters:**
  - `searchQuery` (optional): Search by applicant name or email
  - `startDate` (optional): Filter by creation date (start)
  - `endDate` (optional): Filter by creation date (end)
  - `status` (optional): Filter by application status
  - `page` (optional): Page number (default: 1)
  - `pageSize` (optional): Number of results per page (default: 10)
- **Example:** `/api/applications?status=FRESH&page=1&pageSize=5`
- **Response Example:**
  ```json
  [
    {
      "id": "ALM-20250616-00001",
      "applicantName": "John Doe",
      "status": "FRESH",
      "createdAt": "2025-06-16T10:00:00Z"
    }
  ]
  ```

### 6. Get Application by ID
- **Endpoint:** `GET /api/applications/{id}`
- **Path Parameter:**
  - `id`: Application ID (e.g., `ALM-20250616-00001`)
- **Response Example:**
  ```json
  {
    "id": "ALM-20250616-00001",
    "applicantName": "John Doe",
    "status": "FRESH",
    "createdAt": "2025-06-16T10:00:00Z"
    // ...other fields
  }
  ```

### 7. Create Application
- **Endpoint:** `POST /api/applications`
- **Payload Example:**
  ```json
  {
    "applicantName": "John Doe",
    "applicantMobile": "9876543210",
    "applicantEmail": "john@example.com",
    "fatherName": "Richard Doe",
    "gender": "Male",
    "dob": "1990-01-01",
    "address": "123 Main St, City",
    "applicationType": "New License",
    "weaponType": "Pistol",
    "weaponReason": "Self Defense",
    "licenseType": "Type A",
    "licenseValidity": "2026-01-01",
    "isPreviouslyHeldLicense": false,
    "hasCriminalRecord": false,
    "status": "FRESH"
  }
  ```
- **Response Example:**
  ```json
  {
    "id": "ALM-20250616-00002",
    "applicantName": "John Doe",
    "status": "FRESH",
    "createdAt": "2025-06-16T10:05:00Z"
    // ...other fields
  }
  ```

### 8. Update Application Status
- **Endpoint:** `PATCH /api/applications/{id}/status`
- **Path Parameter:**
  - `id`: Application ID
- **Headers:** `Authorization: Bearer <token>`
- **Payload Example:**
  ```json
  { "status": "FORWARDED" }
  ```
- **Response Example:**
  ```json
  {
    "id": "ALM-20250616-00001",
    "status": "FORWARDED"
    // ...other fields
  }
  ```

### 9. Forward Application
- **Endpoint:** `POST /api/applications/{id}/forward`
- **Path Parameter:**
  - `id`: Application ID
- **Headers:** `Authorization: Bearer <token>`
- **Payload Example:**
  ```json
  {
    "forwardToRole": "ACP",
    "comments": "Forwarding to ACP for review."
  }
  ```
- **Response Example:**
  ```json
  {
    "id": "ALM-20250616-00001",
    "status": "FORWARDED"
    // ...other fields
  }
  ```

### 10. Batch Process Applications
- **Endpoint:** `POST /api/applications/batch`
- **Payload:** (Not implemented)

---

## Document APIs

### 11. Upload Document
- **Endpoint:** `POST /api/applications/{id}/documents`
- **Path Parameter:**
  - `id`: Application ID
- **Payload:** `multipart/form-data` (not implemented)

### 12. Get Documents for Application
- **Endpoint:** `GET /api/applications/{id}/documents`
- **Path Parameter:**
  - `id`: Application ID
- **Response Example:**
  ```json
  [
    {
      "id": "doc-001",
      "documentType": "Aadhaar Card",
      "filePath": "/uploads/doc-001.pdf",
      "uploadedAt": "2025-06-16T10:10:00Z"
    }
  ]
  ```

### 13. Delete Document
- **Endpoint:** `DELETE /api/applications/{id}/documents/{documentId}`
- **Path Parameters:**
  - `id`: Application ID
  - `documentId`: Document ID

---

## Report APIs

### 14. Get Statistics
- **Endpoint:** `GET /api/reports/statistics`
- **Response Example:**
  ```json
  {
    "totalApplications": 100,
    "totalUsers": 20
  }
  ```

### 15. Get Applications by Status
- **Endpoint:** `GET /api/reports/applications-by-status`
- **Response Example:**
  ```json
  [
    { "status": "FRESH", "_count": { "status": 10 } },
    { "status": "FORWARDED", "_count": { "status": 5 } }
  ]
  ```

### 16. Generate Application PDF
- **Endpoint:** `GET /api/applications/{id}/pdf`
- **Path Parameter:**
  - `id`: Application ID

---

## Role APIs

### 17. Get Role Actions
- **Endpoint:** `GET /api/roles/actions`
- **Query Parameter:**
  - `roleId`: Role ID
- **Example:** `/api/roles/actions?roleId=3`

### 18. Get Role Hierarchy
- **Endpoint:** `GET /api/roles/hierarchy`

---

**Note:** All endpoints that require authentication expect the `Authorization: Bearer <token>` header.

For more details or custom examples, refer to the codebase or ask for a specific endpoint.
