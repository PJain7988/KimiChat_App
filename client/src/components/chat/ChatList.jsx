import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useChatStore from '../../context/chatStore';
import useAuthStore from '../../context/authStore';
import Avatar from '../ui/Avatar';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const FILTER_OPTS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'groups', label: 'Groups' },
  { key: 'ai', label: 'AI' },
];

export default function ChatList() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { chats, activeChat, setActiveChat, fetchMessages, unread } = useChatStore();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const getChatDisplayName = (chat, userId) => {
    if (chat.isAI) return 'Kimi AI';
    if (chat.isGroup) return chat.name;
    const other = chat.participants?.find(p => p._id !== userId);
    return other?.name || 'Kimi User';
  };

  const getChatLastMsg = (chat) => {
    if (!chat.lastMessage) return 'No messages yet';
    return chat.lastMessage.content || 'Sent a file';
  };

  const filtered = chats
    .filter(c => {
      const name = getChatDisplayName(c, user?._id);
      const matchSearch = name.toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      if (filter === 'unread') return (unread[c._id] || 0) > 0;
      if (filter === 'groups') return c.isGroup;
      if (filter === 'ai') return c.isAI;
      return true;
    })
    .sort((a, b) => {
      const aTime = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const bTime = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return bTime - aTime;
    });

  const handleSelect = (chat) => {
    setActiveChat(chat);
    fetchMessages(chat._id);
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0a1628] overflow-hidden">
      {/* Header Area */}
      <div className="p-4 space-y-4 shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-display text-[var(--text)]">Messages</h2>
          <div className="flex gap-2">
            <button className="w-9 h-9 flex items-center justify-center bg-[rgba(255,255,255,0.05)] rounded-lg text-gray-400">🔍</button>
            <button className="w-9 h-9 flex items-center justify-center bg-[rgba(0,201,177,0.1)] rounded-lg text-[var(--teal)]">＋</button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative group">
          <input 
            type="text"
            placeholder="Search chats..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0d1f35] border border-[rgba(255,255,255,0.05)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--teal)/50] transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {FILTER_OPTS.map(opt => (
            <button
              key={opt.key}
              onClick={() => setFilter(opt.key)}
              className={`
                px-4 py-1.5 rounded-full text-xs font-bold transition-all shrink-0
                ${filter === opt.key ? 'bg-[var(--teal)] text-black' : 'bg-[rgba(255,255,255,0.05)] text-gray-400 hover:bg-[rgba(255,255,255,0.1)]'}
              `}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chats List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-30">
            <div className="text-4xl mb-4">📭</div>
            <div className="text-sm">No conversations found</div>
          </div>
        ) : (
          filtered.map(chat => {
            const active = activeChat?._id === chat._id;
            const hasUnread = (unread[chat._id] || 0) > 0;
            const otherUser = getOtherUser(chat, user?._id);

            return (
              <div
                key={chat._id}
                onClick={() => handleSelect(chat)}
                className={`
                  p-3 rounded-2xl cursor-pointer transition-all flex items-center gap-3 group
                  ${active ? 'bg-[rgba(0,201,177,0.1)]' : 'hover:bg-[rgba(255,255,255,0.03)]'}
                `}
              >
                <div className="relative">
                  <Avatar 
                    name={getChatDisplayName(chat, user?._id)} 
                    src={chat.avatar} 
                    size={48} 
                    online={chat.isAI || otherUser?.isOnline} 
                  />
                  {hasUnread && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--teal)] text-black text-[10px] font-bold rounded-full flex items-center justify-center ring-4 ring-[#0a1628]">
                      {unread[chat._id]}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-0.5">
                    <h3 className={`font-bold truncate text-sm ${active ? 'text-[var(--teal)]' : 'text-[var(--text)]'}`}>
                      {getChatDisplayName(chat, user?._id)}
                    </h3>
                    <span className="text-[10px] text-gray-500 shrink-0">12:30 PM</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className={`text-xs truncate ${hasUnread ? 'text-[var(--text)] font-bold' : 'text-gray-500'}`}>
                      {getChatLastMsg(chat)}
                    </p>
                    {chat.isAI && <span className="text-[10px] bg-[rgba(0,201,177,0.1)] text-[var(--teal)] px-1.5 rounded font-bold uppercase tracking-tighter ml-2">AI</span>}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// Helper to get other user
function getOtherUser(chat, userId) {
  if (!chat || chat.isAI || chat.isGroup) return null;
  return chat.participants?.find(p => p._id !== userId);
}