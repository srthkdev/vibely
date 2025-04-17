const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

// Initialize Prisma with error handling
let prisma;
try {
  prisma = new PrismaClient();
  console.log('Prisma client initialized successfully');
} catch (error) {
  console.error('Failed to initialize Prisma client:', error);
  // Create a mock prisma client for core functionality
  prisma = {
    room: {
      findUnique: async () => ({ ownerId: null }),
      findMany: async () => []
    },
    user: {
      findFirst: async () => null,
      findUnique: async () => null
    }
  };
  console.log('Using mock Prisma client');
}

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  path: '/api/socket',
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 20000,
  pingInterval: 25000
});

// Store active rooms and their participants
const rooms = new Map();

// Store user information for quick access
const users = new Map();

// Function to get updated participant count for a room
const getParticipantCount = (roomId) => {
  return rooms.has(roomId) ? rooms.get(roomId).size : 0;
};

// Function to get all participants in a room
const getRoomParticipants = (roomId) => {
  if (!rooms.has(roomId)) return [];
  
  const participantsList = [];
  for (const userId of rooms.get(roomId).keys()) {
    const user = users.get(userId);
    if (user) {
      participantsList.push({
        id: userId,
        name: user.name,
        imageUrl: user.imageUrl,
        isMuted: user.isMuted,
        isVideoOff: user.isVideoOff,
        isAdmin: user.isAdmin
      });
    }
  }
  
  return participantsList;
};

// Broadcast updated participant count to all users in a room
const broadcastParticipantCount = (roomId) => {
  const count = getParticipantCount(roomId);
  io.to(roomId).emit('room-participant-count', { roomId, count });
};

// Broadcast updated participants list to all users in a room
const broadcastParticipants = (roomId) => {
  const participants = getRoomParticipants(roomId);
  io.to(roomId).emit('participants', participants);
};

// Check if a user is an admin (room owner)
async function verifyAdmin(userId, roomId) {
  try {
    // Find the room and check if the user is the owner
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: { ownerId: true }
    });
    
    if (!room) return false;
    
    // Find the user with the given clerkId
    const user = await prisma.user.findFirst({
      where: { clerkId: userId }
    });
    
    if (!user) return false;
    
    // Check if the user is the room owner
    return room.ownerId === user.id;
  } catch (error) {
    console.error('Error verifying admin status:', error);
    // If database errors occur, just make the first user the admin for this session
    const roomUsers = rooms.get(roomId);
    if (roomUsers && roomUsers.size > 0) {
      const firstUserId = [...roomUsers.keys()][0];
      return userId === firstUserId;
    }
    return false;
  }
}

