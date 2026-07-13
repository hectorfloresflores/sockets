import { useEffect, useRef, useState } from 'react';

// Telegram-style group chat: header with online users, scrolling message list
// (with system notifications + typing indicator) and a message composer.
function initials(name) {
  return name.slice(0, 2).toUpperCase();
}

function timeOf(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatScreen({ me, items, users, typingUsers, onSend, onTyping }) {
  const [text, setText] = useState('');
  const scrollRef = useRef(null);
  const typingTimeout = useRef(null);

  // Auto-scroll to the newest message whenever items change.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [items, typingUsers]);

  const send = (e) => {
    e.preventDefault();
    const clean = text.trim();
    if (!clean) return;
    onSend(clean);
    setText('');
    onTyping(false);
  };

  const handleChange = (e) => {
    setText(e.target.value);
    onTyping(true);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => onTyping(false), 1200);
  };

  const typingNames = typingUsers.filter((u) => u !== me.username);

  return (
    <div className="flex h-full flex-col bg-[#0e1621]">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-white/5 bg-[#17212b] px-4 py-3 shadow-md">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-cyan-500 text-lg">
          💬
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold leading-tight">Socketgram · Group</div>
          <div className="truncate text-xs text-sky-400">
            {users.length} online: {users.join(', ')}
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-[#0e1621] px-3 py-1 text-xs text-slate-300">
          <span
            className="rounded px-2 py-0.5 font-semibold"
            style={{ backgroundColor: me.color + '33', color: me.color }}
          >
            {me.username}
          </span>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="messages-scroll chat-wallpaper flex-1 space-y-1.5 overflow-y-auto px-3 py-4 sm:px-8">
        {items.map((it) =>
          it.kind === 'system' ? (
            <div key={it.key} className="flex justify-center py-1">
              <span className="rounded-full bg-black/30 px-3 py-1 text-xs text-slate-300">
                {it.text}
              </span>
            </div>
          ) : (
            <MessageBubble key={it.key} msg={it} mine={it.username === me.username} />
          )
        )}

        {typingNames.length > 0 && (
          <div className="flex items-center gap-2 px-2 py-1 text-xs text-slate-400">
            <span className="typing-dot">●</span>
            <span className="typing-dot">●</span>
            <span className="typing-dot">●</span>
            <span>
              {typingNames.join(', ')} {typingNames.length === 1 ? 'is' : 'are'} typing…
            </span>
          </div>
        )}
      </div>

      {/* Composer */}
      <form onSubmit={send} className="flex items-center gap-2 border-t border-white/5 bg-[#17212b] px-3 py-3">
        <input
          value={text}
          onChange={handleChange}
          placeholder="Write a message…"
          maxLength={2000}
          className="flex-1 rounded-full bg-[#0e1621] px-4 py-3 text-white outline-none ring-1 ring-white/10 transition placeholder:text-slate-500 focus:ring-2 focus:ring-sky-500"
        />
        <button
          type="submit"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-500 text-white transition hover:bg-sky-400 active:scale-95"
          aria-label="Send"
        >
          ➤
        </button>
      </form>
    </div>
  );
}

function MessageBubble({ msg, mine }) {
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-3 py-2 shadow ${
          mine ? 'rounded-br-md bg-[#2b5278]' : 'rounded-bl-md bg-[#182533]'
        }`}
      >
        {!mine && (
          <div className="text-xs font-semibold" style={{ color: msg.color }}>
            {msg.username}
          </div>
        )}
        <div className="whitespace-pre-wrap break-words text-[15px] leading-snug text-white">
          {msg.text}
        </div>
        <div className="mt-0.5 text-right text-[10px] text-slate-400">
          {timeOf(msg.createdAt)}
        </div>
      </div>
    </div>
  );
}
