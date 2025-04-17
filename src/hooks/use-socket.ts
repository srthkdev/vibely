import { useCallback, useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import {
  closeSocket,
  initializeSocketWithRegistry,
  checkSocketHealth,
  joinRoom as joinSocketRoom,
} from '@/lib/socket';

// Type definitions for use-socket hook
interface UseSocketProps {
  userId: string;
  roomId: string;
  autoConnect?: boolean;
}

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  connectionError: Error | null;
  isReconnecting: boolean;
  reconnect: () => void;
}

// Add this function at the top of the file, outside any hooks
async function checkSocketServerAvailability(url: string): Promise<boolean> {
  try {
    // Try to make a simple request to the socket server
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${url}/health`, { 
      signal: controller.signal,
      method: 'HEAD'
    }).catch(() => null);
    
    clearTimeout(id);
    
    if (response && response.ok) {
      console.log('Socket server is available');
      return true;
    }
    
    console.warn('Socket server check failed, will still attempt connection');
    return false;
  } catch (error) {
    console.warn('Socket server availability check error:', error);
    return false;
  }
}

export function useSocket({
  userId,
  roomId,
  autoConnect = true,
}: UseSocketProps): UseSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<Error | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Keep track of mounted state to avoid state updates after unmount
  const isMountedRef = useRef<boolean>(true);
  // Store last active roomId to handle room changes
  const prevRoomIdRef = useRef<string | null>(null);

  // Clear any active reconnect timers
  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  // Initialize socket connection
  const initializeSocket = useCallback(() => {
    if (!userId || !roomId) {
      console.log('Missing userId or roomId, not initializing socket');
      return;
    }

    try {
      if (!isMountedRef.current) return;
      
      setIsReconnecting(true);
      console.log(`Initializing socket connection for user ${userId} in room ${roomId}`);
      
      // Check if socket is healthy first
      if (!checkSocketHealth()) {
        console.log('Socket health check failed, initializing new socket');
      }
      
      const socket = initializeSocketWithRegistry();
      socketRef.current = socket;

      // If room has changed, leave previous and join new room
      if (prevRoomIdRef.current && prevRoomIdRef.current !== roomId) {
        console.log(`Room changed from ${prevRoomIdRef.current} to ${roomId}, joining new room`);
        joinSocketRoom(roomId);
      } else if (!prevRoomIdRef.current) {
        // First time joining room
        console.log(`Joining room ${roomId} for the first time`);
        joinSocketRoom(roomId);
      }
      
      prevRoomIdRef.current = roomId;

      // Add event listeners for connection state
      const onConnect = () => {
        if (!isMountedRef.current) return;
        console.log('Socket connected event fired');
        setIsConnected(true);
        setConnectionError(null);
        setIsReconnecting(false);
        clearReconnectTimer();
      };

      const onDisconnect = (reason: string) => {
        if (!isMountedRef.current) return;
        console.log(`Socket disconnected: ${reason}`);
        setIsConnected(false);
        
        // Only attempt reconnection for specific disconnect reasons
        if (
          reason === 'io server disconnect' ||
          reason === 'transport close' ||
          reason === 'transport error'
        ) {
          handleReconnect();
        }
      };

      const onError = (error: Error) => {
        if (!isMountedRef.current) return;
        console.error('Socket error:', error);
        setConnectionError(error);
      };

      socket.on('connect', onConnect);
      socket.on('disconnect', onDisconnect);
      socket.on('error', onError);

      // If socket is already connected, trigger connect event manually
      if (socket.connected) {
        onConnect();
      }

      return () => {
        socket.off('connect', onConnect);
        socket.off('disconnect', onDisconnect);
        socket.off('error', onError);
      };
    } catch (error) {
      if (!isMountedRef.current) return;
      console.error('Error initializing socket:', error);
      setConnectionError(error instanceof Error ? error : new Error(String(error)));
      setIsReconnecting(false);
      
      // Schedule reconnection attempt
      handleReconnect();
    }
  }, [userId, roomId, clearReconnectTimer]);

  // Handle reconnection with exponential backoff
  const handleReconnect = useCallback(() => {
    if (!isMountedRef.current) return;
    clearReconnectTimer();
    
    setIsReconnecting(true);
    
    // Use increasing backoff time between reconnection attempts
    const backoffTime = Math.min(30000, Math.pow(2, reconnectAttemptRef.current) * 1000);
    console.log(`Scheduling reconnection attempt in ${backoffTime}ms`);
    
    reconnectTimerRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;
      reconnectAttemptRef.current++;
      console.log(`Attempting reconnection (attempt ${reconnectAttemptRef.current})`);
      initializeSocket();
    }, backoffTime);
  }, [clearReconnectTimer, initializeSocket]);

  // Track reconnection attempts
  const reconnectAttemptRef = useRef(0);
  
  // Manual reconnect function exposed to consumers
  const reconnect = useCallback(() => {
    console.log('Manual reconnection requested');
    reconnectAttemptRef.current = 0; // Reset attempt counter on manual reconnect
    clearReconnectTimer();
    initializeSocket();
  }, [clearReconnectTimer, initializeSocket]);

  // Initialize socket on mount if autoConnect is true
  useEffect(() => {
    if (autoConnect) {
      initializeSocket();
    }
    
    // Set mounted ref and cleanup function
    isMountedRef.current = true;
    
    return () => {
      console.log('Socket hook unmounting, cleaning up listeners');
      isMountedRef.current = false;
      clearReconnectTimer();
      
      // Don't disconnect socket here - it's managed by the registry
      // Just remove our local reference
      socketRef.current = null;
    };
  }, [autoConnect, initializeSocket, clearReconnectTimer]);

  return {
    socket: socketRef.current,
    isConnected,
    connectionError,
    isReconnecting,
    reconnect,
  };
} 