io.on('connection', async (socket) => {
  const { userId, roomId, userName, userImage } = socket.handshake.auth;
  
  if (!userId || !roomId) {
    console.log('Connection rejected: missing userId or roomId');
    socket.disconnect();
    return;
  }
  
  console.log(`User ${userId} (${userName}) connected to room ${roomId}`);
  
  // Store socket ID for easier reference
  socket.data.userId = userId;
  socket.data.roomId = roomId;
  
  // Check if the user is an admin (room owner)
  const isAdmin = await verifyAdmin(userId, roomId);
  
  // Add user to the room and store user info
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Map());
  }
  
  // Store user information
  users.set(userId, {
    socketId: socket.id,
    name: userName || 'Anonymous',
    imageUrl: userImage || '',
    isMuted: false,
    isVideoOff: false,
    isAdmin
  });
  
  // Add user to room
  rooms.get(roomId).set(userId, socket.id);
  
  // Join socket room
  socket.join(roomId);
  
  // Send connection acknowledgement
  socket.emit('connection-success', { 
    id: socket.id,
    isAdmin
  });
  
  // Notify all clients in the room about the new user
  const userInfo = users.get(userId);
  socket.to(roomId).emit('user-joined', {
    id: userId,
    name: userInfo.name,
    imageUrl: userInfo.imageUrl,
    isMuted: userInfo.isMuted,
    isVideoOff: userInfo.isVideoOff,
    isAdmin: userInfo.isAdmin
  });
  
  // Send existing participants to the new user
  socket.emit('participants', getRoomParticipants(roomId));
  
  // Broadcast updated participant count
  broadcastParticipantCount(roomId);

  // WebRTC signaling
  socket.on('signal', ({ to, signal }) => {
    const toSocketId = users.get(to)?.socketId;
    if (toSocketId) {
      io.to(toSocketId).emit('signal', {
        from: userId,
        signal
      });
    }
  });
  
  // Chat messages
  socket.on('send-message', (message) => {
    io.to(roomId).emit('new-message', {
      id: Date.now().toString(),
      senderId: userId,
      senderName: users.get(userId)?.name || 'Anonymous',
      content: message,
      timestamp: new Date().toISOString()
    });
  });
  
  // Handle user status changes
  socket.on('user-status-change', ({ isMuted, isVideoOff }) => {
    const user = users.get(userId);
    if (user) {
      user.isMuted = isMuted;
      user.isVideoOff = isVideoOff;
      users.set(userId, user);
      
      // Notify others about the status change
      socket.to(roomId).emit('user-status-changed', {
        userId,
        isMuted,
        isVideoOff
      });
      
      // Update and broadcast participants
      broadcastParticipants(roomId);
    }
  });
  
  // Admin actions
  socket.on('admin-action', async ({ targetUserId, action }) => {
    const isUserAdmin = await verifyAdmin(userId, roomId);
    if (!isUserAdmin) {
      socket.emit('error', { message: 'Not authorized to perform admin actions' });
      return;
    }
    
    const targetSocketId = users.get(targetUserId)?.socketId;
    if (!targetSocketId) return;
    
    switch (action) {
      case 'mute':
        io.to(targetSocketId).emit('force-mute');
        const user = users.get(targetUserId);
        if (user) {
          user.isMuted = true;
          users.set(targetUserId, user);
          broadcastParticipants(roomId);
        }
        break;
      case 'disable-video':
        io.to(targetSocketId).emit('force-disable-video');
        const videoUser = users.get(targetUserId);
        if (videoUser) {
          videoUser.isVideoOff = true;
          users.set(targetUserId, videoUser);
          broadcastParticipants(roomId);
        }
        break;
      case 'kick':
        io.to(targetSocketId).emit('kicked-from-room');
        break;
      default:
        break;
    }
  });
  
  // Room deletion
  socket.on('delete-room', async () => {
    const isUserAdmin = await verifyAdmin(userId, roomId);
    if (!isUserAdmin) {
      socket.emit('error', { message: 'Not authorized to delete room' });
      return;
    }
    
    // Notify all users in the room that it's being deleted
    io.to(roomId).emit('room-deleted');
    
    // Clean up room data
    if (rooms.has(roomId)) {
      rooms.delete(roomId);
    }
  });
  
  // Handle keep-alive messages
  socket.on('keep-alive', () => {
    socket.emit('keep-alive-response', { timestamp: Date.now() });
  });
  
  // Handle user leaving or disconnecting
  const handleUserLeave = () => {
    console.log(`User ${userId} disconnected from room ${roomId}`);
    
    // Remove user from the room
    if (rooms.has(roomId)) {
      rooms.get(roomId).delete(userId);
      
      // Notify others that the user has left
      socket.to(roomId).emit('user-left', { userId });
      
      // Update participant count
      broadcastParticipantCount(roomId);
      
      // Update participants list
      broadcastParticipants(roomId);
      
      // Delete room if empty
      if (rooms.get(roomId).size === 0) {
        rooms.delete(roomId);
      }
    }
    
    // Clean up user data
    users.delete(userId);
  };
  
  socket.on('leave-room', handleUserLeave);
  socket.on('disconnect', handleUserLeave);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 