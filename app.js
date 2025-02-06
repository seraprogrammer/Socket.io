require("dotenv").config();
const express = require("express");
const { Client, GatewayIntentBits } = require("discord.js");
const { Server } = require("socket.io");
const http = require("http");
const cors = require("cors");

// Initialize Express App
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" } // Allow all clients to connect
});

// Middleware
app.use(cors());

// Create Discord Bot
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent // Required for reading messages
  ],
});

client.once("ready", () => {
  console.log(`✅ Bot logged in as ${client.user.tag}`);
});

// Listen for messages
client.on("messageCreate", (message) => {
  if (!message.author.bot) { // Ignore bot messages
    console.log(`📩 New message: ${message.content}`);

    // Send the message to all connected clients
    io.emit("newMessage", {
      username: message.author.username,
      content: message.content,
    });
  }
});

// API Route for health check
app.get("/", (req, res) => {
  res.send("✅ Discord Bot Server is running!");
});

// Start Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Login Discord Bot
client.login(process.env.DISCORD_TOKEN);
