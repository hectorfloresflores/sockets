import { io } from 'socket.io-client';

// In dev, Vite proxies /socket.io -> :3001 (see vite.config.js).
// In production the backend serves the app, so a same-origin connection works.
// autoConnect:false lets us connect only when the user actually joins.
export const socket = io({
  autoConnect: false,
});
