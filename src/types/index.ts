// Room types
export interface Room {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  maxUsers: number;
  password?: string;
  topics: string[];
  createdAt: Date;
  updatedAt: Date;
  ownerId?: string;
  owner?: User;
  participants?: RoomParticipant[];
}

// User types
export interface User {
  id: string;
  clerkId: string;
  username: string;
  email?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Participant types
export interface Participant {
  id: string;
  name: string;
  imageUrl?: string;
  isMuted?: boolean;
  isVideoOff?: boolean;
}

export interface RoomParticipant {
  id: string;
  userId: string;
  roomId: string;
  joinedAt: Date;
  leftAt?: Date;
  isMuted: boolean;
  isVideoOff: boolean;
  user?: User;
}

// Message types
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

// Mediasoup types
export interface MediasoupState {
  isConnected: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  isDeafened: boolean;
  isChatVisible: boolean;
  isAdmin: boolean;
}

// Add new connection diagnostics interfaces
export interface ConnectionStatus {
  isConnected: boolean;
  lastConnectAttempt: number;
  lastDisconnectTime?: number;
  disconnectReason?: string;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
}

export interface ConnectionWarning {
  type: 'device' | 'network' | 'media' | 'general';
  message: string;
  error?: Error;
  timestamp: number;
}
