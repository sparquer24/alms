# WebSocket Server Implementation Guide for ALMS

This guide provides instructions for implementing a real WebSocket server for the Arms License Management System (ALMS) to replace the current mock WebSocket service.

## Overview

The WebSocket server will handle real-time notifications and updates for the ALMS application, including:
- Application status changes
- New notifications
- Assignment of applications to users
- System alerts

## Server Implementation

### Technology Stack

- **Node.js** with **Express** for the HTTP server
- **Socket.IO** or **ws** library for WebSocket implementation
- **Redis** for pub/sub functionality (optional, for scaling)

### Basic Server Setup

```javascript
// server.js
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// In-memory store for user connections (replace with Redis for production)
const userConnections = new Map();

// Verify JWT and establish connection
wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const token = url.searchParams.get('token');
  
  if (!token) {
    ws.close(1008, 'Token required');
    return;
  }
  
  let userId;
  try {
    // Verify JWT token (use your actual secret key)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    userId = decoded.userId;
    
    // Add to user connections map
    if (!userConnections.has(userId)) {
      userConnections.set(userId, []);
    }
    userConnections.get(userId).push(ws);
    
    console.log(`User ${userId} connected`);
    
    // Send initial data
    ws.send(JSON.stringify({
      type: 'CONNECTION_ESTABLISHED',
      userId,
      timestamp: new Date().toISOString()
    }));
    
  } catch (error) {
    ws.close(1008, 'Invalid token');
    return;
  }
  
  // Handle messages from client
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log(`Received: ${message} from user ${userId}`);
      
      // Handle message based on type
      switch (data.type) {
        case 'PING':
          ws.send(JSON.stringify({
            type: 'PONG',
            timestamp: new Date().toISOString()
          }));
          break;
        
        // Add other message type handlers as needed
          
        default:
          console.log(`Unknown message type: ${data.type}`);
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });
  
  // Handle disconnection
  ws.on('close', () => {
    if (userId) {
      const userWs = userConnections.get(userId);
      if (userWs) {
        const index = userWs.indexOf(ws);
        if (index !== -1) {
          userWs.splice(index, 1);
        }
        if (userWs.length === 0) {
          userConnections.delete(userId);
        }
      }
      console.log(`User ${userId} disconnected`);
    }
  });
});

// Function to send notification to specific user
function sendNotificationToUser(userId, notification) {
  const connections = userConnections.get(userId);
  
  if (connections && connections.length > 0) {
    const message = JSON.stringify({
      type: 'NOTIFICATION',
      notification
    });
    
    connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }
}

// Function to broadcast message to all connected users
function broadcastMessage(message) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// Start server
const PORT = process.env.WS_PORT || 8001;
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});

// Example REST endpoint to trigger notifications (for testing)
app.post('/api/trigger-notification', express.json(), (req, res) => {
  const { userId, notification } = req.body;
  
  if (!userId || !notification) {
    return res.status(400).json({ error: 'userId and notification required' });
  }
  
  sendNotificationToUser(userId, notification);
  res.json({ success: true });
});
```

## Integration with Client

To replace the mock WebSocket service with the real implementation:

1. Create a production WebSocket service component:

```tsx
// src/config/productionWebSocketService.tsx
"use client";

import { useState, useEffect } from 'react';
import { useWebSocket } from './websocket';
import { useAuth } from './auth';
import { useNotifications } from './notificationContext';

export default function ProductionWebSocketService() {
  const { isAuthenticated, token, userId } = useAuth();
  const { fetchNotifications } = useNotifications();
  
  const baseUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8001';
  const wsUrl = isAuthenticated && token ? `${baseUrl}/ws/notifications?token=${token}` : null;
  
  // Handle WebSocket messages
  const onMessage = (data: any) => {
    if (data.type === 'NOTIFICATION') {
      // Update notifications in the context
      fetchNotifications();
    }
  };
  
  // Connection handling
  const { isConnected, send } = useWebSocket({
    url: wsUrl || '',
    onMessage,
    onOpen: () => {
      console.log('WebSocket connected');
      // Send authentication message if needed
      if (token && userId) {
        send({ type: 'AUTH', userId, token });
      }
    },
    onClose: () => console.log('WebSocket disconnected'),
    onError: (error) => console.error('WebSocket error:', error)
  });
  
  // Send periodic ping to keep connection alive
  useEffect(() => {
    if (!isConnected) return;
    
    const pingInterval = setInterval(() => {
      send({ type: 'PING' });
    }, 30000);
    
    return () => clearInterval(pingInterval);
  }, [isConnected, send]);
  
  return null; // This is a background service component
}
```

2. Update the layout.tsx file to use either the mock or production WebSocket service based on environment:

```tsx
"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../config/auth";
import { LayoutProvider } from "../config/layoutContext";
import { NotificationProvider } from "../config/notificationContext";
import MockNotificationService from "../config/mockWebSocketService";
import ProductionWebSocketService from "../config/productionWebSocketService";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Use mock service in development, real service in production
const IS_DEV = process.env.NODE_ENV === 'development';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <title>Arms License Dashboard</title>
        <meta name="description" content="Dashboard for arms license processing" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <LayoutProvider>
            <NotificationProvider>
              {IS_DEV ? <MockNotificationService /> : <ProductionWebSocketService />}
              {children}
            </NotificationProvider>
          </LayoutProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
```

## Server-Side Notification Triggers

In your backend API routes, add code to send notifications when relevant events occur:

```javascript
// Example: Sending notification when application status changes
router.patch('/applications/:id/status', authenticate, async (req, res) => {
  try {
    // Update application status in database
    const { id } = req.params;
    const { status, comments } = req.body;
    const updatedApplication = await updateApplicationStatus(id, status, comments);
    
    // Get applicant user ID
    const applicantId = updatedApplication.applicantId;
    
    // Create notification
    const notification = {
      id: generateNotificationId(),
      type: 'APPLICATION_STATUS_CHANGE',
      title: 'Application Status Updated',
      message: `Your application ${id} status has been changed to ${status}`,
      isRead: false,
      applicationId: id,
      createdAt: new Date().toISOString()
    };
    
    // Save notification to database
    await saveNotification(notification, applicantId);
    
    // Send real-time notification via WebSocket
    sendNotificationToUser(applicantId, notification);
    
    res.json({
      success: true,
      data: updatedApplication
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update application status' }
    });
  }
});
```

## Deployment Considerations

1. **Scaling WebSockets**:
   - For production deployment with multiple server instances, use Redis or another message broker to synchronize WebSocket notifications across instances.
   - Consider using AWS Elastic Beanstalk, Heroku, or other platforms that support WebSockets.

2. **Connection Management**:
   - Implement proper connection cleanup and timeout handling.
   - Set up health checks and reconnection logic on the client side.

3. **Security**:
   - Ensure proper validation of JWT tokens.
   - Implement rate limiting to prevent abuse.
   - Use WSS (WebSocket Secure) in production.

4. **Monitoring**:
   - Add logging for connection events, errors, and message flow.
   - Set up monitoring for connection counts, message rates, and error rates.
