import React, { useState, useEffect, useRef } from 'react';
import useAuthStore from '../../context/authStore';
import useChatStore from '../../context/chatStore';
import { getSocket } from '../../utils/socket';
import api from '../../utils/api';
import Avatar from '../ui/Avatar';
import { toast } from 'react-hot-toast';

export default function GlobalChat() {
  const { user } = useAuthStore();
  const { activeRoom, setActiveRoom } = useChatStore();
  const [rooms, setRooms] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);
  const socket = getSocket();

  // Load Rooms
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await api.get('/global/rooms');
        setRooms(res.data.rooms || []);
      } catch (err) {
        toast.error('Failed to load rooms');
      }
    };
    fetchRooms();
  }, []);

  // Join Room & Load Messages
  useEffect(() => {
    if (!activeRoom || !socket) return;
    
    socket.emit('global:join', activeRoom.id);
    
    const fetchMsgs = async () => {
      try {
        const res = await api.get(`/global/rooms/${activeRoom.id}/messages`);
        setMessages(res.data.messages || []);
      } catch (err) {}
    };
    fetchMsgs();

    const handleMsg = (msg) => {
      if (msg.roomId === activeRoom.id) {
        setMessages(prev => [...prev, msg]);
      }
    };

    socket.on('global:message', handleMsg);
    return () => {
      socket.emit('global:leave', activeRoom.id);
      socket.off('global:message', handleMsg);
    };
  }, [activeRoom, socket]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, activeRoom]);

  const handleSend = () => {
    if (!input.trim() || !activeRoom || !socket) return;
    socket.emit('global:send', { roomId: activeRoom.id, content: input.trim() });
    setInput('');
  };

  return (
    <div className="app-container">
      {/* Rooms Sidebar */}
      <div className={`
        w-full md:w-[300px] h-full shrink-0 border-r border-[rgba(255,255,255,0.07)] flex flex-col bg-[#0a1628]
        ${activeRoom ? 'hidden md:flex' : 'flex'}
      `}>
        <div className="h-[72px] px-6 flex items-center border-b border-[rgba(255,255,255,0.07)]">
          <h2 className="text-xl font-bold font-display">Global Rooms</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {rooms.map(room => (
            <div 
              key={room.id}
              onClick={() => setActiveRoom(room)}
              className={`p-4 rounded-xl cursor-pointer transition-all flex items-center gap-3 ${
                activeRoom?.id === room.id ? 'bg-[var(--teal)] text-black' : 'hover:bg-[rgba(255,255,255,0.05)]'
              }`}
            >
              <span className="text-2xl">{room.emoji}</span>
              <div className="font-bold">{room.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Room Window */}
      <div className={`
        flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-[#050d1a]
        ${activeRoom ? 'flex' : 'hidden md:flex'}
      `}>
        {!activeRoom ? (
          <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-dim)] gap-4">
            <div className="text-6xl mb-2 opacity-50">🌍</div>
            <h2 className="text-xl font-bold text-[var(--text)]">Discover Rooms</h2>
            <p className="text-sm">Select a global room to join the conversation</p>
          </div>
        ) : (
          <div className="chat-window">
            <header className="chat-header px-4 flex items-center gap-3">
              <button 
                onClick={() => setActiveRoom(null)}
                className="md:hidden p-2 -ml-2 text-[var(--teal)] rounded-lg"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
              </button>
              <span className="text-2xl">{activeRoom.emoji}</span>
              <div className="font-bold flex-1">{activeRoom.name}</div>
              <div className="text-xs text-[var(--text-dim)]">{messages.length} messages</div>
            </header>

            <div ref={scrollRef} className="message-list p-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.user?._id === user?._id ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] text-[var(--text-dim)] font-bold uppercase tracking-wider">{msg.user?.name}</span>
                  </div>
                  <div className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm ${
                    msg.user?._id === user?._id ? 'bg-[var(--teal)] text-black' : 'bg-[#1e3050] text-[var(--text)]'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>

            <footer className="input-area">
              <div className="flex gap-3">
                <input 
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder={`Message in #${activeRoom.name}...`}
                  className="flex-1 bg-[#0d1f35] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-3 text-sm text-[var(--text)] outline-none"
                />
                <button onClick={handleSend} className="w-11 h-11 bg-[var(--teal)] text-black rounded-xl font-bold shadow-lg shadow-[rgba(0,201,177,0.2)]">➤</button>
              </div>
            </footer>
          </div>
        )}
      </div>
    </div>
  );
}
