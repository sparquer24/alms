# ALMS Backend API Documentation

This document describes the main API endpoints for the Arms License Management System (ALMS) backend, including example requests, required payloads, path parameters, and query parameters.

## Application Status Definitions

| Status Code | Description |
|-------------|-------------|
| FRESH       | Newly created application that hasn't been processed yet |
| PENDING     | Application is in process and waiting for approval |
| FORWARDED   | Application has been forwarded to another officer |
| RETURNED    | Application has been returned for corrections |
| RED_FLAGGED | Application has been flagged for issues |
| APPROVED    | Application has been approved |
| REJECTED    | Application has been rejected |
| DISPOSED    | Application has been disposed |

## Authentication APIs

### 1. Login
**Endpoint**: `POST /api/auth/login`

**Payload Example**:
```json
{
  "username": "username@example.com",
  "password": "password123"
}
```

**Response Example**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user123",
      "name": "John Doe",
      "email": "username@example.com",
      "role": "DCP"
    }
  },
  "message": "Login successful"
}
```

### 2. Logout
**Endpoint**: `POST /api/auth/logout`

**Headers**: `Authorization: Bearer <token>`

**Response Example**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### 3. Get Current User
**Endpoint**: `GET /api/auth/me`

**Headers**: `Authorization: Bearer <token>`

**Response Example**:
```json
{
  "success": true,
  "data": {
    "id": "user123",
    "name": "John Doe",
    "email": "username@example.com",
    "role": "DCP",
    "permissions": [
      "canViewFreshForm",
      "canForwardToACP",
      "canForwardToDCP"
    ]
  }
}
```

## User APIs

### 4. Get Users
**Endpoint**: `GET /api/users`

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `role` (optional): Filter users by role name (e.g., SHO, ACP)

**Example**: `/api/users?role=SHO`

**Response Example**:
```json
{
  "success": true,
  "data": [
    {
      "id": "user456",
      "name": "Jane Smith",
      "email": "jane.smith@example.com",
      "role": "SHO"
    },
    {
      "id": "user789",
      "name": "Robert Johnson",
      "email": "robert.johnson@example.com",
      "role": "SHO"
    }
  ]
}
```

## Application APIs

### 5. Get Applications
**Endpoint**: `GET /api/applications`

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `searchQuery` (optional): Search by applicant name or email
- `startDate` (optional): Filter by creation date (start)
- `endDate` (optional): Filter by creation date (end)
- `status` (optional): Filter by application status
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Number of results per page (default: 10)

**Example**: `/api/applications?status=FRESH&page=1&pageSize=5`

**Response Example**:
```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "id": "ALM-20250616-00001",
        "applicantName": "Rahul Sharma",
        "applicantEmail": "rahul.s@example.com",
        "applicationType": "NEW",
        "status": "FRESH",
        "createdAt": "2025-06-15T10:30:00Z",
        "updatedAt": "2025-06-15T10:30:00Z"
      },
      {
        "id": "ALM-20250616-00002",
        "applicantName": "Priya Patel",
        "applicantEmail": "priya.p@example.com",
        "applicationType": "RENEWAL",
        "status": "FRESH",
        "createdAt": "2025-06-16T09:45:00Z",
        "updatedAt": "2025-06-16T09:45:00Z"
      }
    ],
    "pagination": {
      "total": 27,
      "page": 1,
      "pageSize": 5,
      "totalPages": 6
    }
  }
}
```

### 6. Get Application by ID
**Endpoint**: `GET /api/applications/{id}`

**Headers**: `Authorization: Bearer <token>`

**Path Parameter**:
- `id`: Application ID (e.g., ALM-20250616-00001)

**Response Example**:
```json
{
  "success": true,
  "data": {
    "id": "ALM-20250616-00001",
    "applicantName": "Rahul Sharma",
    "applicantEmail": "rahul.s@example.com",
    "fatherName": "Rajesh Sharma",
    "gender": "Male",
    "dob": "1985-04-15",
    "address": "123 Main Street, Mumbai, Maharashtra",
    "applicationType": "NEW",
    "weaponType": "Pistol",
    "weaponReason": "Self Defense",
    "licenseType": "Personal",
    "licenseValidity": "5 years",
    "isPreviouslyHeldLicense": false,
    "hasCriminalRecord": false,
    "status": "PENDING",
    "timeline": [
      {
        "status": "FRESH",
        "timestamp": "2025-06-15T10:30:00Z",
        "actionBy": "self",
        "comments": "Application submitted"
      },
      {
        "status": "PENDING",
        "timestamp": "2025-06-16T11:20:00Z",
        "actionBy": "System",
        "comments": "Application moved to pending review"
      }
    ],
    "documents": [
      {
        "id": "doc123",
        "type": "ID_PROOF",
        "filename": "aadhar_card.pdf",
        "uploadedAt": "2025-06-15T10:30:00Z"
      },
      {
        "id": "doc124",
        "type": "ADDRESS_PROOF",
        "filename": "utility_bill.pdf",
        "uploadedAt": "2025-06-15T10:30:00Z"
      }
    ],
    "createdAt": "2025-06-15T10:30:00Z",
    "updatedAt": "2025-06-16T11:20:00Z"
  }
}
```

### 7. Create Application
**Endpoint**: `POST /api/applications`

**Headers**: `Authorization: Bearer <token>` (optional for applicants)

**Payload Example**:
```json
{
  "applicantName": "Rahul Sharma",
  "applicantMobile": "9876543210",
  "applicantEmail": "rahul.s@example.com",
  "fatherName": "Rajesh Sharma",
  "gender": "Male",
  "dob": "1985-04-15",
  "address": "123 Main Street, Mumbai, Maharashtra",
  "applicationType": "NEW",
  "weaponType": "Pistol",
  "weaponReason": "Self Defense",
  "licenseType": "Personal",
  "licenseValidity": "5 years",
  "isPreviouslyHeldLicense": false,
  "hasCriminalRecord": false
}
```

**Response Example**:
```json
{
  "success": true,
  "data": {
    "id": "ALM-20250616-00003",
    "status": "FRESH",
    "message": "Application created successfully"
  }
}
```

### 8. Update Application Status
**Endpoint**: `PATCH /api/applications/{id}/status`

**Headers**: `Authorization: Bearer <token>`

**Path Parameter**:
- `id`: Application ID

**Payload Example**:
```json
{
  "status": "approved",
  "comments": "All documentation verified and approved",
  "reason": null
}
```

**Response Example**:
```json
{
  "success": true,
  "data": {
    "id": "ALM-20250616-00001",
    "status": "APPROVED",
    "updatedAt": "2025-06-16T14:25:00Z",
    "message": "Application status updated successfully"
  }
}
```

### 9. Forward Application
**Endpoint**: `POST /api/applications/{id}/forward`

**Headers**: `Authorization: Bearer <token>`

**Path Parameter**:
- `id`: Application ID

**Payload Example**:
```json
{
  "forwardTo": "ACP",
  "comments": "Verified all documents and background check completed",
  "recommendation": "recommend"
}
```

**Response Example**:
```json
{
  "success": true,
  "data": {
    "id": "ALM-20250616-00001",
    "status": "FORWARDED",
    "forwardedTo": "ACP",
    "updatedAt": "2025-06-16T15:30:00Z",
    "message": "Application forwarded successfully"
  }
}
```

### 10. Batch Process Applications
**Endpoint**: `POST /api/applications/batch`

**Headers**: `Authorization: Bearer <token>`

**Payload Example**:
```json
{
  "actionType": "forward",
  "applicationIds": ["ALM-20250616-00001", "ALM-20250616-00002"],
  "details": {
    "comments": "All applications verified and ready for next step",
    "forwardTo": "ACP",
    "recommendation": "recommend"
  }
}
```

**Response Example**:
```json
{
  "success": true,
  "data": {
    "processed": 2,
    "failed": 0,
    "updatedIds": ["ALM-20250616-00001", "ALM-20250616-00002"],
    "message": "Applications processed successfully"
  }
}
```

## Document APIs

### 11. Upload Document
**Endpoint**: `POST /api/applications/{id}/documents`

**Headers**: `Authorization: Bearer <token>`

**Path Parameter**:
- `id`: Application ID

**Payload**: `multipart/form-data`
- `document`: The file to upload
- `documentType`: The type of document (idProof, addressProof, photo, etc.)

**Response Example**:
```json
{
  "success": true,
  "data": {
    "id": "doc125",
    "documentType": "PHOTO",
    "filename": "applicant_photo.jpg",
    "uploadedAt": "2025-06-16T16:40:00Z",
    "message": "Document uploaded successfully"
  }
}
```

### 12. Get Documents for Application
**Endpoint**: `GET /api/applications/{id}/documents`

**Headers**: `Authorization: Bearer <token>`

**Path Parameter**:
- `id`: Application ID

**Response Example**:
```json
{
  "success": true,
  "data": [
    {
      "id": "doc123",
      "documentType": "ID_PROOF",
      "filename": "aadhar_card.pdf",
      "fileUrl": "https://storage.example.com/documents/aadhar_card.pdf",
      "uploadedAt": "2025-06-15T10:30:00Z"
    },
    {
      "id": "doc124",
      "documentType": "ADDRESS_PROOF",
      "filename": "utility_bill.pdf",
      "fileUrl": "https://storage.example.com/documents/utility_bill.pdf",
      "uploadedAt": "2025-06-15T10:30:00Z"
    }
  ]
}
```

### 13. Delete Document
**Endpoint**: `DELETE /api/applications/{id}/documents/{documentId}`

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `id`: Application ID
- `documentId`: Document ID

**Response Example**:
```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

