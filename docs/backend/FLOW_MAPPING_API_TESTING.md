# Flow Mapping API - Testing Guide

## API Base URL
```
http://localhost:3001/api/flow-mapping
```

## Endpoints Reference

### 1. Get Flow Mapping for a Role
```bash
GET /flow-mapping/:roleId
```

**Example:**
```bash
curl http://localhost:3001/api/flow-mapping/1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "currentRoleId": 1,
    "currentRole": {
      "id": 1,
      "name": "DCP",
      "code": "DCP",
      "is_active": true
    },
    "nextRoleIds": [2, 3],
    "updatedBy": 5,
    "updatedByUser": {
      "id": 5,
      "username": "admin",
      "email": "admin@example.com"
    },
    "updatedAt": "2025-01-15T10:30:00Z",
    "createdAt": "2025-01-10T08:00:00Z"
  }
}
```

---

### 2. Get All Flow Mappings
```bash
GET /flow-mapping
```

**Example:**
```bash
curl http://localhost:3001/api/flow-mapping
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "currentRoleId": 1,
      "nextRoleIds": [2, 3],
      "currentRole": {
        "id": 1,
        "name": "DCP",
        "code": "DCP"
      }
    },
    {
      "id": 2,
      "currentRoleId": 2,
      "nextRoleIds": [3, 4],
      "currentRole": {
        "id": 2,
        "name": "ACP",
        "code": "ACP"
      }
    }
  ]
}
```

---

### 3. Save/Update Flow Mapping
```bash
PUT /flow-mapping/:roleId
```

**Request Body:**
```json
{
  "nextRoleIds": [2, 3, 4],
  "updatedBy": 5
}
```

**Example:**
```bash
curl -X PUT http://localhost:3001/api/flow-mapping/1 \
  -H "Content-Type: application/json" \
  -d '{
    "nextRoleIds": [2, 3],
    "updatedBy": 5
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Flow mapping updated successfully",
  "data": {
    "id": 1,
    "currentRoleId": 1,
    "nextRoleIds": [2, 3],
    "updatedBy": 5,
    "updatedByUser": {
      "id": 5,
      "username": "admin",
      "email": "admin@example.com"
    },
    "updatedAt": "2025-01-15T11:00:00Z",
    "createdAt": "2025-01-10T08:00:00Z"
  }
}
```

---

### 4. Create Flow Mapping
```bash
POST /flow-mapping
```

**Request Body:**
```json
{
  "currentRoleId": 5,
  "nextRoleIds": [6, 7]
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/api/flow-mapping \
  -H "Content-Type: application/json" \
  -d '{
    "currentRoleId": 5,
    "nextRoleIds": [6, 7]
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Flow mapping created successfully",
  "data": {
    "id": 3,
    "currentRoleId": 5,
    "nextRoleIds": [6, 7],
    "updatedAt": "2025-01-15T11:00:00Z",
    "createdAt": "2025-01-15T11:00:00Z"
  }
}
```

---

### 5. Validate Flow Mapping (Circular Dependency Check)
```bash
POST /flow-mapping/validate
```

**Request Body:**
```json
{
  "currentRoleId": 1,
  "nextRoleIds": [2, 3]
}
```

**Example - Valid Mapping:**
```bash
curl -X POST http://localhost:3001/api/flow-mapping/validate \
  -H "Content-Type: application/json" \
  -d '{
    "currentRoleId": 1,
    "nextRoleIds": [2, 3]
  }'
```

**Response (Valid):**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "hasCircularDependency": false,
    "circlePath": null,
    "message": "Flow mapping is valid"
  }
}
```

**Example - Circular Dependency:**
```bash
# Assuming: 1→2, 2→3, 3→1 (circular)
curl -X POST http://localhost:3001/api/flow-mapping/validate \
  -H "Content-Type: application/json" \
  -d '{
    "currentRoleId": 3,
    "nextRoleIds": [1]
  }'
