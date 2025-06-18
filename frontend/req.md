# Arms License Management System (ALMS) API Requirements

This document outlines the API requirements to replace the mock data in the ALMS application with actual API endpoints.

## Authentication APIs

### 1. User Login
**Endpoint:** `/api/auth/login`  
**Method:** POST  
**Payload:**
```json
{
  "username": "string",
  "password": "string"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "string",
      "name": "string",
      "email": "string",
      "role": "string",
      "designation": "string"
    },
    "token": "string"
  }
}
```

### 2. User Logout
**Endpoint:** `/api/auth/logout`  
**Method:** POST  
**Headers:** Authorization: Bearer {token}  
**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### 3. Get Current User
**Endpoint:** `/api/auth/me`  
**Method:** GET  
**Headers:** Authorization: Bearer {token}  
**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "string",
    "designation": "string"
  }
}
```

## Application Management APIs

### 4. Get All Applications
**Endpoint:** `/api/applications`  
**Method:** GET  
**Headers:** Authorization: Bearer {token}  
**Query Parameters:**
- `searchQuery`: string (optional) - Search by ID, name, mobile
- `startDate`: string (optional) - Filter by application date (YYYY-MM-DD)
- `endDate`: string (optional) - Filter by application date (YYYY-MM-DD)
- `status`: string (optional) - Filter by status (pending, approved, rejected, etc.)
- `page`: number (optional) - Pagination page number
- `limit`: number (optional) - Items per page

**Response:**
```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "id": "string",
        "applicantName": "string",
        "applicantMobile": "string",
        "applicantEmail": "string",
        "fatherName": "string",
        "gender": "string",
        "dob": "string",
        "address": "string",
        "applicationType": "string",
        "applicationDate": "string",
        "applicationTime": "string",
        "status": "string",
        "assignedTo": "string",
        "forwardedFrom": "string",
        "forwardedTo": "string",
        "lastUpdated": "string"
      }
    ],
    "pagination": {
      "total": "number",
      "page": "number",
      "limit": "number",
      "totalPages": "number"
    }
  }
}
```

### 5. Get Application by ID
**Endpoint:** `/api/applications/{id}`  
**Method:** GET  
**Headers:** Authorization: Bearer {token}  
**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "applicantName": "string",
    "applicantMobile": "string",
    "applicantEmail": "string",
    "fatherName": "string",
    "gender": "string",
    "dob": "string",
    "address": "string",
    "applicationType": "string",
    "applicationDate": "string",
    "applicationTime": "string",
    "status": "string",
    "assignedTo": "string",
    "forwardedFrom": "string",
    "forwardedTo": "string",
    "returnReason": "string",
    "flagReason": "string",
    "disposalReason": "string",
    "lastUpdated": "string",
    "documents": [
      {
        "name": "string",
        "type": "string",
        "url": "string"
      }
    ],    "history": [
      {
        "date": "string",
        "time": "string",
        "action": "string",
        "by": "string",
        "comments": "string"
      }
    ],
    "actions": {
      "canForward": true,
      "canReport": true,
      "canApprove": true,
      "canReject": true,
      "canRaiseRedflag": true,
      "canReturn": true,
      "canDispose": true
    }
  }
}
```

### 6. Create New Application
**Endpoint:** `/api/applications`  
**Method:** POST  
**Headers:** Authorization: Bearer {token}  
**Payload:**
```json
{
  "applicantName": "string",
  "applicantMobile": "string",
  "applicantEmail": "string",
  "fatherName": "string",
  "gender": "string",
  "dob": "string",
  "address": "string",
  "applicationType": "string",
  "weaponType": "string",
  "weaponReason": "string",
  "licenseType": "string",
  "licenseValidity": "string",
  "isPreviouslyHeldLicense": "boolean",
  "previousLicenseNumber": "string",
  "hasCriminalRecord": "boolean",
  "criminalRecordDetails": "string"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "message": "Application submitted successfully"
  }
}
```

### 7. Update Application Status
**Endpoint:** `/api/applications/{id}/status`  
**Method:** PATCH  
**Headers:** Authorization: Bearer {token}  
**Payload:**
```json
{
  "status": "string", // approved, rejected, returned, red-flagged, disposed
  "comments": "string",
  "reason": "string" // Required for return, flag, or disposal
}
```
**Response:**
```json
{
  "success": true,
  "message": "Application status updated successfully"
}
```

### 8. Forward Application
**Endpoint:** `/api/applications/{id}/forward`  
**Method:** POST  
**Headers:** Authorization: Bearer {token}  
**Payload:**
```json
{
  "forwardTo": "string", // User ID or role
  "comments": "string",
  "recommendation": "string" // Optional (recommend, not-recommend, re-enquiry)
}
```
**Response:**
```json
{
  "success": true,
  "message": "Application forwarded successfully"
}
```

## Document Management APIs

### 9. Upload Document
**Endpoint:** `/api/applications/{id}/documents`  
**Method:** POST  
**Headers:** Authorization: Bearer {token}  
**Content-Type:** multipart/form-data  
**Payload:**
```
document: File
documentType: string (idProof, addressProof, photo, characterCertificate, etc.)
```
**Response:**
```json
{
  "success": true,
  "data": {
    "documentId": "string",
    "name": "string",
    "type": "string",
    "url": "string"
  }
}
```

### 10. Get Documents
**Endpoint:** `/api/applications/{id}/documents`  
**Method:** GET  
**Headers:** Authorization: Bearer {token}  
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "type": "string",
      "url": "string",
      "uploadedAt": "string"
    }
  ]
}
```

### 11. Delete Document
**Endpoint:** `/api/applications/{id}/documents/{documentId}`  
**Method:** DELETE  
**Headers:** Authorization: Bearer {token}  
**Response:**
```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

