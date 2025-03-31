const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Store active users in rooms
const rooms = new Map();

io.on('connection', (socket) => {
  const { userId, roomId } = socket.handshake.auth;
  
  if (!userId || !roomId) {
    socket.disconnect();
    return;
  }
  
  console.log(`User ${userId} connected to room ${roomId}`);
  
  // Add user to room
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }
  rooms.get(roomId).add(userId);
  
  // Join socket room
  socket.join(roomId);
  
  // Notify others in the room
  socket.to(roomId).emit('user-joined', { userId });
  
  // Notify the new user about existing participants
  const participants = Array.from(rooms.get(roomId)).filter(id => id !== userId);
  if (participants.length > 0) {
    socket.emit('existing-users', { participants });
  }
  
  // Handle signaling
  socket.on('signal', ({ to, signal }) => {
    io.to(to).emit('signal', {
      from: userId,
      signal
    });
  });
  
  // Handle messages
  socket.on('message', ({ message }) => {
    io.to(roomId).emit('message', {
      from: userId,
      message,
      timestamp: Date.now()
    });
  });
  
  // Handle room events
  socket.on('join-room', ({ roomId }) => {
    console.log(`User ${userId} joined room ${roomId}`);
  });
  
  socket.on('leave-room', ({ roomId }) => {
    leaveRoom(userId, roomId);
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User ${userId} disconnected from room ${roomId}`);
    leaveRoom(userId, roomId);
  });
  
  // Helper function to handle user leaving a room
  function leaveRoom(userId, roomId) {
    if (rooms.has(roomId)) {
      rooms.get(roomId).delete(userId);
      
      // Delete room if empty
      if (rooms.get(roomId).size === 0) {
        rooms.delete(roomId);
      } else {
        // Notify others that user has left
        socket.to(roomId).emit('user-left', { userId });
      }
    }
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
}); 