# User API Documentation

## Overview
The User API provides endpoints to create and retrieve users. All endpoints require authentication.

## Base URL
```
http://localhost:3000/api/users
```

## Endpoints

### 1. Create User
- **Endpoint:** `POST /api/users`
- **Description:** Creates a new user.
- **Request Body:**
  ```json
  {
    // User fields (see backend DTO for details)
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "data": { ... }
  }
  ```

### 2. Get Users
- **Endpoint:** `GET /api/users`
- **Description:** Retrieves users. Optionally filter by role.
- **Query Params:**
  - `role` (optional): Filter users by role
- **Response:**
  ```json
  {
    "success": true,
    "data": [ ... ]
  }
  ```

## Error Responses
- 400 Bad Request
- 401 Unauthorized
- 404 Not Found
- 500 Internal Server Error

## Notes
- All endpoints require JWT authentication.
- Use the token received from the login endpoint for authorization.
- Request/response payloads should match the DTOs defined in the backend.
