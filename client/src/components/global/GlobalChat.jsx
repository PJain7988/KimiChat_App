import React, { useState, useEffect, useRef } from 'react';
import useAuthStore from '../../context/authStore';
import useChatStore from '../../context/chatStore';
import { getSocket } from '../../utils/socket';
import api from '../../utils/api';
import Avatar from '../ui/Avatar';
import { toast } from 'react-hot-toast';

// --- MODALS ---
function InviteModal({ room, onClose, socket, user }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const search = async (val) => {
    setQuery(val);
    if (val.length < 2) return;
    try {
      const res = await api.get(`/users/search?q=${val}`);
      setResults(res.data.users);
    } catch {}
  };
  return (
    <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0a1628] border border-[rgba(255,255,255,0.1)] rounded-3xl p-6 w-full max-w-md animate-scale-in" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-bold mb-4 font-display">Invite to {room.name}</h3>
        <input 
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-4 outline-none focus:border-[var(--teal)]"
          placeholder="Search users..."
          value={query} onChange={e => search(e.target.value)}
        />
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {results.map(u => (
            <div key={u._id} className="flex items-center gap-3 p-2 bg-white/5 rounded-xl">
              <Avatar name={u.name} src={u.avatar} size={32} />
              <span className="flex-1 font-medium">{u.name}</span>
              <button onClick={() => {
                socket.emit('global:invite', { targetUserId: u._id, roomId: room.id, senderName: user.name });
                toast.success('Invite sent!');
              }} className="text-[var(--teal)] font-bold text-sm px-3 py-1">Invite</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function GlobalChat() {
  const { user } = useAuthStore();
  const { activeRoom, setActiveRoom } = useChatStore();
  const [rooms, setRooms] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const scrollRef = useRef(null);
  const socket = getSocket();

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await api.get('/global/rooms');
        setRooms(res.data.rooms || []);
      } catch (err) {}
    };
    fetchRooms();
  }, []);

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
    const handleMsg = (msg) => { if (msg.roomId === activeRoom.id) setMessages(prev => [...prev, msg]); };
    socket.on('global:message', handleMsg);
    return () => { socket.emit('global:leave', activeRoom.id); socket.off('global:message', handleMsg); };
  }, [activeRoom, socket]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length, activeRoom]);

  const handleSend = () => {
    if (!input.trim() || !activeRoom || !socket) return;
    socket.emit('global:send', { roomId: activeRoom.id, content: input.trim() });
    setInput('');
  };

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      <div className={`w-full md:w-[300px] h-full shrink-0 border-r border-white/10 flex flex-col bg-[#0a1628] ${activeRoom ? 'hidden md:flex' : 'flex'}`}>
        <div className="h-[72px] px-6 flex items-center border-b border-white/10">
          <h2 className="text-xl font-bold font-display">Global Rooms</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {rooms.map(room => (
            <div key={room.id} onClick={() => setActiveRoom(room)} className={`p-4 rounded-xl cursor-pointer transition-all flex items-center gap-3 ${activeRoom?.id === room.id ? 'bg-[var(--teal)] text-black' : 'hover:bg-white/5'}`}>
              <span className="text-2xl">{room.emoji}</span>
              <div className="font-bold">{room.name}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={`flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-[#050d1a] ${activeRoom ? 'flex' : 'hidden md:flex'}`}>
        {!activeRoom ? (
          <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-dim)] gap-4 animate-fade-in">
            <div className="text-6xl mb-2 opacity-50">🌍</div>
            <h2 className="text-xl font-bold text-[var(--text)] font-display">Discover Rooms</h2>
            <p className="text-sm">Select a global room to join</p>
          </div>
        ) : (
          <div className="flex flex-col h-full w-full">
            <header className="h-[72px] shrink-0 px-4 flex items-center gap-3 bg-[#0a1628] border-b border-white/10">
              <button onClick={() => setActiveRoom(null)} className="md:hidden p-2 text-[var(--teal)]"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg></button>
              <span className="text-2xl">{activeRoom.emoji}</span>
              <div className="font-bold flex-1 truncate">{activeRoom.name}</div>
              <button onClick={() => setShowInvite(true)} className="p-2 text-[var(--teal)] text-sm font-bold">Invite</button>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-area">
              {messages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.user?._id === user?._id ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] text-[var(--text-dim)] font-bold mb-1 px-2">{msg.user?.name}</span>
                  <div className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm ${msg.user?._id === user?._id ? 'bg-[var(--teal)] text-black' : 'bg-[#1e3050] text-[var(--text)]'}`}>{msg.content}</div>
                </div>
              ))}
            </div>

            <footer className="p-4 bg-[#0a1628] border-t border-white/10">
              <div className="flex gap-3">
                <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder={`Message in #${activeRoom.name}...`} className="flex-1 bg-[#0d1f35] border border-white/10 rounded-xl px-4 py-3 text-sm text-[var(--text)] outline-none" />
                <button onClick={handleSend} className="w-11 h-11 bg-[var(--teal)] text-black rounded-xl font-bold">➤</button>
              </div>
            </footer>
          </div>
        )}
      </div>
      {showInvite && activeRoom && <InviteModal room={activeRoom} user={user} socket={socket} onClose={() => setShowInvite(false)} />}
    </div>
  );
}
