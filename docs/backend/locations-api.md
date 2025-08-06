# Locations API Documentation

## Overview
The Locations API provides endpoints to fetch geographical and administrative location data including States, Districts, Zones, Divisions, and Police Stations. Each endpoint supports both fetching all records and specific records by ID.

## Base URL
```
http://localhost:3000/api/locations
```

## Authentication
All endpoints require authentication. Include the Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## API Endpoints

### 1. States API

#### Get All States
**Endpoint:** `GET /api/locations/states`

**Example:**
```http
GET /api/locations/states
```

**Response:**
```json
{
  "success": true,
  "message": "States retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "Telangana"
    },
    {
      "id": 2,
      "name": "Andhra Pradesh"
    }
  ],
  "count": 2
}
```

#### Get Specific State
**Endpoint:** `GET /api/locations/states/:id`

**Parameters:**
- `id` (required, path parameter): Specific state ID to fetch

**Example:**
```http
GET /api/locations/states/1
```

**Response:**
```json
{
  "success": true,
  "message": "State retrieved successfully",
  "data": {
    "id": 1,
    "name": "Telangana",
    "districts": [
      {
        "id": 1,
        "name": "Hyderabad",
        "stateId": 1
      }
    ]
  }
}
```

---

### 2. Districts API

#### Get All Districts
**Endpoint:** `GET /api/locations/districts`

**Parameters:**
- `stateId` (optional, query parameter): Filter districts by state ID

**Examples:**

**Get All Districts:**
```http
GET /api/locations/districts
```

**Get Districts by State:**
```http
GET /api/locations/districts?stateId=1
```

#### Get Specific District
**Endpoint:** `GET /api/locations/districts/:id`

**Parameters:**
- `id` (required, path parameter): Specific district ID to fetch

**Example:**
```http
GET /api/locations/districts/1
```

**Response:**
```json
{
  "success": true,
  "message": "District retrieved successfully",
  "data": {
    "id": 1,
    "name": "Hyderabad",
    "stateId": 1,
    "state": {
      "id": 1,
      "name": "Telangana"
    },
    "zones": [
      {
        "id": 1,
        "name": "East Zone",
        "districtId": 1
      }
    ]
  }
}
```

---

### 3. Zones API

#### Get All Zones
**Endpoint:** `GET /api/locations/zones`

**Parameters:**
- `districtId` (optional, query parameter): Filter zones by district ID

**Examples:**

**Get All Zones:**
```http
GET /api/locations/zones
```

**Get Zones by District:**
```http
GET /api/locations/zones?districtId=1
```

#### Get Specific Zone
**Endpoint:** `GET /api/locations/zones/:id`

**Parameters:**
- `id` (required, path parameter): Specific zone ID to fetch

**Example:**
```http
GET /api/locations/zones/1
```

**Response:**
```json
{
  "success": true,
  "message": "Zone retrieved successfully",
  "data": {
    "id": 1,
    "name": "East Zone",
    "districtId": 1,
    "district": {
      "id": 1,
      "name": "Hyderabad",
      "state": {
        "id": 1,
        "name": "Telangana"
      }
    },
    "divisions": [
      {
        "id": 1,
        "name": "Mahankali",
        "zoneId": 1
      }
    ]
  }
}
```

---

### 4. Divisions API

#### Get All Divisions
**Endpoint:** `GET /api/locations/divisions`

**Parameters:**
- `zoneId` (optional, query parameter): Filter divisions by zone ID

**Examples:**

**Get All Divisions:**
```http
GET /api/locations/divisions
```

**Get Divisions by Zone:**
```http
GET /api/locations/divisions?zoneId=1
```

#### Get Specific Division
**Endpoint:** `GET /api/locations/divisions/:id`

**Parameters:**
- `id` (required, path parameter): Specific division ID to fetch

**Example:**
```http
GET /api/locations/divisions/1
```

