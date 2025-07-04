const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

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

app.prepare().then(() => {
  const expressApp = express();
  
  // CORS middleware
  expressApp.use(cors({
    origin: process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${port}`,
    credentials: true
  }));

  const server = http.createServer(expressApp);
  
  // Socket.IO setup
  const io = new Server(server, {
    path: '/api/socket',
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${port}`,
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 20000,
    pingInterval: 25000
  });

  // Store active rooms and their participants
  const rooms = new Map();
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

  // Broadcast updated participant count to all users in a room AND to room management
  const broadcastParticipantCount = (roomId) => {
    const count = getParticipantCount(roomId);
    // Send to users in the room
    io.to(roomId).emit('room-participant-count', { roomId, count });
    // Send to room management page users
    io.to('room-management').emit('room-participant-count', { roomId, count });
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

  // Socket.IO connection handling
  io.on('connection', async (socket) => {
    const { userId, roomId, userName, userImage } = socket.handshake.auth;
    
    // Handle room management connections (for rooms list page)
    if (!roomId && userId) {
      console.log(`Room management connection from user ${userId}`);
      socket.join('room-management');
      
      socket.on('join-room-management', () => {
        console.log(`User ${userId} explicitly joined room-management`);
        socket.join('room-management');
      });
      
      socket.on('disconnect', () => {
        console.log(`Room management user ${userId} disconnected`);
      });
      
      return; // Exit early for room management connections
    }
    
    if (!userId || !roomId) {
      console.log('Connection rejected: missing userId or roomId');
      socket.disconnect();
      return;
    }
    
    // Check if user is already connected to this room
    const existingUser = users.get(userId);
    if (existingUser && rooms.has(roomId) && rooms.get(roomId).has(userId)) {
      console.log(`User ${userId} already connected to room ${roomId}, disconnecting old connection`);
      
      // Disconnect the old socket
      const oldSocketId = existingUser.socketId;
      const oldSocket = io.sockets.sockets.get(oldSocketId);
      if (oldSocket) {
        oldSocket.disconnect();
      }
      
      // Clean up old data
      rooms.get(roomId).delete(userId);
      users.delete(userId);
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
  expressApp.get('/api/health', (req, res) => {
    res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      socketConnections: io.engine.clientsCount,
      activeRooms: rooms.size
    });
  });

  // Handle all other requests with Next.js
  expressApp.all('*', (req, res) => {
    return handle(req, res);
  });

  server.listen(port, () => {
    console.log(`🚀 Combined server running on port ${port}`);
    console.log(`📡 Socket.IO server ready`);
    console.log(`🌐 Next.js app ready`);
    console.log(`🔗 Health check: http://localhost:${port}/api/health`);
  });
}); 