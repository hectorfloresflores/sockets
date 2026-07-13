import { useEffect, useRef, useState } from 'react';
import { socket } from './socket.js';
import JoinScreen from './components/JoinScreen.jsx';
import ChatScreen from './components/ChatScreen.jsx';
import Modal from './components/Modal.jsx';

const ERROR_TEXT = {
  wrong_password: { title: 'Incorrect password', message: 'The chat password you entered is not correct.' },
  name_taken: { title: 'Username already in chat', message: 'Someone is currently online with that name. Pick another one (it frees up when their tab closes).' },
  empty_name: { title: 'Name required', message: 'Please type a name to join the chat.' },
  wrong_admin_password: { title: 'Incorrect admin password', message: 'That admin password is not correct, so nothing was deleted.' },
};

export default function App() {
  const [screen, setScreen] = useState('join');
  const [me, setMe] = useState(null);
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [connecting, setConnecting] = useState(false);
  const [modal, setModal] = useState({ open: false });
  const sysCounter = useRef(0);

  // Register socket listeners once.
  useEffect(() => {
    const onMessage = (msg) =>
      setItems((prev) => [...prev, { ...msg, kind: 'message', key: `m-${msg.id}` }]);

    const onSystem = (evt) =>
      setItems((prev) => [
        ...prev,
        { ...evt, kind: 'system', key: `s-${evt.at}-${sysCounter.current++}` },
      ]);

    const onUsers = (list) => setUsers(list);

    const onTyping = ({ username, isTyping }) =>
      setTypingUsers((prev) =>
        isTyping
          ? prev.includes(username) ? prev : [...prev, username]
          : prev.filter((u) => u !== username)
      );

    const onReset = () => setItems([]);

    socket.on('message', onMessage);
    socket.on('system', onSystem);
    socket.on('users', onUsers);
    socket.on('typing', onTyping);
    socket.on('reset', onReset);

    return () => {
      socket.off('message', onMessage);
      socket.off('system', onSystem);
      socket.off('users', onUsers);
      socket.off('typing', onTyping);
      socket.off('reset', onReset);
    };
  }, []);

  const handleJoin = (username, password) => {
    setConnecting(true);
    if (!socket.connected) socket.connect();

    socket.emit('join', { username, password }, (res) => {
      setConnecting(false);
      if (!res?.ok) {
        if (!res || res.error !== 'name_taken') socket.disconnect();
        const info = ERROR_TEXT[res?.error] || {
          title: 'Could not join',
          message: 'Something went wrong. Please try again.',
        };
        setModal({ open: true, tone: 'error', ...info });
        return;
      }
      setMe({ username: res.username, color: res.color });
      setUsers(res.users);
      setItems(
        res.history.map((m) => ({ ...m, kind: 'message', key: `m-${m.id}` }))
      );
      setScreen('chat');
    });
  };

  const handleReset = (adminPassword) => {
    // Reset can be triggered from the join screen without being connected.
    if (!socket.connected) socket.connect();
    socket.emit('reset', { password: adminPassword }, (res) => {
      if (!res?.ok) {
        const info = ERROR_TEXT[res?.error] || {
          title: 'Reset failed',
          message: 'Could not reset the chat.',
        };
        setModal({ open: true, tone: 'error', ...info });
      } else {
        setModal({
          open: true,
          tone: 'success',
          title: 'Chat reset',
          message: 'All messages and name colors were deleted.',
        });
      }
      // If we only connected to run the reset, drop the connection again.
      if (screen === 'join') socket.disconnect();
    });
  };

  const handleSend = (text) => socket.emit('message', text);
  const handleTyping = (isTyping) => socket.emit('typing', isTyping);

  return (
    <div className="h-full">
      {screen === 'join' ? (
        <JoinScreen onJoin={handleJoin} onReset={handleReset} connecting={connecting} />
      ) : (
        <ChatScreen
          me={me}
          items={items}
          users={users}
          typingUsers={typingUsers}
          onSend={handleSend}
          onTyping={handleTyping}
        />
      )}

      <Modal
        open={modal.open}
        title={modal.title}
        message={modal.message}
        tone={modal.tone}
        onClose={() => setModal({ open: false })}
      />
    </div>
  );
}
