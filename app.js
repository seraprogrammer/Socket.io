require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const users = {}; // Store connected users

io.on("connection", (socket) => {
  console.log(`🔗 User connected: ${socket.id}`);

  // Store user info
  socket.on("join", (username) => {
    users[socket.id] = username;
    console.log(`👤 ${username} joined as ${socket.id}`);
    io.emit("updateUsers", Object.values(users)); // Update users list
  });

  // Handle WebRTC offer
  socket.on("offer", (data) => {
    console.log(`📡 Offer sent from ${socket.id} to ${data.target}`);
    socket
      .to(data.target)
      .emit("offer", { sender: socket.id, offer: data.offer });
  });

  // Handle WebRTC answer
  socket.on("answer", (data) => {
    console.log(`✅ Answer sent from ${socket.id} to ${data.target}`);
    socket
      .to(data.target)
      .emit("answer", { sender: socket.id, answer: data.answer });
  });

  // Handle ICE candidates
  socket.on("ice-candidate", (data) => {
    console.log(`❄️ ICE Candidate from ${socket.id} to ${data.target}`);
    socket
      .to(data.target)
      .emit("ice-candidate", { sender: socket.id, candidate: data.candidate });
  });

  // Handle real-time chat messages
  socket.on("message", (data) => {
    console.log(`💬 ${users[socket.id]}: ${data.message}`);
    io.emit("message", { sender: users[socket.id], message: data.message });
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log(`❌ User disconnected: ${users[socket.id] || socket.id}`);
    delete users[socket.id];
    io.emit("updateUsers", Object.values(users));
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
