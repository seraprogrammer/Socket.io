require('dotenv').config(); // Load environment variables from .env file

const { Client, GatewayIntentBits } = require("discord.js");
const { joinVoiceChannel, getVoiceConnection } = require("@discordjs/voice");
const express = require("express");
const cors = require("cors");
const app = express();
const port = 3000;

// Use environment variables from .env file
const token = process.env.DISCORD_TOKEN; // Bot token from .env file
const channelId = process.env.CHANNEL_ID; // Voice channel ID from .env file

// 🔹 Fix: Improved CORS Handling
app.use(cors({
  origin: '*', // Allows all origins (Change '*' to specific origins in production)
  methods: ['GET', 'POST'], // Specify allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Specify allowed headers
}));

// Handle CORS preflight requests
app.options('*', cors());

// Initialize Discord Client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates, // Required for interacting with voice channels
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}!`);
});

// ✅ Endpoint to make the bot join a voice channel
app.get("/join", async (req, res) => {
  try {
    if (!client.isReady()) {
      return res.status(400).json({ error: "❌ Bot is not logged in or ready" });
    }

    const channel = client.channels.cache.get(channelId);
    
    if (!channel || channel.type !== 2) { // Type 2 = Voice Channel
      return res.status(400).json({ error: "❌ Invalid voice channel ID" });
    }

    joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
    });

    console.log(`✅ Joined voice channel: ${channelId}`);
    res.json({ status: "✅ Joined", channel: channelId });

  } catch (error) {
    console.error("❌ Error joining voice channel:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Endpoint to make the bot leave a voice channel
app.get("/leave", async (req, res) => {
  try {
    if (!client.isReady()) {
      return res.status(400).json({ error: "❌ Bot is not logged in or ready" });
    }

    const connection = getVoiceConnection(channelId);
    
    if (!connection) {
      return res.status(400).json({ error: "❌ Bot is not in a voice channel" });
    }

    connection.destroy();
    console.log(`✅ Left voice channel: ${channelId}`);
    res.json({ status: "✅ Left", channel: channelId });

  } catch (error) {
    console.error("❌ Error leaving voice channel:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Start the Express server
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});

// ✅ Log the bot in with the bot token
client.login(token).catch(error => {
  console.error("❌ Failed to login bot:", error);
});
