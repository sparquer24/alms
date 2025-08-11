# Application Form API Documentation

## Overview
The Application Form API provides endpoints to create, retrieve, and validate Fresh License Application Forms. All endpoints require authentication.

## Base URL
```
http://localhost:3000/api/application-form
```

## Endpoints

### 1. Create Application
- **Endpoint:** `POST /api/application-form`
- **Description:** Creates a new fresh license application form.
- **Request Body:**
  ```json
  {
    // Fields as per CreateFreshLicenseApplicationsFormsInput DTO
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "data": { ... }
  }
  ```

### 2. Get All Applications
- **Endpoint:** `GET /api/application-form`
- **Description:** Retrieves all applications for the authenticated user.
- **Response:**
  ```json
  {
    "success": true,
    "data": [ ... ]
  }
  ```

### 3. Get Application by ID
- **Endpoint:** `GET /api/application-form/:id`
- **Description:** Retrieves a specific application by its ID.
- **Response:**
  ```json
  {
    "success": true,
    "data": { ... }
  }
  ```

### 4. Get States (Helper)
- **Endpoint:** `GET /api/application-form/helpers/states`
- **Description:** Returns a list of states for form selection.

### 5. Get Districts by State (Helper)
- **Endpoint:** `GET /api/application-form/helpers/districts/:stateId`
- **Description:** Returns districts for a given state.

### 6. Get Police Stations by Division (Helper)
- **Endpoint:** `GET /api/application-form/helpers/police-stations/:divisionId`
- **Description:** Returns police stations for a given division.

### 7. Validate IDs (Helper)
- **Endpoint:** `GET /api/application-form/helpers/validate-ids`
- **Description:** Validates IDs for the application form.

### 8. Check Aadhar Exists (Helper)
- **Endpoint:** `GET /api/application-form/helpers/check-aadhar/:aadharNumber`
- **Description:** Checks if an Aadhar number already exists in the system.

## Error Responses
- 400 Bad Request
- 401 Unauthorized
- 404 Not Found
- 500 Internal Server Error

## Notes
- All endpoints require JWT authentication.
- Use the token received from the login endpoint for authorization.
- Request/response payloads should match the DTOs defined in the backend.
