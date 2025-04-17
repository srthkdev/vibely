'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useWebRTC } from './use-webrtc';

// Define message interface
export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
}

// Define participant interface
export interface ChatParticipant {
  id: string;
  name: string;
  imageUrl?: string;
  isMuted?: boolean;
  isVideoOff?: boolean;
  isAdmin?: boolean;
}

export function useChat(
  webrtcHook: ReturnType<typeof useWebRTC>
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  
  // Listen for new messages from the WebRTC socket
  useEffect(() => {
    // Safety check for webrtcClient
    if (!webrtcHook?.webrtcClient) return;
    
    // Set connected state from webrtc hook (with safety check)
    setIsConnected(webrtcHook?.state?.isConnected || false);
    
    // Set up event listener for new messages
    const handleNewMessage = (message: ChatMessage) => {
      setMessages(prev => [...prev, message]);
    };
    
    // Register event handler
    webrtcHook.webrtcClient.onSocketEvent('new-message', handleNewMessage);
    
    // Cleanup function
    return () => {
      if (webrtcHook?.webrtcClient) {
        webrtcHook.webrtcClient.offSocketEvent('new-message', handleNewMessage);
      }
    };
  }, [webrtcHook?.webrtcClient, webrtcHook?.state?.isConnected]);
  
  // Function to send a message
  const sendMessage = useCallback((content: string) => {
    if (!webrtcHook?.webrtcClient || !content.trim()) return;
    
    webrtcHook.sendMessage(content);
  }, [webrtcHook]);
  
  // Function to clear chat messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);
  
  // Function to perform admin actions
  const performAdminAction = useCallback((targetUserId: string, action: 'mute' | 'disable-video' | 'kick') => {
    if (!webrtcHook?.webrtcClient || !webrtcHook?.state?.isAdmin) return;
    
    switch (action) {
      case 'mute':
        webrtcHook.muteParticipant(targetUserId);
        break;
      case 'disable-video':
        webrtcHook.disableParticipantVideo(targetUserId);
        break;
      case 'kick':
        webrtcHook.kickParticipant(targetUserId);
        break;
    }
  }, [webrtcHook]);
  
  return {
    messages,
    sendMessage,
    clearMessages,
    isConnected: isConnected,
    participants: webrtcHook?.participants || [],
    performAdminAction
  };
} 