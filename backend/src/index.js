// Socketgram server: Express (static + health) + Socket.IO (real-time chat).
import express from 'express';
import cors from 'cors';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { CONFIG } from './config.js';
import { getAllMessages, saveMessage, resetEverything } from './db.js';
import { getOrCreateColor } from './colors.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

// --- Online users -----------------------------------------------------------
// A username IS the identity. It can only be reused when its socket is closed.
// online: Map<username, socketId>
const online = new Map();
const onlineList = () => [...online.keys()];

// --- Socket.IO events -------------------------------------------------------
io.on('connection', (socket) => {
  // The username this socket has claimed (set after a successful join).
  socket.data.username = null;

  socket.on('join', ({ username, password }, ack) => {
    const name = String(username || '').trim().slice(0, CONFIG.MAX_NAME_LENGTH);

    if (!name) return ack?.({ ok: false, error: 'empty_name' });
    if (password !== CONFIG.JOIN_PASSWORD) {
      return ack?.({ ok: false, error: 'wrong_password' });
    }
    // Name can only be taken if it is NOT currently connected.
    if (online.has(name)) {
      return ack?.({ ok: false, error: 'name_taken' });
    }

    const color = getOrCreateColor(name);
    socket.data.username = name;
    online.set(name, socket.id);

    // Send the joining client everything they need to render the chat.
    ack?.({
      ok: true,
      username: name,
      color,
      history: getAllMessages(),
      users: onlineList(),
    });

    // Ephemeral join notification (NOT stored in the DB) so students literally
    // see a new socket appear in real time.
    io.emit('system', {
      type: 'join',
      username: name,
      color,
      text: `🟢 New socket connected — ${name} joined the chat`,
      at: Date.now(),
    });
    io.emit('users', onlineList());
  });

  socket.on('message', (text, ack) => {
    const username = socket.data.username;
    if (!username) return ack?.({ ok: false, error: 'not_joined' });

    const clean = String(text || '').trim().slice(0, CONFIG.MAX_MESSAGE_LENGTH);
    if (!clean) return ack?.({ ok: false, error: 'empty' });

    const color = getOrCreateColor(username);
    const msg = saveMessage({ username, color, text: clean, createdAt: Date.now() });
    io.emit('message', msg);
    ack?.({ ok: true });
  });

  // Ephemeral typing indicator (broadcast to everyone except the sender).
  socket.on('typing', (isTyping) => {
    const username = socket.data.username;
    if (!username) return;
    socket.broadcast.emit('typing', { username, isTyping: !!isTyping });
  });

  // Admin-only: wipe messages AND name->color assignments.
  socket.on('reset', ({ password }, ack) => {
    if (password !== CONFIG.ADMIN_PASSWORD) {
      return ack?.({ ok: false, error: 'wrong_admin_password' });
    }
    resetEverything();
    io.emit('reset');
    io.emit('system', {
      type: 'reset',
      text: '🧹 An admin cleared the chat history and name colors',
      at: Date.now(),
    });
    ack?.({ ok: true });
  });

  socket.on('disconnect', () => {
    const username = socket.data.username;
    if (username && online.get(username) === socket.id) {
      online.delete(username);
      io.emit('system', {
        type: 'leave',
        username,
        text: `🔴 Socket closed — ${username} left the chat`,
        at: Date.now(),
      });
      io.emit('users', onlineList());
    }
  });
});

// --- Serve the built React frontend in production ---------------------------
const clientDir = join(__dirname, '..', '..', 'frontend', 'dist');
if (existsSync(clientDir)) {
  app.use(express.static(clientDir));
  app.get('*', (_req, res) => res.sendFile(join(clientDir, 'index.html')));
} else {
  app.get('/', (_req, res) =>
    res.send('Socketgram backend running. Build the frontend (npm run build) to serve the UI.')
  );
}

httpServer.listen(CONFIG.PORT, () => {
  console.log(`⚡ Socketgram server listening on http://localhost:${CONFIG.PORT}`);
});
