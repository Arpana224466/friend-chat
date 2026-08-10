// Very small file-based "database". Good enough for a friend group chat app.
// Everything lives in the /data folder as JSON files.

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

function ensureFile(file, defaultValue) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(defaultValue, null, 2));
  }
}

ensureFile(USERS_FILE, []);
ensureFile(MESSAGES_FILE, []);

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJSON(file, data) {
  // write to a temp file then rename, so a crash mid-write can't corrupt the file
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
}

// ---- Users ----

function getUsers() {
  return readJSON(USERS_FILE);
}

function findUserByUsername(username) {
  return getUsers().find(
    (u) => u.username.toLowerCase() === String(username).toLowerCase()
  );
}

function findUserById(id) {
  return getUsers().find((u) => u.id === id);
}

function createUser({ id, username, passwordHash }) {
  const users = getUsers();
  users.push({ id, username, passwordHash, createdAt: Date.now() });
  writeJSON(USERS_FILE, users);
}

// ---- Messages ----
// A "room" id is either "global" or a sorted pair of user ids like "u1__u2" for DMs.

function getMessages(roomId, limit = 100) {
  const all = readJSON(MESSAGES_FILE);
  return all.filter((m) => m.roomId === roomId).slice(-limit);
}

function addMessage({ roomId, fromId, fromUsername, text }) {
  const all = readJSON(MESSAGES_FILE);
  const msg = {
    id: Date.now() + '-' + Math.random().toString(36).slice(2, 8),
    roomId,
    fromId,
    fromUsername,
    text,
    ts: Date.now(),
  };
  all.push(msg);
  writeJSON(MESSAGES_FILE, all);
  return msg;
}

function dmRoomId(idA, idB) {
  return [idA, idB].sort().join('__');
}

module.exports = {
  getUsers,
  findUserByUsername,
  findUserById,
  createUser,
  getMessages,
  addMessage,
  dmRoomId,
};
