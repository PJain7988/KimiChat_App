import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useChatStore from '../../context/chatStore';
import useAuthStore from '../../context/authStore';
import Avatar from '../ui/Avatar';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const Icon = {
  pencil: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  search: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  dots: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <circle cx="12" cy="5" r="1.5" fill="currentColor" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <circle cx="12" cy="19" r="1.5" fill="currentColor" />
    </svg>
  ),
};

const FILTER_OPTS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'groups', label: 'Groups' },
  { key: 'ai', label: 'AI' },
];

export default function ChatList() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { chats, activeChat, setActiveChat, unread } = useChatStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showOptions, setShowOptions] = useState(false);

  // Filter logic
  const filteredChats = chats.filter(chat => {
    const nameMatch = (chat.isGroup ? chat.name : chat.participants?.find(p => p._id !== user?._id)?.name || 'Kimi User')
      .toLowerCase().includes(search.toLowerCase());
    
    if (!nameMatch) return false;
    if (filter === 'unread') return unread[chat._id] > 0;
    if (filter === 'groups') return chat.isGroup;
    if (filter === 'ai') return chat.isAI;
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-[#0a1628]">
      {/* Header */}
      <header className="h-[72px] px-6 flex items-center justify-between border-b border-[rgba(255,255,255,0.07)]">
        <h1 className="text-xl font-bold font-display">Messages</h1>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-[rgba(255,255,255,0.05)] rounded-lg transition-colors text-[var(--teal)]">
            {Icon.pencil}
          </button>
          <div className="relative">
            <button 
              onClick={() => setShowOptions(!showOptions)}
              className="p-2 hover:bg-[rgba(255,255,255,0.05)] rounded-lg transition-colors"
            >
              {Icon.dots}
            </button>
            {showOptions && (
              <div className="absolute right-0 mt-2 w-48 bg-[#1e3050] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-2xl py-2 z-50 animate-fade-in">
                <button className="w-full px-4 py-2 text-left text-sm hover:bg-[rgba(255,255,255,0.05)]">New Group</button>
                <button className="w-full px-4 py-2 text-left text-sm hover:bg-[rgba(255,255,255,0.05)]">Settings</button>
                <button className="w-full px-4 py-2 text-left text-sm hover:bg-[rgba(255,255,255,0.05)] text-[var(--red)]">Logout</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Search & Filter */}
      <div className="p-4 space-y-4 shrink-0">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)]">
            {Icon.search}
          </span>
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats..."
            className="w-full bg-[#0d1f35] border border-[rgba(255,255,255,0.05)] rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-[var(--teal)] transition-colors"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {FILTER_OPTS.map(opt => (
            <button
              key={opt.key}
              onClick={() => setFilter(opt.key)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                filter === opt.key 
                ? 'bg-[var(--teal)] text-black' 
                : 'bg-[rgba(255,255,255,0.05)] text-[var(--text-dim)] hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Items */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
        {filteredChats.map(chat => {
          const otherUser = chat.isGroup ? null : chat.participants?.find(p => p._id !== user?._id);
          const name = chat.isGroup ? chat.name : (otherUser?.name || 'Kimi User');
          const lastMsg = chat.lastMessage?.content || 'No messages yet';
          const isActive = activeChat?._id === chat._id;
          const isUnread = unread[chat._id] > 0;

          return (
            <div 
              key={chat._id}
              onClick={() => setActiveChat(chat)}
              className={`
                group p-3 rounded-2xl cursor-pointer transition-all flex items-center gap-3 relative
                ${isActive ? 'bg-[rgba(0,201,177,0.1)]' : 'hover:bg-[rgba(255,255,255,0.03)]'}
              `}
            >
              <div className="relative">
                <Avatar name={name} src={chat.avatar} size={48} online={otherUser?.isOnline || chat.isAI} />
                {isActive && (
                  <div className="absolute left-[-12px] top-1/4 bottom-1/4 w-1 bg-[var(--teal)] rounded-full" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                  <span className={`font-bold truncate text-sm ${isActive ? 'text-[var(--teal)]' : 'text-[var(--text)]'}`}>{name}</span>
                  <span className="text-[10px] text-[var(--text-dim)]">
                    {chat.lastMessage?.createdAt ? new Date(chat.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <p className={`text-xs truncate ${isUnread ? 'text-[var(--text)] font-bold' : 'text-[var(--text-dim)]'}`}>
                    {lastMsg}
                  </p>
                  {isUnread && (
                    <span className="ml-2 w-5 h-5 bg-[var(--teal)] text-black text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unread[chat._id]}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}