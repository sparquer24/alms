"use client";

import { useState, useEffect } from 'react';
import { useWebSocket } from './websocket';
import { useAuth } from './auth';
import { useNotifications } from './notificationContext';

// This component provides a production WebSocket service for real-time notifications
export default function ProductionWebSocketService() {
  const { isAuthenticated, token, userName } = useAuth();
  const { fetchNotifications } = useNotifications();
  const [isReconnecting, setIsReconnecting] = useState(false);
  
  // Get WebSocket URL from environment or use default
  const baseUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8001';
  const wsUrl = isAuthenticated && token ? `${baseUrl}/ws/notifications?token=${token}` : null;
  
  // Handle WebSocket messages from server
  const onMessage = (data: any) => {
    if (data.type === 'NOTIFICATION') {
      // Update notifications in context when new notification arrives
      fetchNotifications();
      
      // Show browser notification if supported and permission granted
      showBrowserNotification(data.notification);
    }
    else if (data.type === 'PONG') {
      console.debug('WebSocket ping-pong successful');
    }
    else if (data.type === 'CONNECTION_ESTABLISHED') {
      console.log('WebSocket connection established with server');
    }
  };
  
  // Connection handling
  const { isConnected, send, error } = useWebSocket({
    url: wsUrl || '',
    onMessage,
    onOpen: () => {
      console.log('WebSocket connected');
      setIsReconnecting(false);
      
      // Send authentication message if needed
      if (token && userName) {
        send({ type: 'AUTH', userName, token });
      }
    },
    onClose: () => {
      console.log('WebSocket disconnected');
      setIsReconnecting(true);
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
      setIsReconnecting(true);
    },
    reconnectInterval: 5000, // Reconnect every 5 seconds if connection drops
    maxReconnectAttempts: 10 // Try to reconnect up to 10 times
  });
  
  // Send periodic ping to keep connection alive
  useEffect(() => {
    if (!isConnected) return;
    
    const pingInterval = setInterval(() => {
      send({ type: 'PING', timestamp: new Date().toISOString() });
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(pingInterval);
  }, [isConnected, send]);
  
  // Request notification permissions and show browser notifications
  useEffect(() => {
    // Check if browser supports notifications
    if ('Notification' in window && Notification.permission !== 'granted') {
      // Request permission for browser notifications
      Notification.requestPermission();
    }
  }, []);
  
  // Function to display browser notifications
  const showBrowserNotification = (notification: any) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }
    
    try {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/icon-alms.svg', // Use ALMS icon
        tag: notification.id
      });
    } catch (error) {
      console.error('Error showing browser notification:', error);
    }
  };
  
  // This is a background service component that doesn't render anything
  return null;
}
