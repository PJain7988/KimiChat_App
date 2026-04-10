import React, { useState, useEffect, useRef } from 'react';
import useAuthStore from '../../context/authStore';
import { getSocket } from '../../utils/socket';
import api from '../../utils/api';
import Avatar from '../ui/Avatar';

const ROOMS = [
  { id: 'general',    name: 'General',      emoji: '🌍', members: 2847 },
  { id: 'tech-talk',  name: 'Tech Talk',    emoji: '💻', members: 1203 },
  { id: 'gaming',     name: 'Gaming Zone',  emoji: '🎮', members: 987  },
  { id: 'music',      name: 'Music Vibes',  emoji: '🎵', members: 654  },
  { id: 'art-design', name: 'Art & Design', emoji: '🎨', members: 432  },
];

export default function GlobalChat() {
  const { user } = useAuthStore();
  const [activeRoom, setActiveRoom] = useState(ROOMS[0]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typers, setTypers] = useState([]);
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  const socket = getSocket();

  useEffect(() => {
    loadMessages(activeRoom.id);
    if (socket) {
      socket.emit('global:join', activeRoom.id);
      socket.on('global:message', handleNewMsg);
      socket.on('global:typing', handleTyping);
    }
    return () => {
      if (socket) {
        socket.emit('global:leave', activeRoom.id);
        socket.off('global:message', handleNewMsg);
        socket.off('global:typing', handleTyping);
      }
    };
  }, [activeRoom.id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadMessages = async (room) => {
    setLoading(true);
    try {
      const res = await api.get(`/global/${room}/messages`);
      setMessages(res.data.messages || []);
    } catch { setMessages([]); }
    setLoading(false);
  };

  const handleNewMsg = (msg) => {
    setMessages(prev => {
      if (prev.some(m => m._id === msg._id)) return prev;
      return [...prev, msg];
    });
  };

  const handleTyping = ({ name, isTyping }) => {
    setTypers(prev => isTyping ? [...prev.filter(n => n !== name), name] : prev.filter(n => n !== name));
    if (isTyping) setTimeout(() => setTypers(prev => prev.filter(n => n !== name)), 3000);
  };

  const switchRoom = (room) => {
    if (socket) socket.emit('global:leave', activeRoom.id);
    setActiveRoom(room);
    setMessages([]);
  };

  const sendMsg = async () => {
    if (!input.trim()) return;
    const content = input.trim();
    setInput('');
    if (socket) {
      socket.emit('global:message', { room: activeRoom.id, content });
    } else {
      try {
        await api.post(`/global/${activeRoom.id}/messages`, { content });
      } catch {}
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); }
  };

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* Rooms Sidebar */}
      <div style={{ width: 260, background: 'var(--bg-card2)', borderRight: '1px solid var(--border2)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '20px 16px 12px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>🌐 Rooms</div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>Join a public room</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
          {ROOMS.map(room => {
            const active = activeRoom.id === room.id;
            return (
              <div key={room.id} onClick={() => switchRoom(room)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 10px',
                  borderRadius: 14, cursor: 'pointer', marginBottom: 2, transition: 'all .2s',
                  background: active ? 'var(--teal-glow)' : 'transparent',
                  border: active ? '1px solid rgba(0,201,177,0.2)' : '1px solid transparent',
                }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: active ? 'linear-gradient(135deg,var(--teal),var(--blue))' : 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  {room.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{room.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>👥 {room.members.toLocaleString()} online</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-dark)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '14px 20px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border2)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg,var(--teal),var(--blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
            {activeRoom.emoji}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>{activeRoom.name}</div>
            <div style={{ fontSize: 12, color: 'var(--green)' }}>👥 {activeRoom.members.toLocaleString()} members online</div>
          </div>
        </div>

        {/* Welcome bar */}
        <div style={{ margin: '12px 16px 0', padding: '10px 14px', background: 'linear-gradient(90deg,rgba(0,201,177,.1),rgba(26,140,255,.1))', borderLeft: '3px solid var(--teal)', borderRadius: '0 10px 10px 0', fontSize: 13, color: 'var(--text-dim)' }}>
          Welcome to <strong style={{ color: 'var(--teal)' }}>{activeRoom.name}</strong> — Be respectful & have fun! 🌍
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loading && <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>Loading…</div>}
          {messages.map((msg, i) => {
            const isMe = msg.sender?._id === user._id;
            return (
              <div key={msg._id || i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexDirection: isMe ? 'row-reverse' : 'row' }}>
                <Avatar name={msg.sender?.name || '?'} src={msg.sender?.avatar} size={32} />
                <div style={{ maxWidth: '70%' }}>
                  {!isMe && <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 3 }}>{msg.sender?.name}</div>}
                  <div style={{
                    padding: '10px 14px', borderRadius: isMe ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                    background: isMe ? 'linear-gradient(135deg,var(--teal),var(--teal-dim))' : 'var(--bg-card2)',
                    color: isMe ? '#000' : 'var(--text)', fontSize: 14, lineHeight: 1.5,
                  }}>
                    {msg.content}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 3, textAlign: isMe ? 'right' : 'left' }}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
          {typers.length > 0 && (
            <div style={{ fontSize: 12, color: 'var(--text-dim)', fontStyle: 'italic' }}>
              {typers.join(', ')} {typers.length === 1 ? 'is' : 'are'} typing…
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '12px 16px', background: 'var(--bg-card)', borderTop: '1px solid var(--border2)' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            {['📸 Photo', '📎 File', '📊 Poll', '🎤 Voice'].map(b => (
              <button key={b} style={{ padding: '5px 12px', borderRadius: 8, background: 'rgba(255,255,255,.06)', border: '1px solid var(--border2)', color: 'var(--text-dim)', fontSize: 12, cursor: 'pointer' }}>{b}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Share something in ${activeRoom.name}…`}
              rows={1}
              style={{ flex: 1, background: 'rgba(255,255,255,.06)', border: '1.5px solid var(--border2)', borderRadius: 14, padding: '12px 16px', color: 'var(--text)', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none', resize: 'none', maxHeight: 120, transition: 'border .2s' }}
              onFocus={e => e.target.style.borderColor = 'var(--teal)'}
              onBlur={e => e.target.style.borderColor = 'var(--border2)'}
            />
            <button onClick={sendMsg} disabled={!input.trim()} style={{ width: 44, height: 44, borderRadius: 12, border: 'none', cursor: 'pointer', background: input.trim() ? 'linear-gradient(135deg,var(--teal),var(--blue))' : 'rgba(255,255,255,.06)', color: input.trim() ? '#fff' : 'var(--text-dim)', fontSize: 18, flexShrink: 0 }}>➤</button>
          </div>
        </div>
      </div>
    </div>
  );
}