**Response:**
```json
{
  "success": true,
  "message": "Division retrieved successfully",
  "data": {
    "id": 1,
    "name": "Mahankali",
    "zoneId": 1,
    "zone": {
      "id": 1,
      "name": "East Zone",
      "district": {
        "id": 1,
        "name": "Hyderabad",
        "state": {
          "id": 1,
          "name": "Telangana"
        }
      }
    },
    "stations": [
      {
        "id": 1,
        "name": "Rein Bazar PS",
        "divisionId": 1
      }
    ]
  }
}
```

---

### 5. Police Stations API

#### Get All Police Stations
**Endpoint:** `GET /api/locations/police-stations`

**Parameters:**
- `divisionId` (optional, query parameter): Filter police stations by division ID

**Examples:**

**Get All Police Stations:**
```http
GET /api/locations/police-stations
```

**Get Police Stations by Division:**
```http
GET /api/locations/police-stations?divisionId=1
```

#### Get Specific Police Station
**Endpoint:** `GET /api/locations/police-stations/:id`

**Parameters:**
- `id` (required, path parameter): Specific police station ID to fetch

**Example:**
```http
GET /api/locations/police-stations/1
```

**Response:**
```json
{
  "success": true,
  "message": "Police station retrieved successfully",
  "data": {
    "id": 1,
    "name": "Rein Bazar PS",
    "divisionId": 1,
    "division": {
      "id": 1,
      "name": "Mahankali",
      "zone": {
        "id": 1,
        "name": "East Zone",
        "district": {
          "id": 1,
          "name": "Hyderabad",
          "state": {
            "id": 1,
            "name": "Telangana"
          }
        }
      }
    }
  }
}
```

---

### 6. Location Hierarchy API

#### Get Complete Location Hierarchy
**Endpoint:** `GET /api/locations/hierarchy`

**Description:** Returns the complete hierarchical structure of all locations (States → Districts → Zones → Divisions → Police Stations).

**Example:**
```http
GET /api/locations/hierarchy
```

**Response:**
```json
{
  "success": true,
  "message": "Location hierarchy retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "Telangana",
      "districts": [
        {
          "id": 1,
          "name": "Hyderabad",
          "zones": [
            {
              "id": 1,
              "name": "East Zone",
              "divisions": [
                {
                  "id": 1,
                  "name": "Mahankali",
                  "stations": [
                    {
                      "id": 1,
                      "name": "Rein Bazar PS"
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Invalid request parameters",
  "error": "Detailed error message"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized access",
  "error": "Invalid or missing authorization token"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found",
  "error": "The requested resource was not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "An unexpected error occurred"
}
```

---

## Usage Examples

### Frontend Implementation (JavaScript/TypeScript)

```javascript
// Get all states
const getStates = async () => {
  try {
    const response = await fetch('/api/locations/states', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching states:', error);
  }
};

// Get specific state with districts
const getStateWithDistricts = async (stateId) => {
  try {
    const response = await fetch(`/api/locations/states/${stateId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching state:', error);
  }
};

// Get districts by state
const getDistrictsByState = async (stateId) => {
  try {
    const response = await fetch(`/api/locations/districts?stateId=${stateId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching districts:', error);
  }
};
```

---

## Database Schema Reference

The APIs are based on the following database models:

- **States**: Contains state information
- **Districts**: Belongs to a state, contains zones
- **Zones**: Belongs to a district, contains divisions  
- **Divisions**: Belongs to a zone, contains police stations
- **PoliceStations**: Belongs to a division

Each model includes proper foreign key relationships and supports hierarchical data fetching.

---

## Notes

1. All endpoints return data sorted alphabetically by name
2. When fetching specific records, related hierarchical data is included
3. Query parameters are case-sensitive
4. All responses follow a consistent format with `success`, `message`, and `data` fields
5. Authentication is required for all endpoints
6. Proper error handling is implemented for all scenarios
