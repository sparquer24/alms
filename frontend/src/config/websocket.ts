import { useEffect, useState } from 'react';

interface WebSocketOptions {
  url: string;
  onMessage?: (data: any) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

interface WebSocketHook {
  socket: WebSocket | null;
  isConnected: boolean;
  error: Event | null;
  send: (data: any) => void;
  connect: () => void;
  disconnect: () => void;
}

export const useWebSocket = ({
  url,
  onMessage,
  onOpen,
  onClose,
  onError,
  reconnectInterval = 5000,
  maxReconnectAttempts = 5,
}: WebSocketOptions): WebSocketHook => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Event | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const connect = () => {
    try {
      const ws = new WebSocket(url);
      
      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
        setReconnectAttempts(0);
        if (onOpen) onOpen();
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (onMessage) onMessage(data);
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        if (onClose) onClose();
        
        // Attempt to reconnect if not closed intentionally and within max attempts
        if (!event.wasClean && reconnectAttempts < maxReconnectAttempts) {
          setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, reconnectInterval);
        }
      };

      ws.onerror = (event) => {
        setError(event);
        if (onError) onError(event);
      };

      setSocket(ws);
    } catch (error) {
      console.error('WebSocket connection error:', error);
    }
  };

  const disconnect = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close();
    }
  };

  const send = (data: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data));
    } else {
      console.error('WebSocket is not connected');
    }
  };

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  return {
    socket,
    isConnected,
    error,
    send,
    connect,
    disconnect,
  };
};

// Usage example:
// const NotificationWebSocketProvider = () => {
//   const { isAuthenticated, token } = useAuth();
//   const [notifications, setNotifications] = useState([]);
//
//   const onMessage = (data) => {
//     if (data.type === 'NOTIFICATION') {
//       setNotifications(prev => [data.notification, ...prev]);
//     }
//   };
//
//   const baseUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
//   const wsUrl = `${baseUrl}/ws/notifications?token=${token}`;
//
//   const { isConnected } = useWebSocket({
//     url: wsUrl,
//     onMessage,
//     onOpen: () => console.log('WebSocket connected'),
//     onClose: () => console.log('WebSocket disconnected'),
//     onError: (error) => console.error('WebSocket error:', error),
//   });
//
//   return null; // This is a background service component
// };
