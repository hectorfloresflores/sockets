// SQLite database layer for Socketgram.
// We use better-sqlite3: a single embedded file, synchronous API, zero config.
// The whole conversation and the name->color map live in ./data/socketgram.db
import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'data');
mkdirSync(dataDir, { recursive: true });

const db = new Database(join(dataDir, 'socketgram.db'));
db.pragma('journal_mode = WAL');

// messages: every chat message ever sent (loaded fully on join).
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    username  TEXT NOT NULL,
    color     TEXT NOT NULL,
    text      TEXT NOT NULL,
    createdAt INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS user_colors (
    username TEXT PRIMARY KEY,
    color    TEXT NOT NULL
  );
`);

// Prepared statements (fast + safe from SQL injection).
const stmts = {
  insertMessage: db.prepare(
    'INSERT INTO messages (username, color, text, createdAt) VALUES (?, ?, ?, ?)'
  ),
  allMessages: db.prepare('SELECT * FROM messages ORDER BY id ASC'),
  getColor: db.prepare('SELECT color FROM user_colors WHERE username = ?'),
  setColor: db.prepare('INSERT INTO user_colors (username, color) VALUES (?, ?)'),
  clearMessages: db.prepare('DELETE FROM messages'),
  clearColors: db.prepare('DELETE FROM user_colors'),
};

export function getAllMessages() {
  return stmts.allMessages.all();
}

export function saveMessage({ username, color, text, createdAt }) {
  const info = stmts.insertMessage.run(username, color, text, createdAt);
  return { id: info.lastInsertRowid, username, color, text, createdAt };
}

// Returns the persisted color for a username, or null if it has none yet.
export function getUserColor(username) {
  const row = stmts.getColor.get(username);
  return row ? row.color : null;
}

// Persists a color for a username (called once, the first time they join).
export function setUserColor(username, color) {
  stmts.setColor.run(username, color);
}

// Admin reset: wipe every message AND every stored name->color assignment.
export function resetEverything() {
  const tx = db.transaction(() => {
    stmts.clearMessages.run();
    stmts.clearColors.run();
  });
  tx();
}

export default db;
