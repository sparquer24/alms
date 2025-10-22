# Auth API Documentation

## Overview
The Auth API provides endpoints for user authentication, profile retrieval, and token verification. All endpoints require authentication unless specified otherwise.

## Base URL
```
http://localhost:3000/api/auth
```

## Endpoints

### 1. Login
- **Endpoint:** `POST /api/auth/login`
- **Description:** Authenticates a user and returns a JWT token.
- **Request Body:**
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **Response:**
  ```json
  {
    "accessToken": "string",
    "expiresIn": 3600,
    "user": { ... }
  }
  ```

### 2. Get Profile
- **Endpoint:** `GET /api/auth/getMe`
- **Description:** Returns the authenticated user's profile.
- **Headers:**
  - `Authorization: Bearer <token>`
- **Response:**
  ```json
  {
    "id": "string",
    "username": "string",
    "roles": [ ... ],
    ...
  }
  ```

### 3. Verify Token
- **Endpoint:** `GET /api/auth/verify`
- **Description:** Verifies the validity of the JWT token.
- **Headers:**
  - `Authorization: Bearer <token>`
- **Response:**
  ```json
  {
    "valid": true,
    "user": { ... }
  }
  ```

## Error Responses
- 401 Unauthorized
- 400 Bad Request
- 500 Internal Server Error

## Notes
- All endpoints return JSON responses.
- JWT authentication is required for protected endpoints.
- Use the token received from the login endpoint for subsequent requests.
