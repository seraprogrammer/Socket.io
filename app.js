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

// Listen for messages from Discord
client.on("messageCreate", (message) => {
  if (!message.author.bot) {
    console.log(`📩 New message: ${message.content}`);
    io.emit("newMessage", { username: message.author.username, content: message.content });
  }
});

// Listen for messages from the client and send them to Discord
io.on("connection", (socket) => {
  console.log("🟢 New Client Connected");

  socket.on("sendMessage", async (data) => {
    const channel = await client.channels.fetch(process.env.CHANNEL_ID);
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
  res.send("✅ Discord Bot Server is running!");
});

// Start Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Login Discord Bot
client.login(process.env.DISCORD_TOKEN);