## Report APIs

### 14. Get Statistics
**Endpoint**: `GET /api/reports/statistics`

**Headers**: `Authorization: Bearer <token>`

**Response Example**:
```json
{
  "success": true,
  "data": {
    "totalApplications": 156,
    "byStatus": {
      "FRESH": 27,
      "PENDING": 43,
      "FORWARDED": 32,
      "APPROVED": 36,
      "REJECTED": 10,
      "RETURNED": 5,
      "RED_FLAGGED": 3
    },
    "byMonth": [
      { "month": "January", "count": 12 },
      { "month": "February", "count": 15 },
      { "month": "March", "count": 18 },
      { "month": "April", "count": 22 },
      { "month": "May", "count": 24 },
      { "month": "June", "count": 65 }
    ]
  }
}
```

### 15. Get Applications by Status
**Endpoint**: `GET /api/reports/applications-by-status`

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `status`: Filter by application status
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Number of results per page (default: 10)

**Response Example**:
```json
{
  "success": true,
  "data": {
    "status": "APPROVED",
    "applications": [
      {
        "id": "ALM-20250605-00042",
        "applicantName": "Vikram Singh",
        "applicantEmail": "vikram.s@example.com",
        "applicationType": "NEW",
        "weaponType": "Rifle",
        "approvedBy": "DCP",
        "approvedOn": "2025-06-10T14:30:00Z"
      },
      {
        "id": "ALM-20250608-00057",
        "applicantName": "Aarti Joshi",
        "applicantEmail": "aarti.j@example.com",
        "applicationType": "RENEWAL",
        "weaponType": "Pistol",
        "approvedBy": "CP",
        "approvedOn": "2025-06-12T11:15:00Z"
      }
    ],
    "pagination": {
      "total": 36,
      "page": 1,
      "pageSize": 10,
      "totalPages": 4
    }
  }
}
```