## Report APIs

### 12. Get Application Statistics
**Endpoint:** `/api/reports/statistics`  
**Method:** GET  
**Headers:** Authorization: Bearer {token}  
**Query Parameters:**
- `startDate`: string (optional) - Start date for filtering (YYYY-MM-DD)
- `endDate`: string (optional) - End date for filtering (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 123,
    "pending": 45,
    "approved": 35,
    "rejected": 12,
    "returned": 15,
    "flagged": 8,
    "disposed": 8,
    "byApplicationType": {
      "New License": 65,
      "Renewal": 40,
      "Transfer": 18
    },
    "byMonthYear": [
      {
        "month": "Jan 2025",
        "count": 28
      },
      {
        "month": "Feb 2025",
        "count": 35
      }
    ]
  }
}
```

### 13. Get Applications by Status
**Endpoint:** `/api/reports/applications-by-status`  
**Method:** GET  
**Headers:** Authorization: Bearer {token}  
**Query Parameters:**
- `status`: string - The status to filter by (forwarded, returned, flagged, disposed, freshform, sent, final)
- `page`: number (optional) - Pagination page number
- `limit`: number (optional) - Items per page

**Response:** 
```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "id": "string",
        "applicantName": "string",
        "applicantMobile": "string",
        "applicationType": "string",
        "applicationDate": "string",
        "status": "string",
        "assignedTo": "string"
      }
    ],
    "pagination": {
      "total": "number",
      "page": "number",
      "limit": "number",
      "totalPages": "number"
    }
  }
}
```

### 14. Generate Application PDF
**Endpoint:** `/api/applications/{id}/pdf`  
**Method:** GET  
**Headers:** Authorization: Bearer {token}  
**Response:**
- PDF file as binary data with appropriate Content-Type header

## User Management APIs

### 15. Get Users by Role
**Endpoint:** `/api/users`  
**Method:** GET  
**Headers:** Authorization: Bearer {token}  
**Query Parameters:**
- `role`: string (optional) - Filter by role (SHO, ACP, DCP, CP)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "email": "string",
      "role": "string",
      "designation": "string"
    }
  ]
}
```

## Role-Based Action APIs

### 16. Get Available Actions by Role
**Endpoint:** `/api/roles/actions`  
**Method:** GET  
**Headers:** Authorization: Bearer {token}  
**Response:**
```json
{
  "success": true,
  "data": {
    "role": "string", // e.g., "SHO", "ACP", "DCP", "CP"
    "permissions": [
      {
        "action": "string", // e.g., "forward", "approve", "reject", "return", "flag", "dispose"
        "allowed": true
      }
    ]
  }
}
```

### 17. Get Role Hierarchy
**Endpoint:** `/api/roles/hierarchy`  
**Method:** GET  
**Headers:** Authorization: Bearer {token}  
**Response:**
```json
{
  "success": true,
  "data": {
    "hierarchy": [
      {
        "role": "string", // e.g., "SHO"
        "level": 1,
        "canForwardTo": ["string"] // e.g., ["ACP"]
      },
      {
        "role": "string", // e.g., "ACP"
        "level": 2,
        "canForwardTo": ["string"] // e.g., ["DCP"]
      }
    ]
  }
}
```

## Batch Action APIs

### 18. Batch Process Applications
**Endpoint:** `/api/applications/batch`  
**Method:** POST  
**Headers:** Authorization: Bearer {token}  
**Payload:**
```json
{
  "actionType": "string", // forward, approve, reject, return, flag, dispose
  "applicationIds": ["string"], // Array of application IDs to process
  "details": {
    "comments": "string",
    "forwardTo": "string", // Required for forward action
    "reason": "string", // Required for reject, return, flag, dispose actions
    "recommendation": "string" // Optional for forward action
  }
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "processed": ["string"], // Array of successfully processed application IDs
    "failed": [
      {
        "id": "string",
        "reason": "string"
      }
    ]
  }
}
```

## Notes and Considerations

1. **Authentication and Authorization**:
   - All API endpoints except login require authentication via JWT tokens
   - Role-based access control should be implemented for various actions
   - Each role (SHO, ACP, DCP, CP) has specific permissions and workflow capabilities

2. **API Design for Action-Specific Operations**:
   - Each action (forward, approve, reject, etc.) has its own dedicated API endpoint
   - This design allows for better scalability and handling of concurrent requests
   - Action-specific APIs improve security by isolating permissions per endpoint

3. **Request Handling Efficiency**:
   - Application fetch requests consolidate into a single API with flexible query parameters
   - Background processing should be implemented for resource-intensive operations
   - Consider implementing API rate limiting based on role and operation type

4. **File Uploads**:
   - Document uploads should enforce size limits and file type restrictions
   - Consider storage strategies (local storage vs cloud storage like AWS S3)

5. **Pagination**:
   - All list endpoints should implement pagination for better performance
   - Default limit could be 10-20 items per page

6. **Error Handling**:
   - All APIs should return appropriate HTTP status codes (400, 401, 403, 404, 500)
   - Error responses should follow a consistent structure:
     ```json
     {
       "success": false,
       "error": {
         "code": "string",
         "message": "string"
       }
     }
     ```

7. **Real-time Updates**:
   - Consider implementing WebSocket connections for real-time notifications
   - This is particularly useful for status updates and new application notifications

8. **Performance Optimization**:
   - Implement caching strategies for frequently accessed data
   - Consider using database indexing for common query patterns
   - Use connection pooling for database efficiency

9. **Data Security**:
   - Ensure sensitive applicant data is properly encrypted
   - Implement rate limiting to prevent abuse
   - Consider adding CSRF protection for authentication endpoints
