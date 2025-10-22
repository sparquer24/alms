# Authentication API Specifications

## Overview
This document outlines the expected API endpoints, request/response structures for authentication in the ALMS system.

## Base URL
- **Development**: `http://localhost:8000`
- **Production**: Set via `NEXT_PUBLIC_API_URL` environment variable

## 1. Login API

### **Endpoint**
```
POST /auth/login
```

### **Request Structure**
```typescript
{
  username: string;  // User's email or username
  password: string;  // User's password
}
```

### **Expected Response Structure**
```typescript
{
  success: boolean;
  statusCode: number;
  message?: string;
  body?: {
    token: string;        // JWT token for authentication
    user: {
      id: string;
      name: string;
      username: string;
      email: string;
      role: string;       // "DCP", "ACP", "SHO", "APPLICANT", etc.
      designation: string;
      createdAt: string;
      lastLogin: string;
      permissions: string[];  // Array of permission strings
      availableActions: {
        action: string;
        resource: string;
      }[];
    };
  };
  error?: any;
}
```

### **Success Response Example**
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

### **Error Response Example**
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

## 2. Current User API (auth/me)

### **Endpoint**
```
GET /auth/me
```

### **Headers Required**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### **Expected Response Structure**
```typescript
{
  success: boolean;
  statusCode: number;
  message?: string;
  body?: {
    id: string;
    name: string;
    username: string;
    email: string;
    role: string;
    designation: string;
    createdAt: string;
    lastLogin: string;
    permissions: string[];
    availableActions: {
      action: string;
      resource: string;
    }[];
  };
  error?: any;
}
```

### **Success Response Example**
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
```

### **Error Response (Invalid Token)**
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid or expired token",
  "error": {
    "code": "INVALID_TOKEN",
    "details": "JWT token is invalid or has expired"
  }
}
```

## 3. Logout API

### **Endpoint**
```
POST /auth/logout
```

### **Headers Required**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### **Expected Response**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Logged out successfully"
}
```

## 4. Change Password API

### **Endpoint**
```
POST /auth/change-password
```

### **Headers Required**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### **Request Structure**
```typescript
{
  currentPassword: string;
  newPassword: string;
}
```

### **Expected Response**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Password changed successfully"
}
```

## 5. Reset Password API (Public)

### **Endpoint**
```
POST /auth/reset-password
```

### **Request Structure**
```typescript
{
  email: string;
}
```

### **Expected Response**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Password reset email sent"
}
```

## User Roles and Permissions

### **Available Roles**
```typescript
enum UserRole {
  APPLICANT = "APPLICANT",        // Citizen who applies for license
  ZS = "ZS",                      // Zonal Superintendent
  DCP = "DCP",                    // Deputy Commissioner of Police
  ACP = "ACP",                    // Assistant Commissioner of Police
  SHO = "SHO",                    // Station House Officer
  AS = "AS",                      // Arms Superintendent
  ARMS_SUPDT = "ARMS_SUPDT",      // ARMS Superintendent
  ARMS_SEAT = "ARMS_SEAT",        // ARMS Seat
  ADO = "ADO",                    // Administrative Officer
  CADO = "CADO",                  // Chief Administrative Officer
  JTCP = "JTCP",                  // Joint Commissioner of Police
  CP = "CP",                      // Commissioner of Police
  ADMIN = "ADMIN"                 // System Administrator
}
```

### **Sample Permissions by Role**

#### **DCP (Deputy Commissioner of Police)**
```json
{
  "permissions": [
    "VIEW_APPLICATIONS",
    "VIEW_FORWARDED",
    "VIEW_RETURNED", 
    "VIEW_REPORTS",
    "APPROVE_APPLICATIONS",
    "REJECT_APPLICATIONS",
    "FORWARD_TO_ACP",
    "FORWARD_TO_AS",
    "FORWARD_TO_CP",
    "ADD_REMARKS",
    "APPROVE_TA"
  ],
  "availableActions": [
    {"action": "approve", "resource": "application"},
    {"action": "reject", "resource": "application"},
    {"action": "forward", "resource": "application"},
    {"action": "return", "resource": "application"}
  ]
}
```

#### **APPLICANT**
```json
{
  "permissions": [
    "SUBMIT_APPLICATION",
    "VIEW_SENT",
    "VIEW_RETURNED",
    "VIEW_FINAL",
    "UPLOAD_DOCUMENTS"
  ],
  "availableActions": [
    {"action": "submit", "resource": "application"},
    {"action": "upload", "resource": "document"},
    {"action": "resubmit", "resource": "application"}
  ]
}
```

## Frontend Storage

### **Cookies (for SSR/Middleware)**
```typescript
{
  token: string;
  user: User;
  isAuthenticated: boolean;
  role: string;     // Duplicated for quick middleware access
  name: string;     // Duplicated for quick display
}
```

### **Redux Store**
```typescript
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}
```

### **localStorage (for persistence)**
Same structure as cookies for backup/restore functionality.

## Error Handling

### **Common HTTP Status Codes**
- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid credentials/token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

### **Error Response Structure**
```typescript
{
  success: false;
  statusCode: number;
  message: string;
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

## Client-Side Implementation

### **API Client Usage**
```typescript
// Login
const response = await AuthApi.login({ username, password });

// Get current user (automatic token from cookies)
const userResponse = await AuthApi.getCurrentUser();

// Logout (automatic token from cookies)
await AuthApi.logout();

// Change password (automatic token from cookies)
await AuthApi.changePassword(currentPassword, newPassword);
```

### **Token Management**
- Tokens are automatically read from cookies
- Authorization headers are automatically added
- Invalid tokens trigger automatic redirect to login
- Token refresh handled transparently

This specification ensures consistent authentication flow across the entire ALMS application.
