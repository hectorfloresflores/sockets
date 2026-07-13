# Socketgram

A small, Telegram-style group chat built to teach students how WebSockets work.
It uses Socket.IO for real-time messaging, an embedded SQLite database for
persistence, and a React frontend. The whole thing runs as a single process in
production: the Node backend serves the built React app and handles the sockets.

## Features

- Real-time group chat over Socket.IO.
- Join screen with an animated background, a username field, and a chat password.
- The username is the identity. A name can only be reused once its socket is
  closed, so if "Carlos" leaves, someone else can join as "Carlos".
- Each name is assigned a stable hex color the first time it is seen; the color
  is stored and reused for every future session.
- Persistent history in an embedded SQLite file; the full conversation loads on
  join.
- Live teaching signals: an online-users list in the header, join/leave system
  notifications ("new socket connected" / "socket closed"), and a typing
  indicator. Notifications are ephemeral (broadcast live, not stored).
- Message timestamps and per-user colored names.
- Admin reset button on the join screen (bottom) that wipes all messages and
  name colors, protected by a separate admin password.
- Error modals for an incorrect chat password and for a username that is already
  online.

## Tech stack

- Backend: Node.js, Express, Socket.IO, better-sqlite3 (embedded SQLite).
- Frontend: React, Vite, Tailwind CSS, socket.io-client.
- Packaging: multi-stage Docker image.

## Project structure

```
sockets/
  package.json            Convenience scripts (install:all, build, start, dev:*)
  Dockerfile              Multi-stage build (frontend build + backend runtime)
  .dockerignore
  backend/
    package.json
    src/
      index.js            Express + Socket.IO server; serves the built frontend
      db.js               SQLite setup, queries, reset
      colors.js           Stable per-name color assignment
      config.js           Passwords, port, limits (env-overridable)
    data/                 SQLite file lives here (created at runtime, git-ignored)
  frontend/
    package.json
    vite.config.js        Dev server + Socket.IO proxy to the backend
    index.html
    src/
      main.jsx
      App.jsx             State + socket wiring, screen switching, modals
      socket.js           Shared socket.io-client instance
      index.css           Tailwind import + animations
      components/
        JoinScreen.jsx
        ChatScreen.jsx
        FloatingBackground.jsx
        Modal.jsx
```

## Architecture

There are two parts. In development they run separately; in production they run
as one process.

- The backend creates an HTTP server with Express and attaches a Socket.IO
  server to it. Clients open a WebSocket connection and exchange events.
- Presence (who is online) is kept in memory as a map of username to socket id.
  A username is considered taken only while its socket is connected, which is
  why names free up when a browser tab closes.
- Messages and the name-to-color map are stored in a single SQLite file via
  better-sqlite3. On join, the server sends the full history to the new client.
- Join/leave notifications and the typing indicator are broadcast events only;
  they are never written to the database.
- In production the backend also serves the compiled React app from
  `frontend/dist`, so a single container exposes both the UI and the sockets on
  one port (3001).

Socket events:

- Client to server: `join`, `message`, `typing`, `reset` (each uses an ack
  callback for the result).
- Server to client: `message`, `system` (join/leave/reset notices), `users`
  (online list), `typing`, `reset` (clear the view).

Request/data flow at a glance:

```
Browser (React) <--WebSocket--> Socket.IO (Node/Express) <--> SQLite file
        |                                   |
   renders UI                        in-memory presence map
```

## Configuration

All settings live in `backend/src/config.js` and can be overridden with
environment variables:

- `JOIN_PASSWORD` (default `letmein`): required to enter the chat.
- `ADMIN_PASSWORD` (default `admin123`): required to reset history and colors.
- `PORT` (default `3001`): HTTP port the server listens on.

## Running locally

Install dependencies for both packages:

```
npm run install:all
```

Development (two terminals, hot reload). The Vite dev server proxies Socket.IO
traffic to the backend:

```
npm run dev:backend      # starts the API + sockets on :3001
npm run dev:frontend     # starts Vite on :5173
```

Open http://localhost:5173.

Production-style single process (backend serves the built UI):

```
npm run build            # builds frontend/dist
npm start                # serves everything on :3001
```

Open http://localhost:3001.

## Docker

Build the image from the repository root:

```
docker build -t socketgram:latest .
```

Run it, persisting the SQLite database to a named volume and overriding the
passwords:

```
docker run --rm -p 3001:3001 \
  -e JOIN_PASSWORD=letmein \
  -e ADMIN_PASSWORD=admin123 \
  -v socketgram-data:/app/backend/data \
  socketgram:latest
```

Open http://localhost:3001.

Notes:

- The image is multi-stage: one stage builds the frontend, one installs and
  compiles the backend (better-sqlite3 is a native module), and a slim runtime
  stage runs as the non-root `node` user.
- The SQLite file lives at `/app/backend/data`; mount a volume there to keep
  history across container restarts.