```

**Response (Circular):**
```json
{
  "success": true,
  "data": {
    "isValid": false,
    "hasCircularDependency": true,
    "circlePath": "1 → 2 → 3 → 1",
    "message": "Circular workflow detected: 1 → 2 → 3 → 1"
  }
}
```

---

### 6. Get Next Roles
```bash
GET /flow-mapping/:roleId/next-roles
```

**Example:**
```bash
curl http://localhost:3001/api/flow-mapping/1/next-roles
```

**Response:**
```json
{
  "success": true,
  "data": {
    "currentRoleId": 1,
    "currentRoleName": "DCP",
    "nextRoles": [
      {
        "id": 2,
        "name": "ACP",
        "code": "ACP"
      },
      {
        "id": 3,
        "name": "SHO",
        "code": "SHO"
      }
    ]
  }
}
```

---

### 7. Duplicate Flow Mapping
```bash
POST /flow-mapping/:sourceRoleId/duplicate/:targetRoleId
```

**Example:**
```bash
curl -X POST http://localhost:3001/api/flow-mapping/1/duplicate/5 \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "message": "Flow mapping duplicated successfully",
  "data": {
    "id": 3,
    "currentRoleId": 5,
    "nextRoleIds": [2, 3],
    "updatedAt": "2025-01-15T11:00:00Z"
  }
}
```

---

### 8. Reset Flow Mapping
```bash
POST /flow-mapping/:roleId/reset
```

**Example:**
```bash
curl -X POST http://localhost:3001/api/flow-mapping/1/reset \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "message": "Flow mapping reset successfully",
  "data": {
    "id": 1,
    "currentRoleId": 1,
    "nextRoleIds": [],
    "updatedAt": "2025-01-15T11:05:00Z"
  }
}
```

---

### 9. Delete Flow Mapping
```bash
DELETE /flow-mapping/:roleId
```

**Example:**
```bash
curl -X DELETE http://localhost:3001/api/flow-mapping/1
```

**Response:**
```json
{
  "success": true,
  "message": "Flow mapping deleted successfully"
}
```

---

## Error Responses

### Role Not Found
```json
{
  "message": "Role with ID 999 not found",
  "error": "Not Found",
  "statusCode": 404
}
```

### Invalid Role IDs
```json
{
  "message": "Invalid role IDs: 999, 1000",
  "error": "Bad Request",
  "statusCode": 400
}
```

### Circular Dependency Detected
```json
{
  "message": "Circular workflow detected: 1 → 2 → 3 → 1. Cannot create mapping that causes circular workflow.",
  "error": "Bad Request",
  "statusCode": 400
}
```

### Missing Required Fields
```json
{
  "message": [
    "nextRoleIds must be an array",
    "each value in nextRoleIds must be an integer",
    "nextRoleIds must contain at least 1 elements"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

---

## Test Scenarios

### Scenario 1: Create Simple Mapping
```bash
# Step 1: Get available roles
curl http://localhost:3001/api/roles

# Step 2: Create mapping - DCP forwards to ACP and SHO
curl -X POST http://localhost:3001/api/flow-mapping \
  -H "Content-Type: application/json" \
  -d '{
    "currentRoleId": 1,
    "nextRoleIds": [2, 3]
  }'

# Step 3: Verify mapping was created
curl http://localhost:3001/api/flow-mapping/1
```

### Scenario 2: Test Circular Dependency
```bash
# Setup chain: 1→2, 2→3, 3→4
curl -X POST http://localhost:3001/api/flow-mapping \
  -H "Content-Type: application/json" \
  -d '{"currentRoleId": 1, "nextRoleIds": [2]}'

curl -X POST http://localhost:3001/api/flow-mapping \
  -H "Content-Type: application/json" \
  -d '{"currentRoleId": 2, "nextRoleIds": [3]}'

curl -X POST http://localhost:3001/api/flow-mapping \
  -H "Content-Type: application/json" \
  -d '{"currentRoleId": 3, "nextRoleIds": [4]}'

# Try to add 4→1 (creates circle)
curl -X POST http://localhost:3001/api/flow-mapping/validate \
  -H "Content-Type: application/json" \
  -d '{"currentRoleId": 4, "nextRoleIds": [1]}'

# Response should show circular dependency detected
```

### Scenario 3: Update Existing Mapping
```bash
# Get current mapping
curl http://localhost:3001/api/flow-mapping/1

# Update with different next roles
curl -X PUT http://localhost:3001/api/flow-mapping/1 \
  -H "Content-Type: application/json" \
  -d '{
    "nextRoleIds": [2, 3, 4, 5],
    "updatedBy": 10
  }'

# Verify update
curl http://localhost:3001/api/flow-mapping/1
```

### Scenario 4: Duplicate Mapping
```bash
# Duplicate from Role 1 to Role 6
curl -X POST http://localhost:3001/api/flow-mapping/1/duplicate/6 \
  -H "Content-Type: application/json"

# Verify both have same next roles
curl http://localhost:3001/api/flow-mapping/1
curl http://localhost:3001/api/flow-mapping/6
```

### Scenario 5: Reset Mapping
```bash
# Reset Role 1 mapping
curl -X POST http://localhost:3001/api/flow-mapping/1/reset \
  -H "Content-Type: application/json"

# Verify it's empty
curl http://localhost:3001/api/flow-mapping/1
# Should return nextRoleIds: []
```

---

## Using Postman

### Collection Setup

1. **Create Collection**: "Flow Mapping API"

2. **Add Variables**:
   - `base_url`: `http://localhost:3001/api`
   - `roleId`: `1`
   - `targetRoleId`: `2`

3. **Create Requests**:

   **GET All Mappings**
   ```
   {{base_url}}/flow-mapping
   ```

   **GET Specific Mapping**
   ```
   {{base_url}}/flow-mapping/{{roleId}}
   ```

   **PUT Update Mapping**
   ```
   {{base_url}}/flow-mapping/{{roleId}}
   
   Body (raw JSON):
   {
     "nextRoleIds": [2, 3],
     "updatedBy": 5
   }
   ```

   **POST Validate**
   ```
   {{base_url}}/flow-mapping/validate
   
   Body (raw JSON):
   {
     "currentRoleId": 1,
     "nextRoleIds": [2, 3]
   }
   ```

---

## Frontend Integration Testing

```typescript
// Test API calls from frontend
const testFlowMapping = async () => {
  const API_BASE_URL = 'http://localhost:3001/api';

  try {
    // Get roles
    const rolesRes = await fetch(`${API_BASE_URL}/roles`);
    const roles = await rolesRes.json();
    console.log('Roles:', roles);

    // Get flow mapping
    const mappingRes = await fetch(`${API_BASE_URL}/flow-mapping/1`);
    const mapping = await mappingRes.json();
    console.log('Mapping:', mapping);

    // Validate
    const validateRes = await fetch(`${API_BASE_URL}/flow-mapping/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentRoleId: 1,
        nextRoleIds: [2, 3]
      })
    });
    const validation = await validateRes.json();
    console.log('Validation:', validation);

    // Save
    const saveRes = await fetch(`${API_BASE_URL}/flow-mapping/1`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nextRoleIds: [2, 3],
        updatedBy: 5
      })
    });
    const saved = await saveRes.json();
    console.log('Saved:', saved);

  } catch (error) {
    console.error('Error:', error);
  }
};

// Run test
testFlowMapping();
```

---

## Troubleshooting

### Issue: "Role not found"
**Solution**: Ensure you're using valid role IDs. First, fetch all roles to get correct IDs.

### Issue: "Circular workflow detected"
**Solution**: The mapping creates a cycle. Review existing mappings and ensure they don't form circles.

### Issue: "Invalid role IDs"
**Solution**: Check that all IDs in nextRoleIds array are valid role IDs.

### Issue: "Missing required fields"
**Solution**: Ensure request body includes all required fields (currentRoleId, nextRoleIds for POST; nextRoleIds for PUT).

### Issue: CORS errors in frontend
**Solution**: Ensure backend CORS is configured to allow requests from frontend URL.

---

**API Documentation Version**: 1.0
**Last Updated**: November 21, 2025
