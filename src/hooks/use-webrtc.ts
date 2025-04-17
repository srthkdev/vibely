'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { WebRTCClient, Participant, WebRTCState } from '@/lib/webrtc';

// Add a stable unique key for the room to prevent rapid mounts/unmounts
interface RoomIdentifier {
  roomId: string;
  instanceId: string;
}

let stableRoomRef: RoomIdentifier | null = null;
let pendingConnections = new Map<string, NodeJS.Timeout>();

// Constants
const CONNECTION_STABILIZATION_TIME = 3000; // 3 seconds
const RECONNECT_DELAY = 2000; // 2 seconds
const MOUNT_DEBOUNCE_TIME = 1000; // 1 second

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

export function useWebRTC(
  roomId: string,
  userId: string,
  userName: string,
  userImage: string = '',
  isAdmin: boolean = false
) {
  // Client reference to avoid recreating on rerenders
  const webrtcClientRef = useRef<WebRTCClient | null>(null);
  const reconnectAttempts = useRef<number>(0);
  const maxReconnectAttempts = 3;
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountInstanceIdRef = useRef<string>(`${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);
  
  // State for participants and streams
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [initError, setInitError] = useState<Error | null>(null);
  
  // WebRTC state
  const [state, setState] = useState<WebRTCState>({
    isConnected: false,
    isMuted: false,
    isVideoOff: false,
    isDeafened: false,
    isChatVisible: false,
    isAdmin: isAdmin
  });
  
  // Initialize WebRTC client
  useEffect(() => {
    const instance = mountInstanceIdRef.current;
    console.log(`Initializing WebRTC client for roomId: ${roomId} userId: ${userId} (instance: ${instance})`);
    
    // Skip if essential params are missing
    if (!roomId || !userId) return;
    
    // If client exists and has same parameters, skip
    if (webrtcClientRef.current 
        && webrtcClientRef.current.getRoomId() === roomId 
        && webrtcClientRef.current.getUserId() === userId) {
      console.log('Client exists with same params. Skipping effect run.');
      return;
    }
    
    // Cleanup previous client if it exists
    if (webrtcClientRef.current) {
      console.log('Disconnecting previous WebRTC client');
      webrtcClientRef.current.disconnect();
      webrtcClientRef.current = null;
    }
    
    // Reset state
    setIsInitialized(false);
    setInitError(null);
    reconnectAttempts.current = 0;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Initialize new client
    const initClient = async () => {
      try {
        // Create new client
        const client = new WebRTCClient({
          roomId,
          userId,
          userName,
          userImage,
          isAdmin
        });
        webrtcClientRef.current = client;
        
        // Set up event listeners
        client.on('participants-updated', (newParticipants: Participant[]) => {
          console.log('Participants updated:', userId);
          setParticipants(newParticipants);
        });
        
        client.on('state-changed', (newState: WebRTCState) => {
          setState(prev => ({...prev, ...newState}));
        });
        
        client.on('remote-streams-updated', (streams: Map<string, MediaStream>) => {
          console.log('Remote streams updated, count:', streams.size);
          setRemoteStreams(new Map(streams));
        });
        
        client.on('local-stream-updated', (stream: MediaStream) => {
          console.log('Local stream updated:', stream.id);
          setLocalStream(stream);
        });
        
        client.on('error', (error: Error) => {
          console.error('WebRTC client error:', error);
          if (error.message.includes('getUserMedia') || 
              error.message.includes('NotAllowedError') ||
              error.name === 'NotAllowedError' ||
              error.name === 'NotFoundError') {
            // Media access errors
            setInitError(error);
          } else if (!isInitialized) {
            // Only update error state if we're not initialized
            setInitError(error);
          }
        });
        
        client.on('kicked', () => {
          console.log('User kicked from room');
          // Disconnect client
          if (webrtcClientRef.current) {
            webrtcClientRef.current.disconnect();
            webrtcClientRef.current = null;
            setIsInitialized(false);
          }
        });
        
        client.on('room-deleted', () => {
          console.log('Room was deleted');
          // Disconnect client
          if (webrtcClientRef.current) {
            webrtcClientRef.current.disconnect();
            webrtcClientRef.current = null;
            setIsInitialized(false);
          }
        });
        
        // Initialize the client
        const success = await client.initialize({
          userId,
          userName,
          userImage,
          isAdmin,
          roomId,
          enableAudio: true,
          enableVideo: true
        });
        
        if (success) {
          console.log('WebRTC client initialized successfully');
          setIsInitialized(true);
          setInitError(null);
          
          // Get initial state
          setLocalStream(client.getLocalStream());
          setState(client.getState());
        } else {
          console.error('Failed to initialize WebRTC client');
          setIsInitialized(false);
          // Error should be set by the error handler
        }
      } catch (error) {
        console.error('Error in WebRTC initialization:', error);
        setInitError(error instanceof Error ? error : new Error('Initialization failed'));
        setIsInitialized(false);
        
        // If we have reconnect attempts left, try again after a delay
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          console.log(`Reconnect attempt ${reconnectAttempts.current}/${maxReconnectAttempts} in 3 seconds...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            initClient();
          }, 3000);
        }
      }
    };
    
    // Start initialization
    initClient();
    
    // Cleanup
    return () => {
      console.log(`Running cleanup for WebRTC client effect (instance: ${instance})`);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      if (webrtcClientRef.current) {
        console.log('Disconnecting WebRTC client on unmount');
        webrtcClientRef.current.disconnect();
        webrtcClientRef.current = null;
      }
    };
  }, [roomId, userId, userName, userImage, isAdmin]);
  
  // Function to attempt reconnection
  const attemptReconnect = useCallback(() => {
    console.log('Attempting to reconnect WebRTC client...');
    setInitError(null);
    reconnectAttempts.current = 0;
    
    if (webrtcClientRef.current) {
      webrtcClientRef.current.disconnect();
      
      // Short delay before reconnecting to ensure clean state
      setTimeout(async () => {
        try {
          const success = await webrtcClientRef.current?.initialize({
            userId,
            userName,
            userImage,
            isAdmin,
            roomId,
            enableAudio: !state.isMuted,
            enableVideo: !state.isVideoOff
          });
          
          if (success) {
            console.log('WebRTC client reconnected successfully');
            setIsInitialized(true);
            setInitError(null);
          } else {
            console.error('Failed to reconnect WebRTC client');
            setIsInitialized(false);
            reconnectAttempts.current++;
            
            if (reconnectAttempts.current >= maxReconnectAttempts) {
              setInitError(new Error(`Failed after ${maxReconnectAttempts} reconnection attempts`));
            }
          }
        } catch (error) {
          console.error('Error in WebRTC reconnection:', error);
          setInitError(error instanceof Error ? error : new Error('Reconnection failed'));
          setIsInitialized(false);
          reconnectAttempts.current++;
        }
      }, 1000);
    } else {
      // Client doesn't exist, recreate it
      const client = new WebRTCClient({
        roomId,
        userId,
        userName,
        userImage,
        isAdmin
      });
      webrtcClientRef.current = client;
      
      client.on('participants-updated', (newParticipants: Participant[]) => {
        setParticipants(newParticipants);
      });
      
      client.on('state-changed', (newState: WebRTCState) => {
        setState(prev => ({...prev, ...newState}));
      });
      
      client.on('remote-streams-updated', (streams: Map<string, MediaStream>) => {
        setRemoteStreams(new Map(streams));
      });
      
      client.on('local-stream-updated', (stream: MediaStream) => {
        setLocalStream(stream);
      });
      
      client.on('error', (error: Error) => {
        console.error('WebRTC client error during reconnect:', error);
        setInitError(error);
      });
      
      // Initialize with a short delay
      setTimeout(async () => {
        try {
          const success = await client.initialize({
            userId,
            userName,
            userImage,
            isAdmin,
            roomId,
            enableAudio: !state.isMuted,
            enableVideo: !state.isVideoOff
          });
          
          if (success) {
            console.log('WebRTC client initialized successfully after reconnect');
            setIsInitialized(true);
            setInitError(null);
          } else {
            console.error('Failed to initialize WebRTC client after reconnect');
            reconnectAttempts.current++;
            
            if (reconnectAttempts.current >= maxReconnectAttempts) {
              setInitError(new Error(`Failed after ${maxReconnectAttempts} reconnection attempts`));
            }
          }
        } catch (error) {
          console.error('Error in WebRTC reconnection:', error);
          setInitError(error instanceof Error ? error : new Error('Reconnection failed'));
          reconnectAttempts.current++;
        }
      }, 1000);
    }
  }, [roomId, userId, userName, userImage, isAdmin, state.isMuted, state.isVideoOff]);

  // Function to get a remote stream for a participant
  const getRemoteStream = useCallback((participantId: string): MediaStream | null => {
    if (!webrtcClientRef.current) return null;
    return remoteStreams.get(participantId) || null;
  }, [remoteStreams]);

  // Chat functionality
  const sendMessage = useCallback((message: string) => {
    if (!webrtcClientRef.current || !isInitialized) return;
    webrtcClientRef.current.sendMessage(message);
  }, [isInitialized]);

  // Media control functions
  const toggleMute = useCallback(() => {
    if (!webrtcClientRef.current) return;
    webrtcClientRef.current.toggleMute();
  }, []);

  const toggleVideo = useCallback(() => {
    if (!webrtcClientRef.current) return;
    webrtcClientRef.current.toggleVideo();
  }, []);

  const toggleDeafen = useCallback(() => {
    if (!webrtcClientRef.current) return;
    webrtcClientRef.current.toggleDeafen();
  }, []);

  const toggleChat = useCallback(() => {
    if (!webrtcClientRef.current) return;
    webrtcClientRef.current.toggleChat();
  }, []);

  // Admin control functions
  const muteParticipant = useCallback((participantId: string) => {
    if (!webrtcClientRef.current || !state.isAdmin) return;
    webrtcClientRef.current.muteParticipant(participantId);
  }, [state.isAdmin]);

  const disableParticipantVideo = useCallback((participantId: string) => {
    if (!webrtcClientRef.current || !state.isAdmin) return;
    webrtcClientRef.current.disableParticipantVideo(participantId);
  }, [state.isAdmin]);

  const kickParticipant = useCallback((participantId: string) => {
    if (!webrtcClientRef.current || !state.isAdmin) return;
    webrtcClientRef.current.kickParticipant(participantId);
  }, [state.isAdmin]);

  const deleteRoom = useCallback(() => {
    if (!webrtcClientRef.current || !state.isAdmin) return;
    webrtcClientRef.current.deleteRoom();
  }, [state.isAdmin]);

  return {
    localStream,
    participants,
    state,
    isInitialized,
    initError,
    toggleMute,
    toggleVideo,
    toggleDeafen,
    toggleChat,
    muteParticipant,
    disableParticipantVideo,
    kickParticipant,
    deleteRoom,
    sendMessage,
    getRemoteStream,
    attemptReconnect,
    webrtcClient: webrtcClientRef.current
  };
} 