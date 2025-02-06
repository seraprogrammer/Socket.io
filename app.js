require("dotenv").config();
const express = require("express");
const { Client, GatewayIntentBits } = require("discord.js");
const { Server } = require("socket.io");
const http = require("http");
const cors = require("cors");

// Initialize Express App
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());

// Create Discord Bot
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // Read messages
  ],
});

client.once("ready", () => {
  console.log(`✅ Bot logged in as ${client.user.tag}`);
});

// Define the global chat room channel
const GLOBAL_CHAT_CHANNEL_ID = process.env.CHANNEL_ID;

// Fetch messages from Discord when a user connects
async function fetchChatHistory(socket) {
  try {
    const channel = await client.channels.fetch(GLOBAL_CHAT_CHANNEL_ID);
    const messages = await channel.messages.fetch({ limit: 20 });

    const chatHistory = messages.map((msg) => ({
      username: msg.author.username,
      content: msg.content,
    })).reverse(); // Show oldest first

    socket.emit("chatHistory", chatHistory);
  } catch (error) {
    console.error("Error fetching messages:", error);
  }
}

// Listen for messages from Discord
client.on("messageCreate", (message) => {
  if (message.channel.id === GLOBAL_CHAT_CHANNEL_ID && !message.author.bot) {
    io.emit("newMessage", {
      username: message.author.username,
      content: message.content,
    });
  }
});

// Handle socket.io connections
io.on("connection", (socket) => {
  console.log("🟢 New Client Connected");

  // Send chat history when user connects
  fetchChatHistory(socket);

  // Handle message sending
  socket.on("sendMessage", async (data) => {
    const channel = await client.channels.fetch(GLOBAL_CHAT_CHANNEL_ID);
    if (channel) {
      channel.send(`${data.username}: ${data.message}`);
    }
  });

  socket.on("disconnect", () => {
    console.log("🔴 Client Disconnected");
  });
});

// API Route for health check
app.get("/", (req, res) => {
  res.send("✅ Discord Global Chat Server is running!");
});

// Start Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  await client.login(process.env.DISCORD_TOKEN);
});
