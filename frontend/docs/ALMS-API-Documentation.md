# ALMS (Arms License Management System) - API Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [Base Configuration](#base-configuration)
3. [Authentication APIs](#authentication-apis)
4. [Application Management APIs](#application-management-apis)
5. [Document Management APIs](#document-management-apis)
6. [User Management APIs](#user-management-apis)
7. [Notification APIs](#notification-apis)
8. [Dashboard APIs](#dashboard-apis)
9. [Report APIs](#report-apis)
10. [Role & Permission APIs](#role--permission-apis)
11. [Error Handling](#error-handling)
12. [Security & Authentication](#security--authentication)

---

## 🎯 Overview

The ALMS API provides comprehensive endpoints for managing arms license applications, user authentication, document handling, notifications, and administrative functions. This system supports multiple user roles including Applicants, Police Officers (SHO, ACP, DCP, CP), and Administrative staff.

---

## ⚙️ Base Configuration

### Environment Setup
```properties
NEXT_PUBLIC_API_URL = 'http://localhost:3001'
PORT=5000
```

### Base URLs
- **Development API**: `http://localhost:3001`
- **Frontend**: `http://localhost:5000`
- **Production**: Set via `NEXT_PUBLIC_API_URL` environment variable

### Standard Response Format
All APIs follow this consistent response structure:
```typescript
{
  success: boolean;
  statusCode: number;
  message?: string;
  body?: any;           // Response data
  error?: {
    code: string;
    details: string;
    validation?: {
      field: string;
      message: string;
    }[];
  };
}
```

---

## 🔐 Authentication APIs

### 1. Login API
**Endpoint:** `POST /auth/login`

**Description:** Authenticates user credentials and returns JWT token with user information.

**Request Body:**
```typescript
{
  username: string;  // Email or username
  password: string;  // User password
}
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful",
  "body": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_123",
      "name": "John Doe",
      "username": "john.doe",
      "email": "john@police.gov.in",
      "role": "DCP",
      "designation": "Deputy Commissioner of Police",
      "createdAt": "2024-01-01T00:00:00Z",
      "lastLogin": "2024-06-27T10:00:00Z",
      "permissions": [
        "VIEW_APPLICATIONS",
        "APPROVE_APPLICATIONS",
        "FORWARD_APPLICATIONS",
        "VIEW_REPORTS"
      ],
      "availableActions": [
        {
          "action": "approve",
          "resource": "application"
        },
        {
          "action": "forward",
          "resource": "application"
        }
      ]
    }
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": {
    "code": "INVALID_CREDENTIALS",
    "details": "Username or password is incorrect"
  }
}
```

### 2. Get Current User API
**Endpoint:** `GET /auth/me`

**Description:** Retrieves current authenticated user information.

**Headers Required:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "body": {
    "id": "user_123",
    "name": "John Doe",
    "username": "john.doe",
    "email": "john@police.gov.in",
    "role": "DCP",
    "designation": "Deputy Commissioner of Police",
    "createdAt": "2024-01-01T00:00:00Z",
    "lastLogin": "2024-06-27T10:00:00Z",
    "permissions": [
      "VIEW_APPLICATIONS",
      "APPROVE_APPLICATIONS"
    ],
    "availableActions": [
      {
        "action": "approve",
        "resource": "application"
      }
    ]
  }
}
```

### 3. Logout API
**Endpoint:** `POST /auth/logout`

**Headers Required:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Logged out successfully"
}
```

### 4. Change Password API
**Endpoint:** `POST /auth/change-password`

**Headers Required:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```typescript
{
  currentPassword: string;
  newPassword: string;
}
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Password changed successfully"
}
```

### 5. Reset Password API
**Endpoint:** `POST /auth/reset-password`

**Request Body:**
```typescript
{
  email: string;
}
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Password reset email sent"
}
```

---

## 📋 Application Management APIs

### 1. Get All Applications
**Endpoint:** `GET /applications`

**Headers Required:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
```typescript
{
  searchQuery?: string;    // Search in applicant name, mobile, email
  startDate?: string;      // Filter by submission date (ISO format)
  endDate?: string;        // Filter by submission date (ISO format)
  status?: string;         // Filter by application status
  page?: number;           // Page number for pagination
  limit?: number;          // Items per page
}
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "body": {
    "applications": [
      {
        "id": "app_123",
        "applicantName": "Rajesh Kumar",
        "applicantMobile": "9876543210",
        "applicantEmail": "rajesh@example.com",
        "status": "pending",
        "submissionDate": "2024-06-25T10:30:00Z",
        "weaponType": "rifle",
        "licenseType": "new",
        "currentStage": "SHO_REVIEW"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

### 2. Get Application by ID
**Endpoint:** `GET /applications/{id}`

**Headers Required:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "body": {
    "id": "app_123",
    "applicantName": "Rajesh Kumar",
    "applicantMobile": "9876543210",
    "applicantEmail": "rajesh@example.com",
    "fatherName": "Ram Kumar",
    "gender": "Male",
    "dob": "1985-05-15",
    "address": "123 Main Street, Delhi",
    "applicationType": "new",
    "weaponType": "rifle",
    "weaponReason": "self-defense",
    "licenseType": "new",
    "licenseValidity": "3-years",
    "status": "pending",
    "submissionDate": "2024-06-25T10:30:00Z",
    "currentStage": "SHO_REVIEW",
    "documents": [
      {
        "id": "doc_123",
        "type": "idProof",
        "filename": "aadhar.pdf",
        "uploadedAt": "2024-06-25T10:35:00Z"
      }
    ],
    "timeline": [
      {
        "stage": "SUBMITTED",
        "timestamp": "2024-06-25T10:30:00Z",
        "officer": "System",
        "remarks": "Application submitted"
      }
    ]
  }
}
```

### 3. Create New Application
**Endpoint:** `POST /applications`

**Headers Required:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```typescript
{
  applicantName: string;
  applicantMobile: string;
  applicantEmail: string;
  fatherName: string;
  gender: string;
  dob: string;
  address: string;
  applicationType: string;
  weaponType: string;
  weaponReason: string;
  licenseType: string;
  licenseValidity: string;
  isPreviouslyHeldLicense: boolean;
  previousLicenseNumber?: string;
  hasCriminalRecord: boolean;
  criminalRecordDetails?: string;
}
```

**Success Response (201):**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Application created successfully",
  "body": {
    "id": "app_124",
    "applicationNumber": "ALMS2024000124",
    "status": "submitted"
  }
}
```

### 4. Update Application Status
**Endpoint:** `PUT /applications/{id}/status`

**Headers Required:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```typescript
{
  status: 'approved' | 'rejected' | 'returned' | 'red-flagged' | 'disposed';
  comments: string;
  reason?: string;  // Required for return, flag, or disposal
}
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Application status updated successfully",
  "body": {
    "id": "app_123",
    "status": "approved",
    "updatedAt": "2024-06-27T15:30:00Z"
  }
}
```

### 5. Forward Application
**Endpoint:** `POST /applications/{id}/forward`

**Headers Required:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```typescript
{
  forwardTo: string;  // User ID or role
  comments: string;
  recommendation?: 'recommend' | 'not-recommend' | 're-enquiry';
}
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Application forwarded successfully",
  "body": {
    "id": "app_123",
    "forwardedTo": "user_456",
    "forwardedAt": "2024-06-27T15:30:00Z"
  }
}
```

### 6. Batch Process Applications
**Endpoint:** `POST /applications/batch`

**Headers Required:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```typescript
{
  actionType: 'forward' | 'approve' | 'reject' | 'return' | 'flag' | 'dispose';
  applicationIds: string[];
  details: {
    comments: string;
    forwardTo?: string;
    reason?: string;
    recommendation?: 'recommend' | 'not-recommend' | 're-enquiry';
  };
}
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Batch operation completed successfully",
  "body": {
    "processed": 5,
    "successful": 4,
    "failed": 1,
    "results": [
      {
        "applicationId": "app_123",
        "success": true
      },
      {
        "applicationId": "app_124",
        "success": false,
        "error": "Insufficient permissions"
      }
    ]
  }
}
```

---

## 📄 Document Management APIs

### 1. Upload Document
**Endpoint:** `POST /applications/{applicationId}/documents`

**Headers Required:**
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Form Data:**
```typescript
{
  document: File;
  documentType: string;  // 'idProof', 'addressProof', 'photo', 'characterCertificate'
}
```

**Success Response (201):**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Document uploaded successfully",
  "body": {
    "id": "doc_125",
    "filename": "aadhar_card.pdf",
    "type": "idProof",
    "size": 2048576,
    "uploadedAt": "2024-06-27T15:30:00Z"
  }
}
```

### 2. Get Application Documents
**Endpoint:** `GET /applications/{applicationId}/documents`

**Headers Required:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "body": {
    "documents": [
      {
        "id": "doc_123",
        "type": "idProof",
        "filename": "aadhar.pdf",
        "size": 1024576,
        "uploadedAt": "2024-06-25T10:35:00Z",
        "downloadUrl": "/documents/doc_123/download"
      },
      {
        "id": "doc_124",
        "type": "photo",
        "filename": "passport_photo.jpg",
        "size": 512000,
        "uploadedAt": "2024-06-25T10:40:00Z",
        "downloadUrl": "/documents/doc_124/download"
      }
    ]
  }
}
```

### 3. Delete Document
**Endpoint:** `DELETE /applications/{applicationId}/documents/{documentId}`

**Headers Required:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Document deleted successfully"
}
```

---

## 👥 User Management APIs

### 1. Get Users by Role
**Endpoint:** `GET /users`

**Headers Required:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
```typescript
{
  role?: 'SHO' | 'ACP' | 'DCP' | 'CP';
}
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "body": {
    "users": [
      {
        "id": "user_123",
        "name": "John Doe",
        "email": "john@police.gov.in",
        "role": "DCP",
        "designation": "Deputy Commissioner of Police",
        "station": "Central Delhi",
        "isActive": true
      }
    ]
  }
}
```

### 2. Get User Preferences
**Endpoint:** `GET /users/preferences`

**Headers Required:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "body": {
    "notifications": {
      "enabled": true,
      "emailNotifications": true,
      "applicationStatusChanges": true,
      "applicationForwarded": true,
      "applicationReturned": true,
      "commentNotifications": true,
      "systemAlerts": true
    },
    "display": {
      "darkMode": false,
      "compactView": false,
      "language": "en"
    }
  }
}
```

### 3. Update User Preferences
**Endpoint:** `PUT /users/preferences`

**Headers Required:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```typescript
{
  notifications?: {
    emailNotifications?: boolean;
    applicationUpdates?: boolean;
    systemAlerts?: boolean;
  };
  display?: {
    darkMode?: boolean;
    compactView?: boolean;
    language?: string;
  };
}
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Preferences updated successfully"
}
```

---

## 🔔 Notification APIs

### 1. Get All Notifications
**Endpoint:** `GET /notifications`

**Headers Required:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
```typescript
{
  read?: boolean;       // Filter by read status
  page?: number;        // Page number
  pageSize?: number;    // Items per page
}
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "body": {
    "notifications": [
      {
        "id": "notif_123",
        "title": "Application Forwarded",
        "message": "Application ALMS2024000123 has been forwarded to you for review",
        "type": "application_forwarded",
        "isRead": false,
        "createdAt": "2024-06-27T10:30:00Z",
        "applicationId": "app_123"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

### 2. Mark Notification as Read
**Endpoint:** `PUT /notifications/{id}/read`

**Headers Required:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Notification marked as read"
}
```

### 3. Mark All Notifications as Read
**Endpoint:** `PUT /notifications/read-all`

**Headers Required:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "All notifications marked as read"
}
```

---

## 📊 Dashboard APIs

### 1. Get Dashboard Summary
**Endpoint:** `GET /dashboard/summary`

**Headers Required:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "body": {
    "pendingApplications": 25,
    "approvedApplications": 150,
    "rejectedApplications": 8,
    "totalApplications": 183,
    "recentActivity": [
      {
        "id": "activity_123",
        "type": "application_submitted",
        "description": "New application submitted by Rajesh Kumar",
        "timestamp": "2024-06-27T14:30:00Z"
      }
    ],
    "statusDistribution": {
      "pending": 25,
      "under_review": 15,
      "approved": 150,
      "rejected": 8
    }
  }
}
```

---

## 📈 Report APIs

### 1. Get Statistics
**Endpoint:** `GET /reports/statistics`

**Headers Required:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
```typescript
{
  startDate?: string;  // ISO date format
  endDate?: string;    // ISO date format
}
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "body": {
    "totalApplications": 500,
    "approvedApplications": 420,
    "rejectedApplications": 30,
    "pendingApplications": 50,
    "avgProcessingTime": "15 days",
    "monthlyTrends": [
      {
        "month": "2024-06",
        "submitted": 45,
        "approved": 38,
        "rejected": 3
      }
    ]
  }
}
```

### 2. Get Applications by Status
**Endpoint:** `GET /reports/applications-by-status`

**Headers Required:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
```typescript
{
  status: 'forwarded' | 'returned' | 'flagged' | 'disposed' | 'freshform' | 'sent' | 'final';
  page?: number;
  limit?: number;
}
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "body": {
    "applications": [
      {
        "id": "app_123",
        "applicantName": "Rajesh Kumar",
        "submissionDate": "2024-06-25T10:30:00Z",
        "status": "forwarded",
        "currentStage": "ACP_REVIEW"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 25,
      "totalPages": 2
    }
  }
}
```

### 3. Generate PDF Report
**Endpoint:** `GET /applications/{applicationId}/pdf`

**Headers Required:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="application_app_123.pdf"

[Binary PDF Data]
```

---

## 🛡️ Role & Permission APIs

### 1. Get Available Actions
**Endpoint:** `GET /roles/actions`

**Headers Required:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "body": {
    "actions": [
      {
        "action": "approve",
        "resource": "application",
        "description": "Approve applications"
      },
      {
        "action": "forward",
        "resource": "application",
        "description": "Forward applications to next level"
      }
    ]
  }
}
```

### 2. Get Role Hierarchy
**Endpoint:** `GET /roles/hierarchy`

**Headers Required:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "body": {
    "hierarchy": [
      {
        "role": "CP",
        "level": 1,
        "canForwardTo": [],
        "reportsTo": null
      },
      {
        "role": "DCP",
        "level": 2,
        "canForwardTo": ["CP"],
        "reportsTo": "CP"
      },
      {
        "role": "ACP",
        "level": 3,
        "canForwardTo": ["DCP", "CP"],
        "reportsTo": "DCP"
      }
    ]
  }
}
```

---

## ⚠️ Error Handling

### Common HTTP Status Codes
- `200` - OK (Success)
- `201` - Created (Resource created successfully)
- `400` - Bad Request (Validation errors)
- `401` - Unauthorized (Invalid/missing authentication)
- `403` - Forbidden (Insufficient permissions)
- `404` - Not Found (Resource not found)
- `422` - Unprocessable Entity (Validation failed)
- `500` - Internal Server Error

### Error Response Format
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": "Request validation failed",
    "validation": [
      {
        "field": "applicantEmail",
        "message": "Invalid email format"
      },
      {
        "field": "applicantMobile",
        "message": "Mobile number is required"
      }
    ]
  }
}
```

---

## 🔒 Security & Authentication

### Token Management
- **JWT Tokens**: All protected endpoints require valid JWT token
- **Token Storage**: Stored in cookies and localStorage
- **Token Expiry**: Tokens expire after 24 hours
- **Auto-refresh**: Implemented on frontend for seamless experience

### Request Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Role-Based Access Control
Each API endpoint validates user permissions based on their role:

| Role | Permissions |
|------|-------------|
| **APPLICANT** | Submit applications, view own applications, upload documents |
| **SHO** | View assigned applications, conduct enquiry, forward to ACP |
| **ACP** | Review applications, forward to DCP/SHO, add recommendations |
| **DCP** | Approve/reject applications, forward to CP/AS, final decisions |
| **CP** | Final approval authority, view all reports, system oversight |
| **ADMIN** | Full system access, user management, system configuration |

### Data Protection
- All sensitive data encrypted in transit (HTTPS)
- Password hashing using bcrypt
- Input validation and sanitization
- SQL injection prevention
- XSS protection implemented

---

## 📞 Support & Contact

For API support and technical assistance:
- **Email**: tech-support@alms.gov.in
- **Documentation**: Updated regularly with API changes
- **Version**: v1.0.0
- **Last Updated**: June 27, 2025

---

*This documentation covers all available API endpoints in the ALMS system. For implementation examples and frontend integration guides, refer to the respective client documentation.*
