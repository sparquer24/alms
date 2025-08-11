"use client";

import { useState, useEffect } from 'react';
import { useWebSocket } from './websocket';
import { useAuth } from './auth';
import { useNotifications } from './notificationContext';

// This component provides a mock WebSocket service for testing notifications
// It can be replaced with a real WebSocket service when the backend is ready
export default function MockNotificationService() {
  const { isAuthenticated, token, userRole } = useAuth();
  const { fetchNotifications } = useNotifications();
  const [mockSocketConnected, setMockSocketConnected] = useState(false);
  
  // Simulated mock WebSocket connection
  useEffect(() => {
    if (!isAuthenticated || !token) return;
    
    // Set up mock connection after a delay
    const timer = setTimeout(() => {
      console.log('Mock WebSocket connected');
      setMockSocketConnected(true);
      
      // Initial fetch of notifications
      fetchNotifications();
    }, 1000);
    
    return () => {
      clearTimeout(timer);
      setMockSocketConnected(false);
      console.log('Mock WebSocket disconnected');
    };
  }, [isAuthenticated, token, fetchNotifications]);
  
  // Simulate incoming notifications periodically
  useEffect(() => {
    if (!mockSocketConnected) return;
    
    // Generate random notifications every 30-60 seconds for testing
    const interval = setInterval(() => {
      const shouldSendNotification = Math.random() > 0.5;
      
      if (shouldSendNotification) {
        simulateNotification();
      }
    }, 30000 + Math.random() * 30000);
    
    return () => clearInterval(interval);
  }, [mockSocketConnected]);
  
  // Function to simulate a random notification
  const simulateNotification = () => {
    if (!isAuthenticated) return;
    
    const notificationTypes = [
      'APPLICATION_STATUS_CHANGE',
      'APPLICATION_FORWARDED',
      'APPLICATION_RETURNED',
      'DOCUMENT_REQUEST',
      'SYSTEM_ALERT',
      'COMMENT_ADDED'
    ];
    
    const randomType = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
    const randomId = `ALM-${Math.floor(10000000 + Math.random() * 90000000)}`;
    
    let title, message;
    
    switch (randomType) {
      case 'APPLICATION_STATUS_CHANGE':
        title = 'Application Status Changed';
        message = `Application ${randomId} status has been updated`;
        break;
      case 'APPLICATION_FORWARDED':
        title = 'Application Forwarded';
        message = `Application ${randomId} has been forwarded to you for review`;
        break;
      case 'APPLICATION_RETURNED':
        title = 'Application Returned';
        message = `Application ${randomId} has been returned for corrections`;
        break;
      case 'DOCUMENT_REQUEST':
        title = 'Documents Required';
        message = `Please upload additional documents for application ${randomId}`;
        break;
      case 'SYSTEM_ALERT':
        title = 'System Notification';
        message = 'The system will undergo maintenance tonight at 11 PM';
        break;
      case 'COMMENT_ADDED':
        title = 'New Comment';
        message = `A new comment was added to application ${randomId}`;
        break;
      default:
        title = 'Notification';
        message = 'You have a new notification';
    }
    
    // Simulate the WebSocket message event
    const mockEvent = {
      data: JSON.stringify({
        type: 'NOTIFICATION',
        notification: {
          id: `notif-${Date.now()}`,
          type: randomType,
          title,
          message,
          isRead: false,
          applicationId: randomId,
          createdAt: new Date().toISOString()
        }
      })
    };
    
    // Dispatch a custom event to simulate receiving a WebSocket message
    const customEvent = new CustomEvent('mockWebSocketMessage', { detail: mockEvent });
    window.dispatchEvent(customEvent);
    
    console.log('Simulated notification:', mockEvent.data);
  };
  
  // This component doesn't render anything visible
  return null;
}
