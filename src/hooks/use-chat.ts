'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import * as socketService from '@/lib/socket';

export interface Message {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
  };
  timestamp: number;
}

export function useChat(roomId: string) {
  const { userId } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userId || !roomId) return;

    // Initialize socket if not already initialized
    const socket = socketService.initializeSocket(roomId, userId);
    setIsConnected(socket.connected);

    // Handle connection status
    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Listen for new messages
    socketService.onMessage(({ from, message, timestamp }) => {
      const newMessage: Message = {
        id: `${from}-${timestamp}`,
        content: message,
        sender: {
          id: from,
          name: from === userId ? 'You' : `User ${from.slice(0, 5)}...`
        },
        timestamp
      };

      setMessages(prevMessages => [...prevMessages, newMessage]);
    });

    // Cleanup
    return () => {
      socket.off('message');
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [roomId, userId]);

  const sendMessage = (content: string) => {
    if (!content.trim() || !isConnected) return;

    socketService.sendMessage(content);

    // Add the message to local state immediately
    // The server will broadcast it to everyone including ourselves, but we add it now for
    // a more responsive UI experience
    const localMessage: Message = {
      id: `${userId}-${Date.now()}`,
      content,
      sender: {
        id: userId || 'unknown',
        name: 'You'
      },
      timestamp: Date.now()
    };

    setMessages(prevMessages => [...prevMessages, localMessage]);
  };

  return {
    messages,
    sendMessage,
    isConnected
  };
} 