require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const rooms = new Map(); // Store room information

io.on("connection", (socket) => {
  console.log(`🔗 User connected: ${socket.id}`);

  // Handle joining a room
  socket.on("joinRoom", (roomId) => {
    console.log(`User ${socket.id} joining room ${roomId}`);
    socket.join(roomId);
    
    // Initialize room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    rooms.get(roomId).add(socket.id);

    // Notify others in the room
    socket.to(roomId).emit("userJoined", socket.id);
    
    // Send current users in the room
    const roomUsers = Array.from(rooms.get(roomId));
    io.to(roomId).emit("updateUsers", roomUsers);
  });

  // Handle leaving a room
  socket.on("leaveRoom", (roomId) => {
    console.log(`User ${socket.id} leaving room ${roomId}`);
    handleLeaveRoom(socket, roomId);
  });

  // Handle editor content updates
  socket.on("editorContent", ({ room, content }) => {
    socket.to(room).emit("editorContent", { content });
  });

  // Handle output updates
  socket.on("outputUpdate", ({ room, content }) => {
    socket.to(room).emit("outputUpdate", { content });
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log(`❌ User disconnected: ${socket.id}`);
    // Clean up all rooms this socket was in
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
