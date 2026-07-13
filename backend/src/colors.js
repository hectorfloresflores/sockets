// Assigns a stable, pleasant hex color to each username.
// The color is generated once and then persisted in the DB, so a given name
// (e.g. "hector") always shows in the same color across sessions.
import { getUserColor, setUserColor } from './db.js';

// A curated palette of bright, readable colors that look good on the dark
// Telegram-style chat bubbles. We start from these and only fall back to a
// fully random hex when the palette is exhausted.
const PALETTE = [
  '#e17076', '#7bc862', '#65aadd', '#a695e7', '#ee7aae',
  '#6ec9cb', '#faa774', '#5ca6e4', '#f2749a', '#88c057',
  '#d97ede', '#4db8a8', '#e8a33d', '#7986cb', '#4db6ac',
];

function randomHex() {
  const n = Math.floor(Math.random() * 0xffffff);
  return '#' + n.toString(16).padStart(6, '0');
}

// Returns the (stable) color for a username, creating + persisting one the
// first time we ever see that name.
export function getOrCreateColor(username) {
  const existing = getUserColor(username);
  if (existing) return existing;

  // Pick from the palette based on how many colors we've assigned, so the
  // first few users get distinct, nice colors before we fall back to random.
  const color = PALETTE[Math.floor(Math.random() * PALETTE.length)] || randomHex();
  setUserColor(username, color);
  return color;
}
