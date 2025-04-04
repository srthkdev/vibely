'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { io, Socket } from 'socket.io-client';

export interface Message {
  id: string;
  content: string;
  timestamp: string;
  sender: {
    id: string;
    name: string;
    imageUrl?: string;
  };
}

export function useChat(roomId: string) {
  const { userId } = useAuth();
  const { user } = useUser();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<{
    id: string;
    name: string;
    imageUrl?: string;
  }[]>([]);

  // Initialize socket connection
  useEffect(() => {
    if (!roomId || !userId || !user) return;

    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
      query: { roomId },
    });

    socketInstance.on('connect', () => {
      console.log('Connected to chat server');
      setIsConnected(true);
      
      // Join the room chat
      socketInstance.emit('join-room-chat', roomId, {
        id: userId,
        name: user.fullName || 'Anonymous',
        imageUrl: user.imageUrl
      });
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from chat server');
      setIsConnected(false);
    });

    socketInstance.on('message', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });
    
    // Handle user joining the room
    socketInstance.on('user-joined', (user) => {
      setParticipants(prev => {
        if (!prev.find(p => p.id === user.id)) {
          return [...prev, user];
        }
        return prev;
      });
      
      // Add system message about user joining
      const systemMessage: Message = {
        id: `system-${Date.now()}`,
        content: `${user.name} joined the room`,
        timestamp: new Date().toISOString(),
        sender: {
          id: 'system',
          name: 'System'
        }
      };
      
      setMessages(prev => [...prev, systemMessage]);
    });
    
    // Handle user leaving the room
    socketInstance.on('user-left', (user) => {
      setParticipants(prev => prev.filter(p => p.id !== user.id));
      
      // Add system message about user leaving
      const systemMessage: Message = {
        id: `system-${Date.now()}`,
        content: `${user.name} left the room`,
        timestamp: new Date().toISOString(),
        sender: {
          id: 'system',
          name: 'System'
        }
      };
      
      setMessages(prev => [...prev, systemMessage]);
    });
    
    // Handle admin actions
    socketInstance.on('admin-action', (data) => {
      const { participantId, action, adminId } = data;
      
      // Add system message about admin action
      const systemMessage: Message = {
        id: `system-${Date.now()}`,
        content: `Admin performed action: ${action} on a participant`,
        timestamp: new Date().toISOString(),
        sender: {
          id: 'system',
          name: 'System'
        }
      };
      
      setMessages(prev => [...prev, systemMessage]);
    });

    setSocket(socketInstance);

    return () => {
      // Leave the room chat before disconnecting
      if (socketInstance.connected) {
        socketInstance.emit('leave-room-chat', roomId, {
          id: userId,
          name: user.fullName || 'Anonymous'
        });
      }
      socketInstance.disconnect();
    };
  }, [roomId, userId, user]);

  // Load previous messages
  useEffect(() => {
    if (!roomId) return;

    const loadMessages = async () => {
      try {
        const response = await fetch(`/api/rooms/${roomId}/messages`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data);
        }
      } catch (error) {
        console.error('Failed to load messages:', error);
      }
    };

    loadMessages();
  }, [roomId]);

  // Send message
  const sendMessage = useCallback((content: string) => {
    if (!socket || !userId || !user) return;

    const message: Omit<Message, 'id' | 'timestamp'> = {
      content,
      sender: {
        id: userId,
        name: user.fullName || 'Anonymous',
        imageUrl: user.imageUrl,
      },
    };

    socket.emit('message', message);
  }, [socket, userId, user]);

  // Function to perform admin actions on participants
  const performAdminAction = useCallback((participantId: string, action: string) => {
    if (!socket || !userId) return;
    
    socket.emit('admin-action', {
      roomId,
      participantId,
      action,
      userId
    });
  }, [socket, userId, roomId]);
  
  return {
    messages,
    sendMessage,
    isConnected,
    participants,
    performAdminAction
  };
} 