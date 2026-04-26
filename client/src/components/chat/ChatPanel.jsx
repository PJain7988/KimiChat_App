import React, { useState, useEffect, useRef, useCallback } from 'react';
import useChatStore from '../../context/chatStore';
import useAuthStore from '../../context/authStore';
import { getSocket } from '../../utils/socket';
import api from '../../utils/api';
import Avatar from '../ui/Avatar';
import MessageBubble from './MessageBubble';
import ChatList from './ChatList';
import ContactProfile from './ContactProfile';
import { toast } from 'react-hot-toast';
import { getChatOtherUser } from '../../utils/idUtils';

// Constants for UI
const AVATAR_COLORS = ['#00c9b1', '#1a8cff', '#7c5cfc', '#ff4fa3', '#ffb830', '#ff6b35', '#22c55e'];

export default function ChatPanel({ onStartCall }) {
  const { user } = useAuthStore();
  const { 
    chats, activeChat, setActiveChat, messages, 
    sendMessage, fetchMessages, typingStatus 
  } = useChatStore();
  
  const [input, setInput] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const socket = getSocket();

  // Helper functions
  const getOtherUser = (chat) => getChatOtherUser(chat, user?._id);
  const getChatName = (chat) => chat?.isGroup ? chat.name : (getOtherUser(chat)?.name || 'Kimi User');
  const getChatStatus = (chat) => {
    if (chat?.isAI) return 'Always Online 🤖';
    const other = getOtherUser(chat);
    return other?.isOnline ? 'Online' : 'Offline';
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages[activeChat?._id]?.length, activeChat?._id]);

  // Handle message send
  const handleSend = async (customContent = null) => {
    const content = customContent || input.trim();
    if (!content || !activeChat) return;

    try {
      await sendMessage(activeChat._id, content);
      setInput('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    } catch (err) {
      toast.error('Failed to send message');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const activeMsgs = messages[activeChat?._id] || [];

  return (
    <div className="app-container">
      {/* Sidebar / Chat List Column */}
      <div className={`
        w-full md:w-[320px] h-full shrink-0 border-r border-[rgba(255,255,255,0.07)] flex flex-col bg-[#0a1628]
        ${activeChat ? 'hidden md:flex' : 'flex'}
      `}>
        <ChatList />
      </div>

      {/* Main Chat Window */}
      <div className={`
        flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-[#050d1a]
        ${activeChat ? 'flex' : 'hidden md:flex'}
      `}>
        {!activeChat ? (
          <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-dim)] gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-[var(--teal)] to-[var(--blue)] rounded-[24px] flex items-center justify-center text-4xl shadow-xl shadow-[rgba(0,201,177,0.2)]">💬</div>
            <h2 className="text-xl font-bold text-[var(--text)]">Select a conversation</h2>
            <p className="text-sm">Choose a chat to start messaging</p>
          </div>
        ) : (
          <div className="chat-window">
            {/* STICKY HEADER */}
            <header className="chat-header px-4 flex items-center gap-3">
              <button 
                onClick={() => setActiveChat(null)}
                className="md:hidden p-2 -ml-2 text-[var(--teal)] hover:bg-[rgba(0,201,177,0.1)] rounded-lg transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
              </button>

              <div 
                className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                onClick={() => setShowProfile(true)}
              >
                <Avatar 
                  name={getChatName(activeChat)} 
                  src={activeChat.avatar} 
                  size={42}
                  online={activeChat.isAI || getOtherUser(activeChat)?.isOnline}
                />
                <div className="min-w-0">
                  <div className="font-bold truncate text-[var(--text)]">{getChatName(activeChat)}</div>
                  <div className="text-xs text-[var(--text-dim)]">{getChatStatus(activeChat)}</div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button onClick={() => onStartCall?.(getOtherUser(activeChat), 'audio')} className="p-2 text-[var(--text-dim)] hover:text-[var(--teal)] transition-colors">📞</button>
                <button onClick={() => onStartCall?.(getOtherUser(activeChat), 'video')} className="p-2 text-[var(--text-dim)] hover:text-[var(--teal)] transition-colors">📹</button>
                <button onClick={() => setShowSearch(!showSearch)} className="p-2 text-[var(--text-dim)] hover:text-[var(--teal)] transition-colors">🔍</button>
              </div>
            </header>

            {/* MESSAGE LIST */}
            <div ref={scrollRef} className="message-list p-4 space-y-3">
              {activeMsgs.map((msg, i) => (
                <MessageBubble 
                  key={msg._id || i} 
                  message={msg}
                  isMe={msg.sender?._id === user?._id || msg.sender === user?._id}
                />
              ))}
            </div>

            {/* INPUT AREA */}
            <footer className="input-area">
              <div className="flex items-end gap-3">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  className="flex-1 bg-[#0d1f35] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-3 text-sm text-[var(--text)] outline-none focus:border-[var(--teal)] transition-colors resize-none max-h-32"
                  rows={1}
                />
                <button 
                  onClick={() => handleSend()}
                  disabled={!input.trim()}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                    input.trim() 
                    ? 'bg-gradient-to-r from-[var(--teal)] to-[var(--blue)] text-white shadow-lg shadow-[rgba(0,201,177,0.2)]' 
                    : 'bg-[#0d1f35] text-[var(--text-dim)] opacity-50'
                  }`}
                >
                  ➤
                </button>
              </div>
            </footer>
          </div>
        )}
      </div>

      {showProfile && activeChat && (
        <ContactProfile 
          chat={activeChat}
          contact={getOtherUser(activeChat)}
          onClose={() => setShowProfile(false)}
        />
      )}
    </div>
  );
}