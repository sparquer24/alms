# Additional API Implementation Tasks

This document outlines the additional APIs that need to be implemented for the Arms License Management System (ALMS) beyond what is already documented in the main API documentation.

## Notification System APIs

### 1. WebSocket Connection API

**Endpoint**: `WebSocket /ws/notifications`

**Query Parameters**:
- `token`: Valid JWT token for authentication

**WebSocket Events**:
- `open`: Connection established
- `message`: Receive notification data
- `close`: Connection closed
- `error`: Connection error

**Event Data Example**:
```json
{
  "type": "NOTIFICATION",
  "notification": {
    "id": "notif123",
    "type": "APPLICATION_STATUS_CHANGE",
    "title": "Application Status Changed",
    "message": "Your application ALM-20250616-00001 has been approved",
    "isRead": false,
    "applicationId": "ALM-20250616-00001",
    "createdAt": "2025-06-16T10:30:00Z"
  }
}
```

### 2. Notification Subscription API

**Endpoint**: `PATCH /api/users/notification-preferences`

**Headers**: `Authorization: Bearer <token>`

**Payload Example**:
```json
{
  "preferences": {
    "applicationStatusChanges": true,
    "commentNotifications": true,
    "systemAlerts": false,
    "emailNotifications": true
  }
}
```

**Response Example**:
```json
{
  "success": true,
  "message": "Notification preferences updated successfully"
}
```

## Dashboard APIs

### 1. Chart Data API

**Endpoint**: `GET /api/dashboard/charts`

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `chartType`: The type of chart data to retrieve
- `dateRange`: Optional date range filter (e.g., "last7days", "last30days", "last3months", "custom")
- `startDate`: Required if dateRange is "custom"
- `endDate`: Required if dateRange is "custom"

**Example**: `/api/dashboard/charts?chartType=applicationByStatus&dateRange=last30days`

**Response Example**:
```json
{
  "success": true,
  "data": {
    "chartType": "applicationByStatus",
    "labels": ["FRESH", "PENDING", "FORWARDED", "APPROVED", "REJECTED"],
    "datasets": [
      {
        "label": "Applications by Status",
        "data": [42, 23, 15, 36, 8],
        "backgroundColor": ["#E3F2FD", "#BBDEFB", "#90CAF9", "#64B5F6", "#42A5F5"]
      }
    ],
    "dateRange": "last30days"
  }
}
```

### 2. Performance Metrics API

**Endpoint**: `GET /api/dashboard/performance-metrics`

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `period`: Time period for metrics (e.g., "daily", "weekly", "monthly")

**Response Example**:
```json
{
  "success": true,
  "data": {
    "processingTime": {
      "average": "3.2 days",
      "min": "0.5 days",
      "max": "12 days",
      "trend": "+0.3 days"
    },
    "approvalRate": {
      "rate": "78%",
      "trend": "+2.5%"
    },
    "rejectionRate": {
      "rate": "12%",
      "trend": "-1.2%"
    },
    "returnRate": {
      "rate": "10%",
      "trend": "-1.3%"
    }
  }
}
```

## Role-Based API Access

### 1. Permission Check API

**Endpoint**: `GET /api/auth/check-permission`

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `permission`: The permission to check

**Example**: `/api/auth/check-permission?permission=CAN_APPROVE_APPLICATIONS`

**Response Example**:
```json
{
  "success": true,
  "data": {
    "hasPermission": true,
    "permissionName": "CAN_APPROVE_APPLICATIONS",
    "role": "DCP"
  }
}
```

## Implementation Priority

1. WebSocket Connection API - Highest priority to enable real-time notifications
2. Dashboard Summary API - High priority for dashboard functionality
3. Notification Subscription API - Medium priority for user preferences
4. Chart Data API - Medium priority for dashboard visualizations
5. Performance Metrics API - Lower priority, can implement later
6. Permission Check API - Lower priority, can use role-based checks initially

## Implementation Notes

1. All APIs should follow the standard response format with `success`, `data`, and optional `message` or `error` fields.
2. JWT token authentication required for all endpoints.
3. Add proper error handling and validation for all APIs.
4. Include rate limiting for WebSocket connections and API endpoints.
5. Log all API access for security auditing.

For detailed API documentation and specifications, refer to the main API documentation file.
