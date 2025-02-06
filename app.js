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

app.use(cors({
  origin: '*',  // This will allow any origin to make requests
}));

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
  console.log(`Logged in as ${client.user.tag}!`);
});

// Endpoint to make the bot join a voice channel
app.get("/join", (req, res) => {
  if (client.isReady()) {
    const channel = client.channels.cache.get(channelId);

    if (channel && channel.isVoice()) {
      joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
      });

      res.json({ status: "joined", channel: channelId });
    } else {
      res.status(400).json({ error: "Invalid voice channel ID" });
    }
  } else {
    res.status(400).json({ error: "Bot is not logged in or ready" });
  }
});

// Endpoint to make the bot leave a voice channel
app.get("/leave", (req, res) => {
  if (client.isReady()) {
    const connection = getVoiceConnection(channelId);

    if (connection) {
      connection.destroy();
      res.json({ status: "left", channel: channelId });
    } else {
      res.status(400).json({ error: "Bot is not in a voice channel" });
    }
  } else {
    res.status(400).json({ error: "Bot is not logged in or ready" });
  }
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// Log the bot in with the bot token
client.login(token);
