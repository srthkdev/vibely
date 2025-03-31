'use client';

import { io, Socket } from 'socket.io-client';
import { WebRTCMessage } from './webrtc';

let socket: Socket | null = null;

export const initializeSocket = (roomId: string, userId: string): Socket => {
  if (socket) return socket;

  // Connect to the socket server
  socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
    auth: {
      userId,
      roomId
    }
  });

  // Connection event handlers
  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  return socket;
};

export const closeSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinRoom = (roomId: string): void => {
  if (!socket) return;
  socket.emit('join-room', { roomId });
};

export const leaveRoom = (roomId: string): void => {
  if (!socket) return;
  socket.emit('leave-room', { roomId });
};

export const sendSignal = (to: string, signal: WebRTCMessage): void => {
  if (!socket) return;
  socket.emit('signal', { to, signal });
};

export const onSignal = (callback: (data: { from: string, signal: WebRTCMessage }) => void): void => {
  if (!socket) return;
  socket.on('signal', callback);
};

export const onUserJoined = (callback: (data: { userId: string }) => void): void => {
  if (!socket) return;
  socket.on('user-joined', callback);
};

export const onUserLeft = (callback: (data: { userId: string }) => void): void => {
  if (!socket) return;
  socket.on('user-left', callback);
};

export const onMessage = (callback: (data: { from: string, message: string, timestamp: number }) => void): void => {
  if (!socket) return;
  socket.on('message', callback);
};

export const sendMessage = (message: string): void => {
  if (!socket) return;
  socket.emit('message', { message });
}; 