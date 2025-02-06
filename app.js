const express = require('express');
const app = express();
const port = 3000;

app.get('/join', (req, res) => {
  // Trigger the bot to join a voice channel
  client.emit('messageCreate', { content: '!join', member: { voice: { channel: { id: 'CHANNEL_ID' } } } });
  res.json({ status: 'joined' });
});

app.get('/leave', (req, res) => {
  // Trigger the bot to leave the voice channel
  client.emit('messageCreate', { content: '!leave', member: { voice: { channel: { id: 'CHANNEL_ID' } } } });
  res.json({ status: 'left' });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
