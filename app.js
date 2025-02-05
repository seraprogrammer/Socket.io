require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  perMessageDeflate: false, // Disable compression for low-latency
  httpCompression: false,
  maxHttpBufferSize: 1e6, // 1MB
  pingInterval: 5000, // Faster pings for better responsiveness
  pingTimeout: 2500,
  transports: ['websocket'], // Enforce WebSocket only
  allowUpgrades: true,
  upgradeTimeout: 10000,
  cookie: false
});

const rooms = new Map(); // Store room information

// Optimize room broadcasts
io.on("connection", (socket) => {
  console.log(`🔗 User connected: ${socket.id}`);

  // Handle joining a room with acknowledgment
  socket.on("joinRoom", (roomId, callback) => {
    try {
      console.log(`User ${socket.id} joining room ${roomId}`);
      socket.join(roomId);
      
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
      }
      rooms.get(roomId).add(socket.id);

      const roomUsers = Array.from(rooms.get(roomId));
      
      // Notify others in the room
      socket.to(roomId).emit("userJoined", socket.id);
      
      // Send users list to everyone in the room
      io.in(roomId).emit("updateUsers", roomUsers);
      
      // Send join confirmation to the client
      socket.emit("roomJoined", { roomId });
      
      // Send acknowledgment with users list
      if (callback) {
        callback({ 
          success: true, 
          users: roomUsers 
        });
      }
      
      console.log(`Room ${roomId} users:`, roomUsers);
    } catch (error) {
      console.error(`Error joining room ${roomId}:`, error);
      if (callback) {
        callback({ 
          success: false, 
          error: "Failed to join room" 
        });
      }
    }
  });

  // Handle leaving a room with acknowledgment
  socket.on("leaveRoom", (roomId, callback) => {
    try {
      console.log(`User ${socket.id} leaving room ${roomId}`);
      socket.leave(roomId);
      
      if (rooms.has(roomId)) {
        rooms.get(roomId).delete(socket.id);
        
        // If room is empty, delete it
        if (rooms.get(roomId).size === 0) {
          rooms.delete(roomId);
        } else {
          // Notify others and update users list
          const roomUsers = Array.from(rooms.get(roomId));
          socket.to(roomId).emit("userLeft", socket.id);
          io.in(roomId).emit("updateUsers", roomUsers);
        }
      }
      
      if (callback) {
        callback({ success: true });
      }
    } catch (error) {
      console.error(`Error leaving room ${roomId}:`, error);
      if (callback) {
        callback({ success: false, error: "Failed to leave room" });
      }
    }
  });

  // Optimize room broadcasts
  socket.on("editorContent", (data) => {
    socket.broadcast.to(data.room).emit("editorContent", data.text);
  });
  
  // Handle output updates
  socket.on("outputUpdate", ({ room, content }) => {
    socket.broadcast.to(room).emit("outputUpdate", content);
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log(`❌ User disconnected: ${socket.id}`);
    rooms.forEach((users, roomId) => {
      if (users.has(socket.id)) {
        handleLeaveRoom(socket, roomId);
      }
    });
  });
});

function handleLeaveRoom(socket, roomId) {
  if (rooms.has(roomId)) {
    rooms.get(roomId).delete(socket.id);
    socket.leave(roomId);
    
    // Notify others that user left
    socket.to(roomId).emit("userLeft", socket.id);
    
    // If room is empty, delete it
    if (rooms.get(roomId).size === 0) {
      rooms.delete(roomId);
    } else {
      // Update user list for remaining users
      const roomUsers = Array.from(rooms.get(roomId));
      io.to(roomId).emit("updateUsers", roomUsers);
    }
  }
}

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