### 16. Generate Application PDF
**Endpoint**: `GET /api/applications/{id}/pdf`

**Headers**: `Authorization: Bearer <token>`

**Path Parameter**:
- `id`: Application ID

**Response**: Binary PDF file with appropriate headers

## Role APIs

### 17. Get Role Actions
**Endpoint**: `GET /api/roles/actions`

**Headers**: `Authorization: Bearer <token>`

**Query Parameter**:
- `roleId`: Role ID

**Example**: `/api/roles/actions?roleId=3`

**Response Example**:
```json
{
  "success": true,
  "data": {
    "roleName": "SHO",
    "actions": [
      "VIEW_FRESH_FORM",
      "VIEW_FORWARDED",
      "VIEW_RETURNED",
      "CONDUCT_ENQUIRY",
      "FORWARD_TO_ACP",
      "ADD_REMARKS",
      "UPLOAD_DOCUMENTS"
    ]
  }
}
```

### 18. Get Role Hierarchy
**Endpoint**: `GET /api/roles/hierarchy`

**Headers**: `Authorization: Bearer <token>`

**Response Example**:
```json
{
  "success": true,
  "data": {
    "hierarchy": [
      {
        "id": 1,
        "name": "APPLICANT",
        "level": 0
      },
      {
        "id": 2,
        "name": "SHO",
        "level": 1
      },
      {
        "id": 3,
        "name": "ACP",
        "level": 2
      },
      {
        "id": 4,
        "name": "DCP",
        "level": 3
      },
      {
        "id": 5,
        "name": "CP",
        "level": 4
      }
    ]
  }
}
```

