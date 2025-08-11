# Real-time Notification System Implementation Guide

This document outlines the implementation details for the real-time notification system in the Arms License Management System (ALMS).

## Overview

The notification system uses WebSockets to deliver real-time updates to users, ensuring they receive immediate feedback on application status changes, remarks, and important system announcements without needing to refresh the page.

## Architecture

1. **Frontend Components**:
   - `NotificationProvider`: React context that manages notification state
   - `NotificationDropdown`: UI component for displaying notifications
   - `WebSocket Hook`: Custom hook for WebSocket connection management

2. **Backend Services**:
   - WebSocket server handling connections
   - Notification service for generating notifications
   - Authentication middleware for secure connections

## WebSocket Implementation

### Frontend WebSocket Connection

The frontend establishes a WebSocket connection through the `useWebSocket` hook in `websocket.ts`:

```typescript
// Example usage of the WebSocket hook
const { isConnected, send } = useWebSocket({
  url: `ws://localhost:8000/ws/notifications?token=${authToken}`,
  onMessage: (data) => {
    // Handle incoming notification data
  },
  onOpen: () => {
    console.log('Connection established');
  },
  onClose: () => {
    console.log('Connection closed');
  },
  onError: (error) => {
    console.error('WebSocket error:', error);
  },
  reconnectInterval: 5000,
  maxReconnectAttempts: 5,
});
```

### Backend WebSocket Server

The backend should implement a WebSocket server that:

1. Authenticates connections using JWT token
2. Maintains a mapping of user IDs to WebSocket connections
3. Broadcasts notifications to relevant users

```javascript
// Example Node.js WebSocket server with Express (pseudocode)
const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const jwt = require('jsonwebtoken');
const url = require('url');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Connection storage
const connections = new Map();

wss.on('connection', (ws, req) => {
  // Extract token from query params
  const params = url.parse(req.url, true).query;
  const token = params.token;
  
  try {
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    
    // Store connection
    connections.set(userId, ws);
    
    ws.on('message', (message) => {
      console.log('Received message:', message);
    });
    
    ws.on('close', () => {
      connections.delete(userId);
    });
    
  } catch (err) {
    ws.terminate();
  }
});

// Function to send notification to a specific user
function sendNotification(userId, notification) {
  const connection = connections.get(userId);
  
  if (connection && connection.readyState === WebSocket.OPEN) {
    connection.send(JSON.stringify({
      type: 'NOTIFICATION',
      notification
    }));
  }
}

server.listen(8000);
```

## Notification Types

The system supports various notification types:

| Type | Description | Example |
|------|-------------|---------|
| APPLICATION_STATUS_CHANGE | Application status updates | Your application ALM-20250616-00001 has been approved |
| APPLICATION_FORWARDED | Application forwarded | An application has been forwarded to you for review |
| APPLICATION_RETURNED | Application returned | Your application requires additional information |
| DOCUMENT_REQUEST | Document request | Please upload additional documents for your application |
| SYSTEM_ALERT | System announcements | The system will be undergoing maintenance tonight |
| COMMENT_ADDED | New comments | A comment was added to your application |

## Notification Payload Structure

```json
{
  "id": "notif123",
  "type": "APPLICATION_STATUS_CHANGE",
  "title": "Application Status Changed",
  "message": "Your application ALM-20250616-00001 has been approved",
  "isRead": false,
  "applicationId": "ALM-20250616-00001",
  "createdAt": "2025-06-16T10:30:00Z"
}
```

## Security Considerations

1. **Authentication**: All WebSocket connections must be authenticated using JWT tokens
2. **Authorization**: Notifications should only be sent to authorized users
3. **Rate Limiting**: Implement rate limiting to prevent flooding
4. **Payload Validation**: Validate all incoming and outgoing payloads
5. **Connection Management**: Implement proper connection cleanup on session end

## Testing WebSocket Connections

You can test your WebSocket implementation using the following tools:

1. **Browser WebSocket API**: For frontend testing
2. **WebSocket CLI tools**: Like `wscat` for command-line testing
3. **Postman**: For testing WebSocket connections with authentication

Example `wscat` command:
```
wscat -c "ws://localhost:8000/ws/notifications?token=your_jwt_token"
```

## Performance Considerations

1. Keep payload size small to minimize bandwidth usage
2. Implement connection pooling for efficient resource utilization
3. Consider using Redis Pub/Sub for horizontal scaling of notification service
4. Add monitoring for WebSocket connections and message throughput

## Implementation Checklist

- [ ] Set up WebSocket server with authentication
- [ ] Implement the notification service
- [ ] Create frontend notification components
- [ ] Add WebSocket connection management
- [ ] Implement notification storage and retrieval
- [ ] Add read/unread status tracking
- [ ] Test real-time delivery of notifications
- [ ] Add error handling and reconnection logic
- [ ] Implement notification preferences

For any questions regarding the implementation, please contact the system architect or refer to the WebSocket library documentation.
