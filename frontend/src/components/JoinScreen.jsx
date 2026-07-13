import { useState } from 'react';
import FloatingBackground from './FloatingBackground.jsx';

// First page: animated title + join form (username + password) and, at the
// very bottom, the admin-only reset button.
export default function JoinScreen({ onJoin, onReset, connecting }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    onJoin(username.trim(), password);
  };

  const submitReset = (e) => {
    e.preventDefault();
    if (!adminPassword) return;
    onReset(adminPassword);
    setAdminPassword('');
  };

  return (
    <div className="relative flex min-h-full flex-col items-center justify-between overflow-hidden bg-gradient-to-b from-[#0e1621] to-[#17212b] px-4 py-10">
      <FloatingBackground />

      {/* Title + form */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center">
        <div className="mb-2 text-6xl">💬</div>
        <h1 className="bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent sm:text-6xl">
          Socketgram
        </h1>
        <p className="mt-3 text-center text-sm text-slate-400">
          A tiny real-time chat to show how WebSockets work ⚡
        </p>

        <form
          onSubmit={submit}
          className="mt-8 w-[90vw] max-w-sm space-y-3 rounded-2xl bg-[#17212b]/80 p-6 shadow-2xl ring-1 ring-white/10 backdrop-blur"
        >
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Your name"
            maxLength={24}
            autoFocus
            className="w-full rounded-xl bg-[#0e1621] px-4 py-3 text-white outline-none ring-1 ring-white/10 transition placeholder:text-slate-500 focus:ring-2 focus:ring-sky-500"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Chat password"
            className="w-full rounded-xl bg-[#0e1621] px-4 py-3 text-white outline-none ring-1 ring-white/10 transition placeholder:text-slate-500 focus:ring-2 focus:ring-sky-500"
          />
          <button
            type="submit"
            disabled={connecting}
            className="w-full rounded-xl bg-sky-500 py-3 font-semibold text-white transition hover:bg-sky-400 active:scale-[0.98] disabled:opacity-60"
          >
            {connecting ? 'Joining…' : 'Join chat'}
          </button>
        </form>
      </div>

      {/* Admin reset at the very bottom */}
      <div className="relative z-10 mt-8 w-[90vw] max-w-sm text-center">
        {!showReset ? (
          <button
            onClick={() => setShowReset(true)}
            className="text-xs font-medium text-slate-500 underline-offset-2 transition hover:text-red-400 hover:underline"
          >
            Reset chat history (admin)
          </button>
        ) : (
          <form onSubmit={submitReset} className="flex gap-2">
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Admin password"
              className="flex-1 rounded-xl bg-[#0e1621] px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-red-500"
            />
            <button
              type="submit"
              className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-400 active:scale-[0.98]"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => setShowReset(false)}
              className="rounded-xl px-3 py-2 text-sm text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