## Additional Required APIs

### 19. Change Password
**Endpoint**: `POST /api/auth/change-password`

**Headers**: `Authorization: Bearer <token>`

**Payload Example**:
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword456"
}
```

**Response Example**:
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### 20. Reset Password
**Endpoint**: `POST /api/auth/reset-password`

**Payload Example**:
```json
{
  "email": "user@example.com"
}
```

**Response Example**:
```json
{
  "success": true,
  "message": "Password reset instructions sent to your email"
}
```

### 21. Get Notifications
**Endpoint**: `GET /api/notifications`

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `read` (optional): Filter by read status (true/false)
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Number of results per page (default: 10)

**Response Example**:
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notif123",
        "type": "APPLICATION_STATUS_CHANGE",
        "title": "Application Status Changed",
        "message": "Your application ALM-20250616-00001 has been approved",
        "isRead": false,
        "createdAt": "2025-06-16T10:30:00Z"
      },
      {
        "id": "notif124",
        "type": "APPLICATION_FORWARDED",
        "title": "Application Forwarded",
        "message": "An application has been forwarded to you for review",
        "isRead": true,
        "createdAt": "2025-06-15T14:20:00Z"
      }
    ],
    "pagination": {
      "total": 12,
      "page": 1,
      "pageSize": 10,
      "totalPages": 2
    }
  }
}
```

### 22. Mark Notification as Read
**Endpoint**: `PATCH /api/notifications/{id}/read`

**Headers**: `Authorization: Bearer <token>`

**Path Parameter**:
- `id`: Notification ID

**Response Example**:
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

### 23. Mark All Notifications as Read
**Endpoint**: `PATCH /api/notifications/read-all`

**Headers**: `Authorization: Bearer <token>`

**Response Example**:
```json
{
  "success": true,
  "message": "All notifications marked as read",
  "count": 5
}
```

### 24. Get User Preferences
**Endpoint**: `GET /api/users/preferences`

**Headers**: `Authorization: Bearer <token>`

**Response Example**:
```json
{
  "success": true,
  "data": {
    "notifications": {
      "emailNotifications": true,
      "applicationUpdates": true,
      "systemAlerts": false
    },
    "display": {
      "darkMode": false,
      "compactView": true,
      "language": "english"
    }
  }
}
```

### 25. Update User Preferences
**Endpoint**: `PATCH /api/users/preferences`

**Headers**: `Authorization: Bearer <token>`

**Payload Example**:
```json
{
  "notifications": {
    "emailNotifications": false
  },
  "display": {
    "darkMode": true
  }
}
```

**Response Example**:
```json
{
  "success": true,
  "message": "User preferences updated successfully"
}
```

### 26. Get Dashboard Summary
**Endpoint**: `GET /api/dashboard/summary`

**Headers**: `Authorization: Bearer <token>`

**Response Example**:
```json
{
  "success": true,
  "data": {
    "pendingApplications": 12,
    "approvedApplications": 45,
    "rejectedApplications": 8,
    "recentActivities": [
      {
        "action": "APPLICATION_APPROVED",
        "applicationId": "ALM-20250615-00023",
        "timestamp": "2025-06-16T08:45:00Z"
      },
      {
        "action": "APPLICATION_FORWARDED",
        "applicationId": "ALM-20250616-00001",
        "timestamp": "2025-06-16T09:30:00Z"
      }
    ],
    "unreadNotifications": 3,
    "userStats": {
      "totalProcessed": 67,
      "approvalRate": 78,
      "averageProcessTime": "3.2 days"
    }
  }
}
```

### 27. Refresh Token
**Endpoint**: `POST /api/auth/refresh-token`

**Payload Example**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response Example**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Token refreshed successfully"
}
```

---

**Note**: All endpoints that require authentication expect the `Authorization: Bearer <token>` header.

For more details or custom examples, refer to the codebase or ask for a specific endpoint.
