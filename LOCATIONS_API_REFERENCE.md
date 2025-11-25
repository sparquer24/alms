# Locations Management API Reference

## Base URL
```
http://localhost:3001/api
```

## Endpoints

### States

#### Get All States
```bash
GET /locations/states
```

**Response**:
```json
{
  "success": true,
  "message": "States retrieved successfully",
  "data": [
    { "id": 1, "name": "West Bengal", "code": "WB", "createdAt": "...", "updatedAt": "..." },
    { "id": 2, "name": "Maharashtra", "code": "MH", "createdAt": "...", "updatedAt": "..." }
  ],
  "count": 2
}
```

#### Create State
```bash
POST /locations/states
Content-Type: application/json

{
  "name": "Gujarat",
  "code": "GJ"
}
```

#### Update State
```bash
PUT /locations/states/1
Content-Type: application/json

{
  "name": "Gujarat Updated",
  "code": "GU"
}
```

#### Delete State
```bash
DELETE /locations/states/1
```

---

### Districts

#### Get All Districts
```bash
GET /locations/districts
```

#### Get Districts for a State
```bash
GET /locations/districts?stateId=1
```

#### Create District
```bash
POST /locations/districts
Content-Type: application/json

{
  "name": "Ahmedabad",
  "code": "AHM",
  "parentId": 1
}
```

#### Update District
```bash
PUT /locations/districts/1
Content-Type: application/json

{
  "name": "Ahmedabad City",
  "code": "AC"
}
```

#### Delete District
```bash
DELETE /locations/districts/1
```

---

### Zones

#### Get All Zones
```bash
GET /locations/zones
```

#### Get Zones for a District
```bash
GET /locations/zones?districtId=1
```

#### Create Zone
```bash
POST /locations/zones
Content-Type: application/json

{
  "name": "North Zone",
  "code": "NZ",
  "parentId": 1
}
```

#### Update Zone
```bash
PUT /locations/zones/1
Content-Type: application/json

{
  "name": "North East Zone",
  "code": "NEZ"
}
```

#### Delete Zone
```bash
DELETE /locations/zones/1
```

---

### Divisions

#### Get All Divisions
```bash
GET /locations/divisions
```

#### Get Divisions for a Zone
```bash
GET /locations/divisions?zoneId=1
```

#### Create Division
```bash
POST /locations/divisions
Content-Type: application/json

{
  "name": "Central Division",
  "code": "CD",
  "parentId": 1
}
```

#### Update Division
```bash
PUT /locations/divisions/1
Content-Type: application/json

{
  "name": "East Central Division",
  "code": "ECD"
}
```

#### Delete Division
```bash
DELETE /locations/divisions/1
```

---

### Police Stations

#### Get All Police Stations
```bash
GET /locations/police-stations
```

#### Get Police Stations for a Division
```bash
GET /locations/police-stations?divisionId=1
```

#### Create Police Station
```bash
POST /locations/police-stations
Content-Type: application/json

{
  "name": "Lalbazar Police Station",
  "code": "LB",
  "parentId": 1
}
```

#### Update Police Station
```bash
PUT /locations/police-stations/1
Content-Type: application/json

{
  "name": "Lalbazar PS Updated",
  "code": "LPS"
}
```

#### Delete Police Station
```bash
DELETE /locations/police-stations/1
```

---

### Location Hierarchy

#### Get Complete Hierarchy
```bash
GET /locations/hierarchy?stateId=1
```

**Parameters** (provide only one):
- `stateId` - Get hierarchy starting from state
- `districtId` - Get hierarchy starting from district
- `zoneId` - Get hierarchy starting from zone
- `divisionId` - Get hierarchy starting from division
- `policeStationId` - Get complete hierarchy for station

**Response**:
```json
{
  "success": true,
  "message": "Location hierarchy retrieved successfully",
  "data": {
    "state": { "id": 1, "name": "West Bengal" },
    "district": { "id": 1, "name": "Kolkata" },
    "zone": { "id": 1, "name": "North Zone" },
    "division": { "id": 1, "name": "Central Division" },
    "policeStation": null
  }
}
```

---

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "count": 1
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success (GET, PUT, DELETE) |
| 201 | Created (POST) |
| 400 | Bad Request (validation error) |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## Examples

### Create Complete Hierarchy

```bash
# 1. Create State
curl -X POST http://localhost:3001/api/locations/states \
  -H "Content-Type: application/json" \
  -d '{"name": "West Bengal", "code": "WB"}'

# Response: { id: 1, name: "West Bengal", ... }

# 2. Create District under State 1
curl -X POST http://localhost:3001/api/locations/districts \
  -H "Content-Type: application/json" \
  -d '{"name": "Kolkata", "code": "KOL", "parentId": 1}'

# Response: { id: 1, name: "Kolkata", stateId: 1, ... }

# 3. Create Zone under District 1
curl -X POST http://localhost:3001/api/locations/zones \
  -H "Content-Type: application/json" \
  -d '{"name": "North Zone", "code": "NZ", "parentId": 1}'

# Continue similarly for Divisions and Police Stations
```

---

## Frontend Integration

The frontend automatically uses these endpoints through the Locations Management page:

1. **Navigation**: Click on a location to view its children
2. **CRUD**: Use modal forms to create/edit/delete
3. **Export**: Download current level data as Excel file
4. **Validation**: Frontend validates required fields before sending

All API calls include proper error handling and user feedback via toast notifications.
