const path = require('path');
const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const { Server } = require('socket.io');

const db = require('./lib/db');
const { signToken, verifyToken } = require('./lib/auth');

const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---------- REST: auth ----------

app.post('/api/register', (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    return res.status(400).json({
      error: 'Username must be 3-20 characters: letters, numbers, underscore only.',
    });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }
  if (db.findUserByUsername(username)) {
    return res.status(409).json({ error: 'That username is already taken.' });
  }

  const id = crypto.randomUUID();
  const passwordHash = bcrypt.hashSync(password, 10);
  db.createUser({ id, username, passwordHash });

  const user = { id, username };
  const token = signToken(user);
  res.json({ token, user });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  const record = db.findUserByUsername(username || '');

  if (!record || !bcrypt.compareSync(password || '', record.passwordHash)) {
    return res.status(401).json({ error: 'Incorrect username or password.' });
  }

  const user = { id: record.id, username: record.username };
  const token = signToken(user);
  res.json({ token, user });
});

// ---------- REST: auth middleware ----------

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const payload = token && verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Not authenticated.' });
  req.user = payload;
  next();
}

app.get('/api/me', requireAuth, (req, res) => {
  res.json({ user: { id: req.user.id, username: req.user.username } });
});

app.get('/api/users', requireAuth, (req, res) => {
  const users = db
    .getUsers()
    .filter((u) => u.id !== req.user.id)
    .map((u) => ({ id: u.id, username: u.username, online: onlineUserIds.has(u.id) }));
  res.json({ users });
});

app.get('/api/messages/global', requireAuth, (req, res) => {
  res.json({ messages: db.getMessages('global') });
});

app.get('/api/messages/dm/:otherUserId', requireAuth, (req, res) => {
  const roomId = db.dmRoomId(req.user.id, req.params.otherUserId);
  res.json({ messages: db.getMessages(roomId) });
});

// ---------- Real-time ----------

const server = app.listen(PORT, () => {
  console.log(`Friend Chat running at http://localhost:${PORT}`);
});

const io = new Server(server);

// userId -> Set of socket ids (a user can have multiple tabs open)
const onlineUserIds = new Map();

function broadcastPresence() {
  io.emit('presence', { onlineUserIds: [...onlineUserIds.keys()] });
}

io.use((socket, next) => {
  const token = socket.handshake.auth && socket.handshake.auth.token;
  const payload = token && verifyToken(token);
  if (!payload) return next(new Error('Not authenticated'));
  socket.user = { id: payload.id, username: payload.username };
  next();
});

io.on('connection', (socket) => {
  const { id: userId, username } = socket.user;

  if (!onlineUserIds.has(userId)) onlineUserIds.set(userId, new Set());
  onlineUserIds.get(userId).add(socket.id);
  broadcastPresence();

  socket.join('global');

  socket.on('join-dm', (otherUserId) => {
    socket.join(db.dmRoomId(userId, otherUserId));
  });

  socket.on('send-message', ({ roomType, otherUserId, text }) => {
    const cleanText = String(text || '').trim().slice(0, 2000);
    if (!cleanText) return;

    let roomId;
    if (roomType === 'global') {
      roomId = 'global';
    } else if (roomType === 'dm' && otherUserId) {
      roomId = db.dmRoomId(userId, otherUserId);
    } else {
      return;
    }

    const msg = db.addMessage({
      roomId,
      fromId: userId,
      fromUsername: username,
      text: cleanText,
    });

    io.to(roomId).emit('new-message', msg);
  });

  socket.on('typing', ({ roomType, otherUserId }) => {
    const roomId = roomType === 'global' ? 'global' : db.dmRoomId(userId, otherUserId);
    socket.to(roomId).emit('typing', { roomId, fromUsername: username });
  });

  socket.on('disconnect', () => {
    const set = onlineUserIds.get(userId);
    if (set) {
      set.delete(socket.id);
      if (set.size === 0) onlineUserIds.delete(userId);
    }
    broadcastPresence();
  });
});
